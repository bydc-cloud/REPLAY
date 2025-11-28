import { Search, X, Music } from "lucide-react";
import { useState } from "react";
import { AlbumCard } from "./AlbumCard";
import { SongCard } from "./SongCard";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

export const SearchView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { tracks, albums } = useMusicLibrary();
  const { setQueue } = useAudioPlayer();

  const filteredAlbums = searchQuery
    ? albums.filter(
        (album) =>
          album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          album.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredSongs = searchQuery
    ? tracks.filter(
        (track) =>
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const hasResults = filteredAlbums.length > 0 || filteredSongs.length > 0;

  const handlePlaySong = (trackIndex: number) => {
    const actualIndex = tracks.findIndex(t => t.id === filteredSongs[trackIndex].id);
    if (actualIndex >= 0) {
      setQueue(tracks, actualIndex);
    }
  };

  const handlePlayAlbum = (albumName: string, artistName: string) => {
    const albumTracks = tracks.filter(t => t.album === albumName && t.artist === artistName);
    if (albumTracks.length > 0) {
      setQueue(albumTracks, 0);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Search Input */}
      <div className="mb-8 max-w-2xl">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--replay-mid-grey)]"
            size={20}
          />
          <input
            type="text"
            placeholder="Search for songs, albums, or artists..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearching(e.target.value.length > 0);
            }}
            className="w-full pl-12 pr-12 py-4 bg-[var(--replay-elevated)] text-[var(--replay-off-white)] placeholder:text-[var(--replay-mid-grey)] border border-[var(--replay-border)] rounded-lg focus:outline-none focus:border-[var(--replay-off-white)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsSearching(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results or Browse */}
      {!isSearching ? (
        <div>
          <h2 className="text-2xl font-black text-[var(--replay-off-white)] mb-6">
            Browse All
          </h2>
          {albums.length > 0 ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--replay-elevated)] flex items-center justify-center mb-4">
                <Music size={32} className="text-[var(--replay-mid-grey)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--replay-off-white)] mb-2">
                No music yet
              </h3>
              <p className="text-[var(--replay-mid-grey)] max-w-xs">
                Import some music to start browsing
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {hasResults ? (
            <>
              {/* Albums Results */}
              {filteredAlbums.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-black text-[var(--replay-off-white)] mb-6">
                    Albums
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {filteredAlbums.map((album) => (
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

              {/* Songs Results */}
              {filteredSongs.length > 0 && (
                <section>
                  <h2 className="text-2xl font-black text-[var(--replay-off-white)] mb-6">
                    Songs
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSongs.map((track, index) => (
                      <SongCard
                        key={track.id}
                        title={track.title}
                        artist={track.artist}
                        imageUrl={track.artworkUrl || track.artworkData}
                        onClick={() => handlePlaySong(index)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Search
                size={64}
                className="mx-auto mb-4 text-[var(--replay-dark-grey)]"
              />
              <h3 className="text-xl font-semibold text-[var(--replay-off-white)] mb-2">
                No results found
              </h3>
              <p className="text-[var(--replay-mid-grey)]">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
