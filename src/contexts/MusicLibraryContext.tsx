import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from "react";
import { useAuth } from "./PostgresAuthContext";
import { useToast } from "./ToastContext";
import * as musicMetadata from 'music-metadata-browser';
import { analyzeAudioFromDataUrl, preloadEssentia, type AudioAnalysisResult } from '../services/audioAnalysis';

// API URL from environment
const API_URL = import.meta.env.VITE_API_URL || '';

export interface LyricsSegment {
  start: number;
  end: number;
  text: string;
}

export interface LyricsWord {
  word: string;
  start: number;
  end: number;
}

export interface TrackLyrics {
  content: string;
  segments: LyricsSegment[];
  words: LyricsWord[];
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileUrl: string;
  fileKey?: string; // Backblaze B2 file key for cloud-synced tracks
  hasAudio?: boolean; // Indicates if audio data exists in cloud DB (lazy-loaded)
  artworkUrl?: string;
  artworkData?: string;
  isLiked: boolean;
  addedAt: Date;
  playCount: number;
  genre?: string;
  filePath?: string;
  lyrics?: TrackLyrics;
  hasLyrics?: boolean;
  // Audio analysis fields
  bpm?: number;           // Beats per minute (detected)
  musicalKey?: string;    // e.g., "C Major", "A Minor"
  energy?: number;        // 0-1 energy level
  analyzedAt?: Date;      // When analysis was performed
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artworkUrl?: string;
  trackCount: number;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  albumCount: number;
  trackCount: number;
  imageUrl?: string;
  albums: Album[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  trackIds: string[];
  imageUrl?: string;
  coverUrl?: string;
}

export interface ProjectFolder {
  id: string;
  name: string;
  createdAt: Date;
  trackIds: string[];
  color?: string;
}

interface ImportQueueItem {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  track?: Track;
  error?: string;
}

// Detect mobile for import optimization
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

interface CloudSyncStats {
  total: number;
  synced: number;
  failed: number;
  currentTrack?: string;
}

interface MusicLibraryContextType {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  projectFolders: ProjectFolder[];
  likedTracks: Track[];
  recentlyPlayed: Track[];
  isLoading: boolean;
  isImporting: boolean;
  importProgress: number;
  importQueue: ImportQueueItem[];
  importStats: { total: number; completed: number; failed: number; currentFileName?: string };
  isSyncingToCloud: boolean;
  cloudSyncProgress: number;
  cloudSyncStats: CloudSyncStats;
  addTrack: (track: Track) => void;
  removeTrack: (trackId: string) => Promise<void>;
  toggleLike: (trackId: string) => void;
  incrementPlayCount: (trackId: string) => void;
  importFiles: (files: FileList) => Promise<void>;
  resetImportState: () => void;
  getTrackAudio: (trackId: string) => Promise<string | null>;
  getStreamUrl: (trackId: string) => string | null;
  createPlaylist: (name: string, description?: string, coverUrl?: string) => Promise<string>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  updatePlaylistName: (playlistId: string, newName: string) => Promise<void>;
  updatePlaylistCover: (playlistId: string, coverUrl: string) => Promise<void>;
  transcribeTrack: (trackId: string) => Promise<TrackLyrics | null>;
  getLyrics: (trackId: string) => Promise<TrackLyrics | null>;
  cleanupTracksWithoutAudio: () => Promise<{ deleted: number; tracks: string[] }>;
  createProjectFolder: (name: string) => Promise<string>;
  deleteProjectFolder: (folderId: string) => Promise<void>;
  renameProjectFolder: (folderId: string, newName: string) => Promise<void>;
  addToProjectFolder: (folderId: string, trackId: string) => Promise<void>;
  removeFromProjectFolder: (folderId: string, trackId: string) => Promise<void>;
  analyzeTrack: (trackId: string) => Promise<AudioAnalysisResult | null>;
  analyzeAllTracks: () => Promise<void>;
  getLocalOnlyTracks: () => Track[];
  syncLocalTracksToCloud: () => Promise<{ synced: number; failed: number }>;
}

const MusicLibraryContext = createContext<MusicLibraryContextType | undefined>(undefined);

const processAudioFile = async (file: File): Promise<Track> => {
  // Get audio duration using Audio element
  const getDuration = (): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.addEventListener("loadedmetadata", () => {
        const duration = audio.duration;
        URL.revokeObjectURL(objectUrl);
        resolve(duration);
      });
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      });
      audio.src = objectUrl;
    });
  };

  // Extract metadata using music-metadata-browser
  let title = file.name.replace(/\.[^/.]+$/, "");
  let artist = "Unknown Artist";
  let album = "Unknown Album";
  let genre: string | undefined;
  let artworkData: string | undefined;

  try {
    const metadata = await musicMetadata.parseBlob(file);

    if (metadata.common.title) {
      title = metadata.common.title;
    }
    if (metadata.common.artist) {
      artist = metadata.common.artist;
    } else if (metadata.common.artists && metadata.common.artists.length > 0) {
      artist = metadata.common.artists.join(", ");
    }
    if (metadata.common.album) {
      album = metadata.common.album;
    }
    if (metadata.common.genre && metadata.common.genre.length > 0) {
      genre = metadata.common.genre[0];
    }

    // Extract album artwork if available
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      const base64 = btoa(
        new Uint8Array(picture.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      artworkData = `data:${picture.format};base64,${base64}`;
    }
  } catch (error) {
    console.log('Could not parse metadata, using filename:', error);
    // Fallback: Try to extract from filename (e.g., "Artist - Title.mp3")
    const parts = title.split(" - ");
    if (parts.length === 2) {
      artist = parts[0].trim();
      title = parts[1].trim();
    }
  }

  const duration = await getDuration();

  const track: Track = {
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    artist,
    album,
    duration,
    fileUrl: "",
    isLiked: false,
    addedAt: new Date(),
    playCount: 0,
    filePath: file.name,
    genre,
    artworkData,
    artworkUrl: artworkData
  };

  return track;
};

// Storage keys for localStorage
const STORAGE_KEYS = {
  TRACKS: 'replay-tracks',
  PLAYLISTS: 'replay-playlists',
  RECENTLY_PLAYED: 'replay-recently-played',
  PROJECT_FOLDERS: 'replay-project-folders'
};

// Helper functions for localStorage
const getStorageKey = (key: string, userId?: string) => {
  return userId ? `${key}-${userId}` : key;
};

const saveToStorage = (key: string, data: any, userId?: string) => {
  try {
    localStorage.setItem(getStorageKey(key, userId), JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage:`, error);
  }
};

const loadFromStorage = (key: string, userId?: string) => {
  try {
    const data = localStorage.getItem(getStorageKey(key, userId));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error loading from localStorage:`, error);
    return null;
  }
};

export const MusicLibraryProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importQueue, setImportQueue] = useState<ImportQueueItem[]>([]);
  const [importStats, setImportStats] = useState<{ total: number; completed: number; failed: number; currentFileName?: string }>({ total: 0, completed: 0, failed: 0 });
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);
  const [cloudSyncProgress, setCloudSyncProgress] = useState(0);
  const [cloudSyncStats, setCloudSyncStats] = useState<CloudSyncStats>({ total: 0, synced: 0, failed: 0 });
  const syncInProgressRef = useRef(false);
  const importInProgressRef = useRef(false);
  const cloudSyncInProgressRef = useRef(false);
  const pendingAnalysisRef = useRef<string[]>([]); // Queue of track IDs to analyze

  // Fetch tracks from API
  const fetchTracksFromAPI = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tracks`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.map((track: any) => ({
          id: track.id,
          title: track.title,
          artist: track.artist || 'Unknown Artist',
          album: track.album || 'Unknown Album',
          duration: track.duration || 0,
          fileUrl: track.file_url || '', // file_data is now lazy-loaded
          hasAudio: track.has_audio || false, // Indicates if audio data exists in DB
          artworkUrl: track.cover_url,
          isLiked: track.is_liked || false,
          addedAt: new Date(track.created_at),
          playCount: track.play_count || 0,
          genre: track.genre,
          hasLyrics: track.has_lyrics || false,
          lyrics: track.has_lyrics ? { status: 'completed' as const } : { status: (track.lyrics_status || 'pending') as 'pending' | 'processing' | 'completed' | 'failed' },
          // Audio analysis fields
          bpm: track.bpm || undefined,
          musicalKey: track.musical_key || undefined,
          energy: track.energy || undefined,
          analyzedAt: track.analyzed_at ? new Date(track.analyzed_at) : undefined
        }));
      }
      return null;
    } catch (error) {
      console.error('Error fetching tracks from API:', error);
      return null;
    }
  };

  // Fetch audio data for a specific track (lazy-loaded)
  const fetchTrackAudio = async (trackId: string, authToken: string): Promise<string | null> => {
    try {
      console.log('Fetching audio for track:', trackId);
      const response = await fetch(`${API_URL}/api/tracks/${trackId}/audio`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Audio fetched, size:', data.file_data?.length || 0);
        return data.file_data;
      }
      console.error('Failed to fetch audio:', response.status);
      return null;
    } catch (error) {
      console.error('Error fetching track audio:', error);
      return null;
    }
  };

  // Get streaming URL for a cloud-synced track - returns direct URL with token for audio element
  const getStreamUrl = (trackId: string, authToken: string): string => {
    // Return the streaming endpoint URL - the audio element will fetch it directly
    // We append the token as a query param for the streaming endpoint
    return `${API_URL}/api/tracks/${trackId}/stream?token=${encodeURIComponent(authToken)}`;
  };

  // Fetch playlists from API
  const fetchPlaylistsFromAPI = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/playlists`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.map((playlist: any) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          createdAt: new Date(playlist.created_at),
          trackIds: [],
          imageUrl: playlist.cover_url
        }));
      }
      return null;
    } catch (error) {
      console.error('Error fetching playlists from API:', error);
      return null;
    }
  };

  // Load data from API and localStorage on mount and when user changes
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // First load from localStorage for immediate display
        const savedTracks = loadFromStorage(STORAGE_KEYS.TRACKS, user?.id);
        if (savedTracks) {
          setTracks(savedTracks.map((track: any) => ({
            ...track,
            addedAt: new Date(track.addedAt)
          })));
        }

        const savedPlaylists = loadFromStorage(STORAGE_KEYS.PLAYLISTS, user?.id);
        if (savedPlaylists) {
          setPlaylists(savedPlaylists.map((playlist: any) => ({
            ...playlist,
            createdAt: new Date(playlist.createdAt)
          })));
        }

        const savedRecent = loadFromStorage(STORAGE_KEYS.RECENTLY_PLAYED, user?.id);
        if (savedRecent) {
          setRecentlyPlayed(savedRecent.map((track: any) => ({
            ...track,
            addedAt: new Date(track.addedAt)
          })));
        }

        const savedFolders = loadFromStorage(STORAGE_KEYS.PROJECT_FOLDERS, user?.id);
        if (savedFolders) {
          setProjectFolders(savedFolders.map((folder: any) => ({
            ...folder,
            createdAt: new Date(folder.createdAt)
          })));
        }

        // Then sync with API if we have a token
        if (token) {
          const apiTracks = await fetchTracksFromAPI(token);
          if (apiTracks && apiTracks.length > 0) {
            // Merge API tracks with local tracks
            setTracks(prev => {
              const localMap = new Map(prev.map(t => [t.id, t]));
              const merged = apiTracks.map((apiTrack: Track) => {
                const localTrack = localMap.get(apiTrack.id);
                if (localTrack) {
                  // Prefer local fileUrl if it exists and is valid (blob URL or data URI)
                  // Otherwise use API's fileUrl (which contains file_data)
                  const useLocalFile = localTrack.fileUrl &&
                    (localTrack.fileUrl.startsWith('blob:') || localTrack.fileUrl.startsWith('data:'));
                  return { ...apiTrack, fileUrl: useLocalFile ? localTrack.fileUrl : apiTrack.fileUrl };
                }
                return apiTrack;
              });
              // Add any local tracks not in API
              prev.forEach(localTrack => {
                if (!merged.find((t: Track) => t.id === localTrack.id)) {
                  merged.push(localTrack);
                }
              });
              return merged;
            });
          }

          const apiPlaylists = await fetchPlaylistsFromAPI(token);
          if (apiPlaylists && apiPlaylists.length > 0) {
            setPlaylists(apiPlaylists);
          }
        }
      } catch (error) {
        console.error("Error loading music library:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserData();
    } else {
      // Clear data when user logs out
      setTracks([]);
      setPlaylists([]);
      setRecentlyPlayed([]);
      setIsLoading(false);
    }
  }, [user, token]);

  // Save tracks to localStorage when they change
  useEffect(() => {
    if (user && !isLoading) {
      saveToStorage(STORAGE_KEYS.TRACKS, tracks, user.id);
    }
  }, [tracks, user, isLoading]);

  // Save playlists to localStorage when they change
  useEffect(() => {
    if (user && !isLoading) {
      saveToStorage(STORAGE_KEYS.PLAYLISTS, playlists, user.id);
    }
  }, [playlists, user, isLoading]);

  // Save recently played to localStorage when it changes
  useEffect(() => {
    if (user && !isLoading) {
      saveToStorage(STORAGE_KEYS.RECENTLY_PLAYED, recentlyPlayed, user.id);
    }
  }, [recentlyPlayed, user, isLoading]);

  // Save project folders to localStorage when they change
  useEffect(() => {
    if (user && !isLoading) {
      saveToStorage(STORAGE_KEYS.PROJECT_FOLDERS, projectFolders, user.id);
    }
  }, [projectFolders, user, isLoading]);

  // Compute derived data with memoization for performance
  const albums = useMemo((): Album[] => {
    return tracks.reduce((acc, track) => {
      const existingAlbum = acc.find(a => a.name === track.album && a.artist === track.artist);
      if (existingAlbum) {
        existingAlbum.tracks.push(track);
        existingAlbum.trackCount++;
      } else {
        acc.push({
          id: `album-${track.album}-${track.artist}`,
          name: track.album,
          artist: track.artist,
          artworkUrl: track.artworkUrl,
          trackCount: 1,
          tracks: [track]
        });
      }
      return acc;
    }, [] as Album[]);
  }, [tracks]);

  const artists = useMemo((): Artist[] => {
    return tracks.reduce((acc, track) => {
      const existingArtist = acc.find(a => a.name === track.artist);
      if (existingArtist) {
        existingArtist.trackCount++;
        const album = existingArtist.albums.find(a => a.name === track.album);
        if (album) {
          album.tracks.push(track);
          album.trackCount++;
        } else {
          existingArtist.albums.push({
            id: `album-${track.album}-${track.artist}`,
            name: track.album,
            artist: track.artist,
            artworkUrl: track.artworkUrl,
            trackCount: 1,
            tracks: [track]
          });
          existingArtist.albumCount++;
        }
      } else {
        acc.push({
          id: `artist-${track.artist}`,
          name: track.artist,
          albumCount: 1,
          trackCount: 1,
          albums: [{
            id: `album-${track.album}-${track.artist}`,
            name: track.album,
            artist: track.artist,
            artworkUrl: track.artworkUrl,
            trackCount: 1,
            tracks: [track]
          }]
        });
      }
      return acc;
    }, [] as Artist[]);
  }, [tracks]);

  const likedTracks = useMemo(() => tracks.filter(t => t.isLiked), [tracks]);

  const addTrack = (track: Track) => {
    setTracks(prev => [...prev, track]);
  };

  const removeTrack = async (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
  };

  const toggleLike = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    const wasLiked = track?.isLiked ?? false;

    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, isLiked: !t.isLiked } : t
    ));

    if (track) {
      showToast(
        wasLiked ? `Removed "${track.title}" from Liked` : `Added "${track.title}" to Liked`,
        wasLiked ? 'info' : 'success',
        2000
      );
    }
  }, [tracks, showToast]);

  const incrementPlayCount = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, playCount: track.playCount + 1 } : track
    ));

    // Add to recently played
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      setRecentlyPlayed(prev => {
        const filtered = prev.filter(t => t.id !== trackId);
        return [track, ...filtered].slice(0, 20); // Keep last 20
      });
    }
  }, [tracks]);

  // Helper function to retry an operation with exponential backoff
  const retryWithBackoff = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError!;
  };

  // Upload file via proxy (Browser → API → B2) - bypasses CORS issues
  const uploadViaProxy = async (file: File): Promise<{ success: boolean; fileKey?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/upload/proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': file.type || 'audio/mpeg',
          'X-Filename': file.name,
        },
        body: file,
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, fileKey: data.fileKey };
      }
      return { success: false };
    } catch (error) {
      console.error('Proxy upload failed:', error);
      return { success: false };
    }
  };

  // Process a single file in the import queue
  const processImportItem = async (file: File, index: number): Promise<Track | null> => {
    try {
      console.log(`Processing file ${index}: ${file.name}, size: ${file.size}`);

      // Update status to uploading
      setImportQueue(prev => prev.map((item, i) =>
        i === index ? { ...item, status: 'uploading' as const, progress: 10 } : item
      ));

      // Process audio file to get metadata with timeout
      let track: Track;
      try {
        const metadataPromise = processAudioFile(file);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Metadata extraction timeout')), 10000)
        );
        track = await Promise.race([metadataPromise, timeoutPromise]);
      } catch (metaError) {
        console.warn('Metadata extraction failed, using fallback:', metaError);
        // Fallback: create basic track from filename
        const title = file.name.replace(/\.[^/.]+$/, "");
        track = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title,
          artist: "Unknown Artist",
          album: "Unknown Album",
          duration: 0,
          fileUrl: "",
          isLiked: false,
          addedAt: new Date(),
          playCount: 0,
          filePath: file.name
        };
      }

      console.log(`Metadata extracted for: ${track.title}`);

      setImportQueue(prev => prev.map((item, i) =>
        i === index ? { ...item, progress: 30 } : item
      ));

      // Create blob URL for local playback (always, for all file sizes)
      const blobUrl = URL.createObjectURL(file);
      track.fileUrl = blobUrl;

      setImportQueue(prev => prev.map((item, i) =>
        i === index ? { ...item, status: 'uploading' as const, progress: 40 } : item
      ));

      // Try proxy upload to B2 if authenticated (Browser → API → B2, bypasses CORS)
      if (token) {
        try {
          console.log(`Uploading via proxy: ${track.title} (${Math.round(file.size / 1024 / 1024)}MB)`);

          setImportQueue(prev => prev.map((item, i) =>
            i === index ? { ...item, progress: 50 } : item
          ));

          // Upload via proxy (API handles B2 upload server-side)
          const uploadResult = await uploadViaProxy(file);

          if (uploadResult.success && uploadResult.fileKey) {
            setImportQueue(prev => prev.map((item, i) =>
              i === index ? { ...item, progress: 80 } : item
            ));

            // Create track record with file key
            console.log(`Creating track record with file key: ${uploadResult.fileKey}`);
            const trackResponse = await fetch(`${API_URL}/api/tracks/from-b2`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: track.title,
                artist: track.artist,
                album: track.album,
                duration: Math.round(track.duration),
                fileKey: uploadResult.fileKey,
                cover_url: track.artworkUrl || null
              })
            });

            if (trackResponse.ok) {
              const savedTrack = await trackResponse.json();
              track.id = savedTrack.id;
              track.fileKey = uploadResult.fileKey;
              track.hasAudio = true;
              console.log(`Saved to B2 cloud: ${track.title}`);
            } else {
              throw new Error('Failed to create track record');
            }
          } else {
            // Fallback to base64 for small files if proxy fails
            console.log('Proxy upload failed, trying base64 fallback for small files');
            const FALLBACK_THRESHOLD = 20 * 1024 * 1024; // 20MB
            if (file.size <= FALLBACK_THRESHOLD) {
              const fileData = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('FileReader error'));
                reader.readAsDataURL(file);
              });

              const trackResponse = await fetch(`${API_URL}/api/tracks`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  title: track.title,
                  artist: track.artist,
                  album: track.album,
                  duration: Math.round(track.duration),
                  file_data: fileData,
                  cover_url: track.artworkUrl || null
                })
              });

              if (trackResponse.ok) {
                const savedTrack = await trackResponse.json();
                track.id = savedTrack.id;
                track.hasAudio = true;
                console.log(`Saved via base64 fallback: ${track.title}`);
              }
            } else {
              console.log(`Large file ${track.title} - local only (proxy upload failed)`);
            }
          }
        } catch (saveError) {
          console.error(`Cloud upload failed for ${file.name}:`, saveError);
          // Track is still playable locally via blob URL
          showToast(`Saved locally: "${track.title}" (cloud sync failed)`, 'warning');
        }
      }

      // Mark as completed
      setImportQueue(prev => prev.map((item, i) =>
        i === index ? { ...item, status: 'completed' as const, progress: 100, track } : item
      ));

      return track;
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      setImportQueue(prev => prev.map((item, i) =>
        i === index ? { ...item, status: 'failed' as const, error: String(error) } : item
      ));
      return null;
    }
  };

  const importFiles = async (files: FileList) => {
    if (importInProgressRef.current) {
      console.log('Import already in progress, adding to queue...');
      showToast('Import already in progress', 'warning');
      return;
    }

    importInProgressRef.current = true;

    // IMMEDIATELY show UI before any processing
    setIsImporting(true);
    setImportProgress(0);
    setImportStats({ total: 0, completed: 0, failed: 0, currentFileName: 'Scanning files...' });

    // Force UI to render before continuing
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));

    // Filter to only audio files - do this in chunks to not block UI
    const allFiles = Array.from(files);
    const audioFiles: File[] = [];
    const skippedFiles: string[] = [];

    // Supported audio extensions (case-insensitive)
    const AUDIO_EXTENSIONS = /\.(mp3|m4a|wav|ogg|flac|aac|wma|aiff|alac|opus|webm)$/i;

    // Process file filtering in chunks
    const FILTER_CHUNK = 50;
    for (let i = 0; i < allFiles.length; i += FILTER_CHUNK) {
      const chunk = allFiles.slice(i, i + FILTER_CHUNK);
      for (const file of chunk) {
        const isAudio = file.type.startsWith('audio/') || AUDIO_EXTENSIONS.test(file.name);
        if (isAudio) {
          audioFiles.push(file);
        } else if (file.name && !file.name.startsWith('.')) {
          // Track non-hidden files that were skipped
          skippedFiles.push(file.name);
        }
      }
      // Let UI breathe
      if (i + FILTER_CHUNK < allFiles.length) {
        setImportStats(prev => ({ ...prev, currentFileName: `Scanning... ${audioFiles.length} audio files found` }));
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    const totalFiles = audioFiles.length;

    // Show warning about skipped files if any
    if (skippedFiles.length > 0) {
      const skippedCount = skippedFiles.length;
      const examples = skippedFiles.slice(0, 3).join(', ');
      const suffix = skippedCount > 3 ? ` and ${skippedCount - 3} more` : '';
      console.log(`Skipped ${skippedCount} non-audio files: ${examples}${suffix}`);
      if (totalFiles > 0) {
        showToast(`Skipped ${skippedCount} non-audio file${skippedCount > 1 ? 's' : ''}`, 'info', 3000);
      }
    }

    if (totalFiles === 0) {
      showToast('No audio files found. Supported formats: MP3, M4A, WAV, FLAC, AAC, OGG, WMA', 'warning', 4000);
      setIsImporting(false);
      setImportProgress(0);
      setImportStats({ total: 0, completed: 0, failed: 0, currentFileName: undefined });
      importInProgressRef.current = false;
      return;
    }

    // Show count and first file immediately
    setImportStats({ total: totalFiles, completed: 0, failed: 0, currentFileName: audioFiles[0]?.name });

    // Force UI update
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));

    // Show initial toast for large imports
    if (totalFiles > 10) {
      showToast(`Starting import of ${totalFiles} songs...`, 'info', 3000);
    }

    // DON'T create all queue items upfront - just set an empty queue
    // We'll update progress based on completed/failed counts
    setImportQueue([]);

    const newTracks: Track[] = [];
    let completed = 0;
    let failed = 0;

    // On mobile or very large imports, process ONE file at a time
    // On desktop with moderate imports, process in small batches
    const isMobile = isMobileDevice();
    const isLargeImport = totalFiles > 100;
    const BATCH_SIZE = (isMobile || isLargeImport) ? 1 : 2;

    console.log(`Starting import of ${totalFiles} files, batch size: ${BATCH_SIZE}, mobile: ${isMobile}, large: ${isLargeImport}`);

    try {
      for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
        const batchFiles = audioFiles.slice(i, Math.min(i + BATCH_SIZE, totalFiles));

        // Update current file name for display
        if (batchFiles[0]) {
          setImportStats(prev => ({ ...prev, currentFileName: batchFiles[0].name }));
        }

        // CRITICAL: Let UI update between files
        await new Promise(resolve => setTimeout(resolve, 10));

        // Process batch (single file for large imports, up to 2 on desktop)
        const batchPromises = batchFiles.map((file, batchIndex) =>
          processImportItem(file, i + batchIndex)
        );

        const results = await Promise.allSettled(batchPromises);

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            newTracks.push(result.value);
            completed++;
          } else {
            failed++;
          }
        });

        const progress = Math.round(((completed + failed) / totalFiles) * 100);
        setImportStats(prev => ({ ...prev, total: totalFiles, completed, failed }));
        setImportProgress(progress);

        // Periodically add tracks to library and free memory
        // More aggressive for large imports
        const addThreshold = isLargeImport ? 3 : 5;
        if (newTracks.length >= addThreshold) {
          const tracksToAdd = newTracks.splice(0, newTracks.length);
          setTracks(prev => [...prev, ...tracksToAdd]);
          console.log(`Added ${tracksToAdd.length} tracks to library (progressive)`);

          // Allow garbage collection
          await new Promise(resolve => setTimeout(resolve, 20));
        }

        // Show progress toast for large imports every 25 files
        if (totalFiles > 25 && (completed + failed) % 25 === 0 && (completed + failed) < totalFiles) {
          console.log(`Import progress: ${completed + failed}/${totalFiles}`);
        }
      }

      // Add any remaining tracks
      if (newTracks.length > 0) {
        setTracks(prev => [...prev, ...newTracks]);
        console.log(`Added final ${newTracks.length} tracks to library`);
      }

      console.log(`Import complete: ${completed} successful, ${failed} failed`);

      // Queue tracks for background BPM/key analysis (skip for large imports)
      if (!isLargeImport && (!isMobile || completed < 20)) {
        const allTracks = [...newTracks];
        const tracksWithAudio = allTracks.filter(t => t.fileUrl && (t.fileUrl.startsWith('data:') || t.fileUrl.startsWith('blob:')));
        if (tracksWithAudio.length > 0) {
          pendingAnalysisRef.current = [...pendingAnalysisRef.current, ...tracksWithAudio.map(t => t.id)];
          console.log(`Queued ${tracksWithAudio.length} tracks for BPM/key analysis`);
        }
      }

      // Show toast notification based on results
      if (failed === 0 && completed > 0) {
        showToast(`Successfully imported ${completed} ${completed === 1 ? 'song' : 'songs'}`, 'success');
      } else if (failed > 0 && completed > 0) {
        showToast(`Imported ${completed} ${completed === 1 ? 'song' : 'songs'}, ${failed} failed`, 'warning');
      } else if (failed > 0 && completed === 0) {
        showToast(`Failed to import ${failed} ${failed === 1 ? 'song' : 'songs'}`, 'error');
      }

      // Clear queue after a delay to show completion
      setTimeout(() => {
        setImportQueue([]);
        setIsImporting(false);
        setImportProgress(0);
        setImportStats({ total: 0, completed: 0, failed: 0, currentFileName: undefined });
        importInProgressRef.current = false;
      }, 2000);
    } catch (error) {
      // Handle unexpected errors during import
      console.error('Import failed unexpectedly:', error);
      showToast('Import failed unexpectedly. Please try again.', 'error');

      // Add any tracks that were successfully processed before the error
      if (newTracks.length > 0) {
        setTracks(prev => [...prev, ...newTracks]);
        console.log(`Added ${newTracks.length} tracks before error`);
      }

      // Immediately reset import state on error
      setImportQueue([]);
      setIsImporting(false);
      setImportProgress(0);
      setImportStats({ total: 0, completed: 0, failed: 0, currentFileName: undefined });
      importInProgressRef.current = false;
    }
  };

  // Manual reset function for stuck import state
  const resetImportState = useCallback(() => {
    console.log('Manual reset of import state');
    setImportQueue([]);
    setIsImporting(false);
    setImportProgress(0);
    setImportStats({ total: 0, completed: 0, failed: 0, currentFileName: undefined });
    importInProgressRef.current = false;
  }, []);

  // Get audio data for a track (lazy-loaded from cloud)
  const getTrackAudio = useCallback(async (trackId: string): Promise<string | null> => {
    console.log('getTrackAudio called for:', trackId, 'token available:', !!token);

    // First check if we have it locally (blob URL or data URL)
    const track = tracks.find(t => t.id === trackId);
    if (track?.fileUrl && (track.fileUrl.startsWith('blob:') || track.fileUrl.startsWith('data:'))) {
      console.log('Using local audio for track:', trackId);
      return track.fileUrl;
    }

    // Fetch from API
    if (token) {
      // First try to get a stream URL (for B2-stored tracks)
      try {
        console.log('Trying to get stream URL for track:', trackId);
        const streamResponse = await fetch(`${API_URL}/api/tracks/${trackId}/stream-url`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (streamResponse.ok) {
          const data = await streamResponse.json();
          if (data.url) {
            console.log('Got stream URL from:', data.source);
            // For B2 tracks, return the signed URL directly
            if (data.source === 'b2') {
              setTracks(prev => prev.map(t =>
                t.id === trackId ? { ...t, fileUrl: data.url } : t
              ));
              return data.url;
            }
          }
        }
      } catch (error) {
        console.warn('Stream URL fetch failed, falling back to audio endpoint:', error);
      }

      // Fallback to legacy audio endpoint (for base64 stored tracks)
      console.log('Fetching audio from API for track:', trackId);
      const audioData = await fetchTrackAudio(trackId, token);
      if (audioData) {
        console.log('Audio fetched successfully, length:', audioData.length);
        // Cache the audio URL in local track state
        setTracks(prev => prev.map(t =>
          t.id === trackId ? { ...t, fileUrl: audioData } : t
        ));
        return audioData;
      } else {
        console.log('No audio data returned from API');
      }
    } else {
      console.log('No token available, cannot fetch audio from API');
    }

    return null;
  }, [tracks, token]);

  const createPlaylist = async (name: string, description?: string, coverUrl?: string): Promise<string> => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      createdAt: new Date(),
      trackIds: [],
      coverUrl
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    showToast(`Created playlist "${name}"`, 'success', 2500);
    return newPlaylist.id;
  };

  const deletePlaylist = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (playlist) {
      showToast(`Deleted playlist "${playlist.name}"`, 'info', 2500);
    }
  };

  const addToPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    const track = tracks.find(t => t.id === trackId);

    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.trackIds.includes(trackId)) {
        return { ...p, trackIds: [...p.trackIds, trackId] };
      }
      return p;
    }));

    if (playlist && track) {
      showToast(`Added "${track.title}" to ${playlist.name}`, 'success', 2500);
    }
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    const track = tracks.find(t => t.id === trackId);

    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, trackIds: p.trackIds.filter(id => id !== trackId) };
      }
      return p;
    }));

    if (playlist && track) {
      showToast(`Removed "${track.title}" from ${playlist.name}`, 'info', 2500);
    }
  };

  const updatePlaylistName = async (playlistId: string, newName: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return { ...playlist, name: newName };
      }
      return playlist;
    }));
  };

  const updatePlaylistCover = async (playlistId: string, coverUrl: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return { ...playlist, coverUrl };
      }
      return playlist;
    }));
  };

  // Lyrics/Transcription functions
  const getLyrics = async (trackId: string): Promise<TrackLyrics | null> => {
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/api/lyrics/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Handle case where lyrics aren't available yet
        if (!data.content || data.status === 'pending' || data.status === 'processing') {
          return {
            content: '',
            segments: [],
            words: [],
            language: 'en',
            status: data.status || 'pending'
          };
        }

        // Parse segments - they come as JSONB from the API
        let parsedSegments: { segments: LyricsSegment[], words: LyricsWord[] } = { segments: [], words: [] };
        if (data.segments) {
          // If it's a string, parse it; if it's already an object, use it directly
          parsedSegments = typeof data.segments === 'string'
            ? JSON.parse(data.segments)
            : data.segments;
        }

        const lyrics: TrackLyrics = {
          content: data.content,
          segments: parsedSegments.segments || [],
          words: parsedSegments.words || [],
          language: data.language || 'en',
          status: 'completed'
        };

        // Update track in state with lyrics
        setTracks(prev => prev.map(track => {
          if (track.id === trackId) {
            return { ...track, lyrics, hasLyrics: true };
          }
          return track;
        }));

        return lyrics;
      }
      return null;
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      return null;
    }
  };

  const transcribeTrack = async (trackId: string): Promise<TrackLyrics | null> => {
    if (!token) return null;

    try {
      // Mark track as processing
      setTracks(prev => prev.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            lyrics: { content: '', segments: [], words: [], language: 'en', status: 'processing' as const },
            hasLyrics: false
          };
        }
        return track;
      }));

      const response = await fetch(`${API_URL}/api/transcribe/${trackId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        const lyrics: TrackLyrics = {
          content: data.text,
          segments: data.segments || [],
          words: data.words || [],
          language: data.language || 'en',
          status: 'completed'
        };

        // Update track in state with lyrics
        setTracks(prev => prev.map(track => {
          if (track.id === trackId) {
            return { ...track, lyrics, hasLyrics: true };
          }
          return track;
        }));

        return lyrics;
      } else {
        const error = await response.json();
        console.error('Transcription failed:', error);

        // Mark as failed
        setTracks(prev => prev.map(track => {
          if (track.id === trackId) {
            return {
              ...track,
              lyrics: { content: '', segments: [], words: [], language: 'en', status: 'failed' as const }
            };
          }
          return track;
        }));

        return null;
      }
    } catch (error) {
      console.error('Error transcribing track:', error);

      // Mark as failed
      setTracks(prev => prev.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            lyrics: { content: '', segments: [], words: [], language: 'en', status: 'failed' as const }
          };
        }
        return track;
      }));

      return null;
    }
  };

  // Cleanup function to remove tracks without audio data
  const cleanupTracksWithoutAudio = async (): Promise<{ deleted: number; tracks: string[] }> => {
    if (!token) return { deleted: 0, tracks: [] };

    try {
      const response = await fetch(`${API_URL}/api/tracks/cleanup/no-audio`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Remove deleted tracks from local state
        setTracks(prev => prev.filter(track => track.hasAudio !== false));

        // Refresh tracks from API
        if (token) {
          const apiTracks = await fetchTracksFromAPI(token);
          if (apiTracks) {
            setTracks(apiTracks);
          }
        }

        return { deleted: data.deleted, tracks: data.tracks };
      }
      return { deleted: 0, tracks: [] };
    } catch (error) {
      console.error('Error cleaning up tracks:', error);
      return { deleted: 0, tracks: [] };
    }
  };

  // Project Folder functions
  const createProjectFolder = async (name: string): Promise<string> => {
    const newFolder: ProjectFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      createdAt: new Date(),
      trackIds: [],
      color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 7)]
    };
    setProjectFolders(prev => [...prev, newFolder]);
    return newFolder.id;
  };

  const deleteProjectFolder = async (folderId: string) => {
    setProjectFolders(prev => prev.filter(f => f.id !== folderId));
  };

  const renameProjectFolder = async (folderId: string, newName: string) => {
    setProjectFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        return { ...folder, name: newName };
      }
      return folder;
    }));
  };

  const addToProjectFolder = async (folderId: string, trackId: string) => {
    setProjectFolders(prev => prev.map(folder => {
      if (folder.id === folderId && !folder.trackIds.includes(trackId)) {
        return { ...folder, trackIds: [...folder.trackIds, trackId] };
      }
      return folder;
    }));
  };

  const removeFromProjectFolder = async (folderId: string, trackId: string) => {
    setProjectFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        return { ...folder, trackIds: folder.trackIds.filter(id => id !== trackId) };
      }
      return folder;
    }));
  };

  // Audio Analysis functions
  const saveAnalysisToAPI = async (trackId: string, analysis: AudioAnalysisResult): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/tracks/${trackId}/analysis`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bpm: analysis.bpm,
          musical_key: analysis.musicalKey,
          energy: analysis.energy
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving analysis to API:', error);
      return false;
    }
  };

  const analyzeTrack = async (trackId: string): Promise<AudioAnalysisResult | null> => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return null;

    try {
      // Get audio data for this track
      let audioData: string | null = track.fileUrl || null;
      if (!audioData || (!audioData.startsWith('data:') && !audioData.startsWith('blob:'))) {
        // Need to fetch audio from API
        audioData = await getTrackAudio(trackId);
      }

      if (!audioData) {
        console.error('No audio data available for analysis');
        return null;
      }

      console.log(`Analyzing track: ${track.title}`);

      // Perform analysis
      const analysis = await analyzeAudioFromDataUrl(audioData);

      console.log(`Analysis complete for ${track.title}: BPM=${analysis.bpm}, Key=${analysis.musicalKey}`);

      // Update local state
      setTracks(prev => prev.map(t =>
        t.id === trackId
          ? { ...t, bpm: analysis.bpm, musicalKey: analysis.musicalKey, energy: analysis.energy, analyzedAt: new Date() }
          : t
      ));

      // Save to API
      await saveAnalysisToAPI(trackId, analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing track:', error);
      return null;
    }
  };

  const analyzeAllTracks = async (): Promise<void> => {
    const tracksToAnalyze = tracks.filter(t => !t.analyzedAt && t.hasAudio);

    if (tracksToAnalyze.length === 0) {
      showToast('All tracks already analyzed', 'info');
      return;
    }

    showToast(`Analyzing ${tracksToAnalyze.length} tracks...`, 'info');

    let analyzed = 0;
    let failed = 0;

    for (const track of tracksToAnalyze) {
      try {
        const result = await analyzeTrack(track.id);
        if (result) {
          analyzed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (failed === 0) {
      showToast(`Successfully analyzed ${analyzed} tracks`, 'success');
    } else {
      showToast(`Analyzed ${analyzed} tracks, ${failed} failed`, 'warning');
    }
  };

  // Get tracks that are local-only (have blob URL but no fileKey for cloud storage)
  const getLocalOnlyTracks = useCallback((): Track[] => {
    return tracks.filter(track => {
      // Track has a local blob/data URL but no cloud file key
      const hasLocalAudio = track.fileUrl && (track.fileUrl.startsWith('blob:') || track.fileUrl.startsWith('data:'));
      const hasNoCloudKey = !track.fileKey;
      return hasLocalAudio && hasNoCloudKey;
    });
  }, [tracks]);

  // Sync local-only tracks to cloud storage
  const syncLocalTracksToCloud = async (): Promise<{ synced: number; failed: number }> => {
    if (cloudSyncInProgressRef.current) {
      showToast('Cloud sync already in progress', 'warning');
      return { synced: 0, failed: 0 };
    }

    if (!token) {
      showToast('Please sign in to sync to cloud', 'error');
      return { synced: 0, failed: 0 };
    }

    const localTracks = getLocalOnlyTracks();
    if (localTracks.length === 0) {
      showToast('All tracks are already synced to cloud', 'info');
      return { synced: 0, failed: 0 };
    }

    cloudSyncInProgressRef.current = true;
    setIsSyncingToCloud(true);
    setCloudSyncProgress(0);
    setCloudSyncStats({ total: localTracks.length, synced: 0, failed: 0 });

    let synced = 0;
    let failed = 0;
    let staleBlobs = 0;

    showToast(`Syncing ${localTracks.length} tracks to cloud...`, 'info');

    for (let i = 0; i < localTracks.length; i++) {
      const track = localTracks[i];
      setCloudSyncStats(prev => ({ ...prev, currentTrack: track.title }));

      try {
        // Get the audio data
        let audioData = track.fileUrl;
        if (!audioData || (!audioData.startsWith('blob:') && !audioData.startsWith('data:'))) {
          console.log(`Skipping ${track.title} - no local audio data`);
          failed++;
          continue;
        }

        // Convert blob URL to actual blob/file
        let file: File | null = null;
        if (audioData.startsWith('blob:')) {
          try {
            const response = await fetch(audioData);
            if (!response.ok) {
              // Blob URL is stale (page was refreshed) - audio data is lost
              console.warn(`Blob URL expired for ${track.title} - audio data lost after page refresh`);
              staleBlobs++;
              failed++;
              continue;
            }
            const blob = await response.blob();
            // Check if the blob is actually valid audio data
            if (blob.size === 0) {
              console.warn(`Empty blob for ${track.title}`);
              staleBlobs++;
              failed++;
              continue;
            }
            file = new File([blob], `${track.title}.mp3`, { type: blob.type || 'audio/mpeg' });
          } catch (e) {
            // Most likely the blob URL expired after page refresh
            console.error(`Failed to fetch blob for ${track.title}:`, e);
            staleBlobs++;
            failed++;
            continue;
          }
        } else if (audioData.startsWith('data:')) {
          // Convert data URL to File
          const arr = audioData.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || 'audio/mpeg';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          file = new File([u8arr], `${track.title}.mp3`, { type: mime });
        }

        if (!file) {
          failed++;
          continue;
        }

        // Upload via proxy to B2
        console.log(`Uploading ${track.title} to cloud (${Math.round(file.size / 1024 / 1024)}MB)...`);

        const uploadResponse = await fetch(`${API_URL}/api/upload/proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': file.type || 'audio/mpeg',
            'X-Filename': file.name,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          console.error(`Upload failed for ${track.title}:`, await uploadResponse.text());
          failed++;
          continue;
        }

        const uploadResult = await uploadResponse.json();
        if (!uploadResult.fileKey) {
          failed++;
          continue;
        }

        // Update track in database with new fileKey
        const updateResponse = await fetch(`${API_URL}/api/tracks/${track.id}/file-key`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileKey: uploadResult.fileKey }),
        });

        if (updateResponse.ok) {
          // Update local state
          setTracks(prev => prev.map(t =>
            t.id === track.id ? { ...t, fileKey: uploadResult.fileKey, hasAudio: true } : t
          ));
          synced++;
          console.log(`Synced ${track.title} to cloud`);
        } else {
          console.error(`Failed to update track record for ${track.title}`);
          failed++;
        }
      } catch (error) {
        console.error(`Error syncing ${track.title}:`, error);
        failed++;
      }

      // Update progress
      const progress = Math.round(((synced + failed) / localTracks.length) * 100);
      setCloudSyncProgress(progress);
      setCloudSyncStats(prev => ({ ...prev, synced, failed }));
    }

    // Complete
    setIsSyncingToCloud(false);
    setCloudSyncProgress(100);
    cloudSyncInProgressRef.current = false;

    if (failed === 0 && synced > 0) {
      showToast(`Successfully synced ${synced} tracks to cloud`, 'success');
    } else if (synced > 0 && failed > 0) {
      if (staleBlobs > 0) {
        showToast(`Synced ${synced} tracks. ${staleBlobs} tracks lost audio data (re-import from files)`, 'warning', 6000);
      } else {
        showToast(`Synced ${synced} tracks, ${failed} failed`, 'warning');
      }
    } else if (failed > 0 && synced === 0) {
      if (staleBlobs === failed) {
        // All failures were due to stale blob URLs
        showToast(`Audio data lost after page refresh. Re-import your music files to sync to cloud.`, 'error', 8000);
      } else if (staleBlobs > 0) {
        showToast(`${staleBlobs} tracks lost audio data. Re-import from original files.`, 'error', 6000);
      } else {
        showToast(`Failed to sync ${failed} tracks`, 'error');
      }
    }

    // Reset stats after a delay
    setTimeout(() => {
      setCloudSyncStats({ total: 0, synced: 0, failed: 0 });
      setCloudSyncProgress(0);
    }, 3000);

    return { synced, failed };
  };

  // Preload essentia on mount
  useEffect(() => {
    preloadEssentia().catch(console.warn);
  }, []);

  // Process pending analysis queue in background
  useEffect(() => {
    if (isImporting || pendingAnalysisRef.current.length === 0) return;

    const processQueue = async () => {
      const trackIds = [...pendingAnalysisRef.current];
      pendingAnalysisRef.current = [];

      if (trackIds.length > 0) {
        console.log(`Starting background analysis for ${trackIds.length} tracks`);

        for (const trackId of trackIds) {
          try {
            const track = tracks.find(t => t.id === trackId);
            if (track && !track.analyzedAt) {
              await analyzeTrack(trackId);
            }
          } catch (error) {
            console.warn(`Background analysis failed for track ${trackId}:`, error);
          }
        }

        console.log('Background analysis complete');
      }
    };

    // Delay analysis to let UI settle after import
    const timeout = setTimeout(processQueue, 3000);
    return () => clearTimeout(timeout);
  }, [isImporting, tracks]);

  return (
    <MusicLibraryContext.Provider value={{
      tracks,
      albums,
      artists,
      playlists,
      projectFolders,
      likedTracks,
      recentlyPlayed,
      isLoading,
      isImporting,
      importProgress,
      importQueue,
      importStats,
      isSyncingToCloud,
      cloudSyncProgress,
      cloudSyncStats,
      addTrack,
      removeTrack,
      toggleLike,
      incrementPlayCount,
      importFiles,
      resetImportState,
      getTrackAudio,
      getStreamUrl: (trackId: string) => token ? getStreamUrl(trackId, token) : null,
      createPlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      updatePlaylistName,
      updatePlaylistCover,
      transcribeTrack,
      getLyrics,
      cleanupTracksWithoutAudio,
      createProjectFolder,
      deleteProjectFolder,
      renameProjectFolder,
      addToProjectFolder,
      removeFromProjectFolder,
      analyzeTrack,
      analyzeAllTracks,
      getLocalOnlyTracks,
      syncLocalTracksToCloud
    }}>
      {children}
    </MusicLibraryContext.Provider>
  );
};

export const useMusicLibrary = () => {
  const context = useContext(MusicLibraryContext);
  if (context === undefined) {
    throw new Error("useMusicLibrary must be used within a MusicLibraryProvider");
  }
  return context;
};

// Helper function to get audio URL
export const getAudioUrl = (track: Track) => {
  return track.fileUrl;
};