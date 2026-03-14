import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Cpu, Zap } from 'lucide-react';
import { chatWithF1Bot } from '../services/ai';
import { ChatMessage } from '../types';

const FloatingBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Vroom vroom! 🏎️ I'm the pit lane bot. Had food? Ready to sprint?",
      timestamp: Date.now()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: message,
      timestamp: Date.now()
    };

    const loadingId = "loading-" + Date.now();
    const loadingMessage: ChatMessage = {
      id: loadingId,
      role: 'model',
      text: "Beep boop... processing telemetry... ⚙️",
      timestamp: Date.now() + 1
    };

    setChatHistory(prev => [...prev, userMessage, loadingMessage]);
    setMessage('');

    try {
      const historyForApi = chatHistory
        .filter(msg => msg.id !== 'welcome') // don't send the hardcoded welcome to avoid confusing the model
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));

      const responseText = await chatWithF1Bot(userMessage.text, historyForApi);

      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { ...msg, text: responseText } : msg
      ));
    } catch (error) {
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { ...msg, text: "Connection to pit wall lost! 🏁" } : msg
      ));
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 bg-black/90 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-[0_0_30px_rgba(255,0,0,0.15)] overflow-hidden flex flex-col"
            style={{ height: '450px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-900 p-4 flex justify-between items-center border-b border-red-500/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-red-400/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white uppercase italic tracking-wider text-sm flex items-center gap-2">
                    Pit Bot <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                  </h3>
                  <p className="text-[10px] text-red-200 font-mono">Telemetry Systems Active</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40">
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-red-600/20 border border-red-500/30 text-white rounded-tr-sm' 
                        : 'bg-gray-800/80 border border-gray-700 text-gray-200 rounded-tl-sm font-mono'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-black/60 border-t border-red-900/50">
              <div className="flex items-center gap-2 bg-black/80 border border-gray-700 rounded-lg p-1 pr-2 focus-within:border-red-500/50 transition-colors">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent border-none text-white px-3 py-2 text-sm outline-none placeholder-gray-500 font-mono"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-600 to-red-800 rounded-full shadow-[0_0_20px_rgba(255,0,0,0.3)] border border-red-400/50 overflow-visible"
      >
         {/* Animated rings */}
         <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping opacity-20"></div>
         {!isOpen && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_10px_rgba(255,0,0,1)] z-10"></div>
         )}
         
        {isOpen ? (
          <X className="text-white z-10" size={24} />
        ) : (
          <Bot className="text-white z-10 group-hover:animate-bounce" size={26} />
        )}

        {/* Hover Tooltip/Speech Bubble */}
        <AnimatePresence>
            {!isOpen && isHovered && (
                <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.8 }}
                    animate={{ opacity: 1, x: -10, scale: 1 }}
                    exit={{ opacity: 0, x: 0, scale: 0.8 }}
                    className="absolute right-full mr-4 bg-white text-black text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap uppercase italic shadow-lg pointer-events-none"
                >
                    Pit Bot Online! 🏎️
                    {/* Little triangle arrow pointing right */}
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white"></div>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default FloatingBot;
