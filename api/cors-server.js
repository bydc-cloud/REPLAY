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
