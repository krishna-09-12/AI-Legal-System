import { useState } from "react";
import FIRForm from "./components/FIRForm";
import History from "./components/History";

function App() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewReport = (report) => {
    // Bump refresh trigger to tell History component to re-fetch MongoDB
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
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
          
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
              Secure Cloud Processing (IPC)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow py-6">
        {/* Core FIR voice form */}
        <FIRForm onNewReport={handleNewReport} selectedReport={selectedReport} />

        {/* History registry log */}
        <History onSelectReport={setSelectedReport} refreshTrigger={refreshTrigger} />
      </main>

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