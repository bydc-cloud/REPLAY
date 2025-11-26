import { Search, X } from "lucide-react";
import { useState } from "react";
import { AlbumCard } from "./AlbumCard";
import { SongCard } from "./SongCard";

export const SearchView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const allAlbums = [
    {
      title: "Neon Nights",
      artist: "Synthwave Collective",
      imageUrl: "https://images.unsplash.com/photo-1703115015343-81b498a8c080?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Retrograde",
      artist: "Electric Dreams",
      imageUrl: "https://images.unsplash.com/photo-1574494462457-45f409ae5039?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Analog Stories",
      artist: "Vinyl Hearts",
      imageUrl: "https://images.unsplash.com/photo-1681148773017-42eaa4522384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Stadium Lights",
      artist: "Pop Sensation",
      imageUrl: "https://images.unsplash.com/photo-1510809393-728d340e4eb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Blue Note Session",
      artist: "Jazz Ensemble",
      imageUrl: "https://images.unsplash.com/photo-1710951403141-353d4e5c7cbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Amplified",
      artist: "Rock Brigade",
      imageUrl: "https://images.unsplash.com/photo-1740459057005-65f000db582f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
  ];

  const allSongs = [
    {
      title: "Midnight Drive",
      artist: "Neon Lights",
      imageUrl: "https://images.unsplash.com/photo-1703115015343-81b498a8c080?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
    {
      title: "Synth Paradise",
      artist: "Electric Dreams",
      imageUrl: "https://images.unsplash.com/photo-1574494462457-45f409ae5039?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
    {
      title: "Analog Love",
      artist: "Vinyl Hearts",
      imageUrl: "https://images.unsplash.com/photo-1681148773017-42eaa4522384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
    {
      title: "Electric Feel",
      artist: "Pop Sensation",
      imageUrl: "https://images.unsplash.com/photo-1510809393-728d340e4eb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
  ];

  const filteredAlbums = searchQuery
    ? allAlbums.filter(
        (album) =>
          album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          album.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredSongs = searchQuery
    ? allSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const hasResults = filteredAlbums.length > 0 || filteredSongs.length > 0;

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {allAlbums.map((album, index) => (
              <AlbumCard
                key={index}
                title={album.title}
                artist={album.artist}
                imageUrl={album.imageUrl}
              />
            ))}
          </div>
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
                    {filteredAlbums.map((album, index) => (
                      <AlbumCard
                        key={index}
                        title={album.title}
                        artist={album.artist}
                        imageUrl={album.imageUrl}
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
                    {filteredSongs.map((song, index) => (
                      <SongCard
                        key={index}
                        title={song.title}
                        artist={song.artist}
                        imageUrl={song.imageUrl}
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
