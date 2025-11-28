import express from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

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

// Body parser
app.use(express.json({ limit: '50mb' }));

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

// Get all tracks for user
app.get('/api/tracks', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT * FROM tracks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get tracks error:', error.message);
    res.status(500).json({ error: 'Failed to get tracks' });
  }
});

// Add a track
app.post('/api/tracks', authMiddleware, async (req, res) => {
  try {
    const { title, artist, album, duration, file_url, file_key, cover_url, genre, year, track_number } = req.body;
    const db = getPool();

    const result = await db.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, file_url, file_key, cover_url, genre, year, track_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [req.userId, title, artist, album, duration || 0, file_url, file_key, cover_url, genre, year, track_number || 0]
    );

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
