import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileUrl: string;
  artworkUrl?: string;
  artworkData?: string; // Base64 encoded
  dateAdded: Date;
  playCount: number;
  isLiked: boolean;
  trackNumber: number;
  genre?: string;
  year?: number;
  userId: string;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artworkUrl?: string;
  year?: number;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  artworkUrl?: string;
  albums: Album[];
  tracks: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  artworkUrl?: string;
  tracks: Track[];
  dateCreated: Date;
  dateModified: Date;
  userId: string;
}

interface MusicLibraryContextType {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  recentlyPlayed: Track[];
  likedTracks: Track[];
  isLoading: boolean;
  importProgress: number;
  isImporting: boolean;

  // Track operations
  addTrack: (track: Omit<Track, "id" | "dateAdded" | "playCount" | "isLiked" | "userId">) => Promise<Track>;
  deleteTrack: (trackId: string) => void;
  toggleLike: (trackId: string) => void;
  incrementPlayCount: (trackId: string) => void;

  // Playlist operations
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  updatePlaylist: (playlist: Playlist) => void;

  // Import
  importFiles: (files: FileList) => Promise<void>;

  // Search
  search: (query: string) => { tracks: Track[]; albums: Album[]; artists: Artist[] };

  // Stats
  totalDuration: number;
  formattedTotalDuration: string;
}

const MusicLibraryContext = createContext<MusicLibraryContextType | undefined>(undefined);

const TRACKS_STORAGE_KEY = "replay-tracks";
const PLAYLISTS_STORAGE_KEY = "replay-playlists";

// IndexedDB setup for audio file storage (local fallback)
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ReplayMusicDB", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("audioFiles")) {
        db.createObjectStore("audioFiles", { keyPath: "id" });
      }
    };
  });
};

const saveAudioFile = async (id: string, file: Blob): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["audioFiles"], "readwrite");
    const store = transaction.objectStore("audioFiles");
    const request = store.put({ id, file });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const getAudioFile = async (id: string): Promise<Blob | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["audioFiles"], "readonly");
    const store = transaction.objectStore("audioFiles");
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.file || null);
  });
};

const deleteAudioFile = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["audioFiles"], "readwrite");
    const store = transaction.objectStore("audioFiles");
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const MusicLibraryProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUsingSupabase } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // Load library on mount and user change
  useEffect(() => {
    if (!user) {
      setTracks([]);
      setPlaylists([]);
      setIsLoading(false);
      return;
    }

    const loadLibrary = async () => {
      try {
        if (isUsingSupabase) {
          // Load from Supabase
          const { data: tracksData } = await supabase
            .from('tracks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (tracksData) {
            setTracks(tracksData.map((t: any) => ({
              id: t.id,
              title: t.title,
              artist: t.artist,
              album: t.album,
              duration: t.duration,
              fileUrl: t.file_url,
              artworkUrl: t.cover_url,
              dateAdded: new Date(t.created_at),
              playCount: t.play_count || 0,
              isLiked: t.is_liked || false,
              trackNumber: t.track_number || 0,
              genre: t.genre,
              year: t.year,
              userId: t.user_id
            })));
          }

          const { data: playlistsData } = await supabase
            .from('playlists')
            .select('*, playlist_tracks(track_id, position)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (playlistsData) {
            const loadedPlaylists: Playlist[] = [];
            for (const p of playlistsData) {
              const trackIds = (p.playlist_tracks || [])
                .sort((a: any, b: any) => a.position - b.position)
                .map((pt: any) => pt.track_id);

              const playlistTracks = trackIds
                .map((id: string) => tracks.find(t => t.id === id))
                .filter(Boolean) as Track[];

              loadedPlaylists.push({
                id: p.id,
                name: p.name,
                description: p.description,
                artworkUrl: p.cover_url,
                tracks: playlistTracks,
                dateCreated: new Date(p.created_at),
                dateModified: new Date(p.updated_at || p.created_at),
                userId: p.user_id
              });
            }
            setPlaylists(loadedPlaylists);
          }
        } else {
          // Fallback to localStorage
          const savedTracks = localStorage.getItem(`${TRACKS_STORAGE_KEY}-${user.id}`);
          if (savedTracks) {
            const parsed = JSON.parse(savedTracks);
            setTracks(parsed.map((t: Track) => ({
              ...t,
              dateAdded: new Date(t.dateAdded)
            })));
          }

          const savedPlaylists = localStorage.getItem(`${PLAYLISTS_STORAGE_KEY}-${user.id}`);
          if (savedPlaylists) {
            const parsed = JSON.parse(savedPlaylists);
            setPlaylists(parsed.map((p: Playlist) => ({
              ...p,
              dateCreated: new Date(p.dateCreated),
              dateModified: new Date(p.dateModified)
            })));
          }
        }
      } catch (e) {
        console.error("Failed to load library:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadLibrary();
  }, [user, isUsingSupabase]);

  // Save tracks when changed (localStorage fallback)
  useEffect(() => {
    if (user && !isLoading && !isUsingSupabase) {
      localStorage.setItem(`${TRACKS_STORAGE_KEY}-${user.id}`, JSON.stringify(tracks));
    }
  }, [tracks, user, isLoading, isUsingSupabase]);

  // Save playlists when changed (localStorage fallback)
  useEffect(() => {
    if (user && !isLoading && !isUsingSupabase) {
      localStorage.setItem(`${PLAYLISTS_STORAGE_KEY}-${user.id}`, JSON.stringify(playlists));
    }
  }, [playlists, user, isLoading, isUsingSupabase]);

  // Derived data
  const albums: Album[] = (() => {
    const albumMap = new Map<string, Album>();
    tracks.forEach(track => {
      const key = `${track.album}-${track.artist}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          id: key,
          name: track.album,
          artist: track.artist,
          artworkUrl: track.artworkUrl || track.artworkData,
          year: track.year,
          tracks: []
        });
      }
      albumMap.get(key)!.tracks.push(track);
    });
    return Array.from(albumMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  })();

  const artists: Artist[] = (() => {
    const artistMap = new Map<string, Artist>();
    tracks.forEach(track => {
      if (!artistMap.has(track.artist)) {
        artistMap.set(track.artist, {
          id: track.artist,
          name: track.artist,
          artworkUrl: track.artworkUrl || track.artworkData,
          albums: [],
          tracks: []
        });
      }
      artistMap.get(track.artist)!.tracks.push(track);
    });
    // Assign albums to artists
    albums.forEach(album => {
      const artist = artistMap.get(album.artist);
      if (artist && !artist.albums.find(a => a.id === album.id)) {
        artist.albums.push(album);
      }
    });
    return Array.from(artistMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  })();

  const recentlyPlayed = [...tracks]
    .sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())
    .slice(0, 20);

  const likedTracks = tracks.filter(t => t.isLiked);

  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);

  const formattedTotalDuration = (() => {
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  })();

  // Extract metadata from audio file
  const extractMetadata = async (file: File): Promise<{
    title: string;
    artist: string;
    album: string;
    duration: number;
    artworkData?: string;
    trackNumber: number;
    genre?: string;
    year?: number;
  }> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;

      // Default values from filename
      let title = file.name.replace(/\.[^/.]+$/, "");
      let artist = "Unknown Artist";
      let album = "Unknown Album";
      let duration = 0;
      let artworkData: string | undefined;
      let trackNumber = 0;
      let genre: string | undefined;
      let year: number | undefined;

      audio.addEventListener("loadedmetadata", () => {
        duration = audio.duration;
        URL.revokeObjectURL(objectUrl);

        // Try to parse ID3 tags using jsmediatags if available
        // For now, use filename parsing
        const parts = title.split(" - ");
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }

        resolve({ title, artist, album, duration, artworkData, trackNumber, genre, year });
      });

      audio.addEventListener("error", () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ title, artist, album, duration: 0, artworkData, trackNumber, genre, year });
      });
    });
  };

  const addTrack = async (trackData: Omit<Track, "id" | "dateAdded" | "playCount" | "isLiked" | "userId">): Promise<Track> => {
    if (!user) throw new Error("Must be logged in");

    const newTrack: Track = {
      ...trackData,
      id: crypto.randomUUID(),
      dateAdded: new Date(),
      playCount: 0,
      isLiked: false,
      userId: user.id
    };

    if (isUsingSupabase) {
      await supabase.from('tracks').insert({
        id: newTrack.id,
        user_id: user.id,
        title: newTrack.title,
        artist: newTrack.artist,
        album: newTrack.album,
        duration: newTrack.duration,
        file_url: newTrack.fileUrl,
        cover_url: newTrack.artworkUrl,
        play_count: 0,
        is_liked: false,
        track_number: newTrack.trackNumber,
        genre: newTrack.genre,
        year: newTrack.year
      });
    }

    setTracks(prev => [newTrack, ...prev]);
    return newTrack;
  };

  const deleteTrack = useCallback(async (trackId: string) => {
    if (isUsingSupabase) {
      // Delete from Supabase storage and database
      const track = tracks.find(t => t.id === trackId);
      if (track?.fileUrl?.startsWith('https://')) {
        // Delete from Supabase storage
        const filePath = track.fileUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('audio-files').remove([filePath]);
      }
      await supabase.from('tracks').delete().eq('id', trackId);
    }

    setTracks(prev => prev.filter(t => t.id !== trackId));
    deleteAudioFile(trackId).catch(console.error);
  }, [isUsingSupabase, tracks]);

  const toggleLike = useCallback(async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const newIsLiked = !track.isLiked;

    if (isUsingSupabase) {
      await supabase.from('tracks').update({ is_liked: newIsLiked }).eq('id', trackId);
    }

    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, isLiked: newIsLiked } : t
    ));
  }, [isUsingSupabase, tracks]);

  const incrementPlayCount = useCallback(async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const newCount = track.playCount + 1;

    if (isUsingSupabase) {
      await supabase.from('tracks').update({ play_count: newCount }).eq('id', trackId);
    }

    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, playCount: newCount } : t
    ));
  }, [isUsingSupabase, tracks]);

  const importFiles = async (files: FileList) => {
    if (!user) return;

    setIsImporting(true);
    setImportProgress(0);

    const audioFiles = Array.from(files).filter(f =>
      f.type.startsWith("audio/") ||
      /\.(mp3|m4a|wav|ogg|flac|aac|wma)$/i.test(f.name)
    );

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      setImportProgress((i / audioFiles.length) * 100);

      try {
        const metadata = await extractMetadata(file);
        const trackId = crypto.randomUUID();

        let fileUrl = `indexeddb://${trackId}`;

        if (isUsingSupabase) {
          // Upload to Supabase storage
          const filePath = `${user.id}/${trackId}`;
          const { error: uploadError } = await supabase.storage
            .from('audio-files')
            .upload(filePath, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('audio-files')
              .getPublicUrl(filePath);
            fileUrl = publicUrl;
          }
        } else {
          // Store audio file in IndexedDB
          await saveAudioFile(trackId, file);
        }

        // Create track entry
        const newTrack: Track = {
          id: trackId,
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          duration: metadata.duration,
          fileUrl,
          artworkData: metadata.artworkData,
          dateAdded: new Date(),
          playCount: 0,
          isLiked: false,
          trackNumber: metadata.trackNumber,
          genre: metadata.genre,
          year: metadata.year,
          userId: user.id
        };

        if (isUsingSupabase) {
          await supabase.from('tracks').insert({
            id: newTrack.id,
            user_id: user.id,
            title: newTrack.title,
            artist: newTrack.artist,
            album: newTrack.album,
            duration: newTrack.duration,
            file_url: newTrack.fileUrl,
            cover_url: newTrack.artworkUrl,
            play_count: 0,
            is_liked: false,
            track_number: newTrack.trackNumber,
            genre: newTrack.genre,
            year: newTrack.year
          });
        }

        setTracks(prev => [newTrack, ...prev]);
      } catch (e) {
        console.error(`Failed to import ${file.name}:`, e);
      }
    }

    setImportProgress(100);
    setIsImporting(false);
  };

  const createPlaylist = useCallback(async (name: string, description?: string): Promise<Playlist> => {
    if (!user) throw new Error("Must be logged in");

    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      description,
      tracks: [],
      dateCreated: new Date(),
      dateModified: new Date(),
      userId: user.id
    };

    if (isUsingSupabase) {
      await supabase.from('playlists').insert({
        id: newPlaylist.id,
        user_id: user.id,
        name: newPlaylist.name,
        description: newPlaylist.description
      });
    }

    setPlaylists(prev => [newPlaylist, ...prev]);
    return newPlaylist;
  }, [user, isUsingSupabase]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    if (isUsingSupabase) {
      await supabase.from('playlist_tracks').delete().eq('playlist_id', playlistId);
      await supabase.from('playlists').delete().eq('id', playlistId);
    }

    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  }, [isUsingSupabase]);

  const addToPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || playlist.tracks.find(t => t.id === trackId)) return;

    if (isUsingSupabase) {
      await supabase.from('playlist_tracks').insert({
        playlist_id: playlistId,
        track_id: trackId,
        position: playlist.tracks.length
      });
    }

    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        tracks: [...p.tracks, track],
        dateModified: new Date()
      };
    }));
  }, [tracks, playlists, isUsingSupabase]);

  const removeFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    if (isUsingSupabase) {
      await supabase.from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);
    }

    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        tracks: p.tracks.filter(t => t.id !== trackId),
        dateModified: new Date()
      };
    }));
  }, [isUsingSupabase]);

  const updatePlaylist = useCallback(async (playlist: Playlist) => {
    if (isUsingSupabase) {
      await supabase.from('playlists')
        .update({
          name: playlist.name,
          description: playlist.description,
          cover_url: playlist.artworkUrl
        })
        .eq('id', playlist.id);
    }

    setPlaylists(prev => prev.map(p =>
      p.id === playlist.id ? { ...playlist, dateModified: new Date() } : p
    ));
  }, [isUsingSupabase]);

  const search = useCallback((query: string) => {
    if (!query.trim()) return { tracks: [], albums: [], artists: [] };

    const q = query.toLowerCase();
    return {
      tracks: tracks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      ),
      albums: albums.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q)
      ),
      artists: artists.filter(a =>
        a.name.toLowerCase().includes(q)
      )
    };
  }, [tracks, albums, artists]);

  return (
    <MusicLibraryContext.Provider value={{
      tracks,
      albums,
      artists,
      playlists,
      recentlyPlayed,
      likedTracks,
      isLoading,
      importProgress,
      isImporting,
      addTrack,
      deleteTrack,
      toggleLike,
      incrementPlayCount,
      createPlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      updatePlaylist,
      importFiles,
      search,
      totalDuration,
      formattedTotalDuration
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

// Helper to get audio file URL for playback
export const getAudioUrl = async (trackId: string): Promise<string | null> => {
  const file = await getAudioFile(trackId);
  if (!file) return null;
  return URL.createObjectURL(file);
};
