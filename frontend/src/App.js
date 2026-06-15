import { useState, useEffect } from "react";
import FIRForm from "./components/FIRForm";
import History from "./components/History";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import ProfileModal from "./components/ProfileModal";
import { LogOut, User as UserIcon, Sun, Moon, Menu, X } from "lucide-react";
import { getMe } from "./lib/api";

function App() {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // New global states
  const [theme, setTheme] = useState(localStorage.getItem("als_theme") || "dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalTaskActive, setGlobalTaskActive] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("als_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  // Load user profile on startup if token exists
  useEffect(() => {
    const token = localStorage.getItem("als_auth_token");
    if (token) {
      getMe()
        .then((data) => {
          setUser(data);
        })
        .catch(() => {
          // Clean up stale or expired tokens
          localStorage.removeItem("als_auth_token");
          setUser(null);
        });
    }
  }, []);

  const handleNewReport = (report) => {
    // Bump refresh trigger to tell History component to re-fetch complaints
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAuthSuccess = (token, userInfo) => {
    localStorage.setItem("als_auth_token", token);
    setUser(userInfo);
    setIsAuthOpen(false);
    // Reload history log for the newly authenticated user
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem("als_auth_token");
    setUser(null);
    setSelectedReport(null);
    // Reload history log (reverts to guest history)
    setRefreshTrigger((prev) => prev + 1);
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu when opening auth
  };

  const handleProfileOpen = () => {
    setIsProfileOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu when opening profile
  };

  const handleLogoutAction = () => {
    handleLogout();
    setIsMobileMenuOpen(false); // Close mobile menu on logout
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-white">
      
      {/* Premium Header */}
      <header className="border-b border-slate-900/80 bg-slate-950/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <ScaleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase sm:text-xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI Legal System</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                AI Voice Complaint & Jurisdiction Assistant
              </p>
            </div>
          </div>
          
          {/* Header Action Controls - Desktop */}
          <div className="hidden md:flex items-center gap-4 font-bold uppercase tracking-wider text-xs">
            <button
              onClick={toggleTheme}
              disabled={globalTaskActive}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors disabled:opacity-50"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleProfileOpen}
                  disabled={globalTaskActive}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors duration-150 disabled:opacity-50"
                  title="Click to edit profile settings"
                >
                  <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline font-semibold truncate max-w-[150px]">{user.full_name}</span>
                </button>
                <button
                  onClick={handleLogoutAction}
                  disabled={globalTaskActive}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-850 hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openAuth("login")}
                  disabled={globalTaskActive}
                  className="text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  Sign in
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  disabled={globalTaskActive}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/10 disabled:opacity-50"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              disabled={globalTaskActive}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-50"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              disabled={globalTaskActive}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-50"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sidebar/Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl absolute w-full left-0 top-full shadow-2xl">
            <div className="flex flex-col p-4 gap-3 font-bold uppercase tracking-wider text-xs">
              {user ? (
                <>
                  <button
                    onClick={handleProfileOpen}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 w-full"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{user.full_name} Profile</span>
                  </button>
                  <button
                    onClick={handleLogoutAction}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-800 text-rose-400 hover:bg-rose-500/10 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuth("login")}
                    className="p-3 rounded-xl border border-slate-800 text-slate-300 w-full"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => openAuth("signup")}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-xl w-full shadow-lg shadow-indigo-600/10"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {user ? (
          <div className="py-6 animate-in fade-in duration-300">
            {/* Core FIR voice form */}
            <FIRForm 
              onNewReport={handleNewReport} 
              selectedReport={selectedReport} 
              globalTaskActive={globalTaskActive}
              setGlobalTaskActive={setGlobalTaskActive}
            />

            {/* History registry log */}
            <History 
              onSelectReport={setSelectedReport} 
              refreshTrigger={refreshTrigger}
              globalTaskActive={globalTaskActive}
              setGlobalTaskActive={setGlobalTaskActive}
            />
          </div>
        ) : (
          <LandingPage onGetStarted={() => openAuth("signup")} />
        )}
      </main>

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Profile Modal Overlay */}
      {user && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onUpdateSuccess={(token, updatedUser) => {
            localStorage.setItem("als_auth_token", token);
            setUser(updatedUser);
          }}
        />
      )}

      {/* Premium Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950/40 py-6 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 AI Legal System. Developed under the Indian Penal Code Jurisprudence. All rights reserved.</p>
        </div>
      </footer>
      
    </div>
  );
}

function ScaleIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m16 16 3-8 3 8c-.1.3-.3.5-.6.5h-4.8c-.3 0-.5-.2-.6-.5z" />
      <path d="m2 16 3-8 3 8c-.1.3-.3.5-.6.5H2.6c-.3 0-.5-.2-.6-.5z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h18" />
    </svg>
  );
}

export default App;