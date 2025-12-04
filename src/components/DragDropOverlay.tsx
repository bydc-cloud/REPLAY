import { useState, useEffect, useCallback } from "react";
import { Upload, Music, Sparkles } from "lucide-react";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";

interface DragDropOverlayProps {
  children: React.ReactNode;
}

export const DragDropOverlay = ({ children }: DragDropOverlayProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const { importFiles, isImporting } = useMusicLibrary();

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);

    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // Filter for audio files only
      const audioFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (
          file.type.startsWith("audio/") ||
          /\.(mp3|m4a|wav|ogg|flac|aac|wma)$/i.test(file.name)
        ) {
          audioFiles.push(file);
        }
      }

      if (audioFiles.length > 0) {
        // Convert array to FileList-like object
        const dataTransfer = new DataTransfer();
        audioFiles.forEach(file => dataTransfer.items.add(file));
        await importFiles(dataTransfer.files);
      }
    }
  }, [importFiles]);

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <div className="relative">
      {children}

      {/* Drag & Drop Overlay */}
      {isDragging && !isImporting && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex items-center justify-center">
          {/* Animated border */}
          <div className="absolute inset-4 border-4 border-dashed border-white/30 rounded-3xl animate-pulse" />

          {/* Gradient background effect */}
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
                  radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 60%)
                `,
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-8">
            {/* Icon Container */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />

              {/* Icon background */}
              <div className="relative w-full h-full bg-gradient-to-br from-[var(--replay-elevated)] to-[var(--replay-dark-grey)] rounded-3xl flex items-center justify-center border border-white/20">
                <Upload className="w-16 h-16 text-[var(--replay-off-white)] animate-bounce" />
              </div>

              {/* Floating music notes */}
              <div className="absolute -top-4 -left-4 animate-float">
                <Music className="w-8 h-8 text-purple-400 opacity-80" />
              </div>
              <div className="absolute -bottom-2 -right-4 animate-float-delayed">
                <Music className="w-6 h-6 text-pink-400 opacity-80" />
              </div>
              <div className="absolute top-0 -right-6 animate-float-slow">
                <Sparkles className="w-5 h-5 text-blue-400 opacity-80" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-[var(--replay-off-white)] mb-4">
              Drop your music here
            </h2>
            <p className="text-lg text-[var(--replay-mid-grey)] max-w-md mx-auto mb-6">
              Release to import your audio files into RHYTHM
            </p>

            {/* Supported formats */}
            <div className="flex flex-wrap justify-center gap-2">
              {["MP3", "M4A", "WAV", "FLAC", "OGG", "AAC"].map((format) => (
                <span
                  key={format}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm text-[var(--replay-mid-grey)] border border-white/10"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>

          {/* Particle effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: i % 2 === 0 ? "rgba(139, 92, 246, 0.6)" : "rgba(236, 72, 153, 0.6)",
                  animation: `rise ${3 + Math.random() * 4}s ease-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(-5deg);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.1);
          }
        }

        @keyframes rise {
          0% {
            opacity: 0;
            transform: translateY(100vh) scale(0);
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-100vh) scale(1);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3.5s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};
