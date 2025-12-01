import { useState, useRef } from "react";
import { Plus, Play, Pause, MoreHorizontal, Pencil, Trash2, X, Music, Upload, Image } from "lucide-react";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

interface Album {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: Date;
}

export const AlbumsView = () => {
  const { tracks, playlists, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, updatePlaylistCover } = useMusicLibrary();
  const { setQueue, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<string | null>(null);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [newAlbumCover, setNewAlbumCover] = useState<string | null>(null);
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ albumId: string; x: number; y: number } | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  // Use playlists as albums
  const albums = playlists;

  // Handle cover image selection
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isEdit && selectedAlbum) {
        // Update existing album cover
        updatePlaylistCover?.(selectedAlbum, dataUrl);
      } else {
        // Set cover for new album
        setNewAlbumCover(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    await createPlaylist(newAlbumName, newAlbumDescription, newAlbumCover || undefined);
    setNewAlbumName("");
    setNewAlbumDescription("");
    setNewAlbumCover(null);
    setShowCreateModal(false);
  };

  const handleDeleteAlbum = async (albumId: string) => {
    await deletePlaylist(albumId);
    if (selectedAlbum === albumId) {
      setSelectedAlbum(null);
    }
    setContextMenu(null);
  };

  const handlePlayAlbum = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const albumTracks = album.trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter(Boolean) as typeof tracks;

    if (albumTracks.length > 0) {
      setQueue(albumTracks, 0);
    }
  };

  const handleAddTrackToAlbum = async (trackId: string) => {
    if (!selectedAlbum) return;
    await addToPlaylist(selectedAlbum, trackId);
  };

  const handleRemoveTrackFromAlbum = async (trackId: string) => {
    if (!selectedAlbum) return;
    await removeFromPlaylist(selectedAlbum, trackId);
  };

  const getAlbumTracks = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return [];
    return album.trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter(Boolean) as typeof tracks;
  };

  const getAlbumDuration = (albumId: string) => {
    const albumTracks = getAlbumTracks(albumId);
    const totalSeconds = albumTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const mins = Math.floor(totalSeconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins} min`;
  };

  const selectedAlbumData = selectedAlbum ? albums.find(a => a.id === selectedAlbum) : null;
  const selectedAlbumTracks = selectedAlbum ? getAlbumTracks(selectedAlbum) : [];

  // Get album cover (prioritize uploaded cover, then first track's artwork)
  const getAlbumCover = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    // First check if album has a custom cover
    if (album?.coverUrl) {
      return album.coverUrl;
    }
    // Fall back to first track's artwork
    const albumTracks = getAlbumTracks(albumId);
    const trackWithArt = albumTracks.find(t => t.artworkUrl || t.artworkData);
    return trackWithArt?.artworkUrl || trackWithArt?.artworkData;
  };

  return (
    <div className="p-4 md:p-8 pt-4 md:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--replay-off-white)] mb-2">
            Albums
          </h1>
          <p className="text-[var(--replay-mid-grey)]">
            Create and organize your music into albums
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--replay-off-white)] text-[var(--replay-black)] font-semibold rounded-full hover:bg-white/90 transition-all"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Album</span>
        </button>
      </div>

      {/* Albums Grid or Detail View */}
      {selectedAlbum ? (
        // Album Detail View
        <div className="animate-in fade-in duration-300">
          {/* Hidden file input for editing cover */}
          <input
            type="file"
            ref={editCoverInputRef}
            onChange={(e) => handleCoverSelect(e, true)}
            accept="image/*"
            className="hidden"
          />

          {/* Album Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Album Cover */}
            <div
              className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-[var(--replay-elevated)] border border-[var(--replay-border)] overflow-hidden flex-shrink-0 mx-auto md:mx-0 relative group cursor-pointer"
              onClick={() => editCoverInputRef.current?.click()}
            >
              {getAlbumCover(selectedAlbum) ? (
                <img
                  src={getAlbumCover(selectedAlbum)}
                  alt={selectedAlbumData?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Music size={64} className="text-white/30" />
                </div>
              )}
              {/* Edit overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <Image size={32} className="text-white" />
                <span className="text-white text-sm font-medium">Change Cover</span>
              </div>
            </div>

            {/* Album Info */}
            <div className="flex-1 flex flex-col justify-end text-center md:text-left">
              <p className="text-xs uppercase tracking-wider text-[var(--replay-mid-grey)] mb-2">Album</p>
              <h2 className="text-3xl md:text-5xl font-black text-[var(--replay-off-white)] mb-3">
                {selectedAlbumData?.name}
              </h2>
              {selectedAlbumData?.description && (
                <p className="text-[var(--replay-mid-grey)] mb-4">{selectedAlbumData.description}</p>
              )}
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-[var(--replay-mid-grey)]">
                <span>{selectedAlbumTracks.length} songs</span>
                <span>•</span>
                <span>{getAlbumDuration(selectedAlbum)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3 mt-6">
                <button
                  onClick={() => handlePlayAlbum(selectedAlbum)}
                  className="flex items-center gap-2 px-6 py-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] font-semibold rounded-full hover:bg-white/90 transition-all"
                >
                  <Play size={20} fill="currentColor" />
                  Play
                </button>
                <button
                  onClick={() => setShowAddTracks(true)}
                  className="flex items-center gap-2 px-6 py-3 border border-[var(--replay-border)] text-[var(--replay-off-white)] font-semibold rounded-full hover:bg-white/5 transition-all"
                >
                  <Plus size={20} />
                  Add Songs
                </button>
                <button
                  onClick={() => setSelectedAlbum(null)}
                  className="p-3 border border-[var(--replay-border)] text-[var(--replay-mid-grey)] rounded-full hover:bg-white/5 hover:text-[var(--replay-off-white)] transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Track List */}
          <div className="bg-[var(--replay-elevated)]/50 rounded-2xl border border-[var(--replay-border)] overflow-hidden">
            {selectedAlbumTracks.length === 0 ? (
              <div className="p-12 text-center">
                <Music size={48} className="text-[var(--replay-mid-grey)] mx-auto mb-4" />
                <p className="text-[var(--replay-mid-grey)] mb-4">No songs in this album yet</p>
                <button
                  onClick={() => setShowAddTracks(true)}
                  className="text-[var(--replay-off-white)] underline hover:no-underline"
                >
                  Add songs to get started
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--replay-border)]">
                {selectedAlbumTracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group ${
                        isCurrentTrack ? "bg-white/10" : ""
                      }`}
                    >
                      {/* Track Number / Play Button */}
                      <div className="w-8 text-center">
                        <span className="text-[var(--replay-mid-grey)] group-hover:hidden">
                          {index + 1}
                        </span>
                        <button
                          onClick={() => {
                            if (isCurrentTrack) {
                              togglePlayPause();
                            } else {
                              setQueue(selectedAlbumTracks, index);
                            }
                          }}
                          className="hidden group-hover:block text-[var(--replay-off-white)]"
                        >
                          {isCurrentTrack && isPlaying ? (
                            <Pause size={16} fill="currentColor" />
                          ) : (
                            <Play size={16} fill="currentColor" />
                          )}
                        </button>
                      </div>

                      {/* Track Art */}
                      <div className="w-10 h-10 rounded bg-[var(--replay-dark-grey)] overflow-hidden flex-shrink-0">
                        {track.artworkUrl || track.artworkData ? (
                          <img
                            src={track.artworkUrl || track.artworkData}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={16} className="text-[var(--replay-mid-grey)]" />
                          </div>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isCurrentTrack ? "text-green-400" : "text-[var(--replay-off-white)]"}`}>
                          {track.title}
                        </p>
                        <p className="text-sm text-[var(--replay-mid-grey)] truncate">
                          {track.artist}
                        </p>
                      </div>

                      {/* Duration */}
                      <span className="text-sm text-[var(--replay-mid-grey)]">
                        {Math.floor((track.duration || 0) / 60)}:{String(Math.floor((track.duration || 0) % 60)).padStart(2, "0")}
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveTrackFromAlbum(track.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-[var(--replay-mid-grey)] hover:text-red-400 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Albums Grid
        <>
          {albums.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--replay-elevated)] flex items-center justify-center">
                <Music className="w-12 h-12 text-[var(--replay-mid-grey)]" />
              </div>
              <h2 className="text-2xl font-black text-[var(--replay-off-white)] mb-2">
                No albums yet
              </h2>
              <p className="text-[var(--replay-mid-grey)] mb-6 max-w-md mx-auto">
                Create your first album to organize your music into collections.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] font-semibold rounded-full hover:bg-white/90 transition-all"
              >
                <Plus size={20} />
                Create Album
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {albums.map((album) => {
                const albumTracks = getAlbumTracks(album.id);
                const cover = getAlbumCover(album.id);
                const isCurrentAlbum = currentTrack && album.trackIds.includes(currentTrack.id);

                return (
                  <div
                    key={album.id}
                    className="group relative bg-[var(--replay-elevated)]/50 rounded-2xl p-3 md:p-4 border border-[var(--replay-border)] hover:border-white/20 hover:bg-[var(--replay-elevated)] transition-all cursor-pointer"
                    onClick={() => setSelectedAlbum(album.id)}
                  >
                    {/* Album Cover */}
                    <div className="aspect-square rounded-xl overflow-hidden bg-[var(--replay-dark-grey)] mb-3 md:mb-4 relative">
                      {cover ? (
                        <img
                          src={cover}
                          alt={album.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                          <Music size={32} className="text-white/30" />
                        </div>
                      )}

                      {/* Play Button Overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAlbum(album.id);
                        }}
                        className="absolute bottom-2 right-2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--replay-off-white)] text-[var(--replay-black)] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-xl"
                      >
                        {isCurrentAlbum && isPlaying ? (
                          <Pause size={20} fill="currentColor" />
                        ) : (
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Album Info */}
                    <h3 className="font-bold text-[var(--replay-off-white)] truncate mb-1">
                      {album.name}
                    </h3>
                    <p className="text-sm text-[var(--replay-mid-grey)]">
                      {albumTracks.length} songs • {getAlbumDuration(album.id)}
                    </p>

                    {/* Context Menu Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({
                          albumId: album.id,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/70 hover:text-white transition-all"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create Album Modal - Redesigned for better mobile UX */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          {/* Modal Container - scrollable on mobile */}
          <div className="w-full h-full md:h-auto md:max-h-[90vh] max-w-lg mx-auto flex flex-col bg-[var(--replay-elevated)] md:rounded-3xl border-0 md:border border-[var(--replay-border)] overflow-hidden shadow-2xl md:m-4">
            {/* Hidden file input */}
            <input
              type="file"
              ref={coverInputRef}
              onChange={(e) => handleCoverSelect(e, false)}
              accept="image/*"
              className="hidden"
            />

            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--replay-border)] flex-shrink-0 bg-[var(--replay-elevated)]">
              <div>
                <h3 className="text-2xl font-black text-[var(--replay-off-white)]">
                  Create Album
                </h3>
                <p className="text-sm text-[var(--replay-mid-grey)] mt-1">
                  Add a new album to your collection
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewAlbumName("");
                  setNewAlbumDescription("");
                  setNewAlbumCover(null);
                }}
                className="p-2 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Cover Art Upload - Centered */}
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-[var(--replay-off-white)] mb-3 text-center">
                  Album Artwork
                </label>
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="w-40 h-40 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-[var(--replay-border)] hover:border-purple-500/50 cursor-pointer transition-all overflow-hidden flex items-center justify-center group hover:scale-105 active:scale-95 shadow-xl"
                >
                  {newAlbumCover ? (
                    <img
                      src={newAlbumCover}
                      alt="Album cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <Upload size={28} className="text-[var(--replay-mid-grey)] group-hover:text-[var(--replay-off-white)] transition-colors" />
                      </div>
                      <span className="text-sm text-[var(--replay-mid-grey)] group-hover:text-[var(--replay-off-white)] transition-colors font-medium">
                        Tap to add artwork
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[var(--replay-mid-grey)] mt-2 text-center">
                  Recommended: 500x500 or larger
                </p>
              </div>

              {/* Album Name Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--replay-off-white)] mb-2">
                  Album Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Enter album name..."
                  className="w-full px-4 py-4 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all text-lg"
                  autoFocus
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--replay-off-white)] mb-2">
                  Description
                  <span className="text-[var(--replay-mid-grey)] ml-1 font-normal">(optional)</span>
                </label>
                <textarea
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  placeholder="What's this album about?"
                  rows={3}
                  className="w-full px-4 py-4 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer Buttons - Fixed at bottom */}
            <div className="flex gap-3 p-5 border-t border-[var(--replay-border)] flex-shrink-0 bg-[var(--replay-elevated)]">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewAlbumName("");
                  setNewAlbumDescription("");
                  setNewAlbumCover(null);
                }}
                className="flex-1 px-4 py-4 border border-[var(--replay-border)] text-[var(--replay-off-white)] rounded-xl hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlbum}
                disabled={!newAlbumName.trim()}
                className="flex-1 px-4 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
              >
                Create Album
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tracks Modal */}
      {showAddTracks && selectedAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--replay-elevated)] rounded-2xl border border-[var(--replay-border)] overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-[var(--replay-border)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--replay-off-white)]">
                Add Songs to Album
              </h3>
              <button
                onClick={() => setShowAddTracks(false)}
                className="p-2 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {tracks.length === 0 ? (
                <div className="p-8 text-center text-[var(--replay-mid-grey)]">
                  No songs in your library yet
                </div>
              ) : (
                <div className="divide-y divide-[var(--replay-border)]">
                  {tracks.map((track) => {
                    const isInAlbum = selectedAlbumData?.trackIds.includes(track.id);
                    return (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                      >
                        {/* Track Art */}
                        <div className="w-10 h-10 rounded bg-[var(--replay-dark-grey)] overflow-hidden flex-shrink-0">
                          {track.artworkUrl || track.artworkData ? (
                            <img
                              src={track.artworkUrl || track.artworkData}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={16} className="text-[var(--replay-mid-grey)]" />
                            </div>
                          )}
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--replay-off-white)] truncate">
                            {track.title}
                          </p>
                          <p className="text-sm text-[var(--replay-mid-grey)] truncate">
                            {track.artist}
                          </p>
                        </div>

                        {/* Add/Remove Button */}
                        <button
                          onClick={() => {
                            if (isInAlbum) {
                              handleRemoveTrackFromAlbum(track.id);
                            } else {
                              handleAddTrackToAlbum(track.id);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            isInAlbum
                              ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
                              : "bg-white/10 text-[var(--replay-off-white)] hover:bg-white/20"
                          }`}
                        >
                          {isInAlbum ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--replay-border)]">
              <button
                onClick={() => setShowAddTracks(false)}
                className="w-full px-4 py-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] font-semibold rounded-xl hover:bg-white/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-[var(--replay-elevated)] border border-[var(--replay-border)] rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              top: Math.min(contextMenu.y, window.innerHeight - 120),
            }}
          >
            <button
              onClick={() => {
                setSelectedAlbum(contextMenu.albumId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
            >
              <Pencil size={16} />
              <span>Edit Album</span>
            </button>
            <button
              onClick={() => handleDeleteAlbum(contextMenu.albumId)}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={16} />
              <span>Delete Album</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
