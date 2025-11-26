import { AlbumCard } from "./AlbumCard";

export const AlbumsView = () => {
  const albums = [
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
    {
      title: "Midnight Jazz",
      artist: "Jazz Ensemble",
      imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Digital Dreams",
      artist: "Synthwave Collective",
      imageUrl: "https://images.unsplash.com/photo-1619983081563-430f63602796?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Urban Echoes",
      artist: "Electric Dreams",
      imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Sunset Boulevard",
      artist: "Vinyl Hearts",
      imageUrl: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Electric Waves",
      artist: "Pop Sensation",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      title: "Rock Anthem",
      artist: "Rock Brigade",
      imageUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-[var(--replay-off-white)] mb-2">
          Albums
        </h1>
        <p className="text-[var(--replay-mid-grey)]">
          {albums.length} albums in your collection
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {albums.map((album, index) => (
          <AlbumCard
            key={index}
            title={album.title}
            artist={album.artist}
            imageUrl={album.imageUrl}
          />
        ))}
      </div>
    </div>
  );
};
