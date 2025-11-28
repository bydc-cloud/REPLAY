interface ArtistCardProps {
  name: string;
  imageUrl: string;
  albumCount: number;
}

const ArtistCard = ({ name, imageUrl, albumCount }: ArtistCardProps) => {
  return (
    <div className="group cursor-pointer">
      <div className="relative mb-4 aspect-square rounded-full overflow-hidden bg-[var(--replay-elevated)] shadow-lg">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="font-semibold text-[var(--replay-off-white)] text-center truncate px-2">
        {name}
      </h3>
      <p className="text-sm text-[var(--replay-mid-grey)] text-center">
        {albumCount} {albumCount === 1 ? "album" : "albums"}
      </p>
    </div>
  );
};

export const ArtistsView = () => {
  const artists = [
    {
      name: "Synthwave Collective",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 3,
    },
    {
      name: "Electric Dreams",
      imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 2,
    },
    {
      name: "Vinyl Hearts",
      imageUrl: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 4,
    },
    {
      name: "Pop Sensation",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 5,
    },
    {
      name: "Jazz Ensemble",
      imageUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 6,
    },
    {
      name: "Rock Brigade",
      imageUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 3,
    },
    {
      name: "The Melodics",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 2,
    },
    {
      name: "Acoustic Dreams",
      imageUrl: "https://images.unsplash.com/photo-1445985543470-41fba5c3144a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 4,
    },
    {
      name: "Urban Beats",
      imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 7,
    },
    {
      name: "Classical Quartet",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 3,
    },
    {
      name: "Electronic Pulse",
      imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 5,
    },
    {
      name: "Indie Collective",
      imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      albumCount: 4,
    },
  ];

  return (
    <div className="p-4 md:p-8 pt-2 md:pt-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-[var(--replay-off-white)] mb-2">
          Artists
        </h1>
        <p className="text-[var(--replay-mid-grey)]">
          {artists.length} artists in your collection
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {artists.map((artist, index) => (
          <ArtistCard
            key={index}
            name={artist.name}
            imageUrl={artist.imageUrl}
            albumCount={artist.albumCount}
          />
        ))}
      </div>
    </div>
  );
};
