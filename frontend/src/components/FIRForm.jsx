import { useState, useRef, useEffect } from "react";
import { predictIPC, transcribeAudio, textToSpeech } from "../lib/api";
import { 
  Mic, MicOff, Play, Pause, Square, Shield, 
  FileText, CheckCircle, MapPin, User, Clock, Volume2, 
  ArrowRight, Activity, Loader2
} from "lucide-react";

export default function FIRForm({ onNewReport, selectedReport, globalTaskActive, setGlobalTaskActive }) {
  const [text, setText] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("en"); // "en" or "hi"

  // Sync with externally selected report from history
  useEffect(() => {
    if (selectedReport) {
      setReport(selectedReport);
      setText(selectedReport.input_text || selectedReport.text || "");
    }
  }, [selectedReport]);
  
  // Audio Player state
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // MediaRecorder refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  
  // Browser Speech Recognition refs & state
  const recognitionRef = useRef(null);
  const [isBrowserSpeechSupported, setIsBrowserSpeechSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsBrowserSpeechSupported(true);
    }
  }, []);

  // Stop audio playback when a new report is generated
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setAudioUrl(null);
  }, [report]);

  // Handle Voice Recording Toggle
  const startRecording = async () => {
    // Primary: Browser-based Speech Recognition (free, fast, no server dependency)
    if (isBrowserSpeechSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

      recognition.onresult = (event) => {
        let resultText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            resultText += event.results[i][0].transcript;
          }
        }
        if (resultText) {
          setText((prev) => (prev ? `${prev.trim()} ${resultText.trim()}` : resultText.trim()));
        }
      };

      recognition.onerror = (err) => {
        console.error("Speech Recognition Error:", err);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
      return;
    }

    // Fallback: MediaRecorder upload to backend (requires server-side Whisper or FFmpeg setup)
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone permission denied or not supported.");
    }
  };

  const stopRecording = () => {
    if (isBrowserSpeechSupported && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload Audio to Whisper
  const handleAudioUpload = async (audioBlob) => {
    try {
      setTranscribing(true);
      if (setGlobalTaskActive) setGlobalTaskActive(true);
      const transcript = await transcribeAudio(audioBlob);
      if (transcript) {
        // Append or replace text
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    } catch (err) {
      console.error("Transcription error:", err);
      alert(err.response?.data?.detail || "Speech-to-Text failed. Try typing your complaint manually.");
    } finally {
      setTranscribing(false);
      if (setGlobalTaskActive) setGlobalTaskActive(false);
    }
  };

  // Analyze complaint (predict + generate report)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert("Please enter incident details or record your voice.");
      return;
    }

    try {
      setLoading(true);
      if (setGlobalTaskActive) setGlobalTaskActive(true);
      const data = await predictIPC(text);
      setReport(data);
      if (onNewReport) {
        onNewReport(data);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      alert("Failed to analyze complaint. Please check your backend connection.");
    } finally {
      setLoading(false);
      if (setGlobalTaskActive) setGlobalTaskActive(false);
    }
  };

  // Trigger Text-to-Speech (gTTS)
  const handleListenReport = async () => {
    if (!report) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    try {
      setAudioLoading(true);
      if (setGlobalTaskActive) setGlobalTaskActive(true);
      
      // Construct the text content to read aloud
      // Read main category, severity, summary, and action plan items
      const actionsText = report.suggested_actions?.join(". ") || "";
      const speakText = `Complaint Category: ${report.category}. Severity: ${report.severity_level}. Summary: ${report.report_summary}. Action steps: ${actionsText}`;
      
      const url = await textToSpeech(speakText, language);
      setAudioUrl(url);
      
      // Initialize audio element
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("TTS error:", err);
      alert("Failed to synthesize speech. Please try again.");
    } finally {
      setAudioLoading(false);
      if (setGlobalTaskActive) setGlobalTaskActive(false);
    }
  };

  // Stop audio synthesis
  const handleStopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Clear Form state
  const handleClear = () => {
    setText("");
    setReport(null);
  };

  // Severity color selectors
  const getSeverityStyles = (level) => {
    switch (level?.toLowerCase()) {
      case "high":
        return {
          bg: "bg-red-950/40 border-red-500/30 text-red-300",
          badge: "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]",
          glow: "border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.15)]",
        };
      case "medium":
        return {
          bg: "bg-amber-950/40 border-amber-500/30 text-amber-300",
          badge: "bg-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.5)]",
          glow: "border-amber-500/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]",
        };
      case "low":
        return {
          bg: "bg-emerald-950/40 border-emerald-500/30 text-emerald-300",
          badge: "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
          glow: "border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.15)]",
        };
      default:
        return {
          bg: "bg-slate-900/40 border-slate-700/30 text-slate-300",
          badge: "bg-slate-500 text-white",
          glow: "border-slate-700/20",
        };
    }
  };

  const severity = getSeverityStyles(report?.severity_level);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto p-4 md:p-8">
      
      {/* LEFT COLUMN: Input Control Panel */}
      <div className="lg:col-span-5 glass p-6 md:p-8 rounded-3xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
        
        {/* Glow effect decorative */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Record Complaint</h2>
            <p className="text-xs text-slate-400">Describe incident using voice or text</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Voice Input Panel */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800/80 relative">
            
            {/* Glowing active state circle */}
            <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none ${isRecording ? 'bg-indigo-500/5 border border-indigo-500/30' : 'opacity-0'}`} />

            {/* Soundwave representation */}
            <div className="h-12 flex items-center justify-center mb-4">
              {isRecording ? (
                <div className="soundwave">
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                </div>
              ) : transcribing ? (
                <div className="flex items-center gap-2 text-indigo-400 text-sm animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing speech with Whisper...</span>
                </div>
              ) : (
                <span className="text-sm text-slate-500 font-medium">Microphone ready</span>
              )}
            </div>

            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={transcribing || loading || globalTaskActive}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                isRecording 
                  ? "bg-red-500 text-white mic-pulse shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              } disabled:opacity-50`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isRecording ? "Click to Stop Recording" : "Press to Speak (Whisper)"}
            </span>
          </div>

          {/* Textarea for transcript editing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-300">Complaint Details</label>
              <button 
                type="button" 
                onClick={handleClear}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                Clear
              </button>
            </div>
            <textarea
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl p-4 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-600 disabled:opacity-50"
              rows="6"
              placeholder="Your transcribed text will appear here. You can also edit it or type manually if you prefer..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={globalTaskActive}
            />
          </div>

          {/* Language Selector for TTS playback */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/30 rounded-xl border border-slate-800/60">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Voice Assistance Language</span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  language === "en" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  language === "hi" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Hindi / हिन्दी
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || transcribing || !text.trim() || globalTaskActive}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.35)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Running Legal Analytics...</span>
              </>
            ) : (
              <>
                <span>Generate Legal Report</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: AI Report Generator Output */}
      <div className="lg:col-span-7 space-y-6">
        
        {report ? (
          <div className={`glass rounded-3xl border p-6 md:p-8 relative overflow-hidden transition-all duration-500 rainbow-hover ${severity.glow}`}>
            
            {/* Header Details */}
            <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>Complaint reference dossier</span>
                </div>
                <h3 className="text-2xl font-black text-white">{report.complaint_id}</h3>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest uppercase flex items-center gap-1.5 ${severity.badge}`}>
                <Activity className="w-3.5 h-3.5" />
                <span>{report.severity_level} Severity</span>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-b border-slate-800/80 text-sm">
              <div className="flex items-center gap-3 bg-slate-900/20 p-3 rounded-xl border border-slate-800/40">
                <Clock className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Incident Timing</p>
                  <p className="font-bold text-slate-200">{report.incident_time}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-900/20 p-3 rounded-xl border border-slate-800/40">
                <MapPin className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Primary Location</p>
                  <p className="font-bold text-slate-200">{report.incident_location}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-900/20 p-3 rounded-xl border border-slate-800/40">
                <User className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Accused / Suspect</p>
                  <p className="font-bold text-slate-200">{report.suspect_details}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-900/20 p-3 rounded-xl border border-slate-800/40">
                <User className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Impacted Victim</p>
                  <p className="font-bold text-slate-200">{report.victim_details}</p>
                </div>
              </div>
            </div>

            {/* Predictions & Classification */}
            <div className="py-6 border-b border-slate-800/80 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Classification & Jurisdiction</h4>
                <span className="text-xs bg-indigo-500/10 text-indigo-300 font-bold px-2.5 py-1 border border-indigo-500/20 rounded-lg">
                  {report.category}
                </span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 text-sm">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-200">Applicable Statutes:</p>
                    <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{report.ipc_sections}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="py-6 border-b border-slate-800/80 space-y-3">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Formal Report Synthesis</h4>
              <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/30 p-4 rounded-2xl border border-slate-900 font-medium">
                {report.report_summary}
              </p>
            </div>

            {/* Suggested Legal Action Plan */}
            <div className="py-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Emergency Action Protocol</h4>
              <div className="space-y-3">
                {report.suggested_actions?.map((action, idx) => (
                  <div key={idx} className="flex gap-3 text-sm items-start p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 font-semibold">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Read Aloud Control Card */}
            <div className="mt-6 flex flex-wrap gap-4 items-center justify-between p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AI Legal System Voice Readout</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleListenReport}
                  disabled={audioLoading || globalTaskActive}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                    isPlaying 
                      ? "bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                  } disabled:opacity-50`}
                >
                  {audioLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Generating Voice...</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Speak Report</span>
                    </>
                  )}
                </button>

                {isPlaying && (
                  <button
                    type="button"
                    onClick={handleStopSpeech}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="glass rounded-3xl border border-dashed border-slate-800 p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 mb-4">
              <Scale className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Legal Analytics Panel</h3>
            <p className="text-slate-500 text-sm max-w-sm mt-2 leading-relaxed">
              Once you submit an incident, the artificial intelligence engine will automatically generate a structured, certified legal advisory report.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// Icon fallbacks if needed
function Scale(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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