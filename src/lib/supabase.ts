import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These will be set from environment variables
// Users need to set these in their .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Only create client if configured, otherwise create a dummy that won't be used
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);

// Database types
export interface DbUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface DbTrack {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  file_url: string;
  cover_url?: string;
  created_at: string;
}

export interface DbPlaylist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_url?: string;
  created_at: string;
}

export interface DbPlaylistTrack {
  playlist_id: string;
  track_id: string;
  position: number;
}
