import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

console.log('Starting Replay API...');
console.log('Port:', port);
console.log('Node version:', process.version);

// CORS
app.use(cors({ origin: true, credentials: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '100mb' }));

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ name: 'Replay Music API', status: 'running' });
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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
    console.log('Database ready');
  } catch (e) {
    console.error('DB init error:', e.message);
  }
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
    const user = result.rows[0];
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
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    delete user.password_hash;
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

// Get tracks
app.get('/api/tracks', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      `SELECT id, user_id, title, artist, album, duration, cover_url, play_count, is_liked, created_at,
              (file_data IS NOT NULL) as has_audio
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

// Add track
app.post('/api/tracks', auth, async (req, res) => {
  try {
    const { title, artist, album, duration, file_data, cover_url } = req.body;
    const db = getPool();
    const result = await db.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, file_data, cover_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, title, artist, album, duration || 0, file_data, cover_url]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Add track error:', e.message);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

// Update track
app.put('/api/tracks/:id', auth, async (req, res) => {
  try {
    const { title, artist, album, is_liked, play_count } = req.body;
    const db = getPool();
    const result = await db.query(
      `UPDATE tracks SET
        title = COALESCE($1, title),
        artist = COALESCE($2, artist),
        album = COALESCE($3, album),
        is_liked = COALESCE($4, is_liked),
        play_count = COALESCE($5, play_count)
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [title, artist, album, is_liked, play_count, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update track error:', e.message);
    res.status(500).json({ error: 'Failed to update track' });
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

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  initDB();
});
