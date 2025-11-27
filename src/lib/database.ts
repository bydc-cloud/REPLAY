// PostgreSQL database connection for Railway
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// User type
export interface DbUser {
  id: string;
  email: string;
  username: string;
  created_at: Date;
}

// Track type
export interface DbTrack {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  file_data?: string; // Base64 encoded audio file
  cover_url?: string;
  play_count: number;
  is_liked: boolean;
  created_at: Date;
}

// Database initialization
export async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tracks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tracks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) DEFAULT 'Unknown Artist',
        album VARCHAR(255) DEFAULT 'Unknown Album',
        duration FLOAT DEFAULT 0,
        file_data TEXT, -- Base64 encoded audio
        cover_url TEXT,
        play_count INTEGER DEFAULT 0,
        is_liked BOOLEAN DEFAULT false,
        genre VARCHAR(100),
        year INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create playlists table
    await pool.query(`
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

    // Create playlist_tracks junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
        track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (playlist_id, track_id)
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON tracks(user_id);
      CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// User authentication functions
export async function createUser(email: string, password: string, username: string): Promise<DbUser | null> {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
      [email.toLowerCase(), username, passwordHash]
    );

    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      throw new Error('An account with this email already exists');
    }
    throw error;
  }
}

export async function verifyUser(email: string, password: string): Promise<DbUser | null> {
  try {
    const result = await pool.query(
      'SELECT id, email, username, password_hash, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('User verification error:', error);
    return null;
  }
}

// Track management functions
export async function getUserTracks(userId: string): Promise<DbTrack[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM tracks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }
}

export async function createTrack(track: Omit<DbTrack, 'id' | 'created_at'>): Promise<DbTrack | null> {
  try {
    const result = await pool.query(
      `INSERT INTO tracks (user_id, title, artist, album, duration, file_data, cover_url, play_count, is_liked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [track.user_id, track.title, track.artist, track.album, track.duration,
       track.file_data, track.cover_url, track.play_count || 0, track.is_liked || false]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating track:', error);
    return null;
  }
}

export async function updateTrack(trackId: string, userId: string, updates: Partial<DbTrack>): Promise<DbTrack | null> {
  try {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'user_id')
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) return null;

    const values = Object.values(updates).filter((_, index) => {
      const key = Object.keys(updates)[index];
      return key !== 'id' && key !== 'user_id';
    });

    const result = await pool.query(
      `UPDATE tracks SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [trackId, userId, ...values]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating track:', error);
    return null;
  }
}

export async function deleteTrack(trackId: string, userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'DELETE FROM tracks WHERE id = $1 AND user_id = $2',
      [trackId, userId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting track:', error);
    return false;
  }
}

// Export the pool for direct queries if needed
export { pool };