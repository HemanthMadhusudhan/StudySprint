import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, FileText, Play, Volume2, X, ChevronRight,
  Sparkles, Check, XCircle, Zap, ShieldAlert, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStudyContent, chatWithContext } from './services/ai';
import { readFileAsText } from './services/pdf';
import { AppState, StudySession, ChatMessage, Question, QuestionType } from './types';
import Scene3D from './components/Scene3D';
import TelemetryLoading from './components/TelemetryLoading';
import FloatingBot from './components/FloatingBot';

// --- Types ---
interface ExtendedAppState extends AppState {
  currentPage: 'home' | 'document-analyzer' | 'search-chat';
  searchQuery: string;
  searchChatHistory: ChatMessage[];
}

// --- Navbar Component ---
const Navbar: React.FC<{ currentPage: string, onNavigate: (page: string) => void }> = ({ currentPage, onNavigate }) => (
  <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-xl border-b border-red-500/20 px-4 md:px-8 py-4 flex justify-between items-center transition-all duration-300 pointer-events-auto">
    <div className="flex items-center cursor-pointer group gap-0" onClick={() => onNavigate('home')}>
      <div className="relative flex items-center mr-4">
        {/* Speed Stripes */}
        <div className="absolute -left-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="w-3 h-0.5 bg-red-600 rounded-full" />
          <div className="w-5 h-0.5 bg-red-600 rounded-full" />
          <div className="w-2 h-0.5 bg-red-600 rounded-full" />
        </div>

        {/* Tech Icon Container */}
        <motion.div
          whileHover={{ scale: 1.1, skewX: -20 }}
          className="p-1.5 bg-red-600 rounded-[2px] skew-x-[-15deg] shadow-[0_0_20px_rgba(255,40,0,0.4)] z-10"
        >
          <Zap size={18} className="text-white fill-white" />
        </motion.div>
      </div>

      {/* Formal F1 Typography */}
      <h1 className="flex items-center font-black italic tracking-tighter uppercase text-white leading-none overflow-hidden" style={{ fontFamily: 'Orbitron', fontSize: '22px' }}>
        <span className="relative z-10">STUDY</span>
        <span className="text-red-600 ml-1 relative group-hover:translate-x-1 transition-transform duration-300">
          SPRINT
          {/* Subtle Speed Trail under SPRINT */}
          <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-red-600/30 skew-x-[-30deg]" />
        </span>
      </h1>
    </div>
    <div className="flex bg-black/50 p-1 rounded-sm border border-gray-800 skew-x-[-10deg]">
      <button
        onClick={() => onNavigate('home')}
        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest skew-x-[10deg] transition-all ${currentPage === 'home' || currentPage === 'search-chat' ? 'text-white bg-red-600' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
      >
        Home
      </button>
      <button
        onClick={() => onNavigate('document-analyzer')}
        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest skew-x-[10deg] transition-all ${currentPage === 'document-analyzer' ? 'text-white bg-red-600' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
      >
        Analyzer
      </button>
    </div>
  </nav>
);

// --- Home Page (Pit-Stop) ---
const HomePage: React.FC<{
  state: ExtendedAppState,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onNavigate: (page: string) => void,
  onSearch: (query: string) => void
}> = ({ state, fileInputRef, handleFileUpload, onNavigate, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center pt-16 pb-6 px-4 overflow-hidden z-10 w-full glass-card border-none bg-transparent">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 mix-blend-screen mix-blend-luminosity">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 scale-[1.2] object-cover"
        >
          <source src="/car.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay" />
      </div>

      {/* Intro Overlay covering everything until animation finishes */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: "-100%" }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
        className="fixed inset-0 z-50 bg-red-600 flex items-center justify-center pointer-events-none"
      >
        <div className="text-8xl font-black italic text-black/20 uppercase tracking-tighter">SPRINT</div>
      </motion.div>

      <div className="max-w-4xl w-full mx-auto space-y-8">
        <div className="text-center space-y-2">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white"
          >
            Knowledge at <span className="racing-gradient-text drop-shadow-[0_0_15px_rgba(255,40,0,0.5)]">Racing Speed</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            className="text-gray-400 max-w-xl mx-auto text-base"
          >
            Upload your documents. Our F1-grade AI processes them instantly to deliver high-performance summaries and lap-time insights.
          </motion.p>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto bg-red-950/50 border border-red-500/50 rounded-xl p-4 flex items-start gap-4 shadow-[0_0_20px_rgba(255,0,0,0.2)]"
            >
              <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={24} />
              <div className="text-left">
                <h4 className="text-red-500 font-bold uppercase tracking-widest text-sm mb-1">Telemetry Failure</h4>
                <p className="text-red-200 font-mono text-sm leading-relaxed">{state.error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar / Direct Ask */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative flex items-center bg-black/60 border border-gray-700 p-2 rounded-lg shadow-2xl focus-within:border-red-500/50 focus-within:shadow-[0_0_30px_rgba(255,40,0,0.15)] transition-all skew-x-[-5deg]">
            <Cpu size={24} className="text-gray-500 ml-4 skew-x-[5deg]" />
            <input
              type="text"
              placeholder="Ask the AI telemetry system..."
              className="flex-1 bg-transparent border-none text-white px-4 py-3 outline-none font-mono text-sm placeholder-gray-600 skew-x-[5deg]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            />
            <button
              onClick={handleSearchSubmit}
              disabled={!searchQuery.trim()}
              className="bg-white hover:bg-gray-200 text-black px-6 py-3 font-bold uppercase italic tracking-wider transition-colors disabled:opacity-50"
            >
              <div className="skew-x-[5deg]">Query</div>
            </button>
          </div>
        </motion.div>

        {/* Pit Stop Upload Area */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <label
            className={`block relative cursor-pointer group rounded-xl p-[2px] overflow-hidden transition-all duration-300 ${isDragOver ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0] && fileInputRef.current) { fileInputRef.current.files = e.dataTransfer.files; handleFileUpload({ target: fileInputRef.current } as any); } }}
          >
            {/* Animated glowing border */}
            <div className={`absolute inset-0 bg-gradient-to-r from-red-600 via-blue-500 to-red-600 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 opacity-50 blur-lg ${isDragOver ? 'translate-y-0 opacity-100 animate-pulse' : ''}`} />

            <div className="relative bg-carbon-fiber border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center overflow-hidden z-10">
              {/* Pit stop lines */}
              <div className="absolute top-0 bottom-0 left-10 w-1 bg-red-600/20" />
              <div className="absolute top-0 bottom-0 right-10 w-1 bg-red-600/20" />
              <div className="absolute top-0 bottom-0 left-12 w-0.5 bg-red-600/10" />
              <div className="absolute top-0 bottom-0 right-12 w-0.5 bg-red-600/10" />

              <div className="bg-red-500/20 p-4 rounded-full mb-4 border-2 border-red-500/50 relative">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-20 group-hover:opacity-50 transition-opacity" />
                <Upload size={28} className="text-red-500 relative z-10 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-1 italic">Pit-Stop Upload</h3>
              <p className="text-gray-400 text-xs font-mono leading-relaxed max-w-sm">
                Drag & drop PDF, DOCX, or TXT down the track.
                <br />Maximum payload: 20MB.
              </p>

              <div className="mt-6 relative inline-flex group/btn">
                <div className="absolute inset-0 bg-red-600 blur-md opacity-20 group-hover/btn:opacity-60 transition-opacity" />
                <div className="relative flex items-center bg-red-600 text-white px-6 py-2.5 font-bold uppercase tracking-widest italic skew-x-[15deg] group-hover/btn:-translate-y-0.5 transition-transform cursor-pointer text-sm">
                  <span className="skew-x-[-15deg] flex items-center gap-2">
                    <Zap size={16} className="fill-white" /> Sprint Summary
                  </span>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,.docx"
              onChange={handleFileUpload}
            />
          </label>
        </motion.div>
      </div>
    </div>
  );
};

// --- Results Dashboard Page (Racing HUD) ---
const DocumentAnalyzerPage: React.FC<{
  state: ExtendedAppState,
  setState: React.Dispatch<React.SetStateAction<ExtendedAppState>>,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}> = ({ state, setState, fileInputRef, handleFileUpload }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'questions' | 'chat'>('summary');
  const [chatInput, setChatInput] = useState('');
  const [mcqSelections, setMcqSelections] = useState<Record<string, string>>({});

  if (!state.studySession) {
    return (
      <div className="pt-28 pb-12 px-4 max-w-5xl mx-auto h-screen flex flex-col items-center justify-center text-center relative z-10 pointer-events-auto">
        <h1 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-widest mb-8">No Telemetry <span className="text-red-500">Detected</span></h1>
        <label className="relative block group cursor-pointer w-full max-w-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-blue-500 to-red-600 blur-xl opacity-20 group-hover:opacity-60 transition duration-500 rounded-xl"></div>
          <div className="relative rounded-xl p-16 border border-gray-800 flex flex-col items-center justify-center gap-6 bg-carbon-fiber shadow-2xl">
            <Upload size={64} className="text-red-500" />
            <div className="text-center">
              <p className="font-bold text-white text-2xl uppercase tracking-wider italic">Initialize Upload Sequence</p>
              <p className="text-gray-400 mt-2 font-mono text-sm max-w-sm mx-auto">Drop a PDF, DOCX, or TXT down the track to acquire an AI generated lap-time summary.</p>
            </div>

            {state.error && (
              <div className="w-full bg-red-950/50 border border-red-500/50 rounded-lg p-3 flex items-center gap-3 mt-2">
                <ShieldAlert className="text-red-500 shrink-0" size={20} />
                <p className="text-red-200 font-mono text-xs text-left">{state.error}</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,.docx"
              onChange={handleFileUpload}
            />
          </div>
        </label>
      </div>
    );
  }

  const handleSendMessage = async (customQuery?: string) => {
    // Boilerplate chat handled similar to before, see complete file for details.
    const textToSend = customQuery || chatInput;
    if (!textToSend.trim()) return;
    if (activeTab !== 'chat') setActiveTab('chat');
    if (!customQuery) setChatInput('');

    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now() };
    const loadingId = "loading-" + Date.now();
    const loadingMessage: ChatMessage = { id: loadingId, role: 'model', text: "Processing Telemetry...", timestamp: Date.now() + 1 };

    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, newMessage, loadingMessage] }));

    try {
      const historyForApi = state.chatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
      historyForApi.push({ role: 'user', parts: [{ text: textToSend }] });
      const response = await chatWithContext(textToSend, state.extractedText, historyForApi);
      setState(prev => ({
        ...prev,
        chatHistory: prev.chatHistory.map(msg => msg.id === loadingId ? { ...msg, text: response || "Data corrupted." } : msg)
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        chatHistory: prev.chatHistory.map(msg => msg.id === loadingId ? { ...msg, text: "System error." } : msg)
      }));
    }
  };

  return (
    <div className="pt-24 pb-8 px-4 max-w-[1400px] mx-auto h-screen flex flex-col z-10 relative pointer-events-auto">
      {/* File Header Telemetry */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 bg-black/40 border border-red-500/20 p-4 rounded-xl backdrop-blur-md"
      >
        <div className="flex-1 min-w-0 flex items-center">
          <div className="w-12 h-12 bg-red-600/20 border-2 border-red-600 rounded flex items-center justify-center skew-x-[-10deg] mr-4 shrink-0">
            <FileText className="text-red-500 skew-x-[10deg]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em] mb-1">Target Acquired</div>
            <h2 className="text-xl font-bold text-white truncate font-mono">{state.currentFile?.name}</h2>
          </div>
        </div>

        {/* Navigation Tabs (HUD Style) */}
        <div className="flex bg-black p-1 rounded border border-gray-800 self-start md:self-end text-sm skew-x-[-15deg]">
          {[
            { id: 'summary', icon: <Zap size={14} />, label: 'Telemetry (Summary)' },
            { id: 'questions', icon: <ShieldAlert size={14} />, label: 'Stress Test (Q&A)' },
            { id: 'chat', icon: <Cpu size={14} />, label: 'AI Comms (Chat)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab.id
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <div className="skew-x-[15deg] flex items-center gap-2">{tab.icon} {tab.label.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 overflow-hidden bg-black/60 border border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative flex flex-col backdrop-blur-xl rounded-2xl"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-blue-500 to-red-600" />

        {activeTab === 'summary' && (
          <div className="h-full overflow-y-auto p-6 md:p-10 custom-scrollbar relative z-10 text-gray-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-10 pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-3xl font-black italic uppercase tracking-widest text-white">🏁 Lap Time Results</h3>
                <p className="text-red-500 text-sm font-mono mt-1">AI processing complete.</p>
              </div>
            </div>

            <div className="space-y-12">
              <section>
                <h4 className="flex items-center gap-3 text-xl font-bold uppercase tracking-wider text-purple-400 mb-4 border-b border-gray-800 pb-2">
                  <span className="w-2 h-2 bg-purple-400"></span> 📊 Key Concepts
                </h4>
                <div className="flex flex-wrap gap-2">
                  {state.studySession.keyTerms.map((term, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05, backgroundColor: "#ff2800", color: "white", borderColor: "#ff2800" }}
                      className="px-4 py-2 rounded-sm border border-gray-700 bg-gray-900/50 text-sm font-mono cursor-pointer transition-colors"
                      onClick={() => handleSendMessage(`Explain ${term}`)}
                    >
                      {term}
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Fake structure splitting the summary into HUD sections */}
              <section>
                <h4 className="flex items-center gap-3 text-xl font-bold uppercase tracking-wider text-blue-400 mb-4 border-b border-gray-800 pb-2">
                  <span className="w-2 h-2 bg-blue-400 animate-pulse"></span> ⚡ Quick Insights
                </h4>
                <div className="text-lg leading-relaxed font-light text-gray-200">
                  {/* Extract the first sentence or part of it if no newlines */}
                  {state.studySession.summary.split('\n').filter(Boolean)[0] || state.studySession.summary.split('.')[0] + '.'}
                </div>
              </section>

              <section>
                <h4 className="flex items-center gap-3 text-xl font-bold uppercase tracking-wider text-red-500 mb-4 border-b border-gray-800 pb-2">
                  <span className="w-2 h-2 bg-red-500 animate-pulse"></span> 🧠 Deep Summary
                </h4>
                <div className="space-y-4 leading-relaxed text-gray-300">
                  {state.studySession.summary.split('\n').filter(Boolean).length > 1 ? (
                    state.studySession.summary.split('\n').filter(Boolean).slice(1).map((para, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        {para}
                      </motion.p>
                    ))
                  ) : (
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {state.studySession.summary}
                    </motion.p>
                  )}
                </div>
              </section>

            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="h-full overflow-y-auto p-6 md:p-10 custom-scrollbar relative z-10 text-gray-200">
            <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-3xl font-black italic uppercase tracking-widest text-white">🛡️ Stress Test</h3>
                <p className="text-red-500 text-sm font-mono mt-1">Acquired QA metrics.</p>
              </div>
            </div>

            <div className="space-y-8">
              {state.studySession.questions.map((q, i) => (
                <motion.div
                  key={q.id || i}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-black/50 border border-gray-800 rounded-xl p-6 hover:border-red-500/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-3 py-1 bg-gray-900 border border-gray-700 text-blue-400 font-bold text-xs uppercase tracking-widest rounded-sm">{q.type}</span>
                    </div>
                    <span className="text-red-500 font-mono text-xs">{q.marks} {q.marks === 1 ? 'Point' : 'Points'}</span>
                  </div>

                  <p className="font-bold text-lg mb-4 text-white">{q.question}</p>

                  {q.type === 'MCQ' && q.options && (
                    <div className="grid grid-col-1 md:grid-cols-2 gap-3 mb-4">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = mcqSelections[q.id] === opt;
                        const isCorrect = isSelected && opt === q.answer;
                        const isWrong = isSelected && opt !== q.answer;

                        let borderClass = 'border-gray-700';
                        let bgClass = 'bg-gray-900/50 hover:bg-gray-800';
                        let textClass = 'text-gray-300';

                        if (isCorrect) {
                          borderClass = 'border-green-500/50';
                          bgClass = 'bg-green-500/10';
                          textClass = 'text-green-400 font-bold';
                        } else if (isWrong) {
                          borderClass = 'border-red-500/50';
                          bgClass = 'bg-red-500/10';
                          textClass = 'text-red-400 font-bold';
                        } else if (mcqSelections[q.id] && opt === q.answer) {
                          borderClass = 'border-green-500/30 border-dashed';
                          textClass = 'text-green-500/70';
                        }

                        return (
                          <button
                            key={oIdx}
                            className={`text-left p-3 rounded-md border transition-all ${borderClass} ${bgClass} ${textClass} flex items-center justify-between`}
                            onClick={() => !mcqSelections[q.id] && setMcqSelections(prev => ({ ...prev, [q.id]: opt }))}
                            disabled={!!mcqSelections[q.id]}
                          >
                            <span>{opt}</span>
                            {isCorrect && <Check size={16} className="text-green-500" />}
                            {isWrong && <XCircle size={16} className="text-red-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {((q.type === 'MCQ' && mcqSelections[q.id]) || q.type !== 'MCQ') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-800"
                    >
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">System Answer:</p>
                      <p className="text-gray-300 whitespace-pre-wrap">{q.answer}</p>
                      {q.explanation && (
                        <div className="mt-3 bg-blue-900/10 border-l-2 border-blue-500 p-3">
                          <p className="text-xs text-blue-400 whitespace-pre-wrap">{q.explanation}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col bg-transparent relative z-10">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
              {state.chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded border ${msg.role === 'user' ? 'bg-red-600/10 border-red-500/30 text-white rounded-tr-none' : 'bg-blue-600/10 border-blue-500/30 text-blue-50 rounded-tl-none font-mono text-sm'}`}>
                    <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">{msg.role === 'user' ? 'Pilot' : 'AI Engineer'}</div>
                    <p className="whitespace-pre-wrap">
                      {msg.text === "Processing Telemetry..." ? <span className="animate-pulse">Retrieving Data...</span> : msg.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-black/80 border-t border-gray-800">
              <div className="flex gap-3 bg-gray-900 border border-gray-700 p-1.5 focus-within:border-red-500/50 transition-all skew-x-[-5deg]">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Transmit message to AI core..." className="flex-1 px-4 bg-transparent border-none text-white outline-none font-mono text-sm placeholder-gray-600 skew-x-[5deg]" />
                <button onClick={() => handleSendMessage()} disabled={!chatInput.trim()} className="bg-red-600 hover:bg-red-500 text-white p-3 font-bold uppercase disabled:opacity-50 transition-colors skew-x-[5deg]">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- Search Chat Page (Telemetry API) ---
const SearchChatPage: React.FC<{
  state: ExtendedAppState,
  setState: React.Dispatch<React.SetStateAction<ExtendedAppState>>,
  onBackToHome: () => void
}> = ({ state, setState, onBackToHome }) => {
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = async (customQuery?: string) => {
    const textToSend = customQuery || chatInput;
    if (!textToSend.trim()) return;

    if (!customQuery) setChatInput('');

    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now() };
    const loadingId = "loading-" + Date.now();
    const loadingMessage: ChatMessage = { id: loadingId, role: 'model', text: "Processing Telemetry...", timestamp: Date.now() + 1 };

    setState(prev => ({ ...prev, searchChatHistory: [...prev.searchChatHistory, newMessage, loadingMessage] }));

    try {
      const historyForApi = state.searchChatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
      historyForApi.push({ role: 'user', parts: [{ text: textToSend }] });

      const response = await chatWithContext(textToSend, '', historyForApi);

      setState(prev => ({
        ...prev,
        searchChatHistory: prev.searchChatHistory.map(msg =>
          msg.id === loadingId
            ? { ...msg, text: response || "Data corrupted." }
            : msg
        )
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        searchChatHistory: prev.searchChatHistory.map(msg =>
          msg.id === loadingId
            ? { ...msg, text: "System error." }
            : msg
        )
      }));
    }
  };

  return (
    <div className="pt-24 pb-8 px-4 max-w-[1400px] mx-auto h-screen flex flex-col z-10 relative pointer-events-auto">
      <div className="flex items-center justify-between gap-4 mb-6 bg-black/40 border border-red-500/20 p-4 rounded-xl backdrop-blur-md">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white uppercase italic tracking-widest"><span className="text-red-500">AI</span> Telemetry</h2>
          <p className="text-sm text-gray-400 mt-1 font-mono">Global communications array</p>
        </div>
        <button
          onClick={onBackToHome}
          className="px-6 py-2 text-sm font-bold text-white uppercase italic tracking-wider bg-red-600 hover:bg-red-500 transition-colors skew-x-[15deg]"
        >
          <div className="skew-x-[-15deg]">Abort</div>
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-black/60 border border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative flex flex-col backdrop-blur-xl rounded-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-blue-500 to-red-600" />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative z-10">
          {state.searchChatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded border ${msg.role === 'user' ? 'bg-red-600/10 border-red-500/30 text-white rounded-tr-none' : 'bg-blue-600/10 border-blue-500/30 text-blue-50 rounded-tl-none font-mono text-sm'}`}>
                <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">{msg.role === 'user' ? 'Pilot' : 'AI Engineer'}</div>
                <p className="whitespace-pre-wrap">
                  {msg.text === "Processing Telemetry..." ? <span className="animate-pulse">Retrieving Data...</span> : msg.text}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-black/80 border-t border-gray-800 z-10">
          <div className="flex gap-3 bg-gray-900 border border-gray-700 p-1.5 focus-within:border-red-500/50 transition-all skew-x-[-5deg]">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Transmit query to global AI network..." className="flex-1 px-4 bg-transparent border-none text-white outline-none font-mono text-sm placeholder-gray-600 skew-x-[5deg]" />
            <button onClick={() => handleSendMessage()} disabled={!chatInput.trim()} className="bg-red-600 hover:bg-red-500 text-white p-3 font-bold uppercase disabled:opacity-50 transition-colors skew-x-[5deg]">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
const getInitialState = (): ExtendedAppState => ({
  currentFile: null,
  extractedText: '',
  isProcessing: false,
  processingStatus: '',
  processingProgress: 0,
  error: null,
  studySession: null,
  chatHistory: [],
  view: 'home',
  currentPage: 'home',
  searchQuery: '',
  searchChatHistory: [],
});

const App: React.FC = () => {
  const [state, setState] = useState<ExtendedAppState>(getInitialState());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNavigate = (page: string) => {
    setState(prev => ({ ...prev, currentPage: page as ExtendedAppState['currentPage'], view: page === 'document-analyzer' && prev.studySession ? 'dashboard' : 'home' }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setState(prev => ({
      ...prev, isProcessing: true, processingStatus: 'Extracting File Data...', processingProgress: 0, error: null, currentFile: file, view: 'dashboard', currentPage: 'document-analyzer'
    }));

    try {
      const text = await readFileAsText(file, (progress) => {
        setState(prev => ({ ...prev, processingProgress: Math.min(progress, 90) }));
      });

      setState(prev => ({ ...prev, extractedText: text, processingStatus: 'Optimizing Neural Maps...', processingProgress: 90 }));

      const interval = setInterval(() => {
        setState(prev => prev.processingProgress >= 99 ? prev : { ...prev, processingProgress: prev.processingProgress + 1 });
      }, 30);

      const session = await generateStudyContent(text);
      clearInterval(interval);

      setState(prev => ({
        ...prev, isProcessing: false, processingProgress: 100, studySession: session, error: null,
        chatHistory: [{ id: 'sys', role: 'model', text: `Telemetry data for ${file.name} acquired. Systems nominal. Ready for queries.`, timestamp: Date.now() }]
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || "Unknown Telemetry Error",
        // Keep them on whatever page they were on, but clear the current file/session mapping
        currentFile: null
      }));
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: query, timestamp: Date.now() };
    const loadingId = "loading-" + Date.now();
    const loadingMessage: ChatMessage = { id: loadingId, role: 'model', text: "Processing Telemetry...", timestamp: Date.now() + 1 };

    setState(prev => ({
      ...prev,
      currentPage: 'search-chat',
      searchQuery: query,
      searchChatHistory: [userMessage, loadingMessage]
    }));

    try {
      const response = await chatWithContext(query, '', []);
      setState(prev => ({
        ...prev,
        searchChatHistory: prev.searchChatHistory.map(msg =>
          msg.id === loadingId
            ? { ...msg, text: response || "Data corrupted." }
            : msg
        )
      }));
    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        searchChatHistory: prev.searchChatHistory.map(msg =>
          msg.id === loadingId
            ? { ...msg, text: "System error." }
            : msg
        )
      }));
    }
  };

  return (
    <div className="min-h-screen text-white bg-black font-sans selection:bg-red-500/30">
      <Scene3D isIntro={true} />

      <div className="relative z-10 pointer-events-none">
        <Navbar currentPage={state.currentPage} onNavigate={handleNavigate} />

        <AnimatePresence mode="wait">
          {state.isProcessing && <TelemetryLoading key="loading" status={state.processingStatus} progress={state.processingProgress} />}

          {!state.isProcessing && state.currentPage === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)" }} className="pointer-events-auto">
              <HomePage state={state} fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} onNavigate={handleNavigate} onSearch={handleSearch} />
            </motion.div>
          )}

          {!state.isProcessing && state.currentPage === 'document-analyzer' && (
            <motion.div key="analyzer" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pointer-events-auto h-screen">
              <DocumentAnalyzerPage state={state} setState={setState} fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} />
            </motion.div>
          )}

          {!state.isProcessing && state.currentPage === 'search-chat' && (
            <motion.div key="search-chat" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pointer-events-auto h-screen">
              <SearchChatPage state={state} setState={setState} onBackToHome={() => handleNavigate('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FloatingBot />

      {/* Credits Info Button */}
      <div className="fixed bottom-6 left-6 z-[120] pointer-events-auto group">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-10 h-10 bg-black/40 backdrop-blur-md border border-red-500/30 rounded-full flex items-center justify-center cursor-help transition-colors group-hover:bg-red-600/20 group-hover:border-red-500"
        >
          <div className="font-serif italic text-red-500 font-bold text-lg select-none">i</div>
        </motion.div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl border border-red-500/30 px-4 py-2 rounded-lg whitespace-nowrap shadow-[0_0_20px_rgba(255,0,0,0.1)]">
            <p className="text-[10px] font-mono text-red-500 uppercase tracking-[0.2em] mb-0.5 opacity-60">Authentication Credits</p>
            <p className="text-sm font-bold italic tracking-wider text-white">FrontEnd Web Development Project
              <br />Made By Batman & Team..! 🏎️</p>
          </div>
          {/* Tooltip Arrow */}
          <div className="w-2 h-2 bg-black border-r border-b border-red-500/30 rotate-45 ml-4 -mt-1" />
        </div>
      </div>
    </div>
  );
};

export default App;
