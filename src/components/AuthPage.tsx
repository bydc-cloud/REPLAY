import { useState } from "react";
import { Play, Eye, EyeOff, ArrowLeft, Music, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface AuthPageProps {
  onBack: () => void;
  initialMode?: "signin" | "signup";
}

export const AuthPage = ({ onBack, initialMode = "signup" }: AuthPageProps) => {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signUp, signIn, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      if (mode === "signup") {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    clearError();
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-[var(--replay-black)] flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#000000]" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/3 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 md:py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">REPLAY</span>
        </div>

        <div className="w-20" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                <Music className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-black text-white text-center mb-2">
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-white/50 text-center mb-8">
              {mode === "signup"
                ? "Start organizing your music collection"
                : "Sign in to access your library"}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors pr-12"
                    placeholder={mode === "signup" ? "Min. 6 characters" : "Enter password"}
                    required
                    minLength={mode === "signup" ? 6 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {mode === "signup" ? "Creating Account..." : "Signing In..."}
                  </>
                ) : (
                  mode === "signup" ? "Create Account" : "Sign In"
                )}
              </button>
            </form>

            {/* Switch Mode */}
            <p className="text-center text-white/50 mt-6">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={switchMode}
                    className="text-white hover:text-white/80 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={switchMode}
                    className="text-white hover:text-white/80 font-medium transition-colors"
                  >
                    Create One
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-white/30 text-sm mt-6">
            Your data is stored locally in your browser.
            <br />
            No server, no tracking, complete privacy.
          </p>
        </div>
      </div>
    </div>
  );
};
