
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, MessageCircle, Play, Settings, FilePlus, 
  Scissors, Download, CheckCircle, AlertCircle, Sparkles, 
  Mic, Volume2, X, ChevronRight, BookOpen, Layers, ArrowLeft, Image as ImageIcon,
  Check, XCircle, Presentation, PenTool, User, Loader2, Share2, Copy, Maximize2, AlertTriangle,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookLogo, FadeIn, StaggerContainer, StaggerItem } from './components/AnimatedComponents';
import { generateStudyContent, chatWithContext, generatePresentationContent, humanizeText, generateAiImage } from './services/ai';
import { readFileAsText, mergePDFs, splitPDF, imagesToPDF, compressPDF, wordToPDF, pdfToWord } from './services/pdf';
import { AppState, StudySession, ChatMessage, Question, QuestionType } from './types';

// --- Types ---

interface ExtendedAppState extends AppState {
  humanizerText: string;
  humanizedOutput: string;
  pptTopic: string;
  showPptModal: boolean;
  showHumanizerModal: boolean;
  // Image Gen State
  showImageModal: boolean;
  imagePrompt: string;
  generatedImage: string | null;
}

// --- Independent Components (Defined OUTSIDE App to prevent re-renders) ---

const Navbar: React.FC<{ view: string, onGoHome: (e?: React.MouseEvent) => void }> = ({ view, onGoHome }) => (
  <nav className="fixed top-0 left-0 right-0 z-[9999] glass-card border-b-0 px-4 md:px-8 py-3 flex justify-between items-center transition-all duration-300 pointer-events-auto">
    <div 
      className="flex items-center text-gray-900 cursor-pointer hover:opacity-80 transition-opacity z-[10000]" 
      onClick={(e) => onGoHome(e)}
    >
      <BookLogo />
      <span className="font-bold text-xl tracking-tight text-indigo-900 ml-2">QuickRead</span>
    </div>
    <div className="flex gap-3 z-[10000]">
      {view !== 'home' && (
        <button 
          type="button"
          onClick={(e) => onGoHome(e)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-700 bg-white/90 hover:bg-white rounded-xl transition-all border border-indigo-100 hover:border-indigo-400 shadow-sm active:scale-90 cursor-pointer pointer-events-auto"
        >
          <Home size={18} /> <span>Home</span>
        </button>
      )}
    </div>
  </nav>
);

const LoadingView: React.FC<{ status: string, progress: number }> = ({ status, progress }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center bg-white/80 backdrop-blur-2xl z-[70] fixed inset-0"
    >
      <div className="relative w-28 h-28 mb-8">
        <div className="absolute inset-0 border-[6px] border-gray-100 rounded-full"></div>
        <motion.div 
          className="absolute inset-0 border-[6px] border-t-indigo-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        ></motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
           <BookLogo />
        </div>
      </div>
      
      <motion.h2 
        key={status}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold text-gray-800 mb-2"
      >
        {status || 'Processing...'}
      </motion.h2>
      
      <div className="w-80 h-3 bg-gray-100 rounded-full mt-6 overflow-hidden border border-gray-200 relative">
          <motion.div 
            className="absolute inset-0 bg-indigo-50 opacity-50"
            animate={{ x: ["0%", "100%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ backgroundImage: "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)", backgroundSize: "1rem 1rem" }}
          />
          <motion.div 
            className="h-full bg-indigo-600 rounded-full relative z-10 shadow-lg shadow-indigo-200"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
      </div>
      
      <div className="mt-3 flex justify-between w-80 text-xs font-semibold text-gray-500">
        <span>Processing Module</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </motion.div>
  );
};

// --- Home View Component ---

interface HomeViewProps {
  state: ExtendedAppState;
  setState: React.Dispatch<React.SetStateAction<ExtendedAppState>>;
  refs: {
    fileInput: React.RefObject<HTMLInputElement | null>;
    pdfToWord: React.RefObject<HTMLInputElement | null>;
    wordToPdf: React.RefObject<HTMLInputElement | null>;
    merge: React.RefObject<HTMLInputElement | null>;
  };
  handlers: {
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    processFileTool: (files: FileList | null, processor: any, name: string, msg: string) => void;
    handleGeneratePPT: () => void;
    handleHumanize: () => void;
    handleGenerateImage: () => void;
    handleCloseImageModal: () => void;
  };
  toolStatus: string | null;
  isHumanizing: boolean;
  isGeneratingImage: boolean;
}

const HomeView: React.FC<HomeViewProps> = ({ state, setState, refs, handlers, toolStatus, isHumanizing, isGeneratingImage }) => {
  return (
    <div className="pt-28 pb-12 px-4 max-w-7xl mx-auto">
      {state.error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 shadow-sm"
        >
          <AlertCircle size={20} /> {state.error}
        </motion.div>
      )}
      
      {/* Hero / Main Upload Section */}
      <div className="text-center mb-12 lg:mb-16 space-y-6">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6 shadow-sm">
            <Sparkles size={14} /> AI-Powered Study Platform
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
             Master your documents <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
              in seconds, not hours.
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4 leading-relaxed">
            Upload notes for instant summaries, clear doubts with AI chat, or use our suite of student tools.
          </p>
        </FadeIn>

        <FadeIn delay={0.2} className="max-w-xl mx-auto mt-10">
          <label className="relative block group cursor-pointer transform transition-transform hover:-translate-y-1">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative glass-card rounded-3xl p-10 border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-all flex flex-col items-center justify-center gap-5 bg-white/80">
              <div className="p-5 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Upload size={36} />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">Drop PDF, DOCX or PPTX</p>
                <p className="text-sm text-gray-500 mt-2">Up to 20MB • Instant AI Analysis</p>
              </div>
              <input 
                ref={refs.fileInput}
                type="file" 
                className="hidden" 
                accept=".pdf,.txt,.md,.docx" 
                onChange={handlers.handleFileUpload} 
              />
            </div>
          </label>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-start justify-center gap-2 text-amber-700 bg-amber-50/80 border border-amber-100 p-3 rounded-xl max-w-lg mx-auto backdrop-blur-sm"
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-left leading-relaxed">
              <span className="font-bold">Caution:</span> Please upload one module at a time. Uploading the complete syllabus may overwhelm the system.
            </p>
          </motion.div>
        </FadeIn>
      </div>

      {toolStatus && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] px-6 py-3 bg-gray-900/90 backdrop-blur-md text-white rounded-full flex items-center gap-3 shadow-xl animate-fade-in-up border border-white/10">
           <Loader2 size={18} className="animate-spin text-indigo-400" /> <span className="font-medium">{toolStatus}</span>
        </div>
      )}

      {/* Hidden Inputs for File Tools */}
      <input ref={refs.pdfToWord} type="file" accept=".pdf" className="hidden" onChange={(e) => { handlers.processFileTool(e.target.files, (files: any) => pdfToWord(files[0]), `converted_${Date.now()}.doc`, "PDF text extracted to Word!"); e.target.value = ''; }} />
      <input ref={refs.wordToPdf} type="file" accept=".docx,.txt" className="hidden" onChange={(e) => { handlers.processFileTool(e.target.files, (files: any) => wordToPDF(files[0]), `converted_${Date.now()}.pdf`, "Word to PDF Converted!"); e.target.value = ''; }} />
      <input ref={refs.merge} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => { handlers.processFileTool(e.target.files, (files: any) => mergePDFs(files), `merged_${Date.now()}.pdf`, "Merged Successfully!"); e.target.value = ''; }} />

      {/* PPT Topic Modal */}
      <AnimatePresence>
        {state.showPptModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setState(prev => ({...prev, showPptModal: false}))} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2 text-gray-900"><Presentation size={24} className="text-indigo-600"/> PPT Generator</h2>
                <p className="text-gray-500 text-sm mb-6">Create professional slides in seconds.</p>
                <div className="flex flex-col gap-4">
                    <label className="text-sm font-semibold text-gray-700">Presentation Topic</label>
                    <input 
                      type="text" 
                      className="p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg bg-gray-50 text-gray-900 placeholder-gray-400"
                      placeholder="e.g., The French Revolution, Quantum Physics..."
                      value={state.pptTopic}
                      onChange={(e) => setState(prev => ({...prev, pptTopic: e.target.value}))}
                      onKeyDown={(e) => e.key === 'Enter' && handlers.handleGeneratePPT()}
                      autoFocus
                    />
                    <button 
                      onClick={handlers.handleGeneratePPT}
                      disabled={!state.pptTopic.trim() || !!toolStatus}
                      className="bg-indigo-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-200"
                    >
                      {toolStatus ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />} 
                      {toolStatus ? 'Generating Slides...' : 'Generate PPT'}
                    </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Humanizer Modal */}
      <AnimatePresence>
        {state.showHumanizerModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] p-6 shadow-2xl relative flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900"><User size={24} className="text-indigo-600"/> AI Humanizer</h2>
                        <p className="text-sm text-gray-500">Rewrites AI-generated text to sound natural. Limit: 1000 words.</p>
                    </div>
                    <div className="flex gap-2">
                         <button 
                          onClick={handlers.handleHumanize}
                          disabled={!state.humanizerText.trim() || isHumanizing}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-indigo-200"
                         >
                           {isHumanizing ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} />}
                           {isHumanizing ? 'Processing...' : 'Humanize Text'}
                         </button>
                        <button onClick={() => setState(prev => ({...prev, showHumanizerModal: false}))} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                          <X size={20} />
                        </button>
                    </div>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
                  {/* Input Side */}
                  <div className="flex flex-col h-full bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-100/50">
                        <label className="text-sm font-semibold text-gray-700">Input Text</label>
                        <span className={`text-xs font-mono px-2 py-1 rounded ${state.humanizerText.split(/\s+/).length > 1000 ? 'bg-red-100 text-red-600' : 'bg-white text-gray-500 border border-gray-200'}`}>
                            {state.humanizerText.trim() ? state.humanizerText.trim().split(/\s+/).length : 0}/1000 words
                        </span>
                    </div>
                    <textarea 
                      className="flex-1 p-5 resize-none outline-none text-base bg-transparent text-gray-800 leading-relaxed custom-scrollbar placeholder-gray-400"
                      placeholder="Paste your robotic AI text here to make it sound human..."
                      value={state.humanizerText}
                      onChange={(e) => setState(prev => ({...prev, humanizerText: e.target.value}))}
                      autoFocus
                    />
                  </div>
                  
                  {/* Output Side */}
                  <div className="flex flex-col h-full bg-indigo-50/30 rounded-2xl border border-indigo-100 overflow-hidden relative">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-indigo-100 bg-indigo-50/50">
                        <label className="text-sm font-semibold text-indigo-900">Humanized Result</label>
                         {state.humanizedOutput && (
                             <button onClick={() => navigator.clipboard.writeText(state.humanizedOutput)} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
                                 <Copy size={12}/> Copy
                             </button>
                         )}
                    </div>
                    <div className="flex-1 p-5 overflow-y-auto text-base text-gray-800 leading-relaxed custom-scrollbar w-full">
                      {isHumanizing ? (
                        <div className="flex flex-col items-center justify-center h-full text-indigo-500 gap-4 opacity-70">
                           <Loader2 className="animate-spin" size={40} /> 
                           <span className="font-medium animate-pulse text-lg">Polishing text...</span>
                        </div>
                      ) : (
                         state.humanizedOutput ? (
                             <div className="whitespace-pre-wrap animate-fade-in-up">{state.humanizedOutput}</div>
                         ) : (
                             <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                 <User size={32} className="opacity-20"/>
                                 <span className="italic">Result will appear here...</span>
                             </div>
                         )
                      )}
                    </div>
                  </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Generator Modal */}
      <AnimatePresence>
        {state.showImageModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative h-auto max-h-[85vh] flex flex-col">
                <button onClick={handlers.handleCloseImageModal} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10">
                  <X size={20} />
                </button>
                <div className="mb-4 shrink-0">
                    <h2 className="text-2xl font-bold mb-1 flex items-center gap-2 text-gray-900"><ImageIcon size={24} className="text-indigo-600"/> Image Generator</h2>
                    <div className="text-xs font-medium text-gray-500 bg-gray-100 w-fit px-2 py-1 rounded">No Daily Limit</div>
                </div>
                
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    <div className="space-y-2 shrink-0">
                      <label className="text-sm font-semibold text-gray-700">Image Description</label>
                      <input 
                        type="text" 
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-base bg-gray-50 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., A futuristic city on Mars..."
                        value={state.imagePrompt}
                        onChange={(e) => setState(prev => ({...prev, imagePrompt: e.target.value}))}
                        autoFocus
                      />
                    </div>

                    {/* Image Container */}
                    <div className={`rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center relative group flex-1 min-h-0 ${!state.generatedImage ? 'min-h-[200px]' : ''}`}>
                        {state.generatedImage ? (
                            <img src={state.generatedImage} alt="Generated" className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                                <ImageIcon size={48} className="opacity-20 mb-2"/>
                                <span className="text-sm">Preview will appear here</span>
                            </div>
                        )}
                        
                        {state.generatedImage && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                               <p className="text-white font-medium">Ready to download</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 shrink-0">
                         <button 
                          onClick={handlers.handleGenerateImage}
                          disabled={!state.imagePrompt.trim() || isGeneratingImage}
                          className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                        >
                          {isGeneratingImage ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} 
                          {isGeneratingImage ? 'Creating Magic...' : 'Generate Image'}
                        </button>
                        
                        {state.generatedImage && (
                             <a 
                               href={state.generatedImage} 
                               download={`image_${Date.now()}.png`}
                               className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors flex items-center justify-center border border-gray-200"
                               title="Download Image"
                             >
                                <Download size={20} />
                             </a>
                        )}
                    </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 lg:px-0">
        {[
          { icon: Presentation, title: "PPT Generator", desc: "Generate professional slides from any topic instantly.", action: () => setState(prev => ({...prev, showPptModal: true})) },
          { icon: User, title: "AI Humanizer", desc: "Rewrite robotic text to sound natural and engaging.", action: () => setState(prev => ({...prev, showHumanizerModal: true})) },
          { icon: ImageIcon, title: "Image Generator", desc: "Create unique images from text descriptions (Unlimited).", action: () => setState(prev => ({...prev, showImageModal: true})) },
          { icon: Download, title: "PDF to Word", desc: "Convert PDF documents to editable Word files.", action: () => refs.pdfToWord.current?.click() },
          { icon: FilePlus, title: "Word to PDF", desc: "Convert Word/Text documents to PDF format.", action: () => refs.wordToPdf.current?.click() },
          { icon: Layers, title: "PDF Merger", desc: "Combine multiple PDF files into one document.", action: () => refs.merge.current?.click() },
        ].map((feature, idx) => (
          <StaggerItem key={idx}>
            <motion.button 
              whileHover={{ 
                scale: 1.03, 
                translateY: -5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" }}
              onClick={feature.action}
              className="w-full text-left glass-card p-6 lg:p-8 rounded-3xl transition-all duration-300 group border border-white/40 hover:border-indigo-200 h-full flex flex-col bg-white/60 hover:bg-white/90"
            >
              <div className="flex-1">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform text-indigo-600 shadow-sm border border-indigo-50">
                   <feature.icon size={28} />
                </div>
                <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-indigo-700 transition-colors">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </motion.button>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
};

// --- Dashboard View Component ---

const DashboardView: React.FC<{ state: ExtendedAppState, setState: React.Dispatch<React.SetStateAction<ExtendedAppState>> }> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'questions' | 'chat'>('summary');
  const [chatInput, setChatInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mcqSelections, setMcqSelections] = useState<Record<string, string>>({});
  
  if (!state.studySession) return null;

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleSendMessage = async (customQuery?: string) => {
    const textToSend = customQuery || chatInput;
    if (!textToSend.trim()) return;
    
    // Switch to chat tab if not already
    if (activeTab !== 'chat') setActiveTab('chat');
    
    if (!customQuery) setChatInput('');

    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now() };
    const loadingId = "loading-" + Date.now();
    const loadingMessage: ChatMessage = { id: loadingId, role: 'model', text: "Thinking...", timestamp: Date.now() + 1 };

    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, newMessage, loadingMessage] }));

    try {
      const historyForApi = state.chatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
      // Add current message to context
      historyForApi.push({ role: 'user', parts: [{ text: textToSend }] });

      const response = await chatWithContext(textToSend, state.extractedText, historyForApi);
      
      setState(prev => ({ 
        ...prev, 
        chatHistory: prev.chatHistory.map(msg => 
          msg.id === loadingId 
            ? { ...msg, text: response || "I couldn't generate an answer." } 
            : msg
        ) 
      }));
    } catch (err) { 
      console.error(err); 
      setState(prev => ({ 
        ...prev, 
        chatHistory: prev.chatHistory.map(msg => 
          msg.id === loadingId 
            ? { ...msg, text: "Sorry, I encountered an error. Please try again." } 
            : msg
        ) 
      }));
    }
  };

  return (
    <div className="pt-24 pb-8 px-4 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 truncate">
            <FileText className="text-indigo-600 shrink-0" /> <span className="truncate">{state.currentFile?.name}</span>
          </h2>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
            {state.studySession.keyTerms.map((term, i) => (
              <button 
                key={i} 
                onClick={() => handleSendMessage(`Explain the concept of "${term}" in detail.`)}
                className="text-xs font-medium bg-white/80 border border-indigo-100 px-3 py-1.5 rounded-full text-indigo-700 whitespace-nowrap shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer active:scale-95"
              >
                #{term}
              </button>
            ))}
          </div>
        </div>
        <div className="glass-card p-1.5 rounded-xl flex gap-1 self-start md:self-auto shrink-0 shadow-sm bg-white/50">
          {['summary', 'questions', 'chat'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab 
                  ? 'bg-white shadow-md text-indigo-600 scale-105' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden glass-card rounded-3xl border border-white/60 shadow-xl relative bg-white/60 backdrop-blur-xl flex flex-col">
        {activeTab === 'summary' && (
          <div className="h-full overflow-y-auto p-6 md:p-10 custom-scrollbar">
            <div className="flex justify-between items-start mb-8 sticky top-0 bg-white/0 backdrop-blur-sm p-2 -m-2 rounded-xl z-10">
              <h3 className="text-2xl font-bold text-gray-900">Executive Summary</h3>
              <button onClick={() => speakText(state.studySession!.summary)} className={`p-3 rounded-full transition-all active:scale-95 ${isSpeaking ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                {isSpeaking ? <Volume2 size={22} className="animate-pulse" /> : <Play size={22} className="ml-1" />}
              </button>
            </div>
            <div className="prose prose-lg prose-indigo max-w-none text-gray-700 leading-relaxed font-light">
              {state.studySession.summary.split('\n').map((para, i) => <p key={i} className="mb-6">{para}</p>)}
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="h-full overflow-y-auto p-6 custom-scrollbar bg-gray-50/30">
            <div className="grid gap-8 max-w-4xl mx-auto">
              {Object.values(QuestionType).map((type) => {
                const questions = state.studySession!.questions.filter(q => q.type === type);
                if (questions.length === 0) return null;
                return (
                  <div key={type} className="space-y-4">
                     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest sticky top-0 bg-white/90 backdrop-blur-md py-3 z-10 pl-2 border-b border-gray-100">{type} Questions</h4>
                     {questions.map((q) => (
                       <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group duration-300">
                          <div className="flex justify-between gap-4 mb-4">
                            <p className="font-medium text-gray-900 text-lg leading-snug">{q.question}</p>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg h-fit whitespace-nowrap border border-indigo-100">{q.marks} m</span>
                          </div>
                          {q.type === QuestionType.MCQ && q.options ? (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt, i) => {
                                const isSelected = mcqSelections[q.id] === opt;
                                const isCorrect = q.answer === opt;
                                const showResult = !!mcqSelections[q.id];
                                let btnClass = "text-sm px-5 py-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden ";
                                if (showResult) {
                                    if (isCorrect) btnClass += "bg-green-50 border-green-200 text-green-800 font-semibold ring-1 ring-green-200 ";
                                    else if (isSelected) btnClass += "bg-red-50 border-red-200 text-red-800 ";
                                    else btnClass += "bg-gray-50 border-gray-100 text-gray-400 opacity-50 ";
                                } else {
                                    btnClass += "bg-white border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-sm hover:-translate-y-0.5 ";
                                }
                                return (
                                  <button key={i} disabled={showResult} onClick={() => setMcqSelections(prev => ({...prev, [q.id]: opt}))} className={btnClass}>
                                    <div className="flex items-center justify-between relative z-10">
                                      <span>{opt}</span>
                                      {showResult && isCorrect && <Check size={18} className="text-green-600" />}
                                      {showResult && isSelected && !isCorrect && <XCircle size={18} className="text-red-500" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-3 p-4 bg-gray-50/80 rounded-xl text-sm text-gray-700 border border-gray-100">
                                <span className="font-semibold text-gray-900 block mb-1">Answer:</span>
                                {q.answer}
                            </div>
                          )}
                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm text-indigo-600 font-medium cursor-pointer hover:text-indigo-800 transition-colors" onClick={() => { handleSendMessage(`Explain this question: "${q.question}"`); }}>
                            <MessageCircle size={16} className="mr-2" /> Ask AI to explain this
                          </div>
                       </motion.div>
                     ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col bg-white/30">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
              {state.chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-3xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                    <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                      {msg.text === "Thinking..." ? (
                        <span className="flex items-center gap-1 opacity-70">
                          Thinking<span className="animate-pulse">...</span>
                        </span>
                      ) : (
                        msg.text
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 md:p-6 border-t border-white/50 bg-white/60 backdrop-blur-md">
              <div className="flex gap-3 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask anything about your document..." className="flex-1 px-4 py-3 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400" />
                <button onClick={() => handleSendMessage()} disabled={!chatInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-md">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Container ---

// Initial State Factory to ensure clean reset
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
  humanizerText: '',
  humanizedOutput: '',
  pptTopic: '',
  showPptModal: false,
  showHumanizerModal: false,
  showImageModal: false,
  imagePrompt: '',
  generatedImage: null,
});

const App: React.FC = () => {
  const [state, setState] = useState<ExtendedAppState>(getInitialState());
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const wordToPdfInputRef = useRef<HTMLInputElement>(null);
  const pdfToWordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Limits removed for image generation, no local storage check needed for counts
  }, []);

  // --- Handlers ---

  const handleGoHome = (e?: React.MouseEvent) => {
    // Prevent event propagation issues
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Confirmation if navigating away from an active dashboard session
    if (state.view === 'dashboard') {
      const confirmed = window.confirm('Are you sure you want to close this session? Your unsaved work will be lost.');
      if (!confirmed) return;
    }

    // Stop any ongoing speech immediately
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Force a complete reset to ensure Home works every time
    setState(getInitialState());
    setToolStatus(null);
    
    // Smoothly scroll back to top if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseImageModal = () => {
      setState(prev => ({ 
          ...prev, 
          showImageModal: false,
          generatedImage: null,
          imagePrompt: ''
      }));
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Reset input
    
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setState(prev => ({ ...prev, error: "File too large. Max 20MB." }));
      return;
    }

    setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        processingStatus: 'Extracting Text...',
        processingProgress: 0,
        error: null, 
        currentFile: file, 
        view: 'dashboard'
    }));

    try {
      const text = await readFileAsText(file, (progress) => {
          setState(prev => ({ ...prev, processingProgress: Math.min(progress, 90) }));
      });
      
      setState(prev => ({ ...prev, extractedText: text, processingStatus: 'Analyzing Content...', processingProgress: 90 }));

      const progressInterval = setInterval(() => {
          setState(prev => {
              if (prev.processingProgress >= 98) return prev;
              return { ...prev, processingProgress: prev.processingProgress + 1 };
          });
      }, 200);

      const session = await generateStudyContent(text);
      clearInterval(progressInterval);

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        processingProgress: 100,
        studySession: session,
        chatHistory: [{ id: 'welcome', role: 'model', text: `I've analyzed ${file.name}. Ask me anything about it!`, timestamp: Date.now() }]
      }));

    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: err.message, view: 'home' }));
    }
  };

  const processFileTool = async (
    files: FileList | null, 
    processor: (files: File[]) => Promise<Uint8Array | Blob>, 
    filename: string, 
    successMsg: string
  ) => {
    if (!files || files.length === 0) return;
    setToolStatus("Processing...");
    
    try {
      const result = await processor(Array.from(files));
      const blob = result instanceof Blob ? result : new Blob([result], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      setToolStatus(successMsg);
      setTimeout(() => setToolStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setToolStatus("Error: " + err.message);
      setTimeout(() => setToolStatus(null), 3000);
    }
  };

  const handleGeneratePPT = async () => {
      if (!state.pptTopic.trim()) return;
      
      setToolStatus("Generating Slides...");
      try {
          const pptData = await generatePresentationContent(state.pptTopic);
          if (!pptData.slides || pptData.slides.length === 0) throw new Error("No slides generated");

          setToolStatus("Creating PPTX...");
          const pptx = new (window as any).PptxGenJS();
          
          const titleSlide = pptx.addSlide();
          titleSlide.addText(state.pptTopic, { x: 0.5, y: 2.5, w: '90%', fontSize: 44, bold: true, align: 'center', color: '363636' });
          titleSlide.addText("Generated by QuickRead AI", { x: 0.5, y: 4, w: '90%', fontSize: 18, align: 'center', color: '808080' });

          pptData.slides.forEach((slide: any) => {
              const slideObj = pptx.addSlide();
              slideObj.addText(slide.title, { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: '363636' });
              const bulletText = slide.bullets.map((b: string) => ({ text: b, options: { fontSize: 16, color: '505050', breakLine: true } }));
              slideObj.addText(bulletText, { x: 0.5, y: 1.5, w: '90%', h: '70%', margin: 10, bullet: true, lineSpacing: 25 });
              
              // Add Speaker Notes
              if (slide.speakerNotes) {
                  slideObj.addNotes(slide.speakerNotes);
              }
          });

          pptx.writeFile({ fileName: `${state.pptTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.pptx` });
          
          setToolStatus("PPT Downloaded!");
          // Close modal on success
          setState(prev => ({ ...prev, showPptModal: false, pptTopic: '' }));
          
          setTimeout(() => setToolStatus(null), 3000);

      } catch (err: any) {
          console.error(err);
          setToolStatus("Error: " + err.message);
          setTimeout(() => setToolStatus(null), 3000);
      }
  };

  const handleHumanize = async () => {
      if (!state.humanizerText.trim()) return;
      const wordCount = state.humanizerText.trim().split(/\s+/).length;
      if (wordCount > 1000) {
          alert(`Text too long (${wordCount} words). Please limit to 1000 words.`);
          return;
      }

      setIsHumanizing(true);
      try {
          const result = await humanizeText(state.humanizerText);
          setState(prev => ({ ...prev, humanizedOutput: result || "" }));
      } catch (e) {
          setToolStatus("Error humanizing text");
          setTimeout(() => setToolStatus(null), 2000);
      } finally {
          setIsHumanizing(false);
      }
  };

  const handleGenerateImage = async () => {
      if (!state.imagePrompt.trim()) return;
      // Removed Limit Check

      setIsGeneratingImage(true);
      try {
          const base64Image = await generateAiImage(state.imagePrompt);
          
          setState(prev => ({ 
              ...prev, 
              generatedImage: base64Image
          }));
      } catch (e: any) {
          setToolStatus("Error: " + e.message);
          setTimeout(() => setToolStatus(null), 3000);
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const refs = { fileInput: fileInputRef, pdfToWord: pdfToWordInputRef, wordToPdf: wordToPdfInputRef, merge: mergeInputRef };
  const handlers = { handleFileUpload, processFileTool, handleGeneratePPT, handleHumanize, handleGenerateImage, handleCloseImageModal };

  return (
    <div className="min-h-screen text-gray-900 pb-10">
      <Navbar view={state.view} onGoHome={handleGoHome} />
      
      <AnimatePresence mode="wait">
        {state.isProcessing && <LoadingView key="loading" status={state.processingStatus} progress={state.processingProgress} />}
        
        {!state.isProcessing && state.view === 'home' && (
          <motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <HomeView 
              state={state} 
              setState={setState} 
              refs={refs} 
              handlers={handlers}
              toolStatus={toolStatus}
              isHumanizing={isHumanizing}
              isGeneratingImage={isGeneratingImage}
            />
          </motion.div>
        )}
        
        {!state.isProcessing && state.view === 'dashboard' && (
          <motion.div key="dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <DashboardView state={state} setState={setState} />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 w-full text-center py-3 text-xs font-medium text-gray-400 bg-white/70 backdrop-blur-md border-t border-white/50 z-40">
        QuickRead • Instant Document AI
      </footer>
    </div>
  );
};

export default App;
