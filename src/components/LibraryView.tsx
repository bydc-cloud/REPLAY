import { useState, useRef } from "react";
import { Music, Disc, Users, ListMusic, Plus, Upload, Loader2, Trash2, FolderOpen, Folder, ChevronLeft, Edit2, Check, X } from "lucide-react";
import { AlbumCard } from "./AlbumCard";
import { SongCard } from "./SongCard";
import { useMusicLibrary, Track, ProjectFolder } from "../contexts/MusicLibraryContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

interface ArtistCardProps {
  name: string;
  imageUrl?: string;
  trackCount: number;
  albumCount: number;
  onClick?: () => void;
}

const ArtistCard = ({ name, imageUrl, trackCount, albumCount, onClick }: ArtistCardProps) => {
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative mb-4 aspect-square rounded-full overflow-hidden bg-[var(--replay-elevated)]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--replay-elevated)] to-[var(--replay-dark-grey)]">
            <span className="text-4xl font-black text-[var(--replay-mid-grey)]">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <h3 className="font-semibold text-[var(--replay-off-white)] text-center truncate">
        {name}
      </h3>
      <p className="text-sm text-[var(--replay-mid-grey)] text-center">
        {albumCount} albums • {trackCount} songs
      </p>
    </div>
  );
};

interface PlaylistCardProps {
  name: string;
  songCount: number;
  imageUrl?: string;
  onClick?: () => void;
  onDelete?: () => void;
}

const PlaylistCard = ({ name, songCount, imageUrl, onClick, onDelete }: PlaylistCardProps) => {
  return (
    <div className="group cursor-pointer relative" onClick={onClick}>
      <div className="relative mb-4 aspect-square rounded overflow-hidden bg-[var(--replay-elevated)]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--replay-elevated)] to-[var(--replay-dark-grey)]">
            <ListMusic className="w-12 h-12 text-[var(--replay-mid-grey)]" />
          </div>
        )}
      </div>
      <h3 className="font-semibold text-[var(--replay-off-white)] truncate">{name}</h3>
      <p className="text-sm text-[var(--replay-mid-grey)]">{songCount} songs</p>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <Trash2 size={16} className="text-white" />
        </button>
      )}
    </div>
  );
};

// Project Folder Card component
interface ProjectFolderCardProps {
  folder: ProjectFolder;
  songCount: number;
  onClick?: () => void;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
}

const ProjectFolderCard = ({ folder, songCount, onClick, onDelete, onRename }: ProjectFolderCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const handleRename = () => {
    if (editName.trim() && onRename) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="group cursor-pointer relative" onClick={() => !isEditing && onClick?.()}>
      <div
        className="relative mb-4 aspect-square rounded-xl overflow-hidden flex items-center justify-center bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <Folder className="w-16 h-16 text-[var(--replay-off-white)]/80" />
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/80"
          >
            <Trash2 size={16} className="text-white" />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 px-2 py-1 bg-[var(--replay-elevated)] border border-[var(--replay-border)] rounded text-sm text-[var(--replay-off-white)]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setIsEditing(false);
            }}
          />
          <button onClick={handleRename} className="p-1 text-green-500 hover:bg-white/10 rounded">
            <Check size={16} />
          </button>
          <button onClick={() => setIsEditing(false)} className="p-1 text-red-500 hover:bg-white/10 rounded">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[var(--replay-off-white)] truncate flex-1">{folder.name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
          >
            <Edit2 size={14} />
          </button>
        </div>
      )}
      <p className="text-sm text-[var(--replay-mid-grey)]">{songCount} songs</p>
    </div>
  );
};

export const LibraryView = () => {
  const [activeTab, setActiveTab] = useState("songs");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    tracks,
    albums,
    artists,
    playlists,
    projectFolders,
    importFiles,
    isImporting,
    importProgress,
    createPlaylist,
    deletePlaylist,
    createProjectFolder,
    deleteProjectFolder,
    renameProjectFolder,
    addToProjectFolder,
    removeFromProjectFolder
  } = useMusicLibrary();

  const { setQueue } = useAudioPlayer();

  const tabs = [
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "songs", label: "Songs", icon: Music },
    { id: "albums", label: "Albums", icon: Disc },
    { id: "artists", label: "Artists", icon: Users },
    { id: "playlists", label: "Playlists", icon: ListMusic },
  ];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await importFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handlePlayTrack = (index: number) => {
    setQueue(tracks, index);
  };

  const handlePlayAlbum = (albumName: string, artistName: string) => {
    const albumTracks = tracks.filter(t => t.album === albumName && t.artist === artistName);
    if (albumTracks.length > 0) {
      setQueue(albumTracks, 0);
    }
  };

  const handlePlayArtist = (artistName: string) => {
    const artistTracks = tracks.filter(t => t.artist === artistName);
    if (artistTracks.length > 0) {
      setQueue(artistTracks, 0);
    }
  };

  const handlePlayPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && playlist.trackIds.length > 0) {
      const playlistTracks = playlist.trackIds
        .map(id => tracks.find(t => t.id === id))
        .filter(t => t !== undefined) as Track[];
      if (playlistTracks.length > 0) {
        setQueue(playlistTracks, 0);
      }
    }
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setShowNewPlaylist(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createProjectFolder(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolder(false);
    }
  };

  const handlePlayFolder = (folderId: string) => {
    const folder = projectFolders.find(f => f.id === folderId);
    if (folder && folder.trackIds.length > 0) {
      const folderTracks = folder.trackIds
        .map(id => tracks.find(t => t.id === id))
        .filter(t => t !== undefined) as Track[];
      if (folderTracks.length > 0) {
        setQueue(folderTracks, 0);
      }
    }
  };

  // Get currently open folder
  const openFolder = openFolderId ? projectFolders.find(f => f.id === openFolderId) : null;
  const folderTracks = openFolder
    ? openFolder.trackIds.map(id => tracks.find(t => t.id === id)).filter(t => t !== undefined) as Track[]
    : [];

  return (
    <div className="p-4 md:p-8 pt-2 md:pt-8 pb-32 min-h-full">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac,.wma"
        multiple
        className="hidden"
      />

      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-[var(--replay-off-white)]">
          Your Library
        </h1>

        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--replay-off-white)] text-[var(--replay-black)] font-semibold rounded-full hover:bg-white/90 transition-all disabled:opacity-50"
        >
          {isImporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload size={18} />
              Import
            </>
          )}
        </button>
      </div>

      {/* Import Progress */}
      {isImporting && (
        <div className="mb-6 p-4 bg-[var(--replay-elevated)] border border-[var(--replay-border)] rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 text-[var(--replay-off-white)] animate-spin" />
            <span className="text-sm font-medium text-[var(--replay-off-white)]">
              Importing music...
            </span>
          </div>
          <div className="h-2 bg-[var(--replay-dark-grey)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--replay-off-white)] transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[var(--replay-off-white)] text-[var(--replay-black)]"
                  : "bg-[var(--replay-elevated)] text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {tracks.length === 0 && !isImporting && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--replay-elevated)] flex items-center justify-center">
            <Music className="w-12 h-12 text-[var(--replay-mid-grey)]" />
          </div>
          <h2 className="text-2xl font-black text-[var(--replay-off-white)] mb-2">
            Your library is empty
          </h2>
          <p className="text-[var(--replay-mid-grey)] mb-6 max-w-md mx-auto">
            Import your music files to get started. We support MP3, M4A, WAV, FLAC, and more.
          </p>
          <button
            onClick={handleImportClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] font-semibold rounded-full hover:bg-white/90 transition-all"
          >
            <Upload size={20} />
            Import Music
          </button>
        </div>
      )}

      {/* Content */}
      {tracks.length > 0 && (
        <div>
          {activeTab === "songs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tracks.map((track, index) => (
                <SongCard
                  key={track.id}
                  title={track.title}
                  artist={track.artist}
                  imageUrl={track.artworkUrl || track.artworkData}
                  onClick={() => handlePlayTrack(index)}
                />
              ))}
            </div>
          )}

          {activeTab === "albums" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  title={album.name}
                  artist={album.artist}
                  imageUrl={album.artworkUrl}
                  onClick={() => handlePlayAlbum(album.name, album.artist)}
                />
              ))}
            </div>
          )}

          {activeTab === "artists" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {artists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  name={artist.name}
                  imageUrl={artist.imageUrl}
                  trackCount={artist.trackCount}
                  albumCount={artist.albums.length}
                  onClick={() => handlePlayArtist(artist.name)}
                />
              ))}
            </div>
          )}

          {activeTab === "playlists" && (
            <div>
              {/* Create Playlist Button */}
              <div className="mb-6">
                {showNewPlaylist ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Playlist name..."
                      className="flex-1 px-4 py-2 bg-[var(--replay-elevated)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] focus:outline-none focus:border-[var(--replay-off-white)]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreatePlaylist();
                        if (e.key === "Escape") setShowNewPlaylist(false);
                      }}
                    />
                    <button
                      onClick={handleCreatePlaylist}
                      className="px-4 py-2 bg-[var(--replay-off-white)] text-[var(--replay-black)] font-semibold rounded-xl hover:bg-white/90 transition-all"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setShowNewPlaylist(false)}
                      className="px-4 py-2 bg-[var(--replay-elevated)] text-[var(--replay-mid-grey)] rounded-xl hover:text-[var(--replay-off-white)] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewPlaylist(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--replay-elevated)] text-[var(--replay-mid-grey)] rounded-xl hover:text-[var(--replay-off-white)] transition-all"
                  >
                    <Plus size={18} />
                    Create Playlist
                  </button>
                )}
              </div>

              {playlists.length === 0 ? (
                <div className="text-center py-12">
                  <ListMusic className="w-16 h-16 mx-auto mb-4 text-[var(--replay-mid-grey)]" />
                  <p className="text-[var(--replay-mid-grey)]">No playlists yet</p>
                  <p className="text-sm text-[var(--replay-mid-grey)]/60">Create a playlist to organize your music</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {playlists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      name={playlist.name}
                      songCount={playlist.trackIds.length}
                      imageUrl={playlist.imageUrl}
                      onClick={() => handlePlayPlaylist(playlist.id)}
                      onDelete={() => deletePlaylist(playlist.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div>
              {/* If a folder is open, show its contents */}
              {openFolderId && openFolder ? (
                <div>
                  {/* Back button and folder header */}
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={() => setOpenFolderId(null)}
                      className="flex items-center gap-2 px-3 py-2 bg-[var(--replay-elevated)] text-[var(--replay-mid-grey)] rounded-xl hover:text-[var(--replay-off-white)] transition-all"
                    >
                      <ChevronLeft size={18} />
                      Back
                    </button>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1a1a1a] border border-white/10"
                      >
                        <Folder className="w-5 h-5 text-[var(--replay-off-white)]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[var(--replay-off-white)]">{openFolder.name}</h2>
                        <p className="text-sm text-[var(--replay-mid-grey)]">{folderTracks.length} songs</p>
                      </div>
                    </div>
                  </div>

                  {/* Folder tracks */}
                  {folderTracks.length === 0 ? (
                    <div className="text-center py-12">
                      <Music className="w-16 h-16 mx-auto mb-4 text-[var(--replay-mid-grey)]" />
                      <p className="text-[var(--replay-mid-grey)]">No songs in this project</p>
                      <p className="text-sm text-[var(--replay-mid-grey)]/60">Add songs from your library</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {folderTracks.map((track, index) => (
                        <div key={track.id} className="relative group">
                          <SongCard
                            title={track.title}
                            artist={track.artist}
                            imageUrl={track.artworkUrl || track.artworkData}
                            onClick={() => {
                              setQueue(folderTracks, index);
                            }}
                          />
                          <button
                            onClick={() => removeFromProjectFolder(openFolderId, track.id)}
                            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                          >
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add songs section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-[var(--replay-off-white)] mb-4">Add Songs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                      {tracks
                        .filter(t => !openFolder.trackIds.includes(t.id))
                        .map((track) => (
                          <button
                            key={track.id}
                            onClick={() => addToProjectFolder(openFolderId, track.id)}
                            className="flex items-center gap-3 p-3 bg-[var(--replay-elevated)] rounded-xl hover:bg-white/10 transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[var(--replay-dark-grey)] flex items-center justify-center flex-shrink-0">
                              <Music size={16} className="text-[var(--replay-mid-grey)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--replay-off-white)] truncate">{track.title}</p>
                              <p className="text-xs text-[var(--replay-mid-grey)] truncate">{track.artist}</p>
                            </div>
                            <Plus size={18} className="text-[var(--replay-mid-grey)]" />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Folder list view */
                <div>
                  {/* Create Folder Button */}
                  <div className="mb-6">
                    {showNewFolder ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Project name..."
                          className="flex-1 px-4 py-2 bg-[var(--replay-elevated)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] focus:outline-none focus:border-[var(--replay-off-white)]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateFolder();
                            if (e.key === "Escape") setShowNewFolder(false);
                          }}
                        />
                        <button
                          onClick={handleCreateFolder}
                          className="px-4 py-2 bg-[var(--replay-off-white)] text-[var(--replay-black)] font-semibold rounded-xl hover:bg-white/90 transition-all"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => setShowNewFolder(false)}
                          className="px-4 py-2 bg-[var(--replay-elevated)] text-[var(--replay-mid-grey)] rounded-xl hover:text-[var(--replay-off-white)] transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewFolder(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--replay-elevated)] text-[var(--replay-mid-grey)] rounded-xl hover:text-[var(--replay-off-white)] transition-all"
                      >
                        <Plus size={18} />
                        Create Project
                      </button>
                    )}
                  </div>

                  {projectFolders.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[var(--replay-mid-grey)]" />
                      <p className="text-[var(--replay-mid-grey)]">No projects yet</p>
                      <p className="text-sm text-[var(--replay-mid-grey)]/60">Create a project to organize your songs</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {projectFolders.map((folder) => (
                        <ProjectFolderCard
                          key={folder.id}
                          folder={folder}
                          songCount={folder.trackIds.length}
                          onClick={() => setOpenFolderId(folder.id)}
                          onDelete={() => deleteProjectFolder(folder.id)}
                          onRename={(newName) => renameProjectFolder(folder.id, newName)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
