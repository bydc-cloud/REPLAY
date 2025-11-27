import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./PostgresAuthContext";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileUrl: string;
  artworkUrl?: string;
  artworkData?: string;
  isLiked: boolean;
  addedAt: Date;
  playCount: number;
  genre?: string;
  filePath?: string;
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
}

interface MusicLibraryContextType {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  likedTracks: Track[];
  recentlyPlayed: Track[];
  isLoading: boolean;
  isImporting: boolean;
  importProgress: number;
  addTrack: (track: Track) => void;
  removeTrack: (trackId: string) => Promise<void>;
  toggleLike: (trackId: string) => void;
  incrementPlayCount: (trackId: string) => void;
  importFiles: (files: FileList) => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<string>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  updatePlaylistName: (playlistId: string, newName: string) => Promise<void>;
}

const MusicLibraryContext = createContext<MusicLibraryContextType | undefined>(undefined);

const processAudioFile = (file: File): Promise<Track> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener("loadedmetadata", () => {
      const track: Track = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Unknown Artist",
        album: "Unknown Album",
        duration: audio.duration,
        fileUrl: objectUrl,
        isLiked: false,
        addedAt: new Date(),
        playCount: 0,
        filePath: file.name
      };

      // Try to extract metadata from filename (e.g., "Artist - Title.mp3")
      const parts = track.title.split(" - ");
      if (parts.length === 2) {
        track.artist = parts[0].trim();
        track.title = parts[1].trim();
      }

      // Check if the browser supports reading metadata
      if ('mediaSession' in navigator && 'metadata' in (navigator as any).mediaSession) {
        // This would require additional libraries for proper metadata extraction
        // For now, we'll use the basic extraction above
      }

      URL.revokeObjectURL(objectUrl);
      resolve(track);
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load audio file"));
    });

    audio.src = objectUrl;
  });
};

// Storage keys for localStorage
const STORAGE_KEYS = {
  TRACKS: 'replay-tracks',
  PLAYLISTS: 'replay-playlists',
  RECENTLY_PLAYED: 'replay-recently-played'
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
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);

  // Load data from localStorage on mount and when user changes
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Load tracks
        const savedTracks = loadFromStorage(STORAGE_KEYS.TRACKS, user?.id);
        if (savedTracks) {
          setTracks(savedTracks.map((track: any) => ({
            ...track,
            addedAt: new Date(track.addedAt)
          })));
        } else {
          setTracks([]);
        }

        // Load playlists
        const savedPlaylists = loadFromStorage(STORAGE_KEYS.PLAYLISTS, user?.id);
        if (savedPlaylists) {
          setPlaylists(savedPlaylists.map((playlist: any) => ({
            ...playlist,
            createdAt: new Date(playlist.createdAt)
          })));
        } else {
          setPlaylists([]);
        }

        // Load recently played
        const savedRecent = loadFromStorage(STORAGE_KEYS.RECENTLY_PLAYED, user?.id);
        if (savedRecent) {
          setRecentlyPlayed(savedRecent.map((track: any) => ({
            ...track,
            addedAt: new Date(track.addedAt)
          })));
        } else {
          setRecentlyPlayed([]);
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
  }, [user]);

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

  // Compute derived data
  const albums: Album[] = tracks.reduce((acc, track) => {
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

  const artists: Artist[] = tracks.reduce((acc, track) => {
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

  const likedTracks = tracks.filter(t => t.isLiked);

  const addTrack = (track: Track) => {
    setTracks(prev => [...prev, track]);
  };

  const removeTrack = async (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
  };

  const toggleLike = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, isLiked: !track.isLiked } : track
    ));
  }, []);

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

  const importFiles = async (files: FileList) => {
    setIsImporting(true);
    setImportProgress(0);

    const newTracks: Track[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];

      try {
        const track = await processAudioFile(file);

        // Store file in browser's storage (IndexedDB would be better for larger files)
        const reader = new FileReader();
        const fileDataPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(file);
        const fileData = await fileDataPromise;

        track.fileUrl = fileData;
        newTracks.push(track);

        setImportProgress(Math.round(((i + 1) / totalFiles) * 100));
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    if (newTracks.length > 0) {
      setTracks(prev => [...prev, ...newTracks]);
    }

    setIsImporting(false);
    setImportProgress(0);
  };

  const createPlaylist = async (name: string, description?: string): Promise<string> => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      createdAt: new Date(),
      trackIds: []
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist.id;
  };

  const deletePlaylist = async (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  const addToPlaylist = async (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId && !playlist.trackIds.includes(trackId)) {
        return { ...playlist, trackIds: [...playlist.trackIds, trackId] };
      }
      return playlist;
    }));
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return { ...playlist, trackIds: playlist.trackIds.filter(id => id !== trackId) };
      }
      return playlist;
    }));
  };

  const updatePlaylistName = async (playlistId: string, newName: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return { ...playlist, name: newName };
      }
      return playlist;
    }));
  };

  return (
    <MusicLibraryContext.Provider value={{
      tracks,
      albums,
      artists,
      playlists,
      likedTracks,
      recentlyPlayed,
      isLoading,
      isImporting,
      importProgress,
      addTrack,
      removeTrack,
      toggleLike,
      incrementPlayCount,
      importFiles,
      createPlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      updatePlaylistName
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