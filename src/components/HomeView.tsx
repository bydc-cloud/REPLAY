import { Heart, Music, Upload, Loader2, LogOut, User } from "lucide-react";
import { useRef, useState } from "react";
import { QuickAccessCard } from "./QuickAccessCard";
import { AlbumCard } from "./AlbumCard";
import { SongCard } from "./SongCard";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useAuth } from "../contexts/PostgresAuthContext";

export const HomeView = () => {
  const { user, signOut } = useAuth();
  const {
    tracks,
    albums,
    likedTracks,
    recentlyPlayed,
    importFiles,
    isImporting,
    importProgress
  } = useMusicLibrary();
  const { setQueue } = useAudioPlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.name?.split(" ")[0] || "";
    const timeGreeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    return firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await importFiles(e.target.files);
      // Reset input so same files can be selected again
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

  // Get recent albums (from recently added tracks)
  const recentAlbums = albums.slice(0, 6);

  // Get jump back in songs
  const jumpBackInSongs = recentlyPlayed.slice(0, 4);

  return (
    <div className="p-4 md:p-8 pt-2 md:pt-8">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac,.wma"
        multiple
        className="hidden"
      />

      {/* Header with User Menu */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        {/* Dynamic Greeting with User Name */}
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-[var(--replay-off-white)]">
            {getGreeting()}
          </h1>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--replay-elevated)] border border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User size={16} className="text-[var(--replay-off-white)]" />
            </div>
            <span className="text-sm font-medium text-[var(--replay-off-white)] hidden sm:inline">
              {user?.name?.split(" ")[0]}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--replay-elevated)] border border-[var(--replay-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-[var(--replay-border)]">
                  <p className="text-sm font-medium text-[var(--replay-off-white)] truncate">{user?.name}</p>
                  <p className="text-xs text-[var(--replay-mid-grey)] truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left text-[var(--replay-off-white)] hover:bg-white/5 transition-colors"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
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

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12">
        <QuickAccessCard
          icon={Heart}
          title="Liked Songs"
          description={`${likedTracks.length} songs`}
        />
        <QuickAccessCard
          icon={Music}
          title="All Songs"
          description={`${tracks.length} songs`}
        />
        <button onClick={handleImportClick} className="w-full text-left">
          <QuickAccessCard
            icon={isImporting ? Loader2 : Upload}
            title="Import Music"
            description={isImporting ? "Importing..." : "Add new tracks"}
          />
        </button>
      </div>

      {/* Empty State */}
      {tracks.length === 0 && !isImporting && (
        <div className="text-center py-16 mb-8 px-4">
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
            className="w-full md:w-auto md:inline-flex items-center justify-center gap-2 px-6 py-4 bg-[var(--replay-off-white)] text-[var(--replay-black)] font-semibold rounded-xl md:rounded-full hover:bg-white/90 transition-all active:scale-95"
          >
            <Upload size={20} />
            Import Music
          </button>
        </div>
      )}

      {/* Recently Added Section */}
      {recentAlbums.length > 0 && (
        <section className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-black text-[var(--replay-off-white)] mb-4 md:mb-6">
            Recently Added
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {recentAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                title={album.name}
                artist={album.artist}
                imageUrl={album.artworkUrl}
                onClick={() => handlePlayAlbum(album.name, album.artist)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Jump Back In Section */}
      {jumpBackInSongs.length > 0 && (
        <section className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-black text-[var(--replay-off-white)] mb-4 md:mb-6">
            Jump Back In
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {jumpBackInSongs.map((track) => (
              <SongCard
                key={track.id}
                title={track.title}
                artist={track.artist}
                imageUrl={track.artworkUrl || track.artworkData}
                onClick={() => handlePlayTrack(tracks.findIndex(t => t.id === track.id))}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
