import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  Music,
  Image,
  DollarSign,
  Tag,
  FileAudio,
  Plus,
  Trash2,
  Loader2,
  Package,
  Check,
} from "lucide-react";
import { useAuth } from "../contexts/PostgresAuthContext";

const API_URL = import.meta.env.VITE_API_URL || "https://replay-production-9240.up.railway.app";

interface SamplePackUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SampleFile {
  file: File;
  name: string;
  category: string;
}

const SAMPLE_CATEGORIES = [
  "Drums",
  "Bass",
  "Synths",
  "Vocals",
  "FX",
  "Loops",
  "One-Shots",
  "Melodies",
  "Pads",
  "Other",
];

const GENRES = [
  "Hip Hop",
  "Trap",
  "R&B",
  "Pop",
  "EDM",
  "House",
  "Techno",
  "Lo-Fi",
  "Drill",
  "Afrobeats",
  "Latin",
  "Rock",
  "Jazz",
  "Classical",
  "Other",
];

export const SamplePackUploadModal = ({
  isOpen,
  onClose,
  onSuccess,
}: SamplePackUploadModalProps) => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState("");
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleFile[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle cover art selection
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file for cover art");
        return;
      }
      setCoverArt(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Handle sample files selection
  const handleSamplesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg"];
    const maxSize = 50 * 1024 * 1024; // 50MB per file

    const validFiles = files.filter((file) => {
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|aac|ogg)$/i)) {
        return false;
      }
      if (file.size > maxSize) {
        return false;
      }
      return true;
    });

    const newSamples: SampleFile[] = validFiles.map((file) => ({
      file,
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      category: "Other",
    }));

    setSamples((prev) => [...prev, ...newSamples]);
  };

  // Update sample name
  const updateSampleName = (index: number, name: string) => {
    setSamples((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name } : s))
    );
  };

  // Update sample category
  const updateSampleCategory = (index: number, category: string) => {
    setSamples((prev) =>
      prev.map((s, i) => (i === index ? { ...s, category } : s))
    );
  };

  // Remove sample
  const removeSample = (index: number) => {
    setSamples((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError("Please enter a pack title");
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      setError("Please enter a valid price");
      return;
    }
    if (samples.length === 0) {
      setError("Please add at least one sample to your pack");
      return;
    }
    if (!token) {
      setError("Please sign in to upload sample packs");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("price", price);
      formData.append("genre", genre);
      formData.append("tags", tags);
      formData.append("sample_count", samples.length.toString());

      // Add sample metadata
      const sampleMetadata = samples.map((s) => ({
        name: s.name,
        category: s.category,
      }));
      formData.append("sample_metadata", JSON.stringify(sampleMetadata));

      // Add cover art if provided
      if (coverArt) {
        formData.append("cover", coverArt);
      }

      // Add sample files
      samples.forEach((sample, index) => {
        formData.append(`sample_${index}`, sample.file);
      });

      // Upload with XHR for progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setSuccess(true);
          setTimeout(() => {
            onSuccess?.();
            resetForm();
          }, 1500);
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            setError(response.error || "Upload failed. Please try again.");
          } catch {
            setError("Upload failed. Please try again.");
          }
        }
        setUploading(false);
      });

      xhr.addEventListener("error", () => {
        setError("Network error. Please check your connection and try again.");
        setUploading(false);
      });

      xhr.open("POST", `${API_URL}/api/marketplace/sample-packs`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      console.error("Upload error:", err);
      setError("An unexpected error occurred. Please try again.");
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setGenre("");
    setTags("");
    setCoverArt(null);
    setCoverPreview(null);
    setSamples([]);
    setUploadProgress(0);
    setSuccess(false);
    setError(null);
  };

  // Calculate total file size
  const totalSize = samples.reduce((acc, s) => acc + s.file.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[var(--replay-elevated)] rounded-3xl border border-[var(--replay-border)] overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--replay-border)]">
          <div className="flex items-center gap-3">
            <Package className="text-purple-400" size={24} />
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">
              Create Sample Pack
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            disabled={uploading}
          >
            <X size={20} className="text-[var(--replay-mid-grey)]" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-green-400" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-[var(--replay-off-white)] mb-2">
              Sample Pack Uploaded!
            </h3>
            <p className="text-[var(--replay-mid-grey)]">
              Your sample pack is now listed on the marketplace.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Cover Art & Basic Info */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Art */}
              <div className="flex-shrink-0">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-2 border-dashed border-[var(--replay-border)] hover:border-purple-500/50 transition-colors overflow-hidden flex items-center justify-center bg-[var(--replay-dark-grey)]"
                >
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Image className="mx-auto text-[var(--replay-mid-grey)] mb-2" size={32} />
                      <span className="text-xs text-[var(--replay-mid-grey)]">
                        Add Cover Art
                      </span>
                    </div>
                  )}
                </button>
              </div>

              {/* Title & Price */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                    Pack Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Midnight Trap Kit Vol. 1"
                    className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    disabled={uploading}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                      Price (USD) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                      Genre
                    </label>
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                      disabled={uploading}
                    >
                      <option value="">Select genre</option>
                      {GENRES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your sample pack..."
                rows={3}
                className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                disabled={uploading}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                <Tag className="inline mr-2" size={16} />
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., dark, hard, 808, ambient"
                className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                disabled={uploading}
              />
            </div>

            {/* Sample Files */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-[var(--replay-off-white)]">
                  <FileAudio className="inline mr-2" size={16} />
                  Samples ({samples.length} files, {formatSize(totalSize)})
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.flac,.aac,.ogg,audio/*"
                  multiple
                  onChange={handleSamplesSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl text-sm font-semibold transition-colors"
                  disabled={uploading}
                >
                  <Plus size={16} />
                  Add Samples
                </button>
              </div>

              {/* Sample List */}
              {samples.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--replay-border)] rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer"
                >
                  <Music className="mx-auto text-[var(--replay-mid-grey)] mb-3" size={40} />
                  <p className="text-[var(--replay-mid-grey)] mb-1">
                    Drop your samples here or click to browse
                  </p>
                  <p className="text-xs text-[var(--replay-mid-grey)]/60">
                    MP3, WAV, FLAC, AAC, OGG (max 50MB each)
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {samples.map((sample, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-[var(--replay-dark-grey)] rounded-xl border border-[var(--replay-border)]"
                    >
                      <FileAudio className="text-purple-400 flex-shrink-0" size={20} />
                      <input
                        type="text"
                        value={sample.name}
                        onChange={(e) => updateSampleName(index, e.target.value)}
                        className="flex-1 min-w-0 px-3 py-1.5 bg-[var(--replay-elevated)] border border-[var(--replay-border)] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                        disabled={uploading}
                      />
                      <select
                        value={sample.category}
                        onChange={(e) => updateSampleCategory(index, e.target.value)}
                        className="px-3 py-1.5 bg-[var(--replay-elevated)] border border-[var(--replay-border)] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                        disabled={uploading}
                      >
                        {SAMPLE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <span className="text-xs text-[var(--replay-mid-grey)] whitespace-nowrap">
                        {formatSize(sample.file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSample(index)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                        disabled={uploading}
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--replay-mid-grey)]">Uploading...</span>
                  <span className="text-purple-400 font-semibold">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-[var(--replay-dark-grey)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || samples.length === 0}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Uploading Pack...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Create Sample Pack ({samples.length} samples)
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
