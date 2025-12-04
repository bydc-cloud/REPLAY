import { useState, useRef, useCallback } from 'react';
import {
  X, Upload, Music, Image, Loader2, Globe, Lock, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

interface TrackUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (trackId: string) => void;
}

interface UploadProgress {
  stage: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export function TrackUploadModal({ isOpen, onClose, onSuccess }: TrackUploadModalProps) {
  const { token, isAuthenticated } = useAuth();

  // File state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Metadata state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [musicalKey, setMusicalKey] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState('');

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: 'idle',
    progress: 0,
    message: '',
  });

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Handle audio file selection
  const handleAudioSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/flac', 'audio/aac', 'audio/ogg'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)) {
        setUploadProgress({
          stage: 'error',
          progress: 0,
          message: 'Please select a valid audio file (MP3, WAV, FLAC, AAC, OGG)',
        });
        return;
      }

      setAudioFile(file);

      // Extract title from filename if not set
      if (!title) {
        const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setTitle(name);
      }

      setUploadProgress({ stage: 'idle', progress: 0, message: '' });
    }
  }, [title]);

  // Handle cover file selection
  const handleCoverSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadProgress({
          stage: 'error',
          progress: 0,
          message: 'Please select a valid image file',
        });
        return;
      }

      setCoverFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setUploadProgress({ stage: 'idle', progress: 0, message: '' });
    }
  }, []);

  // Handle upload
  const handleUpload = async () => {
    if (!audioFile || !token || !isAuthenticated) return;

    setUploadProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Preparing upload...',
    });

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (coverFile) {
        formData.append('cover', coverFile);
      }
      formData.append('title', title || audioFile.name);
      formData.append('artist', artist);
      formData.append('genre', genre);
      if (bpm) formData.append('bpm', bpm);
      if (musicalKey) formData.append('musical_key', musicalKey);
      formData.append('is_public', String(isPublic));
      if (description) formData.append('description', description);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress({
            stage: 'uploading',
            progress: percent,
            message: `Uploading... ${percent}%`,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          setUploadProgress({
            stage: 'complete',
            progress: 100,
            message: 'Upload complete!',
          });

          // Wait a moment then close
          setTimeout(() => {
            onSuccess?.(response.id);
            handleClose();
          }, 1500);
        } else {
          let errorMessage = 'Upload failed';
          try {
            const error = JSON.parse(xhr.responseText);
            errorMessage = error.error || errorMessage;
          } catch {
            // Use default message
          }
          setUploadProgress({
            stage: 'error',
            progress: 0,
            message: errorMessage,
          });
        }
      });

      xhr.addEventListener('error', () => {
        setUploadProgress({
          stage: 'error',
          progress: 0,
          message: 'Network error. Please try again.',
        });
      });

      xhr.open('POST', `${API_URL}/api/tracks/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (err) {
      console.error('Upload error:', err);
      setUploadProgress({
        stage: 'error',
        progress: 0,
        message: 'Upload failed. Please try again.',
      });
    }
  };

  // Reset and close
  const handleClose = () => {
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setTitle('');
    setArtist('');
    setGenre('');
    setBpm('');
    setMusicalKey('');
    setIsPublic(true);
    setDescription('');
    setUploadProgress({ stage: 'idle', progress: 0, message: '' });
    onClose();
  };

  // Genre options
  const genres = [
    'Hip Hop', 'Trap', 'R&B', 'Pop', 'Electronic', 'House', 'Techno',
    'Dubstep', 'Drum & Bass', 'Lo-Fi', 'Jazz', 'Soul', 'Rock', 'Indie',
    'Ambient', 'Classical', 'World', 'Latin', 'Reggae', 'Other'
  ];

  // Key options
  const musicalKeys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ];

  if (!isOpen) return null;

  const isUploading = uploadProgress.stage === 'uploading' || uploadProgress.stage === 'processing';
  const canUpload = audioFile && !isUploading && uploadProgress.stage !== 'complete';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Upload Track</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Progress */}
          {uploadProgress.stage !== 'idle' && (
            <div className={`p-4 rounded-xl ${
              uploadProgress.stage === 'error' ? 'bg-red-500/20 border border-red-500/30' :
              uploadProgress.stage === 'complete' ? 'bg-green-500/20 border border-green-500/30' :
              'bg-purple-500/20 border border-purple-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {uploadProgress.stage === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                )}
                {uploadProgress.stage === 'complete' && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {uploadProgress.stage === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`text-sm ${
                  uploadProgress.stage === 'error' ? 'text-red-300' :
                  uploadProgress.stage === 'complete' ? 'text-green-300' :
                  'text-purple-300'
                }`}>
                  {uploadProgress.message}
                </span>
              </div>

              {uploadProgress.stage === 'uploading' && (
                <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* File Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Audio File */}
            <div
              onClick={() => audioInputRef.current?.click()}
              className={`relative p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                audioFile
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }`}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                className="hidden"
              />
              <div className="text-center">
                <Music className={`w-10 h-10 mx-auto mb-3 ${
                  audioFile ? 'text-purple-400' : 'text-white/40'
                }`} />
                {audioFile ? (
                  <>
                    <p className="text-sm font-medium text-white truncate">{audioFile.name}</p>
                    <p className="text-xs text-white/60 mt-1">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-white">Drop audio file here</p>
                    <p className="text-xs text-white/60 mt-1">MP3, WAV, FLAC, AAC, OGG</p>
                  </>
                )}
              </div>
            </div>

            {/* Cover Art */}
            <div
              onClick={() => coverInputRef.current?.click()}
              className={`relative p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
                coverFile
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }`}
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
              ) : null}
              <div className="relative text-center">
                <Image className={`w-10 h-10 mx-auto mb-3 ${
                  coverFile ? 'text-purple-400' : 'text-white/40'
                }`} />
                {coverFile ? (
                  <p className="text-sm font-medium text-white truncate">{coverFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-white">Add cover art</p>
                    <p className="text-xs text-white/60 mt-1">Optional - JPG, PNG</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Track title"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Artist */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Artist</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Genre & BPM */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1a1a1a]">Select genre</option>
                  {genres.map((g) => (
                    <option key={g} value={g} className="bg-[#1a1a1a]">{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="e.g. 120"
                  min="1"
                  max="300"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            {/* Key */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Musical Key</label>
              <select
                value={musicalKey}
                onChange={(e) => setMusicalKey(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#1a1a1a]">Select key</option>
                {musicalKeys.map((k) => (
                  <option key={k} value={k} className="bg-[#1a1a1a]">{k}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about this track..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-400" />
                ) : (
                  <Lock className="w-5 h-5 text-yellow-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {isPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs text-white/60">
                    {isPublic
                      ? 'Anyone can discover and listen to this track'
                      : 'Only you can see this track'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isPublic ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isPublic ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!canUpload}
            className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : uploadProgress.stage === 'complete' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Complete!
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Track
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrackUploadModal;
