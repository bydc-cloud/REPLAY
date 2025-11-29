import express from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import OpenAI from 'openai';
import { Readable } from 'stream';
import { File } from 'buffer';

dotenv.config();

// OpenAI Configuration for Whisper transcription
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let openai = null;
function getOpenAI() {
  if (!openai && OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log('OpenAI client initialized for transcription');
  }
  return openai;
}

// Backblaze B2 Configuration (S3-compatible)
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_BUCKET = process.env.B2_BUCKET || 'replay-music';
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com';
const B2_REGION = process.env.B2_REGION || 'us-west-004';

// Cloudflare Worker URL for free bandwidth (Bandwidth Alliance with B2)
const CLOUDFLARE_CDN_URL = process.env.CLOUDFLARE_CDN_URL || '';

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

// Configure multer for file uploads (memory storage for streaming to B2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  },
});

const app = express();
const port = process.env.PORT || 3001;

// Log startup immediately
console.log('='.repeat(60));
console.log('REPLAY API - STARTING');
console.log('Port:', port);
console.log('Time:', new Date().toISOString());
console.log('='.repeat(60));

// CORS - must be FIRST middleware
app.use((req, res, next) => {
  // Set CORS headers on EVERY response
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  // Log every request
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);

  // Handle preflight immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Body parser - increased limit for base64 audio data
app.use(express.json({ limit: '150mb' }));

// Database - lazy connection
let pool = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }
  return pool;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Initialize database schema
async function initDB() {
  const db = getPool();
  try {
    await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        file_url TEXT,
        file_key TEXT,
        file_data TEXT,
        cover_url TEXT,
        play_count INTEGER DEFAULT 0,
        is_liked BOOLEAN DEFAULT false,
        genre VARCHAR(100),
        year INTEGER,
        track_number INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add file_key column if it doesn't exist (for existing databases)
    await db.query(`
      ALTER TABLE tracks ADD COLUMN IF NOT EXISTS file_key TEXT
    `);

    // Add file_data column if it doesn't exist (for base64 audio storage)
    await db.query(`
      ALTER TABLE tracks ADD COLUMN IF NOT EXISTS file_data TEXT
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cover_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (playlist_id, track_id)
      )
    `);

    // Lyrics table for transcriptions
    await db.query(`
      CREATE TABLE IF NOT EXISTS lyrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE UNIQUE,
        content TEXT NOT NULL,
        segments JSONB,
        language VARCHAR(10),
        transcription_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database schema ready');
    return true;
  } catch (error) {
    console.error('Database init error:', error.message);
    return false;
  }
}

// Health check - responds immediately, no DB needed
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({ name: 'Replay Music API', status: 'running' });
});

// Auth: Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    console.log('Signup attempt:', email);

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const db = getPool();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
      [email.toLowerCase(), username, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    console.log('Signup success:', email);
    res.json({ user, token });
  } catch (error) {
    console.error('Signup error:', error.message);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Auth: Signin
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signin attempt:', email);

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

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    delete user.password_hash;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    console.log('Signin success:', email);
    res.json({ user, token });
  } catch (error) {
    console.error('Signin error:', error.message);
    res.status(500).json({ error: 'Signin failed' });
  }
});

// Auth: Verify
app.get('/api/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, userId: decoded.id });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Auth: Update Profile (name)
app.put('/api/auth/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const db = getPool();
    const result = await db.query(
      'UPDATE users SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, username, created_at',
      [name.trim(), decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    console.log('Profile updated:', user.email, '->', name);
    res.json({ user });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Auth middleware
function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ============ FILE UPLOAD API ============

// Upload audio file to Backblaze B2
app.post('/api/upload', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const client = getS3Client();
    if (!client) {
      return res.status(500).json({ error: 'Storage not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const file = req.file;
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || 'mp3';
    const fileName = `${req.userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

    // Upload to Backblaze B2
    const uploadCommand = new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype || 'audio/mpeg',
    });

    await client.send(uploadCommand);

    console.log('File uploaded to B2:', fileName);

    // Return the file key (not a public URL - we'll generate signed URLs for playback)
    res.json({
      success: true,
      fileKey: fileName,
      size: file.size,
      originalName: file.originalname,
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get streaming URL (via Cloudflare CDN for free bandwidth, or direct B2 signed URL)
app.get('/api/stream/:trackId', authMiddleware, async (req, res) => {
  try {
    const { trackId } = req.params;
    const db = getPool();

    // Get track from database
    const result = await db.query(
      'SELECT * FROM tracks WHERE id = $1 AND user_id = $2',
      [trackId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = result.rows[0];

    if (!track.file_key) {
      return res.status(400).json({ error: 'Track has no audio file' });
    }

    // If Cloudflare CDN is configured, use it for free bandwidth
    if (CLOUDFLARE_CDN_URL) {
      // Cloudflare Worker proxies to B2 - no signed URL needed
      const cdnUrl = `${CLOUDFLARE_CDN_URL}/${track.file_key}`;
      console.log('Streaming via Cloudflare CDN:', cdnUrl);
      return res.json({ url: cdnUrl, expiresIn: null, cdn: true });
    }

    // Fallback to direct B2 signed URL
    const client = getS3Client();
    if (!client) {
      return res.status(500).json({ error: 'Storage not configured' });
    }

    // Generate signed URL valid for 1 hour
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET,
      Key: track.file_key,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    res.json({ url: signedUrl, expiresIn: 3600, cdn: false });
  } catch (error) {
    console.error('Stream error:', error.message);
    res.status(500).json({ error: 'Failed to get stream URL' });
  }
});

// Delete file from B2 (called when track is deleted)
async function deleteFileFromB2(fileKey) {
  try {
    const client = getS3Client();
    if (!client || !fileKey) return;

    const command = new DeleteObjectCommand({
      Bucket: B2_BUCKET,
      Key: fileKey,
    });

    await client.send(command);
    console.log('File deleted from B2:', fileKey);
  } catch (error) {
    console.error('B2 delete error:', error.message);
  }
}

// ============ TRACKS API ============

// Get all tracks for user (without file_data for performance)
app.get('/api/tracks', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    // Exclude file_data from listing - it's fetched separately per track
    const result = await db.query(
      `SELECT id, user_id, title, artist, album, duration, file_url, file_key,
              cover_url, play_count, is_liked, genre, year, track_number,
              created_at, updated_at,
              CASE WHEN file_data IS NOT NULL AND file_data != '' THEN true ELSE false END as has_audio
       FROM tracks WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get tracks error:', error.message);
    res.status(500).json({ error: 'Failed to get tracks' });
  }
});

// Get audio data for a specific track (lazy-loaded)
app.get('/api/tracks/:id/audio', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    const result = await db.query(
      'SELECT file_data FROM tracks WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = result.rows[0];

    if (!track.file_data) {
      return res.status(404).json({ error: 'No audio data for this track' });
    }

    console.log('Serving audio for track:', id, '- size:', track.file_data.length);
    res.json({ file_data: track.file_data });
  } catch (error) {
    console.error('Get track audio error:', error.message);
    res.status(500).json({ error: 'Failed to get track audio' });
  }
});

// Add a track
app.post('/api/tracks', authMiddleware, async (req, res) => {
  try {
    const { title, artist, album, duration, file_url, file_key, file_data, cover_url, genre, year, track_number } = req.body;
    const db = getPool();

    const result = await db.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, file_url, file_key, file_data, cover_url, genre, year, track_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [req.userId, title, artist, album, duration || 0, file_url, file_key, file_data, cover_url, genre, year, track_number || 0]
    );

    console.log('Track saved:', title, '- has file_data:', !!file_data);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Add track error:', error.message);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

// Bulk add tracks
app.post('/api/tracks/bulk', authMiddleware, async (req, res) => {
  try {
    const { tracks } = req.body;
    if (!Array.isArray(tracks)) {
      return res.status(400).json({ error: 'tracks must be an array' });
    }

    const db = getPool();
    const inserted = [];

    for (const track of tracks) {
      const { title, artist, album, duration, file_url, cover_url, genre, year, track_number } = track;
      const result = await db.query(
        `INSERT INTO tracks (user_id, title, artist, album, duration, file_url, cover_url, genre, year, track_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [req.userId, title, artist, album, duration || 0, file_url, cover_url, genre, year, track_number || 0]
      );
      inserted.push(result.rows[0]);
    }

    res.json({ inserted: inserted.length, tracks: inserted });
  } catch (error) {
    console.error('Bulk add tracks error:', error.message);
    res.status(500).json({ error: 'Failed to add tracks' });
  }
});

// Update a track
app.put('/api/tracks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, album, duration, file_url, cover_url, is_liked, play_count, genre, year } = req.body;
    const db = getPool();

    const result = await db.query(
      `UPDATE tracks SET
        title = COALESCE($1, title),
        artist = COALESCE($2, artist),
        album = COALESCE($3, album),
        duration = COALESCE($4, duration),
        file_url = COALESCE($5, file_url),
        cover_url = COALESCE($6, cover_url),
        is_liked = COALESCE($7, is_liked),
        play_count = COALESCE($8, play_count),
        genre = COALESCE($9, genre),
        year = COALESCE($10, year),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [title, artist, album, duration, file_url, cover_url, is_liked, play_count, genre, year, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update track error:', error.message);
    res.status(500).json({ error: 'Failed to update track' });
  }
});

// Delete a track
app.delete('/api/tracks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    const result = await db.query(
      'DELETE FROM tracks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json({ deleted: true, id });
  } catch (error) {
    console.error('Delete track error:', error.message);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

// ============ LYRICS/TRANSCRIPTION API ============

// Get lyrics for a track
app.get('/api/lyrics/:trackId', authMiddleware, async (req, res) => {
  try {
    const { trackId } = req.params;
    const db = getPool();

    const result = await db.query(
      'SELECT * FROM lyrics WHERE track_id = $1',
      [trackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No lyrics found for this track' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lyrics error:', error.message);
    res.status(500).json({ error: 'Failed to get lyrics' });
  }
});

// Transcribe audio file using OpenAI Whisper
app.post('/api/transcribe/:trackId', authMiddleware, async (req, res) => {
  try {
    const { trackId } = req.params;
    const db = getPool();
    const openaiClient = getOpenAI();

    if (!openaiClient) {
      return res.status(500).json({ error: 'Transcription service not configured. Set OPENAI_API_KEY.' });
    }

    // Check if lyrics already exist
    const existingLyrics = await db.query(
      'SELECT id FROM lyrics WHERE track_id = $1',
      [trackId]
    );

    if (existingLyrics.rows.length > 0) {
      return res.status(400).json({ error: 'Lyrics already exist for this track' });
    }

    // Get the track to find its file
    const trackResult = await db.query(
      'SELECT * FROM tracks WHERE id = $1 AND user_id = $2',
      [trackId, req.userId]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = trackResult.rows[0];

    if (!track.file_key) {
      return res.status(400).json({ error: 'Track has no audio file to transcribe' });
    }

    // Mark as pending
    await db.query(
      `INSERT INTO lyrics (track_id, content, transcription_status)
       VALUES ($1, '', 'processing')
       ON CONFLICT (track_id) DO UPDATE SET transcription_status = 'processing'`,
      [trackId]
    );

    // Get the audio file from B2
    const client = getS3Client();
    if (!client) {
      return res.status(500).json({ error: 'Storage not configured' });
    }

    const command = new GetObjectCommand({
      Bucket: B2_BUCKET,
      Key: track.file_key,
    });

    const s3Response = await client.send(command);

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of s3Response.Body) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Get file extension from key
    const fileExt = track.file_key.split('.').pop() || 'mp3';

    // Create a File object for OpenAI
    const audioFile = new File([audioBuffer], `audio.${fileExt}`, {
      type: s3Response.ContentType || 'audio/mpeg'
    });

    console.log(`Transcribing track ${trackId} (${track.title})...`);

    // Call OpenAI Whisper API with verbose timestamps for word-level timing
    const transcription = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word', 'segment']
    });

    console.log(`Transcription complete for ${track.title}`);

    // Store the lyrics with segments
    await db.query(
      `UPDATE lyrics SET
        content = $1,
        segments = $2,
        language = $3,
        transcription_status = 'completed',
        updated_at = CURRENT_TIMESTAMP
       WHERE track_id = $4`,
      [
        transcription.text,
        JSON.stringify({
          segments: transcription.segments || [],
          words: transcription.words || []
        }),
        transcription.language || 'en',
        trackId
      ]
    );

    res.json({
      success: true,
      trackId,
      text: transcription.text,
      language: transcription.language,
      segments: transcription.segments || [],
      words: transcription.words || []
    });

  } catch (error) {
    console.error('Transcription error:', error.message);

    // Update status to failed
    try {
      const db = getPool();
      await db.query(
        `UPDATE lyrics SET transcription_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE track_id = $1`,
        [req.params.trackId]
      );
    } catch (e) {
      // Ignore
    }

    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
});

// Delete lyrics for a track
app.delete('/api/lyrics/:trackId', authMiddleware, async (req, res) => {
  try {
    const { trackId } = req.params;
    const db = getPool();

    await db.query('DELETE FROM lyrics WHERE track_id = $1', [trackId]);
    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete lyrics error:', error.message);
    res.status(500).json({ error: 'Failed to delete lyrics' });
  }
});

// ============ TRACK ANALYSIS API ============

// Store BPM for a track
app.post('/api/tracks/:id/analysis/bpm', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { bpm } = req.body;
    const db = getPool();

    // First ensure the analysis columns exist
    await db.query(`
      ALTER TABLE tracks
      ADD COLUMN IF NOT EXISTS bpm INTEGER,
      ADD COLUMN IF NOT EXISTS musical_key VARCHAR(10)
    `);

    const result = await db.query(
      `UPDATE tracks SET bpm = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING id, bpm`,
      [bpm, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    console.log('BPM saved for track:', id, '-', bpm);
    res.json({ success: true, trackId: id, bpm });
  } catch (error) {
    console.error('Save BPM error:', error.message);
    res.status(500).json({ error: 'Failed to save BPM' });
  }
});

// Store musical key for a track
app.post('/api/tracks/:id/analysis/key', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.body;
    const db = getPool();

    // First ensure the analysis columns exist
    await db.query(`
      ALTER TABLE tracks
      ADD COLUMN IF NOT EXISTS bpm INTEGER,
      ADD COLUMN IF NOT EXISTS musical_key VARCHAR(10)
    `);

    const result = await db.query(
      `UPDATE tracks SET musical_key = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING id, musical_key`,
      [key, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    console.log('Key saved for track:', id, '-', key);
    res.json({ success: true, trackId: id, key });
  } catch (error) {
    console.error('Save key error:', error.message);
    res.status(500).json({ error: 'Failed to save key' });
  }
});

// Get track analysis data
app.get('/api/tracks/:id/analysis', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    const result = await db.query(
      `SELECT id, bpm, musical_key FROM tracks WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get analysis error:', error.message);
    res.status(500).json({ error: 'Failed to get analysis data' });
  }
});

// ============ PLAYLISTS API ============

// Get all playlists
app.get('/api/playlists', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get playlists error:', error.message);
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

// Create a playlist
app.post('/api/playlists', authMiddleware, async (req, res) => {
  try {
    const { name, description, cover_url } = req.body;
    const db = getPool();

    const result = await db.query(
      `INSERT INTO playlists (user_id, name, description, cover_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, name, description, cover_url]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create playlist error:', error.message);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Get playlist with tracks
app.get('/api/playlists/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    const playlist = await db.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (playlist.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const tracks = await db.query(
      `SELECT t.*, pt.position FROM tracks t
       JOIN playlist_tracks pt ON t.id = pt.track_id
       WHERE pt.playlist_id = $1
       ORDER BY pt.position`,
      [id]
    );

    res.json({ ...playlist.rows[0], tracks: tracks.rows });
  } catch (error) {
    console.error('Get playlist error:', error.message);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

// Add track to playlist
app.post('/api/playlists/:id/tracks', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { track_id, position } = req.body;
    const db = getPool();

    // Verify playlist ownership
    const playlist = await db.query(
      'SELECT id FROM playlists WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (playlist.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    await db.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id, position)
       VALUES ($1, $2, $3)
       ON CONFLICT (playlist_id, track_id) DO UPDATE SET position = $3`,
      [id, track_id, position || 0]
    );

    res.json({ added: true });
  } catch (error) {
    console.error('Add to playlist error:', error.message);
    res.status(500).json({ error: 'Failed to add track to playlist' });
  }
});

// Remove track from playlist
app.delete('/api/playlists/:id/tracks/:trackId', authMiddleware, async (req, res) => {
  try {
    const { id, trackId } = req.params;
    const db = getPool();

    await db.query(
      'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
      [id, trackId]
    );

    res.json({ removed: true });
  } catch (error) {
    console.error('Remove from playlist error:', error.message);
    res.status(500).json({ error: 'Failed to remove track from playlist' });
  }
});

// Delete playlist
app.delete('/api/playlists/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    const result = await db.query(
      'DELETE FROM playlists WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json({ deleted: true, id });
  } catch (error) {
    console.error('Delete playlist error:', error.message);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// ============ PRODUCER MARKETPLACE API ============

// Initialize marketplace tables
async function initMarketplaceTables() {
  const db = getPool();
  try {
    // Producer profiles
    await db.query(`
      CREATE TABLE IF NOT EXISTS producer_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        social_links JSONB DEFAULT '{}',
        total_sales INTEGER DEFAULT 0,
        total_earnings DECIMAL(10, 2) DEFAULT 0,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Beats for sale
    await db.query(`
      CREATE TABLE IF NOT EXISTS beats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        producer_id UUID REFERENCES producer_profiles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        license_type VARCHAR(50) DEFAULT 'standard',
        bpm INTEGER,
        musical_key VARCHAR(10),
        genre VARCHAR(100),
        tags TEXT[],
        preview_url TEXT,
        file_key TEXT,
        cover_url TEXT,
        duration INTEGER DEFAULT 0,
        play_count INTEGER DEFAULT 0,
        purchase_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Beat purchases
    await db.query(`
      CREATE TABLE IF NOT EXISTS beat_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        beat_id UUID REFERENCES beats(id) ON DELETE SET NULL,
        producer_id UUID REFERENCES producer_profiles(id) ON DELETE SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        license_type VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'completed',
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Marketplace tables ready');
    return true;
  } catch (error) {
    console.error('Marketplace tables init error:', error.message);
    return false;
  }
}

// Get or create producer profile
app.get('/api/marketplace/profile', authMiddleware, async (req, res) => {
  try {
    await initMarketplaceTables();
    const db = getPool();

    let result = await db.query(
      'SELECT * FROM producer_profiles WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      // Get user info to create profile
      const userResult = await db.query(
        'SELECT username, email FROM users WHERE id = $1',
        [req.userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        result = await db.query(
          `INSERT INTO producer_profiles (user_id, display_name)
           VALUES ($1, $2)
           RETURNING *`,
          [req.userId, user.username]
        );
      }
    }

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Get producer profile error:', error.message);
    res.status(500).json({ error: 'Failed to get producer profile' });
  }
});

// Update producer profile
app.put('/api/marketplace/profile', authMiddleware, async (req, res) => {
  try {
    const { display_name, bio, avatar_url, social_links } = req.body;
    const db = getPool();

    const result = await db.query(
      `UPDATE producer_profiles SET
        display_name = COALESCE($1, display_name),
        bio = COALESCE($2, bio),
        avatar_url = COALESCE($3, avatar_url),
        social_links = COALESCE($4, social_links),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5
       RETURNING *`,
      [display_name, bio, avatar_url, social_links ? JSON.stringify(social_links) : null, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update producer profile error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// List beats (public marketplace)
app.get('/api/marketplace/beats', async (req, res) => {
  try {
    await initMarketplaceTables();
    const db = getPool();
    const { genre, minPrice, maxPrice, bpm, key, sort } = req.query;

    let query = `
      SELECT b.*, pp.display_name as producer_name, pp.avatar_url as producer_avatar
      FROM beats b
      JOIN producer_profiles pp ON b.producer_id = pp.id
      WHERE b.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (genre) {
      query += ` AND b.genre = $${paramIndex++}`;
      params.push(genre);
    }
    if (minPrice) {
      query += ` AND b.price >= $${paramIndex++}`;
      params.push(minPrice);
    }
    if (maxPrice) {
      query += ` AND b.price <= $${paramIndex++}`;
      params.push(maxPrice);
    }
    if (bpm) {
      query += ` AND b.bpm = $${paramIndex++}`;
      params.push(parseInt(bpm));
    }
    if (key) {
      query += ` AND b.musical_key = $${paramIndex++}`;
      params.push(key);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY b.price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY b.price DESC';
        break;
      case 'popular':
        query += ' ORDER BY b.purchase_count DESC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY b.created_at DESC';
    }

    query += ' LIMIT 50';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('List beats error:', error.message);
    res.status(500).json({ error: 'Failed to list beats' });
  }
});

// Get single beat
app.get('/api/marketplace/beats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    const result = await db.query(
      `SELECT b.*, pp.display_name as producer_name, pp.avatar_url as producer_avatar, pp.bio as producer_bio
       FROM beats b
       JOIN producer_profiles pp ON b.producer_id = pp.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beat not found' });
    }

    // Increment play count
    await db.query('UPDATE beats SET play_count = play_count + 1 WHERE id = $1', [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get beat error:', error.message);
    res.status(500).json({ error: 'Failed to get beat' });
  }
});

// Create a beat listing (producer only)
app.post('/api/marketplace/beats', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, license_type, bpm, musical_key, genre, tags, preview_url, file_key, cover_url, duration } = req.body;
    const db = getPool();

    // Get producer profile
    const profileResult = await db.query(
      'SELECT id FROM producer_profiles WHERE user_id = $1',
      [req.userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({ error: 'Producer profile required' });
    }

    const producerId = profileResult.rows[0].id;

    const result = await db.query(
      `INSERT INTO beats (producer_id, title, description, price, license_type, bpm, musical_key, genre, tags, preview_url, file_key, cover_url, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [producerId, title, description, price, license_type || 'standard', bpm, musical_key, genre, tags || [], preview_url, file_key, cover_url, duration || 0]
    );

    console.log('Beat created:', title, '- $', price);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create beat error:', error.message);
    res.status(500).json({ error: 'Failed to create beat listing' });
  }
});

// Update a beat listing
app.put('/api/marketplace/beats/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, license_type, bpm, musical_key, genre, tags, preview_url, cover_url, is_active } = req.body;
    const db = getPool();

    // Verify ownership
    const ownerCheck = await db.query(
      `SELECT b.id FROM beats b
       JOIN producer_profiles pp ON b.producer_id = pp.id
       WHERE b.id = $1 AND pp.user_id = $2`,
      [id, req.userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to update this beat' });
    }

    const result = await db.query(
      `UPDATE beats SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        license_type = COALESCE($4, license_type),
        bpm = COALESCE($5, bpm),
        musical_key = COALESCE($6, musical_key),
        genre = COALESCE($7, genre),
        tags = COALESCE($8, tags),
        preview_url = COALESCE($9, preview_url),
        cover_url = COALESCE($10, cover_url),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [title, description, price, license_type, bpm, musical_key, genre, tags, preview_url, cover_url, is_active, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update beat error:', error.message);
    res.status(500).json({ error: 'Failed to update beat' });
  }
});

// Delete a beat listing
app.delete('/api/marketplace/beats/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    // Verify ownership
    const ownerCheck = await db.query(
      `SELECT b.id FROM beats b
       JOIN producer_profiles pp ON b.producer_id = pp.id
       WHERE b.id = $1 AND pp.user_id = $2`,
      [id, req.userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this beat' });
    }

    await db.query('DELETE FROM beats WHERE id = $1', [id]);
    res.json({ deleted: true, id });
  } catch (error) {
    console.error('Delete beat error:', error.message);
    res.status(500).json({ error: 'Failed to delete beat' });
  }
});

// Get my beat listings (producer dashboard)
app.get('/api/marketplace/my-beats', authMiddleware, async (req, res) => {
  try {
    const db = getPool();

    const result = await db.query(
      `SELECT b.* FROM beats b
       JOIN producer_profiles pp ON b.producer_id = pp.id
       WHERE pp.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get my beats error:', error.message);
    res.status(500).json({ error: 'Failed to get your beats' });
  }
});

// Purchase a beat (simulated - would integrate with payment provider)
app.post('/api/marketplace/purchase/:beatId', authMiddleware, async (req, res) => {
  try {
    const { beatId } = req.params;
    const { license_type } = req.body;
    const db = getPool();

    // Get beat info
    const beatResult = await db.query(
      'SELECT * FROM beats WHERE id = $1 AND is_active = true',
      [beatId]
    );

    if (beatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Beat not found or not available' });
    }

    const beat = beatResult.rows[0];

    // Check not buying own beat
    const ownerCheck = await db.query(
      'SELECT id FROM producer_profiles WHERE id = $1 AND user_id = $2',
      [beat.producer_id, req.userId]
    );

    if (ownerCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot purchase your own beat' });
    }

    // Check not already purchased
    const existingPurchase = await db.query(
      'SELECT id FROM beat_purchases WHERE buyer_id = $1 AND beat_id = $2 AND status = $3',
      [req.userId, beatId, 'completed']
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'Beat already purchased' });
    }

    // Create purchase record
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const purchaseResult = await db.query(
      `INSERT INTO beat_purchases (buyer_id, beat_id, producer_id, amount, license_type, transaction_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed')
       RETURNING *`,
      [req.userId, beatId, beat.producer_id, beat.price, license_type || beat.license_type, transactionId]
    );

    // Update beat purchase count
    await db.query('UPDATE beats SET purchase_count = purchase_count + 1 WHERE id = $1', [beatId]);

    // Update producer earnings
    await db.query(
      'UPDATE producer_profiles SET total_sales = total_sales + 1, total_earnings = total_earnings + $1 WHERE id = $2',
      [beat.price, beat.producer_id]
    );

    console.log('Beat purchased:', beat.title, 'by user', req.userId);

    res.json({
      success: true,
      purchase: purchaseResult.rows[0],
      beat: beat
    });
  } catch (error) {
    console.error('Purchase beat error:', error.message);
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

// Get my purchased beats
app.get('/api/marketplace/my-purchases', authMiddleware, async (req, res) => {
  try {
    const db = getPool();

    const result = await db.query(
      `SELECT bp.*, b.title, b.cover_url, b.preview_url, b.file_key, b.bpm, b.musical_key, b.genre, b.duration,
              pp.display_name as producer_name
       FROM beat_purchases bp
       JOIN beats b ON bp.beat_id = b.id
       JOIN producer_profiles pp ON bp.producer_id = pp.id
       WHERE bp.buyer_id = $1 AND bp.status = 'completed'
       ORDER BY bp.purchased_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get my purchases error:', error.message);
    res.status(500).json({ error: 'Failed to get purchases' });
  }
});

// Get marketplace genres (for filters)
app.get('/api/marketplace/genres', async (req, res) => {
  try {
    const db = getPool();

    const result = await db.query(
      `SELECT DISTINCT genre, COUNT(*) as count
       FROM beats
       WHERE is_active = true AND genre IS NOT NULL
       GROUP BY genre
       ORDER BY count DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get genres error:', error.message);
    res.status(500).json({ error: 'Failed to get genres' });
  }
});

// ============ BEAT PACKS API ============

// Get beat packs
app.get('/api/marketplace/packs', async (req, res) => {
  try {
    const db = getPool();

    // Create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS beat_packs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        producer_id UUID NOT NULL REFERENCES producer_profiles(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_url TEXT,
        price DECIMAL(10,2) NOT NULL,
        discount_percent INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS beat_pack_items (
        pack_id UUID REFERENCES beat_packs(id) ON DELETE CASCADE,
        beat_id UUID REFERENCES beats(id) ON DELETE CASCADE,
        PRIMARY KEY (pack_id, beat_id)
      );
    `);

    const { producer_id } = req.query;
    let query = `
      SELECT bp.*, pp.display_name as producer_name,
             COUNT(bpi.beat_id) as beat_count,
             COALESCE(SUM(b.price), 0) as original_price
      FROM beat_packs bp
      JOIN producer_profiles pp ON bp.producer_id = pp.id
      LEFT JOIN beat_pack_items bpi ON bp.id = bpi.pack_id
      LEFT JOIN beats b ON bpi.beat_id = b.id
      WHERE bp.is_active = true
    `;
    const params = [];

    if (producer_id) {
      params.push(producer_id);
      query += ` AND bp.producer_id = $${params.length}`;
    }

    query += ` GROUP BY bp.id, pp.display_name ORDER BY bp.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get beat packs error:', error.message);
    res.status(500).json({ error: 'Failed to get beat packs' });
  }
});

// Create beat pack
app.post('/api/marketplace/packs', authMiddleware, async (req, res) => {
  try {
    const { title, description, cover_url, price, discount_percent, beat_ids } = req.body;
    const db = getPool();

    // Get producer profile
    const profile = await db.query('SELECT id FROM producer_profiles WHERE user_id = $1', [req.userId]);
    if (profile.rows.length === 0) {
      return res.status(403).json({ error: 'Producer profile required' });
    }

    const producerId = profile.rows[0].id;

    const packResult = await db.query(
      `INSERT INTO beat_packs (producer_id, title, description, cover_url, price, discount_percent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [producerId, title, description, cover_url, price, discount_percent || 0]
    );

    const pack = packResult.rows[0];

    // Add beats to pack
    if (beat_ids && beat_ids.length > 0) {
      for (const beatId of beat_ids) {
        await db.query(
          'INSERT INTO beat_pack_items (pack_id, beat_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [pack.id, beatId]
        );
      }
    }

    res.json(pack);
  } catch (error) {
    console.error('Create beat pack error:', error.message);
    res.status(500).json({ error: 'Failed to create beat pack' });
  }
});

// ============ LICENSING API ============

// Get license types
app.get('/api/marketplace/licenses', async (req, res) => {
  try {
    const db = getPool();

    // Create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS license_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        producer_id UUID REFERENCES producer_profiles(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        max_streams INTEGER,
        max_sales INTEGER,
        allows_radio BOOLEAN DEFAULT false,
        allows_video BOOLEAN DEFAULT false,
        allows_live BOOLEAN DEFAULT false,
        exclusive BOOLEAN DEFAULT false,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const { producer_id } = req.query;
    let query = 'SELECT * FROM license_templates WHERE 1=1';
    const params = [];

    if (producer_id) {
      params.push(producer_id);
      query += ` AND (producer_id = $${params.length} OR is_default = true)`;
    } else {
      query += ' AND is_default = true';
    }

    query += ' ORDER BY price ASC';

    const result = await db.query(query, params);

    // Return default licenses if none found
    if (result.rows.length === 0) {
      const defaultLicenses = [
        { name: 'Basic', description: 'Non-profit use only', price: 29.99, max_streams: 5000, exclusive: false },
        { name: 'Standard', description: 'Commercial use, limited distribution', price: 79.99, max_streams: 100000, max_sales: 5000, allows_video: true, exclusive: false },
        { name: 'Premium', description: 'Full commercial rights', price: 199.99, max_streams: null, allows_radio: true, allows_video: true, allows_live: true, exclusive: false },
        { name: 'Exclusive', description: 'Full ownership transfer', price: 999.99, allows_radio: true, allows_video: true, allows_live: true, exclusive: true }
      ];
      return res.json(defaultLicenses);
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Get licenses error:', error.message);
    res.status(500).json({ error: 'Failed to get licenses' });
  }
});

// Generate license contract PDF data
app.post('/api/marketplace/licenses/generate', authMiddleware, async (req, res) => {
  try {
    const { purchase_id, beat_id, license_type } = req.body;
    const db = getPool();

    // Get purchase and beat details
    const purchaseResult = await db.query(
      `SELECT bp.*, b.title as beat_title, b.bpm, b.musical_key, b.genre,
              pp.display_name as producer_name, pp.bio as producer_bio,
              u.email as buyer_email
       FROM beat_purchases bp
       JOIN beats b ON bp.beat_id = b.id
       JOIN producer_profiles pp ON bp.producer_id = pp.id
       JOIN users u ON bp.buyer_id = u.id
       WHERE bp.id = $1 AND bp.buyer_id = $2`,
      [purchase_id, req.userId]
    );

    if (purchaseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const purchase = purchaseResult.rows[0];

    // Generate license data (for PDF generation on frontend)
    const licenseData = {
      contractId: `LIC-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString(),
      licensee: {
        email: purchase.buyer_email
      },
      licensor: {
        name: purchase.producer_name,
        bio: purchase.producer_bio
      },
      beat: {
        title: purchase.beat_title,
        bpm: purchase.bpm,
        key: purchase.musical_key,
        genre: purchase.genre
      },
      license: {
        type: purchase.license_type,
        price: purchase.amount,
        transactionId: purchase.transaction_id
      },
      terms: getLicenseTerms(purchase.license_type)
    };

    res.json(licenseData);
  } catch (error) {
    console.error('Generate license error:', error.message);
    res.status(500).json({ error: 'Failed to generate license' });
  }
});

function getLicenseTerms(licenseType) {
  const terms = {
    basic: {
      usage: 'Non-profit and personal use only',
      distribution: 'Up to 5,000 streams',
      credits: 'Producer credit required',
      exclusivity: 'Non-exclusive',
      modifications: 'Minor modifications allowed'
    },
    standard: {
      usage: 'Commercial use permitted',
      distribution: 'Up to 100,000 streams or 5,000 sales',
      credits: 'Producer credit required',
      exclusivity: 'Non-exclusive',
      modifications: 'Modifications allowed',
      video: 'Music video permitted'
    },
    premium: {
      usage: 'Full commercial rights',
      distribution: 'Unlimited streams and sales',
      credits: 'Producer credit appreciated',
      exclusivity: 'Non-exclusive',
      modifications: 'Full modifications allowed',
      video: 'Unlimited video use',
      radio: 'Radio broadcasting permitted',
      live: 'Live performances permitted'
    },
    exclusive: {
      usage: 'Full ownership transfer',
      distribution: 'Unlimited worldwide distribution',
      credits: 'Optional',
      exclusivity: 'Exclusive - beat removed from marketplace',
      modifications: 'Full rights to modify',
      video: 'Unlimited',
      radio: 'Unlimited',
      live: 'Unlimited',
      resale: 'Resale rights included'
    }
  };
  return terms[licenseType?.toLowerCase()] || terms.basic;
}

// ============ ROYALTY TRACKING API ============

// Get royalty stats for a producer
app.get('/api/marketplace/royalties', authMiddleware, async (req, res) => {
  try {
    const db = getPool();

    // Get producer profile
    const profile = await db.query('SELECT id FROM producer_profiles WHERE user_id = $1', [req.userId]);
    if (profile.rows.length === 0) {
      return res.status(403).json({ error: 'Producer profile required' });
    }

    const producerId = profile.rows[0].id;

    // Get earnings by time period
    const earningsResult = await db.query(
      `SELECT
        DATE_TRUNC('month', purchased_at) as month,
        COUNT(*) as sales_count,
        SUM(amount) as total_earnings,
        license_type
       FROM beat_purchases
       WHERE producer_id = $1 AND status = 'completed'
       GROUP BY DATE_TRUNC('month', purchased_at), license_type
       ORDER BY month DESC
       LIMIT 12`,
      [producerId]
    );

    // Get top selling beats
    const topBeatsResult = await db.query(
      `SELECT b.id, b.title, b.cover_url, b.purchase_count,
              SUM(bp.amount) as total_revenue
       FROM beats b
       LEFT JOIN beat_purchases bp ON b.id = bp.beat_id AND bp.status = 'completed'
       WHERE b.producer_id = $1
       GROUP BY b.id
       ORDER BY total_revenue DESC NULLS LAST
       LIMIT 10`,
      [producerId]
    );

    // Get pending payouts (simplified - in real app this would track actual payouts)
    const pendingResult = await db.query(
      `SELECT SUM(amount) as pending
       FROM beat_purchases
       WHERE producer_id = $1 AND status = 'completed'
       AND purchased_at > CURRENT_DATE - INTERVAL '30 days'`,
      [producerId]
    );

    res.json({
      monthlyEarnings: earningsResult.rows,
      topBeats: topBeatsResult.rows,
      pendingPayout: pendingResult.rows[0]?.pending || 0,
      currency: 'USD'
    });
  } catch (error) {
    console.error('Get royalties error:', error.message);
    res.status(500).json({ error: 'Failed to get royalty data' });
  }
});

// ============ TRENDING/DISCOVERY API ============

// Get trending beats
app.get('/api/marketplace/trending', async (req, res) => {
  try {
    const db = getPool();
    const { period = '7days' } = req.query;

    let interval = '7 days';
    if (period === '30days') interval = '30 days';
    if (period === 'alltime') interval = '365 days';

    const result = await db.query(
      `SELECT b.*, pp.display_name as producer_name, pp.avatar_url as producer_avatar,
              COALESCE(recent_sales.count, 0) as recent_purchases,
              b.play_count as plays
       FROM beats b
       JOIN producer_profiles pp ON b.producer_id = pp.id
       LEFT JOIN (
         SELECT beat_id, COUNT(*) as count
         FROM beat_purchases
         WHERE purchased_at > CURRENT_TIMESTAMP - INTERVAL '${interval}'
         AND status = 'completed'
         GROUP BY beat_id
       ) recent_sales ON b.id = recent_sales.beat_id
       WHERE b.is_active = true
       ORDER BY recent_purchases DESC, b.play_count DESC NULLS LAST
       LIMIT 20`,
      []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get trending error:', error.message);
    res.status(500).json({ error: 'Failed to get trending beats' });
  }
});

// Track beat play (for discovery algorithm)
app.post('/api/marketplace/beats/:id/play', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    // Add play_count column if not exists
    await db.query('ALTER TABLE beats ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0');

    await db.query('UPDATE beats SET play_count = COALESCE(play_count, 0) + 1 WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Track play error:', error.message);
    res.status(500).json({ error: 'Failed to track play' });
  }
});

// ============ PUBLIC PROFILES API ============

// Get public profile by username
app.get('/api/profiles/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const db = getPool();

    // Add username column if not exists
    await db.query('ALTER TABLE producer_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE');

    const result = await db.query(
      `SELECT pp.id, pp.display_name, pp.username, pp.bio, pp.avatar_url, pp.is_verified,
              pp.total_sales, pp.total_earnings, pp.created_at,
              COUNT(DISTINCT b.id) as beat_count,
              COALESCE(AVG(b.price), 0) as avg_price
       FROM producer_profiles pp
       LEFT JOIN beats b ON pp.id = b.producer_id AND b.is_active = true
       WHERE pp.username = $1
       GROUP BY pp.id`,
      [username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Set username
app.put('/api/profiles/username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    const db = getPool();

    // Validate username
    if (!username || username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    const result = await db.query(
      `UPDATE producer_profiles SET username = $1 WHERE user_id = $2 RETURNING *`,
      [username.toLowerCase(), req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username already taken' });
    }
    console.error('Set username error:', error.message);
    res.status(500).json({ error: 'Failed to set username' });
  }
});

// ============ ACTIVITY FEED API ============

// Get activity feed
app.get('/api/activity', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { limit = 20, offset = 0 } = req.query;

    // Create activity table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get activities from users we follow or our own
    const result = await db.query(
      `SELECT a.*, u.email as user_email
       FROM activities a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, parseInt(limit), parseInt(offset)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get activity error:', error.message);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// Log activity
app.post('/api/activity', authMiddleware, async (req, res) => {
  try {
    const { type, data } = req.body;
    const db = getPool();

    const result = await db.query(
      `INSERT INTO activities (user_id, type, data) VALUES ($1, $2, $3) RETURNING *`,
      [req.userId, type, data]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Log activity error:', error.message);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// ============ COMMENTS & LIKES API ============

// Get comments for a beat
app.get('/api/marketplace/beats/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    // Create comments table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS beat_comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        beat_id UUID REFERENCES beats(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        content TEXT NOT NULL,
        timestamp_seconds DECIMAL(10,2),
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await db.query(
      `SELECT bc.*, u.email as user_email
       FROM beat_comments bc
       JOIN users u ON bc.user_id = u.id
       WHERE bc.beat_id = $1
       ORDER BY bc.created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error.message);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Add comment
app.post('/api/marketplace/beats/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, timestamp_seconds } = req.body;
    const db = getPool();

    const result = await db.query(
      `INSERT INTO beat_comments (beat_id, user_id, content, timestamp_seconds)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, req.userId, content, timestamp_seconds]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Add comment error:', error.message);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Like a beat
app.post('/api/marketplace/beats/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    // Create likes table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS beat_likes (
        user_id UUID REFERENCES users(id),
        beat_id UUID REFERENCES beats(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, beat_id)
      )
    `);

    // Add likes_count column if not exists
    await db.query('ALTER TABLE beats ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0');

    await db.query(
      `INSERT INTO beat_likes (user_id, beat_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.userId, id]
    );

    await db.query('UPDATE beats SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1', [id]);

    res.json({ liked: true });
  } catch (error) {
    console.error('Like beat error:', error.message);
    res.status(500).json({ error: 'Failed to like beat' });
  }
});

// Unlike a beat
app.delete('/api/marketplace/beats/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();

    const result = await db.query(
      'DELETE FROM beat_likes WHERE user_id = $1 AND beat_id = $2 RETURNING *',
      [req.userId, id]
    );

    if (result.rows.length > 0) {
      await db.query('UPDATE beats SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = $1', [id]);
    }

    res.json({ unliked: true });
  } catch (error) {
    console.error('Unlike beat error:', error.message);
    res.status(500).json({ error: 'Failed to unlike beat' });
  }
});

// ============ MESSAGING API ============

// Get conversations
app.get('/api/messages/conversations', authMiddleware, async (req, res) => {
  try {
    const db = getPool();

    // Create messages table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        sender_id UUID REFERENCES users(id),
        receiver_id UUID REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get unique conversations
    const result = await db.query(
      `SELECT DISTINCT ON (other_user)
        CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user,
        m.content as last_message,
        m.created_at as last_message_time,
        m.is_read,
        u.email as other_email
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY other_user, m.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error.message);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get messages with a user
app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const db = getPool();

    const result = await db.query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.userId, userId, parseInt(limit), parseInt(offset)]
    );

    // Mark messages as read
    await db.query(
      'UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false',
      [req.userId, userId]
    );

    res.json(result.rows.reverse());
  } catch (error) {
    console.error('Get messages error:', error.message);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
app.post('/api/messages/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    const db = getPool();

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const result = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [req.userId, userId, content.trim()]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============ PRODUCER BADGES API ============

// Get badges
app.get('/api/badges', async (req, res) => {
  try {
    const db = getPool();

    // Create badges tables if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(20),
        requirement_type VARCHAR(50),
        requirement_value INTEGER
      );

      CREATE TABLE IF NOT EXISTS user_badges (
        user_id UUID REFERENCES users(id),
        badge_id UUID REFERENCES badges(id),
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, badge_id)
      );
    `);

    // Insert default badges if none exist
    const existingBadges = await db.query('SELECT COUNT(*) FROM badges');
    if (parseInt(existingBadges.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO badges (name, description, icon, color, requirement_type, requirement_value) VALUES
        ('First Beat', 'Uploaded your first beat', 'music', 'blue', 'beats_uploaded', 1),
        ('Rising Star', 'Made 10 sales', 'star', 'yellow', 'total_sales', 10),
        ('Top Producer', 'Made 100 sales', 'crown', 'gold', 'total_sales', 100),
        ('Hit Maker', 'Beat reached 1000 plays', 'zap', 'purple', 'beat_plays', 1000),
        ('Verified', 'Verified producer status', 'check-circle', 'green', 'verified', 1),
        ('Premium', 'Premium member', 'diamond', 'cyan', 'premium', 1)
      `);
    }

    const result = await db.query('SELECT * FROM badges ORDER BY requirement_value');
    res.json(result.rows);
  } catch (error) {
    console.error('Get badges error:', error.message);
    res.status(500).json({ error: 'Failed to get badges' });
  }
});

// Get user badges
app.get('/api/badges/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getPool();

    const result = await db.query(
      `SELECT b.*, ub.earned_at
       FROM badges b
       JOIN user_badges ub ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user badges error:', error.message);
    res.status(500).json({ error: 'Failed to get user badges' });
  }
});

// Check and award badges (called after relevant actions)
app.post('/api/badges/check', authMiddleware, async (req, res) => {
  try {
    const db = getPool();

    // Get producer stats
    const stats = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM beats b JOIN producer_profiles pp ON b.producer_id = pp.id WHERE pp.user_id = $1) as beats_uploaded,
        (SELECT total_sales FROM producer_profiles WHERE user_id = $1) as total_sales,
        (SELECT MAX(play_count) FROM beats b JOIN producer_profiles pp ON b.producer_id = pp.id WHERE pp.user_id = $1) as max_plays,
        (SELECT is_verified FROM producer_profiles WHERE user_id = $1) as verified
      `,
      [req.userId]
    );

    const userStats = stats.rows[0] || {};
    const earnedBadges = [];

    // Check each badge
    const badges = await db.query('SELECT * FROM badges');
    for (const badge of badges.rows) {
      let earned = false;

      if (badge.requirement_type === 'beats_uploaded' && userStats.beats_uploaded >= badge.requirement_value) {
        earned = true;
      } else if (badge.requirement_type === 'total_sales' && userStats.total_sales >= badge.requirement_value) {
        earned = true;
      } else if (badge.requirement_type === 'beat_plays' && userStats.max_plays >= badge.requirement_value) {
        earned = true;
      } else if (badge.requirement_type === 'verified' && userStats.verified) {
        earned = true;
      }

      if (earned) {
        await db.query(
          'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.userId, badge.id]
        );
        earnedBadges.push(badge);
      }
    }

    res.json({ checked: true, newBadges: earnedBadges });
  } catch (error) {
    console.error('Check badges error:', error.message);
    res.status(500).json({ error: 'Failed to check badges' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Server error' });
});

// Start server FIRST, then init DB
const server = app.listen(port, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('SERVER LISTENING ON PORT', port);
  console.log('='.repeat(60));

  // Init DB after server is listening
  initDB().then(ok => {
    if (ok) console.log('Database ready');
  });
});

// Keep alive
setInterval(() => {
  console.log('Heartbeat:', new Date().toISOString());
}, 30000);

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled:', err);
});
