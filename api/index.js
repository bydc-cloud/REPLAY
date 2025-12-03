import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

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
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    openai: !!openai,
    b2: !!(B2_KEY_ID && B2_APP_KEY),
    b2_bucket: B2_BUCKET
  });
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
              lyrics_status, created_at, bpm, musical_key, energy, analyzed_at, file_key,
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

// Stream audio via proxy - fetches from B2 and streams through server
// This avoids CORS issues on mobile browsers
// Accepts token via query param for direct audio element access
app.get('/api/tracks/:id/stream-proxy', async (req, res) => {
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
      'SELECT file_data, file_key FROM tracks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const { file_data: fileData, file_key: fileKey } = result.rows[0];

    // If track is stored in B2, proxy the audio through the server
    if (fileKey) {
      const client = getS3Client();
      if (!client) {
        return res.status(500).json({ error: 'Cloud storage not configured' });
      }

      try {
        const command = new GetObjectCommand({
          Bucket: B2_BUCKET,
          Key: fileKey,
        });

        const s3Response = await client.send(command);

        // Set response headers
        res.setHeader('Content-Type', s3Response.ContentType || 'audio/mpeg');
        if (s3Response.ContentLength) {
          res.setHeader('Content-Length', s3Response.ContentLength);
        }
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

        // Pipe the S3 stream directly to the response
        s3Response.Body.pipe(res);

        // Handle stream errors
        s3Response.Body.on('error', (err) => {
          console.error('S3 stream error:', err.message);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Stream error' });
          }
        });

        return;
      } catch (s3Error) {
        console.error('S3 proxy error:', s3Error.message);
        return res.status(500).json({ error: 'Failed to proxy audio from cloud storage' });
      }
    }

    // Fallback to base64 data
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
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

    res.end(buffer);
  } catch (e) {
    console.error('Stream proxy error:', e.message);
    res.status(500).json({ error: 'Failed to stream audio' });
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
      'SELECT file_data, file_key FROM tracks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const { file_data: fileData, file_key: fileKey } = result.rows[0];

    // If track is stored in B2, redirect to signed URL
    if (fileKey) {
      const client = getS3Client();
      if (!client) {
        return res.status(500).json({ error: 'Cloud storage not configured' });
      }

      const command = new GetObjectCommand({
        Bucket: B2_BUCKET,
        Key: fileKey,
      });

      const streamUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

      // Redirect to B2 signed URL for direct streaming
      return res.redirect(302, streamUrl);
    }

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

    // Get track with audio data (include file_key for B2 storage)
    const result = await db.query(
      'SELECT id, file_data, file_key, lyrics_status FROM tracks WHERE id = $1 AND user_id = $2',
      [trackId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = result.rows[0];

    // Try to get audio data - first from B2, then fall back to file_data
    let audioBase64 = null;

    // Try B2 first (preferred for newer tracks)
    if (track.file_key) {
      const client = getS3Client();
      if (client) {
        try {
          const command = new GetObjectCommand({
            Bucket: B2_BUCKET,
            Key: track.file_key,
          });
          const response = await client.send(command);
          // Convert stream to buffer then to base64
          const chunks = [];
          for await (const chunk of response.Body) {
            chunks.push(chunk);
          }
          const audioBuffer = Buffer.concat(chunks);
          audioBase64 = audioBuffer.toString('base64');
          console.log(`Fetched audio from B2 for transcription: ${track.file_key}`);
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

    // Now check if we have audio
    if (!audioBase64) {
      return res.status(400).json({ error: 'No audio data available' });
    }

    // Mark as processing
    await db.query(
      'UPDATE tracks SET lyrics_status = $1 WHERE id = $2',
      ['processing', trackId]
    );

    // Transcribe
    const transcription = await transcribeAudio(audioBase64, trackId);

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
// Tracks need either file_data (legacy base64) OR file_key (B2 cloud) to have audio
app.delete('/api/tracks/cleanup/no-audio', auth, async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'DELETE FROM tracks WHERE user_id = $1 AND file_data IS NULL AND file_key IS NULL RETURNING id, title',
      [req.user.id]
    );
    console.log(`Cleaned up ${result.rows.length} tracks without audio for user ${req.user.id}:`, result.rows.map(t => t.title));
    res.json({
      deleted: result.rows.length,
      tracks: result.rows.map(t => t.title),
      deletedIds: result.rows.map(t => t.id)
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
      // The tracks might still be valid, we just can't check
      console.log('B2 not configured, skipping verification for user', req.user.id);
      return res.json({ checked: 0, deleted: 0, tracks: [], note: 'Cloud storage not configured' });
    }

    const orphanedTracks = [];

    // Check each track's file in B2 using GetObjectCommand (NOT HeadObject)
    // HeadObjectCommand only checks metadata, which can succeed even when the file is missing/corrupted
    // GetObjectCommand with Range header actually tries to read the file, matching streaming behavior
    for (const track of tracksResult.rows) {
      console.log(`Verifying B2 file: ${track.file_key} for track "${track.title}"`);
      try {
        // Use GetObjectCommand with Range to fetch just first byte
        // This validates the file is actually readable, not just metadata
        const command = new GetObjectCommand({
          Bucket: B2_BUCKET,
          Key: track.file_key,
          Range: 'bytes=0-0',  // Only fetch first byte to minimize bandwidth
        });
        const response = await client.send(command);

        // Must actually consume the stream to confirm it's readable
        if (response.Body) {
          const chunks = [];
          for await (const chunk of response.Body) {
            chunks.push(chunk);
            break; // Only need first chunk
          }
          if (chunks.length === 0 || chunks[0].length === 0) {
            // File exists but is empty/unreadable
            orphanedTracks.push(track);
            console.log(`  ✗ File empty/unreadable: ${track.file_key}`);
            continue;
          }
        }
        console.log(`  ✓ File verified: ${track.file_key}`);
      } catch (err) {
        // ANY error means file is not streamable - mark as orphaned
        const errorInfo = err.name || err.Code || err.$metadata?.httpStatusCode || 'unknown';
        orphanedTracks.push(track);
        console.log(`  ✗ File MISSING: ${track.file_key} (${errorInfo})`);
      }
    }

    // Delete orphaned tracks from database
    const deletedTitles = [];
    const deletedIds = [];
    for (const track of orphanedTracks) {
      await db.query('DELETE FROM tracks WHERE id = $1 AND user_id = $2', [track.id, req.user.id]);
      deletedTitles.push(track.title);
      deletedIds.push(track.id);
    }

    console.log(`Verified B2 files: ${tracksResult.rows.length} tracks checked, ${orphanedTracks.length} orphaned tracks deleted for user ${req.user.id}:`, deletedTitles);

    res.json({
      checked: tracksResult.rows.length,
      deleted: orphanedTracks.length,
      tracks: deletedTitles,
      deletedIds: deletedIds
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

// ============ CHUNKED UPLOAD ENDPOINTS FOR LARGE FILES ============

// In-memory storage for chunks (in production, use Redis or temp files)
const uploadSessions = new Map();

// Initialize chunked upload session
app.post('/api/tracks/upload/init', auth, async (req, res) => {
  try {
    const { title, artist, album, duration, cover_url, total_chunks, file_size, mime_type } = req.body;

    // Generate a unique upload session ID
    const sessionId = `upload-${req.user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create track record first (without file_data)
    const db = getPool();
    const result = await db.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, cover_url, lyrics_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, title, artist, album, duration || 0, cover_url, 'pending']
    );

    const track = result.rows[0];

    // Store session info
    uploadSessions.set(sessionId, {
      trackId: track.id,
      userId: req.user.id,
      totalChunks: total_chunks,
      fileSize: file_size,
      mimeType: mime_type || 'audio/mpeg',
      receivedChunks: new Map(),
      createdAt: Date.now()
    });

    console.log(`Chunked upload initialized: ${sessionId}, track: ${track.id}, chunks: ${total_chunks}, size: ${Math.round(file_size / 1024 / 1024)}MB`);

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

// Upload a chunk
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

    // Store the chunk
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

// Finalize chunked upload - assemble and save
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

    // Check all chunks received
    if (session.receivedChunks.size !== session.totalChunks) {
      return res.status(400).json({
        error: `Missing chunks: received ${session.receivedChunks.size}/${session.totalChunks}`
      });
    }

    // Assemble chunks in order
    console.log(`Assembling ${session.totalChunks} chunks for track ${session.trackId}`);
    const chunks = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const chunk = session.receivedChunks.get(i);
      if (!chunk) {
        return res.status(400).json({ error: `Missing chunk ${i}` });
      }
      chunks.push(chunk);
    }

    // Combine into full base64 data URL
    const fullBase64 = chunks.join('');
    const fileData = `data:${session.mimeType};base64,${fullBase64}`;

    console.log(`Assembled file: ${Math.round(fileData.length / 1024 / 1024)}MB for track ${session.trackId}`);

    // Update track with file data
    const db = getPool();
    await db.query(
      'UPDATE tracks SET file_data = $1 WHERE id = $2 AND user_id = $3',
      [fileData, session.trackId, req.user.id]
    );

    // Clean up session
    uploadSessions.delete(session_id);

    // Start auto-transcription in background
    if (openai) {
      console.log(`Starting auto-transcription for chunked upload track: ${session.trackId}`);
      db.query('UPDATE tracks SET lyrics_status = $1 WHERE id = $2', ['processing', session.trackId]);

      transcribeAudio(fileData, session.trackId).then(async (transcription) => {
        if (transcription) {
          await db.query(
            'UPDATE tracks SET lyrics_text = $1, lyrics_segments = $2, lyrics_status = $3 WHERE id = $4',
            [transcription.text, JSON.stringify({ segments: transcription.segments, words: transcription.words }), 'completed', session.trackId]
          );
          console.log(`Auto-transcription completed for track: ${session.trackId}`);
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

// Clean up expired upload sessions periodically
setInterval(() => {
  const now = Date.now();
  const expireTime = 30 * 60 * 1000; // 30 minutes
  for (const [sessionId, session] of uploadSessions.entries()) {
    if (now - session.createdAt > expireTime) {
      console.log(`Cleaning up expired upload session: ${sessionId}`);
      uploadSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// ============ DIRECT-TO-B2 UPLOAD (SCALABLE FOR 400+ SONGS) ============

// Get presigned URL for direct browser-to-B2 upload
// This bypasses the API for file data - much more scalable
app.post('/api/upload/presign', auth, async (req, res) => {
  try {
    const client = getS3Client();
    if (!client) {
      return res.status(400).json({
        error: 'Cloud storage not configured',
        fallback: 'base64' // Tell frontend to use base64 fallback
      });
    }

    const { filename, contentType, fileSize } = req.body;

    // Generate unique file key
    const fileExt = filename.split('.').pop()?.toLowerCase() || 'mp3';
    const fileKey = `${req.user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // Generate presigned URL for PUT (upload)
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: fileKey,
      ContentType: contentType || 'audio/mpeg',
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 }); // 1 hour

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

// Batch presign - get multiple upload URLs at once (for bulk imports)
app.post('/api/upload/presign-batch', auth, async (req, res) => {
  try {
    const client = getS3Client();
    if (!client) {
      return res.status(400).json({
        error: 'Cloud storage not configured',
        fallback: 'base64'
      });
    }

    const { files } = req.body; // Array of { filename, contentType, fileSize }

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

// Create track record after successful B2 upload
app.post('/api/tracks/from-b2', auth, async (req, res) => {
  try {
    const { title, artist, album, duration, fileKey, cover_url } = req.body;

    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey required' });
    }

    const db = getPool();

    // Insert track with file_key (not file_data)
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

// Bulk create tracks after B2 uploads
app.post('/api/tracks/from-b2-batch', auth, async (req, res) => {
  try {
    const { tracks } = req.body; // Array of { title, artist, album, duration, fileKey, cover_url }

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

// Get streaming URL for a track stored in B2
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

    // If track has file_key (B2 storage), generate signed URL
    if (track.file_key) {
      const client = getS3Client();
      if (!client) {
        return res.status(500).json({ error: 'Cloud storage not configured' });
      }

      const command = new GetObjectCommand({
        Bucket: B2_BUCKET,
        Key: track.file_key,
      });

      const streamUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

      return res.json({
        url: streamUrl,
        expiresIn: 3600,
        source: 'b2'
      });
    }

    // Fallback: track has base64 data, return streaming endpoint
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

// Add file_key column to tracks table if needed
async function addFileKeyColumn() {
  const db = getPool();
  if (!db) return;
  try {
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'file_key') THEN
          ALTER TABLE tracks ADD COLUMN file_key TEXT;
        END IF;
      END $$;
    `);
    console.log('file_key column ready');
  } catch (e) {
    console.error('Error adding file_key column:', e.message);
  }
}

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

// ============ PROXY UPLOAD TO B2 (Bypasses CORS) ============
// Browser → API → B2 (avoids CORS issues with direct browser-to-B2 uploads)
app.post('/api/upload/proxy', auth, express.raw({ type: '*/*', limit: '200mb' }), async (req, res) => {
  try {
    const client = getS3Client();
    if (!client) {
      return res.status(400).json({ error: 'Cloud storage not configured', fallback: 'base64' });
    }

    const filename = req.headers['x-filename'] || 'audio.mp3';
    const contentType = req.headers['content-type'] || 'audio/mpeg';
    const fileSize = req.body.length;

    // Generate unique file key
    const fileExt = filename.split('.').pop()?.toLowerCase() || 'mp3';
    const fileKey = `${req.user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    console.log(`Proxy upload: ${filename} (${Math.round(fileSize / 1024 / 1024)}MB) -> ${fileKey}`);

    // Upload to B2
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

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  initDB().then(() => {
    addFileKeyColumn();
  });
});
