interface AlbumArtBackgroundProps {
  imageUrl: string;
}

export const AlbumArtBackground = ({ imageUrl }: AlbumArtBackgroundProps) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Blurred and darkened album art */}
      <div 
        className="absolute inset-0 scale-110 blur-3xl opacity-20"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Gradient overlays for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
    </div>
  );
};
