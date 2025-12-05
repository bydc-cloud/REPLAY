import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import OpenAI, { toFile } from 'openai';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import { execSync } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backblaze B2 Configuration (S3-compatible)
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_BUCKET = process.env.B2_BUCKET || 'replay-music';
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com';
const B2_REGION = process.env.B2_REGION || 'us-west-004';

// Initialize S3 client for Backblaze B2
let s3Client = null;
function getS3Client() {
  if (!s3Client && B2_KEY_ID && B2_APP_KEY) {
    s3Client = new S3Client({
      endpoint: B2_ENDPOINT,
      region: B2_REGION,
      credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
      },
    });
    console.log('Backblaze B2 client initialized');
  }
  return s3Client;
}

console.log('B2 configured:', !!B2_KEY_ID && !!B2_APP_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting Replay Music (Full-Stack Server)...');
console.log('Port:', PORT);
console.log('Node version:', process.version);
console.log('OpenAI configured:', !!process.env.OPENAI_API_KEY);

// OpenAI client for transcription - with extended timeout for large audio files
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 120000, // 2 minute timeout for audio uploads
    maxRetries: 3,   // Retry up to 3 times on transient errors
  });
}

// CORS
app.use(cors({ origin: true, credentials: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Filename');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Parse JSON for API routes (but not for raw body routes)
app.use('/api', (req, res, next) => {
  if (req.path === '/upload/proxy') {
    // Skip JSON parsing for proxy upload - handled separately
    next();
  } else {
    express.json({ limit: '100mb' })(req, res, next);
  }
});

// Database - lazy connection
let pool = null;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// ============ API ROUTES ============

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), openai: !!openai, b2: !!getS3Client() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), openai: !!openai, b2: !!getS3Client() });
});

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Init DB
async function initDB() {
  const db = getPool();
  if (!db) return;
  try {
    await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS tracks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255),
        album VARCHAR(255),
        duration INTEGER DEFAULT 0,
        file_data TEXT,
        cover_url TEXT,
        play_count INTEGER DEFAULT 0,
        is_liked BOOLEAN DEFAULT false,
        lyrics_text TEXT,
        lyrics_segments JSONB,
        lyrics_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add lyrics columns if they don't exist (for existing tables)
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'lyrics_text') THEN
          ALTER TABLE tracks ADD COLUMN lyrics_text TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'lyrics_segments') THEN
          ALTER TABLE tracks ADD COLUMN lyrics_segments JSONB;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'lyrics_status') THEN
          ALTER TABLE tracks ADD COLUMN lyrics_status VARCHAR(50) DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'bpm') THEN
          ALTER TABLE tracks ADD COLUMN bpm INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'musical_key') THEN
          ALTER TABLE tracks ADD COLUMN musical_key VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'energy') THEN
          ALTER TABLE tracks ADD COLUMN energy FLOAT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'analyzed_at') THEN
          ALTER TABLE tracks ADD COLUMN analyzed_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'file_key') THEN
          ALTER TABLE tracks ADD COLUMN file_key TEXT;
        END IF;
        -- RHYTHM Marketplace: Add visibility and sale columns to tracks
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'visibility') THEN
          ALTER TABLE tracks ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'is_for_sale') THEN
          ALTER TABLE tracks ADD COLUMN is_for_sale BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'genre') THEN
          ALTER TABLE tracks ADD COLUMN genre VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'tags') THEN
          ALTER TABLE tracks ADD COLUMN tags TEXT[];
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'is_beat') THEN
          ALTER TABLE tracks ADD COLUMN is_beat BOOLEAN DEFAULT false;
        END IF;
        -- Feature flags for users
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'feature_flags') THEN
          ALTER TABLE users ADD COLUMN feature_flags JSONB DEFAULT '{}';
        END IF;
      END $$;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cover_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        PRIMARY KEY (playlist_id, track_id)
      )
    `);

    // ============================================
    // RHYTHM Social Beat Marketplace - Phase 1 Tables
    // ============================================

    // Producer profiles - extended user info for sellers
    await db.query(`
      CREATE TABLE IF NOT EXISTS producer_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        display_name VARCHAR(255),
        bio TEXT,
        avatar_url TEXT,
        banner_url TEXT,
        website VARCHAR(500),
        social_links JSONB DEFAULT '{}',
        is_verified BOOLEAN DEFAULT false,
        stripe_account_id VARCHAR(255),
        stripe_onboarded BOOLEAN DEFAULT false,
        total_sales INTEGER DEFAULT 0,
        total_earnings DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Follows - who follows whom
    await db.query(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id)
      )
    `);

    // Track likes - separate from is_liked for social features
    await db.query(`
      CREATE TABLE IF NOT EXISTS track_likes (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, track_id)
      )
    `);

    // Reposts - users sharing others' tracks
    await db.query(`
      CREATE TABLE IF NOT EXISTS reposts (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, track_id)
      )
    `);

    // Comments on tracks
    await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        timestamp_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Beat packs - bundles of tracks for sale
    await db.query(`
      CREATE TABLE IF NOT EXISTS packs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_url TEXT,
        price DECIMAL(10,2) NOT NULL,
        sale_price DECIMAL(10,2),
        license_type VARCHAR(50) DEFAULT 'basic',
        visibility VARCHAR(20) DEFAULT 'private',
        download_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pack tracks - tracks included in a pack
    await db.query(`
      CREATE TABLE IF NOT EXISTS pack_tracks (
        pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        PRIMARY KEY (pack_id, track_id)
      )
    `);

    // Sales/purchases record
    await db.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
        track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
        pack_id UUID REFERENCES packs(id) ON DELETE SET NULL,
        amount DECIMAL(10,2) NOT NULL,
        platform_fee DECIMAL(10,2) DEFAULT 0,
        seller_earnings DECIMAL(10,2) NOT NULL,
        license_type VARCHAR(50) NOT NULL,
        stripe_payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Activity feed events
    await db.query(`
      CREATE TABLE IF NOT EXISTS feed_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        target_id UUID NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages / conversations
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        last_read_at TIMESTAMP,
        PRIMARY KEY (conversation_id, user_id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        content TEXT,
        message_type VARCHAR(50) DEFAULT 'text',
        attachment_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
      CREATE INDEX IF NOT EXISTS idx_track_likes_track ON track_likes(track_id);
      CREATE INDEX IF NOT EXISTS idx_comments_track ON comments(track_id);
      CREATE INDEX IF NOT EXISTS idx_feed_events_user ON feed_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_feed_events_created ON feed_events(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_tracks_visibility ON tracks(visibility) WHERE visibility = 'public';
      CREATE INDEX IF NOT EXISTS idx_packs_visibility ON packs(visibility) WHERE visibility = 'public';
    `);

    // Transactions table - unified sales/purchases record with payout tracking
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
        item_id UUID NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        platform_fee DECIMAL(10,2) DEFAULT 0,
        seller_earnings DECIMAL(10,2) NOT NULL,
        license_type VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50),
        payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'completed',
        payout_status VARCHAR(50) DEFAULT 'pending',
        payout_request_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payout requests table
    await db.query(`
      CREATE TABLE IF NOT EXISTS payout_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_details JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        processed_at TIMESTAMP,
        processor_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add payout columns to transactions if missing
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payout_status') THEN
          ALTER TABLE transactions ADD COLUMN payout_status VARCHAR(50) DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payout_request_id') THEN
          ALTER TABLE transactions ADD COLUMN payout_request_id UUID;
        END IF;
      END $$;
    `);

    // Create indexes for transactions and payouts
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_payout_status ON transactions(payout_status);
      CREATE INDEX IF NOT EXISTS idx_payout_requests_user ON payout_requests(user_id);
    `);

    console.log('Database ready');
  } catch (e) {
    console.error('DB init error:', e.message);
  }
}

// Helper: Convert base64 audio to buffer for OpenAI
function base64ToBuffer(base64Data) {
  const base64 = base64Data.replace(/^data:audio\/[^;]+;base64,/, '');
  return Buffer.from(base64, 'base64');
}

// Compress audio buffer to MP3 with lower bitrate for faster uploads
async function compressAudioForTranscription(audioBuffer, originalExt) {
  // If file is under 1MB, no compression needed
  if (audioBuffer.length < 1024 * 1024) {
    console.log('Audio file small enough, skipping compression');
    return { buffer: audioBuffer, ext: originalExt || 'mp3', compressed: false };
  }

  console.log(`Compressing ${audioBuffer.length} bytes for transcription...`);

  try {
    const tempInputPath = `/tmp/transcription_input_${Date.now()}.${originalExt || 'mp3'}`;
    const tempOutputPath = `/tmp/transcription_output_${Date.now()}.mp3`;

    // Write input file
    fs.writeFileSync(tempInputPath, audioBuffer);

    // Compress to 32kbps mono MP3 (good enough for speech recognition)
    // Whisper works fine with low bitrate audio
    execSync(`ffmpeg -i "${tempInputPath}" -ac 1 -ar 16000 -b:a 32k -y "${tempOutputPath}"`, {
      stdio: 'pipe',
      timeout: 60000 // 60 second timeout
    });

    // Read compressed file
    const compressedBuffer = fs.readFileSync(tempOutputPath);
    console.log(`Compressed from ${audioBuffer.length} to ${compressedBuffer.length} bytes (${Math.round(compressedBuffer.length / audioBuffer.length * 100)}%)`);

    // Cleanup temp files
    try {
      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(tempOutputPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    return { buffer: compressedBuffer, ext: 'mp3', compressed: true };
  } catch (error) {
    console.log('ffmpeg compression failed, using original:', error.message);
    return { buffer: audioBuffer, ext: originalExt || 'mp3', compressed: false };
  }
}

// Detect MIME type from file extension or data URI
function detectAudioMimeType(audioBase64, fileKey) {
  // Check file extension from fileKey
  if (fileKey) {
    const ext = fileKey.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'm4a': 'audio/mp4',
      'mp4': 'audio/mp4',
      'wav': 'audio/wav',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac'
    };
    if (mimeTypes[ext]) return { mimeType: mimeTypes[ext], ext };
  }

  // Check data URI prefix
  const match = audioBase64.match(/^data:audio\/([^;]+);base64,/);
  if (match) {
    const format = match[1];
    return { mimeType: `audio/${format}`, ext: format === 'mpeg' ? 'mp3' : format };
  }

  // Default to mp3
  return { mimeType: 'audio/mpeg', ext: 'mp3' };
}

// Helper to check if an error is retryable (429 rate limit, 5xx server errors, or network issues)
function isRetryableTranscriptionError(err) {
  const status = err?.status || err?.response?.status || err?.$metadata?.httpStatusCode;
  const message = err?.message || '';

  // Network errors
  if (!status) {
    return /timeout|ETIMEDOUT|ECONNRESET|ENETUNREACH|socket hang up|Connection error|ENOTFOUND/i.test(message);
  }

  // Rate limit (429) or server errors (5xx)
  return status === 429 || status >= 500;
}

// Transcribe audio using OpenAI Whisper with retry for rate limits, 5xx, and network errors
async function transcribeAudio(audioBase64, trackId, fileKey = null) {
  if (!openai) {
    console.log('OpenAI not configured, skipping transcription');
    return null;
  }

  const maxRetries = 5;
  const retryDelays = [2000, 4000, 8000, 15000, 30000]; // Exponential backoff

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Starting transcription for track ${trackId} (attempt ${attempt}/${maxRetries})`);
      const audioBuffer = base64ToBuffer(audioBase64);
      console.log(`Original audio buffer size: ${audioBuffer.length} bytes`);

      if (!audioBuffer || audioBuffer.length === 0) {
        console.error(`No audio data to transcribe for track ${trackId}`);
        return null;
      }

      // Detect original format
      const { mimeType, ext } = detectAudioMimeType(audioBase64, fileKey);
      console.log(`Detected audio format: ${mimeType} (.${ext})`);

      // Compress audio if needed to reduce upload size (especially for large WAV/AIFF files)
      const { buffer: finalBuffer, ext: finalExt, compressed } = await compressAudioForTranscription(audioBuffer, ext);
      const finalMimeType = compressed ? 'audio/mpeg' : mimeType;

      // OpenAI Whisper has a 25MB limit - check AFTER compression attempt
      const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
      if (finalBuffer.length > MAX_SIZE_BYTES) {
        console.log(`Audio still too large after compression (${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB > 25MB limit). Skipping track ${trackId}`);
        return null;
      }

      // Use toFile helper with correct MIME type
      const audioFile = await toFile(finalBuffer, `audio-${trackId}.${finalExt}`, { type: finalMimeType });

      console.log(`Sending ${finalBuffer.length} bytes to Whisper API${compressed ? ' (compressed)' : ''}...`);

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment', 'word']
      });

      console.log(`Transcription complete for track ${trackId}`);
      console.log(`Transcription text length: ${transcription.text?.length || 0}`);
      console.log(`Transcription segments: ${transcription.segments?.length || 0}`);

      return {
        text: transcription.text,
        segments: transcription.segments || [],
        words: transcription.words || [],
        language: transcription.language || 'en'
      };
    } catch (error) {
      lastError = error;
      const status = error?.status || error?.response?.status || error?.$metadata?.httpStatusCode;
      console.error(`Transcription error (attempt ${attempt}):`, status || '', error.message);

      // Log detailed error info
      if (error.response) {
        console.error('OpenAI response status:', error.response.status);
        console.error('OpenAI response data:', JSON.stringify(error.response.data));
      }
      if (error.error) {
        console.error('OpenAI error object:', JSON.stringify(error.error));
      }

      // Check if we should retry
      if (attempt < maxRetries && isRetryableTranscriptionError(error)) {
        const delay = retryDelays[attempt - 1] || 30000;
        console.log(`Retryable error (status ${status || 'network'}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Final attempt or non-retryable error
      console.error('Transcription failed permanently:', error.stack);
      return null;
    }
  }

  console.error('All transcription attempts exhausted for track:', trackId);
  return null;
}

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const db = getPool();
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
      [email.toLowerCase(), username, hash]
    );
    const dbUser = result.rows[0];
    const user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.username,
      created_at: dbUser.created_at
    };
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user, token });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Email exists' });
    console.error('Signup error:', e.message);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Signin
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const db = getPool();
    const result = await db.query(
      'SELECT id, email, username, password_hash, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const dbUser = result.rows[0];
    const valid = await bcrypt.compare(password, dbUser.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.username,
      created_at: dbUser.created_at
    };
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user, token });
  } catch (e) {
    console.error('Signin error:', e.message);
    res.status(500).json({ error: 'Signin failed' });
  }
});

// Verify token
app.get('/api/auth/verify', auth, (req, res) => {
  res.json({ valid: true, userId: req.user.id });
});

// Update profile
app.put('/api/auth/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const db = getPool();
    const result = await db.query(
      'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, email, username, created_at',
      [name.trim(), req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const dbUser = result.rows[0];
    const user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.username,
      created_at: dbUser.created_at
    };
    res.json({ user });
  } catch (e) {
    console.error('Profile update error:', e.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============================================
// RHYTHM Marketplace: Feature Flags
// ============================================

// Default feature flags for new/existing users
const DEFAULT_FEATURE_FLAGS = {
  feed_enabled: false,
  marketplace_sell_enabled: false,
  social_enabled: false,
  messaging_enabled: false,
  producer_dashboard_enabled: false
};

// Get current user's feature flags
app.get('/api/me/features', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT feature_flags FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Merge defaults with user's flags (user flags override defaults)
    const userFlags = result.rows[0].feature_flags || {};
    const mergedFlags = { ...DEFAULT_FEATURE_FLAGS, ...userFlags };
    res.json(mergedFlags);
  } catch (e) {
    console.error('Get feature flags error:', e.message);
    res.status(500).json({ error: 'Failed to get feature flags' });
  }
});

// Update feature flags (admin-only in future, for now any authenticated user)
app.put('/api/me/features', auth, async (req, res) => {
  try {
    const { flags } = req.body;
    if (!flags || typeof flags !== 'object') {
      return res.status(400).json({ error: 'Invalid flags object' });
    }

    // Only allow valid flag keys
    const validKeys = Object.keys(DEFAULT_FEATURE_FLAGS);
    const sanitizedFlags = {};
    for (const key of validKeys) {
      if (key in flags && typeof flags[key] === 'boolean') {
        sanitizedFlags[key] = flags[key];
      }
    }

    const db = getPool();
    const result = await db.query(
      `UPDATE users SET feature_flags = feature_flags || $1::jsonb WHERE id = $2 RETURNING feature_flags`,
      [JSON.stringify(sanitizedFlags), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const mergedFlags = { ...DEFAULT_FEATURE_FLAGS, ...result.rows[0].feature_flags };
    res.json(mergedFlags);
  } catch (e) {
    console.error('Update feature flags error:', e.message);
    res.status(500).json({ error: 'Failed to update feature flags' });
  }
});

// ============================================
// Existing Track Endpoints
// ============================================

// Get tracks
app.get('/api/tracks', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      `SELECT id, user_id, title, artist, album, duration, cover_url, play_count, is_liked,
              lyrics_status, created_at, bpm, musical_key, energy, analyzed_at, file_key,
              visibility, is_for_sale, genre, tags,
              (file_data IS NOT NULL OR file_key IS NOT NULL) as has_audio,
              (lyrics_text IS NOT NULL AND lyrics_text != '') as has_lyrics
       FROM tracks WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Get tracks error:', e.message);
    res.status(500).json({ error: 'Failed to get tracks' });
  }
});

// Get track audio
app.get('/api/tracks/:id/audio', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT file_data FROM tracks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ file_data: result.rows[0].file_data });
  } catch (e) {
    console.error('Get audio error:', e.message);
    res.status(500).json({ error: 'Failed to get audio' });
  }
});

// Stream audio
app.get('/api/tracks/:id/stream', async (req, res) => {
  let token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT file_data FROM tracks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const fileData = result.rows[0].file_data;
    if (!fileData) return res.status(404).json({ error: 'No audio data' });

    const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid audio format' });

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${buffer.length}`);
      res.setHeader('Content-Length', chunkSize);
      res.end(buffer.slice(start, end + 1));
    } else {
      res.end(buffer);
    }
  } catch (e) {
    console.error('Stream audio error:', e.message);
    res.status(500).json({ error: 'Failed to stream audio' });
  }
});

// Get track lyrics
// Allows: own tracks OR public tracks (for discovery feature)
app.get('/api/lyrics/:id', auth, async (req, res) => {
  try {
    const db = getPool();
    // First try user's own track
    let result = await db.query(
      'SELECT lyrics_text, lyrics_segments, lyrics_status FROM tracks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    // If not found, check public tracks
    if (result.rows.length === 0) {
      result = await db.query(
        "SELECT lyrics_text, lyrics_segments, lyrics_status FROM tracks WHERE id = $1 AND visibility = 'public'",
        [req.params.id]
      );
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const track = result.rows[0];
    if (!track.lyrics_text) {
      return res.json({ status: track.lyrics_status || 'pending', content: null, segments: null });
    }

    res.json({
      status: 'completed',
      content: track.lyrics_text,
      segments: track.lyrics_segments
    });
  } catch (e) {
    console.error('Get lyrics error:', e.message);
    res.status(500).json({ error: 'Failed to get lyrics' });
  }
});

// Transcribe a track
// Allows: own tracks OR public tracks (for discovery feature)
app.post('/api/transcribe/:id', auth, async (req, res) => {
  console.log('=== TRANSCRIPTION ENDPOINT HIT ===', req.params.id);
  try {
    const db = getPool();
    const trackId = req.params.id;

    // First try to find user's own track
    let result = await db.query(
      'SELECT id, file_data, file_key, lyrics_status FROM tracks WHERE id = $1 AND user_id = $2',
      [trackId, req.user.id]
    );

    // If not found, check if it's a public track (for discovery)
    if (result.rows.length === 0) {
      result = await db.query(
        "SELECT id, file_data, file_key, lyrics_status FROM tracks WHERE id = $1 AND visibility = 'public'",
        [trackId]
      );
      if (result.rows.length > 0) {
        console.log(`Transcribing public track ${trackId} requested by user ${req.user.id}`);
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = result.rows[0];
    console.log(`Transcription request: file_key=${track.file_key ? 'yes' : 'no'}, file_data=${track.file_data ? 'yes' : 'no'}`);

    // Try to get audio data - first from B2, then fall back to file_data
    let audioBase64 = null;

    // Try B2 first (preferred for newer tracks)
    if (track.file_key) {
      const client = getS3Client();
      if (client) {
        try {
          console.log(`Fetching from B2 for transcription: ${track.file_key}`);
          const command = new GetObjectCommand({
            Bucket: B2_BUCKET,
            Key: track.file_key,
          });
          const response = await client.send(command);

          // Convert stream to buffer then to base64
          let audioBuffer;
          if (response.Body.transformToByteArray) {
            audioBuffer = Buffer.from(await response.Body.transformToByteArray());
          } else {
            const chunks = [];
            for await (const chunk of response.Body) {
              chunks.push(chunk);
            }
            audioBuffer = Buffer.concat(chunks);
          }

          audioBase64 = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
          console.log(`Fetched ${audioBuffer.length} bytes from B2 for transcription`);
        } catch (err) {
          console.error('B2 fetch for transcription failed:', err.message);
        }
      }
    }

    // Fall back to file_data if B2 failed or not available
    if (!audioBase64 && track.file_data) {
      audioBase64 = track.file_data;
      console.log('Using file_data for transcription');
    }

    if (!audioBase64) {
      console.log('No audio data available for transcription');
      return res.status(400).json({ error: 'No audio data available' });
    }

    await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['processing', trackId]);

    const transcription = await transcribeAudio(audioBase64, trackId, track.file_key);

    if (!transcription) {
      await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', trackId]);
      return res.status(500).json({ error: 'Transcription failed' });
    }

    await db.query(
      'UPDATE tracks SET lyrics_text = $1, lyrics_segments = $2, lyrics_status = $3 WHERE id = $4',
      [transcription.text, JSON.stringify({ segments: transcription.segments, words: transcription.words }), 'completed', trackId]
    );

    res.json({
      text: transcription.text,
      segments: transcription.segments,
      words: transcription.words,
      language: transcription.language
    });
  } catch (e) {
    console.error('Transcribe error:', e.message);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// Add track - uploads to B2 cloud storage for scale
app.post('/api/tracks', auth, async (req, res) => {
  try {
    const { title, artist, album, duration, file_data, cover_url } = req.body;
    const db = getPool();

    // Try to upload to B2 storage first (for scale)
    const client = getS3Client();
    let fileKey = null;
    let audioData = null; // Don't store base64 in DB by default

    if (file_data && client) {
      try {
        const matches = file_data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          const extMap = {
            'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
            'audio/wav': 'wav', 'audio/wave': 'wav', 'audio/x-wav': 'wav',
            'audio/flac': 'flac', 'audio/x-flac': 'flac',
            'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
            'audio/aac': 'aac', 'audio/ogg': 'ogg',
          };
          const ext = extMap[mimeType] || 'mp3';
          fileKey = `tracks/${req.user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

          console.log(`Uploading track to B2: ${fileKey} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);

          const command = new PutObjectCommand({
            Bucket: B2_BUCKET,
            Key: fileKey,
            Body: buffer,
            ContentType: mimeType,
          });

          await client.send(command);
          console.log(`B2 upload complete: ${fileKey}`);
        }
      } catch (b2Err) {
        console.error('B2 upload failed, falling back to base64:', b2Err.message);
        fileKey = null;
        audioData = file_data; // Only store in DB if B2 fails
      }
    } else if (file_data && !client) {
      // B2 not configured, store in DB (not recommended for production)
      audioData = file_data;
      console.warn('B2 not configured - storing audio in database (not scalable)');
    }

    const result = await db.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, file_data, file_key, cover_url, lyrics_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, title, artist, album, duration || 0, audioData, fileKey, cover_url, 'pending']
    );

    const track = result.rows[0];

    // Auto-transcribe if OpenAI is configured
    const transcriptionData = file_data; // Use original base64 for transcription
    if (transcriptionData && openai) {
      console.log(`Starting auto-transcription for track: ${track.id}`);
      db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['processing', track.id]);

      transcribeAudio(transcriptionData, track.id).then(async (transcription) => {
        if (transcription) {
          await db.query(
            'UPDATE tracks SET lyrics_text = $1, lyrics_segments = $2, lyrics_status = $3 WHERE id = $4',
            [transcription.text, JSON.stringify({ segments: transcription.segments, words: transcription.words }), 'completed', track.id]
          );
          console.log(`Auto-transcription completed for track: ${track.id}`);
        } else {
          await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', track.id]);
        }
      }).catch((err) => {
        console.error(`Auto-transcription error for track ${track.id}:`, err.message);
        db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', track.id]);
      });
    }

    res.json(track);
  } catch (e) {
    console.error('Add track error:', e.message);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

// Delete tracks without audio
app.delete('/api/tracks/cleanup/no-audio', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'DELETE FROM tracks WHERE user_id = $1 AND file_data IS NULL AND file_key IS NULL RETURNING id, title',
      [req.user.id]
    );
    console.log(`Cleaned up ${result.rows.length} tracks without audio for user ${req.user.id}`);
    res.json({
      deleted: result.rows.length,
      tracks: result.rows.map(t => t.title)
    });
  } catch (e) {
    console.error('Cleanup error:', e.message);
    res.status(500).json({ error: 'Failed to cleanup tracks' });
  }
});

// Verify B2 files exist and delete orphaned tracks (tracks with file_key but no actual file in B2)
app.delete('/api/tracks/cleanup/verify-b2', auth, async (req, res) => {
  try {
    const db = getPool();

    // Get all tracks with file_key for this user
    const tracksResult = await db.query(
      'SELECT id, title, file_key FROM tracks WHERE user_id = $1 AND file_key IS NOT NULL',
      [req.user.id]
    );

    // If no tracks with file_key, nothing to check
    if (tracksResult.rows.length === 0) {
      return res.json({ checked: 0, deleted: 0, tracks: [] });
    }

    const client = getS3Client();
    if (!client) {
      // B2 not configured - can't verify files, so just return success with 0 deleted
      console.log('B2 not configured, skipping verification for user', req.user.id);
      return res.json({ checked: 0, deleted: 0, tracks: [], note: 'Cloud storage not configured' });
    }

    const orphanedTracks = [];

    // Check each track's file in B2
    for (const track of tracksResult.rows) {
      try {
        const command = new HeadObjectCommand({
          Bucket: B2_BUCKET,
          Key: track.file_key,
        });
        await client.send(command);
        // File exists, track is OK
      } catch (err) {
        // File doesn't exist in B2, track is orphaned
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404 || err.Code === 'NotFound') {
          orphanedTracks.push(track);
        } else {
          // Other error (permissions, network, etc) - log but don't delete
          console.log(`B2 check error for ${track.file_key}:`, err.name || err.Code);
        }
      }
    }

    // Delete orphaned tracks from database
    const deletedTitles = [];
    for (const track of orphanedTracks) {
      await db.query('DELETE FROM tracks WHERE id = $1 AND user_id = $2', [track.id, req.user.id]);
      deletedTitles.push(track.title);
    }

    console.log(`Verified B2 files: ${tracksResult.rows.length} tracks checked, ${orphanedTracks.length} orphaned tracks deleted for user ${req.user.id}`);

    res.json({
      checked: tracksResult.rows.length,
      deleted: orphanedTracks.length,
      tracks: deletedTitles
    });
  } catch (e) {
    console.error('B2 verification error:', e.message);
    res.status(500).json({ error: 'Failed to verify B2 files' });
  }
});

// Update track
app.put('/api/tracks/:id', auth, async (req, res) => {
  try {
    const { title, artist, album, is_liked, play_count, bpm, musical_key, energy } = req.body;
    const db = getPool();
    const result = await db.query(
      `UPDATE tracks SET
        title = COALESCE($1, title),
        artist = COALESCE($2, artist),
        album = COALESCE($3, album),
        is_liked = COALESCE($4, is_liked),
        play_count = COALESCE($5, play_count),
        bpm = COALESCE($6, bpm),
        musical_key = COALESCE($7, musical_key),
        energy = COALESCE($8, energy),
        analyzed_at = CASE WHEN $6 IS NOT NULL OR $7 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE analyzed_at END
       WHERE id = $9 AND user_id = $10 RETURNING *`,
      [title, artist, album, is_liked, play_count, bpm, musical_key, energy, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update track error:', e.message);
    res.status(500).json({ error: 'Failed to update track' });
  }
});

// Update track analysis
app.put('/api/tracks/:id/analysis', auth, async (req, res) => {
  try {
    const { bpm, musical_key, energy } = req.body;
    const db = getPool();
    const result = await db.query(
      `UPDATE tracks SET
        bpm = $1,
        musical_key = $2,
        energy = $3,
        analyzed_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [bpm, musical_key, energy, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    console.log(`Analysis saved for track ${req.params.id}: BPM=${bpm}, Key=${musical_key}`);
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update analysis error:', e.message);
    res.status(500).json({ error: 'Failed to update analysis' });
  }
});

// Delete track
app.delete('/api/tracks/:id', auth, async (req, res) => {
  try {
    const db = getPool();
    await db.query('DELETE FROM tracks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ deleted: true });
  } catch (e) {
    console.error('Delete track error:', e.message);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

// Update track visibility (make public/private for Discovery)
app.put('/api/tracks/:id/visibility', auth, async (req, res) => {
  try {
    const db = getPool();
    const { visibility } = req.body;

    if (!['public', 'private'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibility must be "public" or "private"' });
    }

    const result = await db.query(
      'UPDATE tracks SET visibility = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [visibility, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    console.log(`Track ${req.params.id} visibility set to ${visibility}`);
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update visibility error:', e.message);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

// Post track to Discovery (upload + make public)
app.post('/api/discover/post', auth, async (req, res) => {
  try {
    const { title, artist, description, file_data, cover_url, is_beat } = req.body;
    const db = getPool();

    if (!title || !file_data) {
      return res.status(400).json({ error: 'Title and audio file required' });
    }

    console.log(`Discovery post starting: ${title} by user ${req.user.id}`);

    // Try to upload to B2 storage first
    const client = getS3Client();
    let fileKey = null;
    let audioData = file_data; // fallback to base64 if B2 not available

    if (client) {
      try {
        // Extract base64 data and mime type
        const matches = file_data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          // Determine file extension
          const extMap = {
            'audio/mpeg': 'mp3',
            'audio/mp3': 'mp3',
            'audio/wav': 'wav',
            'audio/wave': 'wav',
            'audio/x-wav': 'wav',
            'audio/flac': 'flac',
            'audio/x-flac': 'flac',
            'audio/mp4': 'm4a',
            'audio/x-m4a': 'm4a',
            'audio/aac': 'aac',
            'audio/ogg': 'ogg',
          };
          const ext = extMap[mimeType] || 'mp3';

          fileKey = `discover/${req.user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

          console.log(`Uploading to B2: ${fileKey} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);

          const command = new PutObjectCommand({
            Bucket: B2_BUCKET,
            Key: fileKey,
            Body: buffer,
            ContentType: mimeType,
          });

          await client.send(command);
          console.log(`B2 upload complete: ${fileKey}`);

          // Store file key instead of base64 data
          audioData = null;
        }
      } catch (b2Err) {
        console.error('B2 upload failed, falling back to base64:', b2Err.message);
        fileKey = null;
        // Keep audioData as base64 fallback
      }
    }

    // Create track with public visibility
    const result = await db.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, file_data, file_key, cover_url, lyrics_status, visibility, is_beat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'public', $10) RETURNING *`,
      [req.user.id, title, artist || 'Unknown Artist', description || null, 0, audioData, fileKey, cover_url, 'pending', is_beat || false]
    );

    const track = result.rows[0];

    // Create feed event for the upload
    await db.query(`
      INSERT INTO feed_events (user_id, event_type, target_type, target_id)
      VALUES ($1, 'upload', 'track', $2)
    `, [req.user.id, track.id]);

    // Auto-transcribe if OpenAI is configured
    const transcriptionData = fileKey ? file_data : audioData; // Use original base64 for transcription
    if (transcriptionData && openai) {
      console.log(`Starting auto-transcription for discovery post: ${track.id}`);
      db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['processing', track.id]);

      transcribeAudio(transcriptionData, track.id).then(async (transcription) => {
        if (transcription) {
          await db.query(
            'UPDATE tracks SET lyrics_text = $1, lyrics_segments = $2, lyrics_status = $3 WHERE id = $4',
            [transcription.text, JSON.stringify({ segments: transcription.segments, words: transcription.words }), 'completed', track.id]
          );
          console.log(`Auto-transcription completed for discovery post: ${track.id}`);
        } else {
          await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', track.id]);
        }
      }).catch((err) => {
        console.error(`Auto-transcription error for discovery post ${track.id}:`, err.message);
        db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', track.id]);
      });
    }

    console.log(`Discovery post created: ${title} by user ${req.user.id}, fileKey: ${fileKey || 'base64'}`);
    res.json(track);
  } catch (e) {
    console.error('Discovery post error:', e.message, e.stack);
    res.status(500).json({ error: 'Failed to create post: ' + e.message });
  }
});

// ============ CHUNKED UPLOAD ENDPOINTS ============
const uploadSessions = new Map();

app.post('/api/tracks/upload/init', auth, async (req, res) => {
  try {
    const { title, artist, album, duration, cover_url, total_chunks, file_size, mime_type } = req.body;
    const sessionId = `upload-${req.user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const db = getPool();
    const result = await db.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, cover_url, lyrics_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, title, artist, album, duration || 0, cover_url, 'pending']
    );

    const track = result.rows[0];

    uploadSessions.set(sessionId, {
      trackId: track.id,
      userId: req.user.id,
      totalChunks: total_chunks,
      fileSize: file_size,
      mimeType: mime_type || 'audio/mpeg',
      receivedChunks: new Map(),
      createdAt: Date.now()
    });

    console.log(`Chunked upload initialized: ${sessionId}, track: ${track.id}, chunks: ${total_chunks}`);

    res.json({
      session_id: sessionId,
      track_id: track.id,
      message: `Ready to receive ${total_chunks} chunks`
    });
  } catch (e) {
    console.error('Init upload error:', e.message);
    res.status(500).json({ error: 'Failed to initialize upload' });
  }
});

app.post('/api/tracks/upload/chunk', auth, async (req, res) => {
  try {
    const { session_id, chunk_index, chunk_data } = req.body;

    const session = uploadSessions.get(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found or expired' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    session.receivedChunks.set(chunk_index, chunk_data);

    const received = session.receivedChunks.size;
    const total = session.totalChunks;

    console.log(`Chunk ${chunk_index + 1}/${total} received for session ${session_id}`);

    res.json({
      received: received,
      total: total,
      complete: received === total
    });
  } catch (e) {
    console.error('Chunk upload error:', e.message);
    res.status(500).json({ error: 'Failed to upload chunk' });
  }
});

app.post('/api/tracks/upload/finalize', auth, async (req, res) => {
  try {
    const { session_id } = req.body;

    const session = uploadSessions.get(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found or expired' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (session.receivedChunks.size !== session.totalChunks) {
      return res.status(400).json({
        error: `Missing chunks: received ${session.receivedChunks.size}/${session.totalChunks}`
      });
    }

    console.log(`Assembling ${session.totalChunks} chunks for track ${session.trackId}`);
    const chunks = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const chunk = session.receivedChunks.get(i);
      if (!chunk) {
        return res.status(400).json({ error: `Missing chunk ${i}` });
      }
      chunks.push(chunk);
    }

    const fullBase64 = chunks.join('');
    const fileData = `data:${session.mimeType};base64,${fullBase64}`;

    const db = getPool();
    await db.query(
      'UPDATE tracks SET file_data = $1 WHERE id = $2 AND user_id = $3',
      [fileData, session.trackId, req.user.id]
    );

    uploadSessions.delete(session_id);

    if (openai) {
      console.log(`Starting auto-transcription for chunked upload track: ${session.trackId}`);
      db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['processing', session.trackId]);

      transcribeAudio(fileData, session.trackId).then(async (transcription) => {
        if (transcription) {
          await db.query(
            'UPDATE tracks SET lyrics_text = $1, lyrics_segments = $2, lyrics_status = $3 WHERE id = $4',
            [transcription.text, JSON.stringify({ segments: transcription.segments, words: transcription.words }), 'completed', session.trackId]
          );
        } else {
          await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', session.trackId]);
        }
      }).catch((err) => {
        console.error(`Auto-transcription error for track ${session.trackId}:`, err.message);
        db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', session.trackId]);
      });
    }

    console.log(`Chunked upload complete for track ${session.trackId}`);

    res.json({
      success: true,
      track_id: session.trackId,
      message: 'Upload complete'
    });
  } catch (e) {
    console.error('Finalize upload error:', e.message);
    res.status(500).json({ error: 'Failed to finalize upload' });
  }
});

// Clean up expired upload sessions
setInterval(() => {
  const now = Date.now();
  const expireTime = 30 * 60 * 1000;
  for (const [sessionId, session] of uploadSessions.entries()) {
    if (now - session.createdAt > expireTime) {
      console.log(`Cleaning up expired upload session: ${sessionId}`);
      uploadSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

// ============ B2 UPLOAD ENDPOINTS ============

// Proxy upload to B2 (bypasses CORS)
app.post('/api/upload/proxy', auth, express.raw({ type: '*/*', limit: '200mb' }), async (req, res) => {
  try {
    const client = getS3Client();
    if (!client) {
      return res.status(400).json({ error: 'Cloud storage not configured', fallback: 'base64' });
    }

    const filename = req.headers['x-filename'] || 'audio.mp3';
    const contentType = req.headers['content-type'] || 'audio/mpeg';
    const fileSize = req.body.length;

    const fileExt = filename.split('.').pop()?.toLowerCase() || 'mp3';
    const fileKey = `${req.user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    console.log(`Proxy upload: ${filename} (${Math.round(fileSize / 1024 / 1024)}MB) -> ${fileKey}`);

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: fileKey,
      Body: req.body,
      ContentType: contentType,
    });

    await client.send(command);

    console.log(`Proxy upload complete: ${fileKey}`);

    res.json({
      success: true,
      fileKey,
      fileSize,
      bucket: B2_BUCKET
    });
  } catch (e) {
    console.error('Proxy upload error:', e.message);
    res.status(500).json({ error: 'Upload failed: ' + e.message });
  }
});

// Get presigned URL for direct upload
app.post('/api/upload/presign', auth, async (req, res) => {
  try {
    const client = getS3Client();
    if (!client) {
      return res.status(400).json({ error: 'Cloud storage not configured', fallback: 'base64' });
    }

    const { filename, contentType, fileSize } = req.body;

    const fileExt = filename.split('.').pop()?.toLowerCase() || 'mp3';
    const fileKey = `${req.user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: fileKey,
      ContentType: contentType || 'audio/mpeg',
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    console.log(`Presigned URL generated for: ${filename} (${Math.round(fileSize / 1024 / 1024)}MB)`);

    res.json({
      uploadUrl,
      fileKey,
      expiresIn: 3600,
      bucket: B2_BUCKET
    });
  } catch (e) {
    console.error('Presign error:', e.message);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Batch presign
app.post('/api/upload/presign-batch', auth, async (req, res) => {
  try {
    const client = getS3Client();
    if (!client) {
      return res.status(400).json({ error: 'Cloud storage not configured', fallback: 'base64' });
    }

    const { files } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Files array required' });
    }

    if (files.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 files per batch' });
    }

    console.log(`Generating ${files.length} presigned URLs for bulk upload`);

    const results = await Promise.all(files.map(async (file, index) => {
      const fileExt = file.filename.split('.').pop()?.toLowerCase() || 'mp3';
      const fileKey = `${req.user.id}/${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const command = new PutObjectCommand({
        Bucket: B2_BUCKET,
        Key: fileKey,
        ContentType: file.contentType || 'audio/mpeg',
      });

      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

      return {
        originalFilename: file.filename,
        uploadUrl,
        fileKey,
        fileSize: file.fileSize
      };
    }));

    console.log(`Generated ${results.length} presigned URLs`);

    res.json({
      uploads: results,
      expiresIn: 3600,
      bucket: B2_BUCKET
    });
  } catch (e) {
    console.error('Batch presign error:', e.message);
    res.status(500).json({ error: 'Failed to generate upload URLs' });
  }
});

// Create track from B2 upload
app.post('/api/tracks/from-b2', auth, async (req, res) => {
  try {
    const { title, artist, album, duration, fileKey, cover_url } = req.body;

    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey required' });
    }

    const db = getPool();

    const result = await db.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, file_key, cover_url, lyrics_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, title, artist, album, duration || 0, fileKey, cover_url, 'pending']
    );

    const track = result.rows[0];
    console.log(`Track created from B2 upload: ${title} (${fileKey})`);

    res.json(track);
  } catch (e) {
    console.error('Create track from B2 error:', e.message);
    res.status(500).json({ error: 'Failed to create track' });
  }
});

// Bulk create tracks from B2
app.post('/api/tracks/from-b2-batch', auth, async (req, res) => {
  try {
    const { tracks } = req.body;

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: 'Tracks array required' });
    }

    const db = getPool();
    const inserted = [];
    const failed = [];

    for (const track of tracks) {
      try {
        const result = await db.query(
          `INSERT INTO tracks (user_id, title, artist, album, duration, file_key, cover_url, lyrics_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [req.user.id, track.title, track.artist, track.album, track.duration || 0, track.fileKey, track.cover_url, 'pending']
        );
        inserted.push(result.rows[0]);
      } catch (err) {
        failed.push({ title: track.title, error: err.message });
      }
    }

    console.log(`Bulk created ${inserted.length} tracks from B2, ${failed.length} failed`);

    res.json({
      inserted: inserted.length,
      failed: failed.length,
      tracks: inserted,
      errors: failed
    });
  } catch (e) {
    console.error('Bulk create tracks from B2 error:', e.message);
    res.status(500).json({ error: 'Failed to create tracks' });
  }
});

// Get streaming URL for B2 track
// Returns info about audio source - frontend uses proxy-stream for B2 tracks
app.get('/api/tracks/:id/stream-url', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT file_key, file_data FROM tracks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = result.rows[0];

    // If track has file_key, indicate B2 source - frontend will use proxy-stream
    if (track.file_key) {
      const client = getS3Client();
      if (!client) {
        return res.status(500).json({ error: 'Cloud storage not configured' });
      }

      // Generate signed URL (frontend uses proxy, but we return this for compatibility)
      const command = new GetObjectCommand({
        Bucket: B2_BUCKET,
        Key: track.file_key,
      });

      const streamUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      console.log(`Generated signed URL for ${track.file_key}`);

      return res.json({
        url: streamUrl,
        expiresIn: 3600,
        source: 'b2',
        fileKey: track.file_key
      });
    }

    if (track.file_data) {
      const token = req.headers.authorization?.split(' ')[1];
      return res.json({
        url: `/api/tracks/${req.params.id}/stream?token=${token}`,
        source: 'base64'
      });
    }

    return res.status(404).json({ error: 'No audio data available' });
  } catch (e) {
    console.error('Get stream URL error:', e.message);
    res.status(500).json({ error: 'Failed to get stream URL' });
  }
});

// Proxy stream from B2 (bypasses CORS issues)
// Accepts token via query param since audio elements can't set headers
app.get('/api/tracks/:id/proxy-stream', async (req, res) => {
  // Get token from query param or header
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT file_key, file_data FROM tracks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = result.rows[0];

    if (track.file_key) {
      const client = getS3Client();
      if (!client) {
        return res.status(500).json({ error: 'Cloud storage not configured' });
      }

      try {
        const command = new GetObjectCommand({
          Bucket: B2_BUCKET,
          Key: track.file_key,
        });

        const response = await client.send(command);

        // Set appropriate headers
        const ext = track.file_key.split('.').pop()?.toLowerCase() || 'mp3';
        const mimeTypes = {
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'flac': 'audio/flac',
          'm4a': 'audio/mp4',
          'ogg': 'audio/ogg',
          'aac': 'audio/aac'
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        if (response.ContentLength) {
          res.setHeader('Content-Length', response.ContentLength);
        }

        // Stream the response
        response.Body.pipe(res);
      } catch (b2Err) {
        console.error(`B2 proxy stream error for ${track.file_key}:`, b2Err.message);
        return res.status(404).json({ error: 'Audio file not found in cloud' });
      }
    } else if (track.file_data) {
      // Fall back to base64 data
      const base64Match = track.file_data.match(/^data:(audio\/[^;]+);base64,(.+)$/);
      if (base64Match) {
        const mimeType = base64Match[1];
        const audioBuffer = Buffer.from(base64Match[2], 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', audioBuffer.length);
        res.send(audioBuffer);
      } else {
        res.status(400).json({ error: 'Invalid audio data format' });
      }
    } else {
      res.status(404).json({ error: 'No audio data available' });
    }
  } catch (e) {
    console.error('Proxy stream error:', e.message);
    res.status(500).json({ error: 'Stream failed' });
  }
});

// Update track file key (for syncing local tracks to cloud)
app.put('/api/tracks/:id/file-key', auth, async (req, res) => {
  try {
    const { fileKey } = req.body;

    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey required' });
    }

    const db = getPool();

    // Verify track belongs to user
    const existingTrack = await db.query(
      'SELECT id FROM tracks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existingTrack.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Update track with new file key
    const result = await db.query(
      `UPDATE tracks SET file_key = $1, file_data = NULL WHERE id = $2 AND user_id = $3 RETURNING *`,
      [fileKey, req.params.id, req.user.id]
    );

    console.log(`Track ${req.params.id} synced to cloud with file key: ${fileKey}`);

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update track file key error:', e.message);
    res.status(500).json({ error: 'Failed to update track' });
  }
});

// Get playlists
app.get('/api/playlists', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Get playlists error:', e.message);
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

// Create playlist
app.post('/api/playlists', auth, async (req, res) => {
  try {
    const { name, description, cover_url } = req.body;
    const db = getPool();
    const result = await db.query(
      'INSERT INTO playlists (user_id, name, description, cover_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, description, cover_url]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Create playlist error:', e.message);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Transcribe all tracks
app.post('/api/transcribe-all', auth, async (req, res) => {
  if (!openai) {
    return res.status(400).json({ error: 'OpenAI not configured' });
  }

  try {
    const db = getPool();

    const result = await db.query(
      `SELECT id, title, file_data FROM tracks
       WHERE user_id = $1
       AND file_data IS NOT NULL
       AND (lyrics_text IS NULL OR lyrics_text = '')
       AND lyrics_status != 'processing'
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const tracksToTranscribe = result.rows;
    console.log(`Found ${tracksToTranscribe.length} tracks to transcribe for user ${req.user.id}`);

    if (tracksToTranscribe.length === 0) {
      return res.json({ message: 'No tracks need transcription', count: 0 });
    }

    res.json({
      message: `Starting transcription for ${tracksToTranscribe.length} tracks`,
      count: tracksToTranscribe.length
    });

    for (const track of tracksToTranscribe) {
      try {
        console.log(`Transcribing track: ${track.title} (${track.id})`);

        await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['processing', track.id]);

        const transcription = await transcribeAudio(track.file_data, track.id);

        if (transcription) {
          await db.query(
            'UPDATE tracks SET lyrics_text = $1, lyrics_segments = $2, lyrics_status = $3 WHERE id = $4',
            [transcription.text, JSON.stringify({ segments: transcription.segments, words: transcription.words }), 'completed', track.id]
          );
          console.log(`Transcription completed for: ${track.title}`);
        } else {
          await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', track.id]);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Error transcribing track ${track.id}:`, err.message);
        await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', track.id]);
      }
    }

    console.log('Batch transcription complete');
  } catch (e) {
    console.error('Transcribe-all error:', e.message);
  }
});

// ============================================
// RHYTHM Social Beat Marketplace - Phase 1 API Endpoints
// ============================================

// ---- PRODUCER PROFILES ----

// Get producer profile
app.get('/api/producers/:userId', async (req, res) => {
  try {
    const db = getPool();
    const { userId } = req.params;

    const result = await db.query(`
      SELECT
        pp.*,
        u.username,
        u.email,
        (SELECT COUNT(*) FROM follows WHERE following_id = pp.user_id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = pp.user_id) as following_count,
        (SELECT COUNT(*) FROM tracks WHERE user_id = pp.user_id AND visibility = 'public') as tracks_count
      FROM producer_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      // Return basic user info if no producer profile exists
      const userResult = await db.query('SELECT id, username FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ user_id: userId, username: userResult.rows[0].username, is_producer: false });
    }

    res.json({ ...result.rows[0], is_producer: true });
  } catch (e) {
    console.error('Get producer profile error:', e.message);
    res.status(500).json({ error: 'Failed to get producer profile' });
  }
});

// Create/update producer profile
app.put('/api/me/producer-profile', auth, async (req, res) => {
  try {
    const db = getPool();
    const { display_name, bio, avatar_url, banner_url, website, social_links } = req.body;

    const result = await db.query(`
      INSERT INTO producer_profiles (user_id, display_name, bio, avatar_url, banner_url, website, social_links)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, producer_profiles.display_name),
        bio = COALESCE(EXCLUDED.bio, producer_profiles.bio),
        avatar_url = COALESCE(EXCLUDED.avatar_url, producer_profiles.avatar_url),
        banner_url = COALESCE(EXCLUDED.banner_url, producer_profiles.banner_url),
        website = COALESCE(EXCLUDED.website, producer_profiles.website),
        social_links = COALESCE(EXCLUDED.social_links, producer_profiles.social_links),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [req.user.id, display_name, bio, avatar_url, banner_url, website, social_links || {}]);

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update producer profile error:', e.message);
    res.status(500).json({ error: 'Failed to update producer profile' });
  }
});

// ---- USER SEARCH ----

// Search users by username or display name
// If no query provided, returns all users with profiles (suggested users for messaging)
app.get('/api/users/search', auth, async (req, res) => {
  try {
    const db = getPool();
    const { q } = req.query;

    // If no query, return all users with profiles (for messaging suggestions)
    if (!q || q.length < 1) {
      const result = await db.query(`
        SELECT
          u.id,
          pp.username,
          pp.display_name,
          pp.avatar_url
        FROM users u
        LEFT JOIN producer_profiles pp ON pp.user_id = u.id
        WHERE pp.username IS NOT NULL
          AND u.id != $1
        ORDER BY pp.display_name NULLS LAST, pp.username
        LIMIT 50
      `, [req.user.id]);
      return res.json(result.rows);
    }

    const result = await db.query(`
      SELECT
        u.id,
        pp.username,
        pp.display_name,
        pp.avatar_url
      FROM users u
      LEFT JOIN producer_profiles pp ON pp.user_id = u.id
      WHERE (pp.username ILIKE $1
         OR pp.display_name ILIKE $1
         OR u.email ILIKE $1)
         AND u.id != $3
      ORDER BY
        CASE WHEN pp.username ILIKE $2 THEN 0 ELSE 1 END,
        pp.username
      LIMIT 20
    `, [`%${q}%`, `${q}%`, req.user.id]);

    res.json(result.rows);
  } catch (e) {
    console.error('User search error:', e.message);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// ---- FOLLOWS ----

// Follow a user
app.post('/api/users/:userId/follow', auth, async (req, res) => {
  try {
    const db = getPool();
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    await db.query(`
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [req.user.id, userId]);

    // Create feed event
    await db.query(`
      INSERT INTO feed_events (user_id, event_type, target_type, target_id)
      VALUES ($1, 'follow', 'user', $2)
    `, [req.user.id, userId]);

    res.json({ success: true });
  } catch (e) {
    console.error('Follow error:', e.message);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
app.delete('/api/users/:userId/follow', auth, async (req, res) => {
  try {
    const db = getPool();
    const { userId } = req.params;

    await db.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, userId]);
    res.json({ success: true });
  } catch (e) {
    console.error('Unfollow error:', e.message);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Get followers
app.get('/api/users/:userId/followers', async (req, res) => {
  try {
    const db = getPool();
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.query(`
      SELECT u.id, u.username, pp.display_name, pp.avatar_url
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      LEFT JOIN producer_profiles pp ON pp.user_id = u.id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json(result.rows);
  } catch (e) {
    console.error('Get followers error:', e.message);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Get following
app.get('/api/users/:userId/following', async (req, res) => {
  try {
    const db = getPool();
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.query(`
      SELECT u.id, u.username, pp.display_name, pp.avatar_url
      FROM follows f
      JOIN users u ON u.id = f.following_id
      LEFT JOIN producer_profiles pp ON pp.user_id = u.id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json(result.rows);
  } catch (e) {
    console.error('Get following error:', e.message);
    res.status(500).json({ error: 'Failed to get following' });
  }
});

// ---- TRACK LIKES ----

// Like a track
app.post('/api/tracks/:trackId/like', auth, async (req, res) => {
  try {
    const db = getPool();
    const { trackId } = req.params;

    await db.query(`
      INSERT INTO track_likes (user_id, track_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [req.user.id, trackId]);

    // Create feed event
    await db.query(`
      INSERT INTO feed_events (user_id, event_type, target_type, target_id)
      VALUES ($1, 'like', 'track', $2)
    `, [req.user.id, trackId]);

    res.json({ success: true });
  } catch (e) {
    console.error('Like error:', e.message);
    res.status(500).json({ error: 'Failed to like track' });
  }
});

// Unlike a track
app.delete('/api/tracks/:trackId/like', auth, async (req, res) => {
  try {
    const db = getPool();
    const { trackId } = req.params;

    await db.query('DELETE FROM track_likes WHERE user_id = $1 AND track_id = $2', [req.user.id, trackId]);
    res.json({ success: true });
  } catch (e) {
    console.error('Unlike error:', e.message);
    res.status(500).json({ error: 'Failed to unlike track' });
  }
});

// Get track likes count
app.get('/api/tracks/:trackId/likes', async (req, res) => {
  try {
    const db = getPool();
    const { trackId } = req.params;

    const result = await db.query('SELECT COUNT(*) as count FROM track_likes WHERE track_id = $1', [trackId]);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (e) {
    console.error('Get likes error:', e.message);
    res.status(500).json({ error: 'Failed to get likes' });
  }
});

// Get user's liked tracks from Discovery (for library sync)
app.get('/api/liked-tracks', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(`
      SELECT t.id, t.title, t.artist, t.duration, t.cover_url, t.bpm, t.musical_key,
             t.genre, t.user_id, t.visibility, t.is_beat,
             u.username, u.display_name, u.avatar_url,
             tl.created_at as liked_at
      FROM track_likes tl
      JOIN tracks t ON t.id = tl.track_id
      JOIN users u ON u.id = t.user_id
      WHERE tl.user_id = $1
      ORDER BY tl.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (e) {
    console.error('Get liked tracks error:', e.message);
    res.status(500).json({ error: 'Failed to get liked tracks' });
  }
});

// ---- REPOSTS ----

// Repost a track
app.post('/api/tracks/:trackId/repost', auth, async (req, res) => {
  try {
    const db = getPool();
    const { trackId } = req.params;

    await db.query(`
      INSERT INTO reposts (user_id, track_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [req.user.id, trackId]);

    // Create feed event
    await db.query(`
      INSERT INTO feed_events (user_id, event_type, target_type, target_id)
      VALUES ($1, 'repost', 'track', $2)
    `, [req.user.id, trackId]);

    res.json({ success: true });
  } catch (e) {
    console.error('Repost error:', e.message);
    res.status(500).json({ error: 'Failed to repost track' });
  }
});

// Remove repost
app.delete('/api/tracks/:trackId/repost', auth, async (req, res) => {
  try {
    const db = getPool();
    const { trackId } = req.params;

    await db.query('DELETE FROM reposts WHERE user_id = $1 AND track_id = $2', [req.user.id, trackId]);
    res.json({ success: true });
  } catch (e) {
    console.error('Remove repost error:', e.message);
    res.status(500).json({ error: 'Failed to remove repost' });
  }
});

// ---- COMMENTS ----

// Get comments for a track
app.get('/api/tracks/:trackId/comments', async (req, res) => {
  try {
    const db = getPool();
    const { trackId } = req.params;

    const result = await db.query(`
      SELECT c.*, u.username, pp.display_name, pp.avatar_url
      FROM comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN producer_profiles pp ON pp.user_id = u.id
      WHERE c.track_id = $1
      ORDER BY c.created_at ASC
    `, [trackId]);

    res.json(result.rows);
  } catch (e) {
    console.error('Get comments error:', e.message);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Add comment
app.post('/api/tracks/:trackId/comments', auth, async (req, res) => {
  try {
    const db = getPool();
    const { trackId } = req.params;
    const { content, parent_id, timestamp_ms } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content required' });
    }

    const result = await db.query(`
      INSERT INTO comments (user_id, track_id, parent_id, content, timestamp_ms)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, trackId, parent_id || null, content.trim(), timestamp_ms || null]);

    // Create feed event
    await db.query(`
      INSERT INTO feed_events (user_id, event_type, target_type, target_id, metadata)
      VALUES ($1, 'comment', 'track', $2, $3)
    `, [req.user.id, trackId, JSON.stringify({ comment_id: result.rows[0].id })]);

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Add comment error:', e.message);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete comment
app.delete('/api/comments/:commentId', auth, async (req, res) => {
  try {
    const db = getPool();
    const { commentId } = req.params;

    // Only allow deleting own comments
    const result = await db.query('DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id', [commentId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or not authorized' });
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Delete comment error:', e.message);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ---- ACTIVITY FEED ----

// Get feed for current user (from people they follow)
app.get('/api/feed', auth, async (req, res) => {
  try {
    const db = getPool();
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.query(`
      SELECT
        fe.*,
        u.username,
        pp.display_name,
        pp.avatar_url,
        CASE
          WHEN fe.target_type = 'track' THEN (SELECT row_to_json(t) FROM tracks t WHERE t.id = fe.target_id)
          WHEN fe.target_type = 'user' THEN (SELECT row_to_json(u2) FROM users u2 WHERE u2.id = fe.target_id)
          ELSE NULL
        END as target_data
      FROM feed_events fe
      JOIN users u ON u.id = fe.user_id
      LEFT JOIN producer_profiles pp ON pp.user_id = u.id
      WHERE fe.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
         OR fe.user_id = $1
      ORDER BY fe.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    res.json(result.rows);
  } catch (e) {
    console.error('Get feed error:', e.message);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// ---- PUBLIC TRACKS (Discovery) ----

// Get public tracks for feed/discovery
app.get('/api/discover/tracks', async (req, res) => {
  try {
    const db = getPool();
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const genre = req.query.genre;

    let query = `
      SELECT
        t.*,
        u.username,
        pp.display_name,
        pp.avatar_url,
        (SELECT COUNT(*) FROM track_likes WHERE track_id = t.id) as likes_count,
        (SELECT COUNT(*) FROM reposts WHERE track_id = t.id) as reposts_count,
        (SELECT COUNT(*) FROM comments WHERE track_id = t.id) as comments_count
      FROM tracks t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN producer_profiles pp ON pp.user_id = u.id
      WHERE t.visibility = 'public'
    `;

    const params = [];
    let paramCount = 0;

    if (genre) {
      paramCount++;
      query += ` AND t.genre = $${paramCount}`;
      params.push(genre);
    }

    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount - 1} OFFSET $${paramCount}`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (e) {
    console.error('Get discover tracks error:', e.message);
    res.status(500).json({ error: 'Failed to get tracks' });
  }
});

// ---- BEAT PACKS ----

// Get user's packs
app.get('/api/me/packs', auth, async (req, res) => {
  try {
    const db = getPool();

    const result = await db.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM pack_tracks WHERE pack_id = p.id) as track_count
      FROM packs p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (e) {
    console.error('Get packs error:', e.message);
    res.status(500).json({ error: 'Failed to get packs' });
  }
});

// Create a pack
app.post('/api/packs', auth, async (req, res) => {
  try {
    const db = getPool();
    const { title, description, cover_url, price, license_type, track_ids } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price required' });
    }

    const result = await db.query(`
      INSERT INTO packs (user_id, title, description, cover_url, price, license_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.user.id, title, description, cover_url, price, license_type || 'basic']);

    const packId = result.rows[0].id;

    // Add tracks to pack
    if (track_ids && track_ids.length > 0) {
      for (let i = 0; i < track_ids.length; i++) {
        await db.query(`
          INSERT INTO pack_tracks (pack_id, track_id, position)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [packId, track_ids[i], i]);
      }
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Create pack error:', e.message);
    res.status(500).json({ error: 'Failed to create pack' });
  }
});

// Get pack details
app.get('/api/packs/:packId', async (req, res) => {
  try {
    const db = getPool();
    const { packId } = req.params;

    const packResult = await db.query(`
      SELECT p.*, u.username, pp.display_name, pp.avatar_url
      FROM packs p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN producer_profiles pp ON pp.user_id = u.id
      WHERE p.id = $1
    `, [packId]);

    if (packResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    const pack = packResult.rows[0];

    // Get tracks in pack
    const tracksResult = await db.query(`
      SELECT t.id, t.title, t.artist, t.duration, t.cover_url, t.bpm, t.musical_key, t.genre
      FROM pack_tracks pt
      JOIN tracks t ON t.id = pt.track_id
      WHERE pt.pack_id = $1
      ORDER BY pt.position
    `, [packId]);

    res.json({ ...pack, tracks: tracksResult.rows });
  } catch (e) {
    console.error('Get pack error:', e.message);
    res.status(500).json({ error: 'Failed to get pack' });
  }
});

// Update pack
app.put('/api/packs/:packId', auth, async (req, res) => {
  try {
    const db = getPool();
    const { packId } = req.params;
    const { title, description, cover_url, price, sale_price, license_type, visibility } = req.body;

    const result = await db.query(`
      UPDATE packs SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        cover_url = COALESCE($3, cover_url),
        price = COALESCE($4, price),
        sale_price = $5,
        license_type = COALESCE($6, license_type),
        visibility = COALESCE($7, visibility),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `, [title, description, cover_url, price, sale_price, license_type, visibility, packId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pack not found or not authorized' });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update pack error:', e.message);
    res.status(500).json({ error: 'Failed to update pack' });
  }
});

// Delete pack
app.delete('/api/packs/:packId', auth, async (req, res) => {
  try {
    const db = getPool();
    const { packId } = req.params;

    const result = await db.query('DELETE FROM packs WHERE id = $1 AND user_id = $2 RETURNING id', [packId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pack not found or not authorized' });
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Delete pack error:', e.message);
    res.status(500).json({ error: 'Failed to delete pack' });
  }
});

// Browse public packs
app.get('/api/discover/packs', async (req, res) => {
  try {
    const db = getPool();
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.query(`
      SELECT
        p.*,
        u.username,
        pp.display_name,
        pp.avatar_url,
        (SELECT COUNT(*) FROM pack_tracks WHERE pack_id = p.id) as track_count
      FROM packs p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN producer_profiles pp ON pp.user_id = u.id
      WHERE p.visibility = 'public'
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json(result.rows);
  } catch (e) {
    console.error('Get discover packs error:', e.message);
    res.status(500).json({ error: 'Failed to get packs' });
  }
});

// ---- MESSAGING ----

// Get conversations
app.get('/api/messages/conversations', auth, async (req, res) => {
  try {
    const db = getPool();

    const result = await db.query(`
      SELECT
        c.*,
        (
          SELECT json_agg(json_build_object('user_id', u.id, 'username', u.username, 'avatar_url', pp.avatar_url))
          FROM conversation_participants cp2
          JOIN users u ON u.id = cp2.user_id
          LEFT JOIN producer_profiles pp ON pp.user_id = u.id
          WHERE cp2.conversation_id = c.id AND cp2.user_id != $1
        ) as other_participants,
        (
          SELECT row_to_json(m)
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')
            AND m.sender_id != $1
        ) as unread_count
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
      ORDER BY c.updated_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (e) {
    console.error('Get conversations error:', e.message);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get messages in a conversation
app.get('/api/messages/conversations/:conversationId', auth, async (req, res) => {
  try {
    const db = getPool();
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before;

    // Verify user is participant
    const participantCheck = await db.query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, req.user.id]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    let query = `
      SELECT m.*, u.username, pp.avatar_url
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN producer_profiles pp ON pp.user_id = u.id
      WHERE m.conversation_id = $1
    `;
    const params = [conversationId];

    if (before) {
      query += ` AND m.created_at < $2`;
      params.push(before);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);

    // Mark as read
    await db.query(
      'UPDATE conversation_participants SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, req.user.id]
    );

    res.json(result.rows.reverse());
  } catch (e) {
    console.error('Get messages error:', e.message);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
app.post('/api/messages/conversations/:conversationId', auth, async (req, res) => {
  try {
    const db = getPool();
    const { conversationId } = req.params;
    const { content, message_type, attachment_id } = req.body;

    // Verify user is participant
    const participantCheck = await db.query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, req.user.id]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const result = await db.query(`
      INSERT INTO messages (conversation_id, sender_id, content, message_type, attachment_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [conversationId, req.user.id, content, message_type || 'text', attachment_id]);

    // Update conversation timestamp
    await db.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [conversationId]);

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Send message error:', e.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Start new conversation
app.post('/api/messages/conversations', auth, async (req, res) => {
  try {
    const db = getPool();
    const { user_id, initial_message } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    if (user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Check if conversation already exists between these users
    const existingConvo = await db.query(`
      SELECT c.id FROM conversations c
      WHERE EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = c.id AND user_id = $1)
        AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = c.id AND user_id = $2)
        AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2
    `, [req.user.id, user_id]);

    let conversationId;

    if (existingConvo.rows.length > 0) {
      conversationId = existingConvo.rows[0].id;
    } else {
      // Create new conversation
      const convoResult = await db.query('INSERT INTO conversations DEFAULT VALUES RETURNING id');
      conversationId = convoResult.rows[0].id;

      // Add participants
      await db.query('INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
        [conversationId, req.user.id, user_id]);
    }

    // Send initial message if provided
    if (initial_message) {
      await db.query(`
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES ($1, $2, $3)
      `, [conversationId, req.user.id, initial_message]);

      await db.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [conversationId]);
    }

    res.json({ conversation_id: conversationId });
  } catch (e) {
    console.error('Start conversation error:', e.message);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// ============ ANALYTICS ENDPOINTS ============

// Get analytics stats
app.get('/api/analytics/stats', auth, async (req, res) => {
  try {
    const db = getPool();
    const range = req.query.range || '30d';

    // Calculate date range
    let daysBack = 30;
    if (range === '7d') daysBack = 7;
    else if (range === '90d') daysBack = 90;
    else if (range === 'all') daysBack = 365 * 10; // "all time"

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - (daysBack * 2));

    // Get current period stats from tracks
    const tracksResult = await db.query(`
      SELECT
        COALESCE(SUM(play_count), 0) as total_plays,
        COALESCE(SUM(CASE WHEN is_liked THEN 1 ELSE 0 END), 0) as total_likes,
        COUNT(*) as track_count
      FROM tracks
      WHERE user_id = $1
    `, [req.user.id]);

    // Get sales stats from transactions
    const salesResult = await db.query(`
      SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(seller_earnings), 0) as total_earnings
      FROM transactions
      WHERE seller_id = $1 AND status = 'completed'
        AND created_at >= $2
    `, [req.user.id, startDate.toISOString()]);

    // Get previous period sales for comparison
    const prevSalesResult = await db.query(`
      SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(seller_earnings), 0) as total_earnings
      FROM transactions
      WHERE seller_id = $1 AND status = 'completed'
        AND created_at >= $2 AND created_at < $3
    `, [req.user.id, prevStartDate.toISOString(), startDate.toISOString()]);

    // Get pending payout (unpaid earnings)
    const pendingResult = await db.query(`
      SELECT COALESCE(SUM(seller_earnings), 0) as pending
      FROM transactions
      WHERE seller_id = $1 AND status = 'completed' AND payout_status = 'pending'
    `, [req.user.id]);

    // Calculate download count from transactions
    const downloadsResult = await db.query(`
      SELECT COUNT(*) as total_downloads
      FROM transactions
      WHERE seller_id = $1 AND status = 'completed'
    `, [req.user.id]);

    // Calculate percentage changes
    const currentSales = parseInt(salesResult.rows[0]?.total_sales || 0);
    const prevSales = parseInt(prevSalesResult.rows[0]?.total_sales || 0);
    const salesChange = prevSales > 0 ? Math.round(((currentSales - prevSales) / prevSales) * 100) : 0;

    const currentEarnings = parseFloat(salesResult.rows[0]?.total_earnings || 0);
    const prevEarnings = parseFloat(prevSalesResult.rows[0]?.total_earnings || 0);
    const earningsChange = prevEarnings > 0 ? Math.round(((currentEarnings - prevEarnings) / prevEarnings) * 100) : 0;

    res.json({
      total_plays: parseInt(tracksResult.rows[0]?.total_plays || 0),
      total_likes: parseInt(tracksResult.rows[0]?.total_likes || 0),
      total_downloads: parseInt(downloadsResult.rows[0]?.total_downloads || 0),
      total_sales: currentSales,
      total_earnings: currentEarnings,
      pending_payout: parseFloat(pendingResult.rows[0]?.pending || 0),
      plays_change: 0, // Would need play history table
      likes_change: 0, // Would need like history table
      sales_change: salesChange,
      earnings_change: earningsChange
    });
  } catch (e) {
    console.error('Analytics stats error:', e.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get top performing items
app.get('/api/analytics/top-items', auth, async (req, res) => {
  try {
    const db = getPool();
    const limit = parseInt(req.query.limit) || 5;

    // Get top beats by sales
    const beatsResult = await db.query(`
      SELECT
        b.id,
        b.title,
        'beat' as type,
        b.play_count as plays,
        COUNT(t.id) as sales,
        COALESCE(SUM(t.seller_earnings), 0) as earnings,
        b.cover_url
      FROM beats b
      LEFT JOIN transactions t ON t.item_id = b.id AND t.item_type = 'beat' AND t.status = 'completed'
      WHERE b.user_id = $1
      GROUP BY b.id
      ORDER BY earnings DESC, plays DESC
      LIMIT $2
    `, [req.user.id, limit]);

    // Get top sample packs
    const packsResult = await db.query(`
      SELECT
        sp.id,
        sp.title,
        'pack' as type,
        0 as plays,
        COUNT(t.id) as sales,
        COALESCE(SUM(t.seller_earnings), 0) as earnings,
        sp.cover_url
      FROM sample_packs sp
      LEFT JOIN transactions t ON t.item_id = sp.id AND t.item_type = 'sample_pack' AND t.status = 'completed'
      WHERE sp.user_id = $1
      GROUP BY sp.id
      ORDER BY earnings DESC
      LIMIT $2
    `, [req.user.id, limit]);

    // Combine and sort by earnings
    const allItems = [...beatsResult.rows, ...packsResult.rows]
      .sort((a, b) => parseFloat(b.earnings) - parseFloat(a.earnings))
      .slice(0, limit);

    res.json(allItems);
  } catch (e) {
    console.error('Top items error:', e.message);
    res.status(500).json({ error: 'Failed to fetch top items' });
  }
});

// Get sales history for chart
app.get('/api/analytics/sales-history', auth, async (req, res) => {
  try {
    const db = getPool();
    const range = req.query.range || '30d';

    let daysBack = 30;
    if (range === '7d') daysBack = 7;
    else if (range === '90d') daysBack = 90;
    else if (range === 'all') daysBack = 365;

    const result = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as sales,
        COALESCE(SUM(seller_earnings), 0) as earnings
      FROM transactions
      WHERE seller_id = $1 AND status = 'completed'
        AND created_at >= NOW() - INTERVAL '${daysBack} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (e) {
    console.error('Sales history error:', e.message);
    res.status(500).json({ error: 'Failed to fetch sales history' });
  }
});

// Request payout
app.post('/api/analytics/payout-request', auth, async (req, res) => {
  try {
    const db = getPool();
    const { payment_method, payment_details } = req.body;

    // Get pending earnings
    const pendingResult = await db.query(`
      SELECT COALESCE(SUM(seller_earnings), 0) as pending
      FROM transactions
      WHERE seller_id = $1 AND status = 'completed' AND payout_status = 'pending'
    `, [req.user.id]);

    const pendingAmount = parseFloat(pendingResult.rows[0]?.pending || 0);

    if (pendingAmount < 50) {
      return res.status(400).json({ error: 'Minimum payout is $50' });
    }

    // Create payout request
    const payoutResult = await db.query(`
      INSERT INTO payout_requests (user_id, amount, payment_method, payment_details, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `, [req.user.id, pendingAmount, payment_method, JSON.stringify(payment_details)]);

    // Mark transactions as payout_requested
    await db.query(`
      UPDATE transactions
      SET payout_status = 'requested', payout_request_id = $1
      WHERE seller_id = $2 AND status = 'completed' AND payout_status = 'pending'
    `, [payoutResult.rows[0].id, req.user.id]);

    res.json({
      success: true,
      payout_id: payoutResult.rows[0].id,
      amount: pendingAmount,
      status: 'pending'
    });
  } catch (e) {
    console.error('Payout request error:', e.message);
    res.status(500).json({ error: 'Failed to create payout request' });
  }
});

// Get payout history
app.get('/api/analytics/payout-history', auth, async (req, res) => {
  try {
    const db = getPool();

    const result = await db.query(`
      SELECT id, amount, payment_method, status, created_at, processed_at
      FROM payout_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.user.id]);

    res.json(result.rows);
  } catch (e) {
    console.error('Payout history error:', e.message);
    res.status(500).json({ error: 'Failed to fetch payout history' });
  }
});

// ============ STATIC FILES (Frontend) ============

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle all non-API routes by serving the index.html (SPA)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  initDB();
});
