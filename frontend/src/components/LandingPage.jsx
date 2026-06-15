import { Scale, Mic, ShieldAlert, FileText, Volume2, Lock, ArrowRight } from "lucide-react";

export default function LandingPage({ onGetStarted }) {
  
  const features = [
    {
      icon: <Mic className="w-6 h-6 text-indigo-400" />,
      title: "Intelligent Voice Intake",
      description: "Speak naturally in Hindi, English, or Hinglish. Browser-native recognition transcribes your testimony in real-time with zero lag.",
      bg: "bg-indigo-500/5 border-indigo-500/10"
    },
    {
      icon: <Scale className="w-6 h-6 text-purple-400" />,
      title: "IPC Section Classifier",
      description: "Our multilingual ML pipeline maps your statement to relevant Indian Penal Code sections (e.g. IPC 302, 379, 420) instantly.",
      bg: "bg-purple-500/5 border-purple-500/10"
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-pink-400" />,
      title: "Dynamic Severity Check",
      description: "Automatically analyzes threat indicators (e.g., weapons, minors, dwelling trespass) to calculate case severity level.",
      bg: "bg-pink-500/5 border-pink-500/10"
    },
    {
      icon: <FileText className="w-6 h-6 text-emerald-400" />,
      title: "Structured FIR Drafts",
      description: "Generates a formal, structured brief containing suspect details, location, time, and incident summaries ready for the police desk.",
      bg: "bg-emerald-500/5 border-emerald-500/10"
    },
    {
      icon: <Volume2 className="w-6 h-6 text-amber-400" />,
      title: "Vocalized Legal Remedies",
      description: "TTS engine converts recommended legal actions and emergency contacts into clear audio playback to guide you offline.",
      bg: "bg-amber-500/5 border-amber-500/10"
    },
    {
      icon: <Lock className="w-6 h-6 text-cyan-400" />,
      title: "Secure Case Archive",
      description: "Maintains a secure, private registry of all your filings protected by JWT credentials. Access your history anytime.",
      bg: "bg-cyan-500/5 border-cyan-500/10"
    }
  ];

  return (
    <div className="relative overflow-hidden bg-slate-950 min-h-screen text-white">
      
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] rounded-full bg-pink-600/5 blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative z-10">
        
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 border border-slate-800 text-indigo-400 uppercase tracking-widest mb-8 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          AI-Powered Intakes & Jurisprudence
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
          Smart Legal Solutions <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            for a Faster Path to Justice
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
          Transform complex verbal reports into structured, jurisdictionally accurate case briefs with real-time classification, emergency remedies, and secure tracking.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold px-8 py-4 rounded-xl text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all duration-200 uppercase tracking-wider"
          >
            View Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </section>

      {/* Grid Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-white mb-4">Everything You Need to Succeed</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Our AI Legal System gives you the tools, insights, and structural formatting to draft FIR briefs and find statutory remedies instantly.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl border backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${feature.bg}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900/60 flex items-center justify-center border border-slate-800/80 mb-6 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-lg font-black text-white mb-3">{feature.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{feature.description}</p>
            </div>
          ))}
        </div>

      </section>

      {/* Bottom CTA Banner (Inspired by screenshot purple banner) */}
      <section className="max-w-6xl mx-auto px-4 py-16 relative z-10">
        <div className="rounded-[32px] overflow-hidden bg-gradient-to-r from-purple-800 via-indigo-700 to-purple-800 p-10 sm:p-16 text-center relative shadow-2xl">
          
          {/* Overlay glow */}
          <div className="absolute inset-0 bg-slate-950/10 pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 relative z-10">
            Ready to Resolve Your Legal Issues?
          </h2>
          <p className="text-sm text-purple-100 max-w-xl mx-auto mb-8 relative z-10 font-medium">
            Join thousands of users who have streamlined their legal filings and case drafts using our voice-driven AI jurisprudence assistant.
          </p>

          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-950 font-black px-8 py-4 rounded-full text-sm transition-all duration-200 uppercase tracking-wider relative z-10 shadow-lg"
          >
            Start Your Journey Now
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </section>

    </div>
  );
}
