import { useState } from "react";
import { X, Mail, Lock, User, ArrowRight } from "lucide-react";
import { login, register } from "../lib/api";

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const data = await login(email, password);
        onAuthSuccess(data.token, data.user);
      } else {
        const data = await register(email, password, fullName);
        onAuthSuccess(data.token, data.user);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Glassmorphic Container */}
      <div className="relative w-full max-w-md overflow-hidden bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.2)] p-8">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-150"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative Badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
            {mode === "login" ? "Welcome Back" : "Get Started Free"}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-center text-white mb-2">
          {mode === "login" ? "Sign in to ALS" : "Create your account"}
        </h2>
        <p className="text-xs text-center text-slate-400 mb-6">
          {mode === "login" 
            ? "Access your dashboard and legal report history." 
            : "Register to begin voice complaints and IPC analysis."}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors duration-200"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider mt-6"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Decorative Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
          <span className="relative bg-slate-900 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">or continue with</span>
        </div>

        {/* Decorative Google Button */}
        <button 
          onClick={() => alert("Google Single Sign-On is disabled in demo mode. Please use email registration.")}
          className="w-full border border-slate-800 hover:bg-slate-800/40 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-colors duration-150"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </button>

        {/* Toggle Mode */}
        <div className="text-center mt-6 text-xs">
          <span className="text-slate-400">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>

      </div>
    </div>
  );
}
