import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  Music,
  DollarSign,
  Tag,
  Image,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/PostgresAuthContext";

const API_URL = import.meta.env.VITE_API_URL || "https://replay-production-9240.up.railway.app";

interface BeatUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadProgress {
  stage: "idle" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  message: string;
}

const GENRES = [
  "Hip Hop",
  "Trap",
  "R&B",
  "Pop",
  "Electronic",
  "House",
  "Techno",
  "Drill",
  "Afrobeat",
  "Reggaeton",
  "Lo-Fi",
  "Jazz",
  "Soul",
  "Rock",
  "Other",
];

const MUSICAL_KEYS = [
  "C Major", "C Minor",
  "C# Major", "C# Minor",
  "D Major", "D Minor",
  "D# Major", "D# Minor",
  "E Major", "E Minor",
  "F Major", "F Minor",
  "F# Major", "F# Minor",
  "G Major", "G Minor",
  "G# Major", "G# Minor",
  "A Major", "A Minor",
  "A# Major", "A# Minor",
  "B Major", "B Minor",
];

const LICENSE_TYPES = [
  { id: "basic", name: "Basic License", description: "Personal use, up to 5,000 streams" },
  { id: "premium", name: "Premium License", description: "Commercial use, unlimited streams" },
  { id: "exclusive", name: "Exclusive License", description: "Full ownership transfer" },
];

export function BeatUploadModal({ isOpen, onClose, onSuccess }: BeatUploadModalProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("29.99");
  const [licenseType, setLicenseType] = useState("basic");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState("");
  const [musicalKey, setMusicalKey] = useState("");
  const [tags, setTags] = useState("");

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: "idle",
    progress: 0,
    message: "",
  });

  // Handle audio file selection
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg"];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|aac|ogg)$/i)) {
        setUploadProgress({
          stage: "error",
          progress: 0,
          message: "Please select a valid audio file (MP3, WAV, FLAC, AAC, OGG)",
        });
        return;
      }

      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        setUploadProgress({
          stage: "error",
          progress: 0,
          message: "File size must be less than 100MB",
        });
        return;
      }

      setAudioFile(file);
      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
      setUploadProgress({ stage: "idle", progress: 0, message: "" });
    }
  };

  // Handle cover image selection
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image type
      if (!file.type.startsWith("image/")) {
        return;
      }

      setCoverFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!audioFile || !title.trim() || !price || !token) {
      setUploadProgress({
        stage: "error",
        progress: 0,
        message: "Please fill in all required fields",
      });
      return;
    }

    setUploadProgress({
      stage: "uploading",
      progress: 0,
      message: "Uploading beat...",
    });

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      if (coverFile) {
        formData.append("cover", coverFile);
      }
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("price", price);
      formData.append("license_type", licenseType);
      if (genre) formData.append("genre", genre);
      if (bpm) formData.append("bpm", bpm);
      if (musicalKey) formData.append("musical_key", musicalKey);
      if (tags) formData.append("tags", tags);

      // Use XHR for progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress({
            stage: "uploading",
            progress: percent,
            message: `Uploading... ${percent}%`,
          });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress({
            stage: "complete",
            progress: 100,
            message: "Beat uploaded successfully!",
          });

          // Reset form after delay
          setTimeout(() => {
            resetForm();
            onSuccess?.();
            onClose();
          }, 1500);
        } else {
          let errorMsg = "Upload failed";
          try {
            const response = JSON.parse(xhr.responseText);
            errorMsg = response.error || errorMsg;
          } catch {
            // ignore parse error
          }
          setUploadProgress({
            stage: "error",
            progress: 0,
            message: errorMsg,
          });
        }
      });

      xhr.addEventListener("error", () => {
        setUploadProgress({
          stage: "error",
          progress: 0,
          message: "Network error. Please try again.",
        });
      });

      xhr.open("POST", `${API_URL}/api/marketplace/beats`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress({
        stage: "error",
        progress: 0,
        message: "Upload failed. Please try again.",
      });
    }
  }, [audioFile, coverFile, title, description, price, licenseType, genre, bpm, musicalKey, tags, token, onSuccess, onClose]);

  // Reset form
  const resetForm = () => {
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setTitle("");
    setDescription("");
    setPrice("29.99");
    setLicenseType("basic");
    setGenre("");
    setBpm("");
    setMusicalKey("");
    setTags("");
    setUploadProgress({ stage: "idle", progress: 0, message: "" });
  };

  if (!isOpen) return null;

  const isUploading = uploadProgress.stage === "uploading" || uploadProgress.stage === "processing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--replay-elevated)] rounded-3xl border border-[var(--replay-border)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--replay-border)] bg-[var(--replay-elevated)]">
          <div>
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">
              Upload Beat
            </h2>
            <p className="text-sm text-[var(--replay-mid-grey)]">
              List your beat for sale on the marketplace
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Audio File */}
          <div>
            <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
              Audio File *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.flac,.aac,.ogg"
              onChange={handleAudioSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full p-6 border-2 border-dashed rounded-2xl transition-all ${
                audioFile
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-[var(--replay-border)] hover:border-purple-500/50 hover:bg-purple-500/5"
              }`}
            >
              {audioFile ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Music className="text-green-400" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-[var(--replay-off-white)] truncate">
                      {audioFile.name}
                    </p>
                    <p className="text-sm text-[var(--replay-mid-grey)]">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Check className="text-green-400" size={24} />
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto text-[var(--replay-mid-grey)] mb-2" size={32} />
                  <p className="text-[var(--replay-off-white)] font-semibold">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-[var(--replay-mid-grey)]">
                    MP3, WAV, FLAC up to 100MB
                  </p>
                </div>
              )}
            </button>
          </div>

          {/* Cover Art */}
          <div>
            <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
              Cover Art (optional)
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className="hidden"
            />
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading}
              className="w-32 h-32 border-2 border-dashed border-[var(--replay-border)] hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Image className="text-[var(--replay-mid-grey)] mb-1" size={24} />
                  <span className="text-xs text-[var(--replay-mid-grey)]">Add cover</span>
                </div>
              )}
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter beat title"
              disabled={isUploading}
              className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your beat..."
              rows={3}
              disabled={isUploading}
              className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          {/* Price and License */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                Price *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--replay-mid-grey)]" size={18} />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={isUploading}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                License Type
              </label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                disabled={isUploading}
                className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] focus:outline-none focus:border-purple-500/50"
              >
                {LICENSE_TYPES.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Genre, BPM, Key */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                disabled={isUploading}
                className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Select...</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                BPM
              </label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="120"
                min="1"
                max="300"
                disabled={isUploading}
                className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                Key
              </label>
              <select
                value={musicalKey}
                onChange={(e) => setMusicalKey(e.target.value)}
                disabled={isUploading}
                className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Select...</option>
                {MUSICAL_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
              Tags (comma-separated)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--replay-mid-grey)]" size={18} />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="dark, melodic, piano"
                disabled={isUploading}
                className="w-full pl-10 pr-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Progress/Status */}
          {uploadProgress.stage !== "idle" && (
            <div
              className={`p-4 rounded-xl ${
                uploadProgress.stage === "error"
                  ? "bg-red-500/10 border border-red-500/30"
                  : uploadProgress.stage === "complete"
                  ? "bg-green-500/10 border border-green-500/30"
                  : "bg-purple-500/10 border border-purple-500/30"
              }`}
            >
              <div className="flex items-center gap-3">
                {uploadProgress.stage === "uploading" && (
                  <Loader2 className="text-purple-400 animate-spin" size={20} />
                )}
                {uploadProgress.stage === "complete" && (
                  <Check className="text-green-400" size={20} />
                )}
                {uploadProgress.stage === "error" && (
                  <AlertCircle className="text-red-400" size={20} />
                )}
                <span
                  className={`font-medium ${
                    uploadProgress.stage === "error"
                      ? "text-red-400"
                      : uploadProgress.stage === "complete"
                      ? "text-green-400"
                      : "text-purple-400"
                  }`}
                >
                  {uploadProgress.message}
                </span>
              </div>
              {uploadProgress.stage === "uploading" && (
                <div className="mt-3 h-2 bg-purple-500/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-[var(--replay-border)] bg-[var(--replay-elevated)]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 py-3 bg-[var(--replay-dark-grey)] hover:bg-[var(--replay-border)] text-[var(--replay-off-white)] rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || !audioFile || !title.trim() || !price}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  List Beat for Sale
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
