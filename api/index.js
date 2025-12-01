import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

console.log('Starting Replay API...');
console.log('Port:', port);
console.log('Node version:', process.version);
console.log('OpenAI configured:', !!process.env.OPENAI_API_KEY);

// OpenAI client for transcription
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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
  res.json({ status: 'ok', time: new Date().toISOString(), openai: !!openai });
});

app.get('/', (req, res) => {
  res.json({ name: 'Replay Music API', status: 'running', transcription: !!openai });
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
    console.log('Database ready');
  } catch (e) {
    console.error('DB init error:', e.message);
  }
}

// Helper: Convert base64 audio to buffer for OpenAI
function base64ToBuffer(base64Data) {
  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:audio\/[^;]+;base64,/, '');
  return Buffer.from(base64, 'base64');
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioBase64, trackId) {
  if (!openai) {
    console.log('OpenAI not configured, skipping transcription');
    return null;
  }

  try {
    console.log(`Starting transcription for track ${trackId}`);

    // Convert base64 to buffer
    const audioBuffer = base64ToBuffer(audioBase64);

    // Create a File-like object for OpenAI
    const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment', 'word']
    });

    console.log(`Transcription complete for track ${trackId}, segments: ${transcription.segments?.length || 0}`);

    return {
      text: transcription.text,
      segments: transcription.segments || [],
      words: transcription.words || [],
      language: transcription.language || 'en'
    };
  } catch (error) {
    console.error('Transcription error:', error.message);
    return null;
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
    const dbUser = result.rows[0];
    // Map username to name for frontend compatibility
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
    // Map username to name for frontend compatibility
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
    // Map username to name for frontend compatibility
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

// Get tracks (includes lyrics status)
app.get('/api/tracks', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      `SELECT id, user_id, title, artist, album, duration, cover_url, play_count, is_liked,
              lyrics_status, created_at, bpm, musical_key, energy, analyzed_at,
              (file_data IS NOT NULL) as has_audio,
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

// Stream audio - sends binary data for faster playback start
// Accepts token via query param for direct audio element access
app.get('/api/tracks/:id/stream', async (req, res) => {
  // Support token from query param (for audio element) or header
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

    // Parse the data URL to get mime type and base64 data
    const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid audio format' });

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Set headers for streaming
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    // Ensure CORS headers are set for audio streaming on mobile
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

    // Handle range requests for seeking
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
app.get('/api/lyrics/:id', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT lyrics_text, lyrics_segments, lyrics_status FROM tracks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
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

// Transcribe a track (manual trigger)
app.post('/api/transcribe/:id', auth, async (req, res) => {
  try {
    const db = getPool();
    const trackId = req.params.id;

    // Get track with audio data
    const result = await db.query(
      'SELECT id, file_data, lyrics_status FROM tracks WHERE id = $1 AND user_id = $2',
      [trackId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = result.rows[0];

    if (!track.file_data) {
      return res.status(400).json({ error: 'No audio data available' });
    }

    // Mark as processing
    await db.query(
      'UPDATE tracks SET lyrics_status = $1 WHERE id = $2',
      ['processing', trackId]
    );

    // Transcribe
    const transcription = await transcribeAudio(track.file_data, trackId);

    if (!transcription) {
      await db.query(
        'UPDATE tracks SET lyrics_status = $1 WHERE id = $2',
        ['failed', trackId]
      );
      return res.status(500).json({ error: 'Transcription failed' });
    }

    // Save lyrics
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

// Add track (with auto-transcription)
app.post('/api/tracks', auth, async (req, res) => {
  try {
    const { title, artist, album, duration, file_data, cover_url } = req.body;
    const db = getPool();

    // Insert track
    const result = await db.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, file_data, cover_url, lyrics_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, title, artist, album, duration || 0, file_data, cover_url, 'pending']
    );

    const track = result.rows[0];

    // Start auto-transcription in background (don't await)
    if (file_data && openai) {
      console.log(`Starting auto-transcription for track: ${track.id}`);

      // Update status to processing
      db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['processing', track.id]);

      // Transcribe in background
      transcribeAudio(file_data, track.id).then(async (transcription) => {
        if (transcription) {
          await db.query(
            'UPDATE tracks SET lyrics_text = $1, lyrics_segments = $2, lyrics_status = $3 WHERE id = $4',
            [transcription.text, JSON.stringify({ segments: transcription.segments, words: transcription.words }), 'completed', track.id]
          );
          console.log(`Auto-transcription completed for track: ${track.id}`);
        } else {
          await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', track.id]);
          console.log(`Auto-transcription failed for track: ${track.id}`);
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

// Delete tracks without audio data (authenticated user)
app.delete('/api/tracks/cleanup/no-audio', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'DELETE FROM tracks WHERE user_id = $1 AND file_data IS NULL RETURNING id, title',
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

// Update track audio analysis (BPM, key, energy)
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

// Transcribe all tracks that don't have lyrics (admin/batch endpoint)
app.post('/api/transcribe-all', auth, async (req, res) => {
  if (!openai) {
    return res.status(400).json({ error: 'OpenAI not configured' });
  }

  try {
    const db = getPool();

    // Get all tracks without lyrics for this user
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

    // Return immediately, process in background
    res.json({
      message: `Starting transcription for ${tracksToTranscribe.length} tracks`,
      count: tracksToTranscribe.length
    });

    // Process each track in background
    for (const track of tracksToTranscribe) {
      try {
        console.log(`Transcribing track: ${track.title} (${track.id})`);

        // Mark as processing
        await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['processing', track.id]);

        // Transcribe
        const transcription = await transcribeAudio(track.file_data, track.id);

        if (transcription) {
          await db.query(
            'UPDATE tracks SET lyrics_text = $1, lyrics_segments = $2, lyrics_status = $3 WHERE id = $4',
            [transcription.text, JSON.stringify({ segments: transcription.segments, words: transcription.words }), 'completed', track.id]
          );
          console.log(`Transcription completed for: ${track.title}`);
        } else {
          await db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['failed', track.id]);
          console.log(`Transcription failed for: ${track.title}`);
        }

        // Small delay between tracks to avoid rate limits
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

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  initDB();
});
