import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TelemetryLoading: React.FC<{ status: string, progress: number }> = ({ status, progress }) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const target = Math.floor(progress);
    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        if (prev < target) {
          const diff = target - prev;
          let step = 1;
          if (diff > 50) step = 2;
          else if (diff < 15) step = Math.random() > 0.6 ? 1 : 0;
          return Math.min(prev + step, target);
        }
        return prev;
      });
    }, 40); // Faster interval for responsive feedback
    return () => clearInterval(interval);
  }, [progress]);

  const leds = 15;
  const activeLeds = Math.floor((displayProgress / 100) * leds);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#222_0%,#000_100%)] opacity-40"></div>
      
      <div className="relative w-full max-w-[1200px] aspect-[16/10] flex items-center justify-center scale-100 sm:scale-[1.05]">
        
        {/* Photorealistic Steering Wheel Asset */}
        <div className="relative w-full h-full flex items-center justify-center">
            {/* The absolute real steering wheel image */}
            <img 
                src="/steering-wheel.png" 
                alt="F1 Steering Wheel" 
                className="w-full h-full object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
            />

            {/* "ANALYSING" HEADER - Formal F1 Style */}
            <div className="absolute top-[18.5%] left-[50%] -translate-x-1/2 flex items-center gap-2 pointer-events-none">
                <span className="text-[10px] md:text-[12px] font-black italic tracking-[0.4em] text-white opacity-80 uppercase" style={{ fontFamily: 'Orbitron' }}>
                  Analysing
                </span>
                <div className="flex gap-1">
                   <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                   <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse delay-75" />
                   <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse delay-150" />
                </div>
            </div>

            {/* Top RPM LED Strip Overlay - Precisely aligned to physical slots */}
            <div className="absolute top-[21.8%] left-[50%] -translate-x-1/2 w-[24%] h-[1.3%] flex justify-center items-center gap-[0.25rem] px-2.5 pointer-events-none">
                {Array.from({ length: leds }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`aspect-square h-full rounded-full transition-all duration-300 ${
                            i < activeLeds 
                                ? (i < 5 ? "bg-green-500 shadow-[0_0_6px_#22c55e]" : i < 10 ? "bg-red-500 shadow-[0_0_6px_#ef4444]" : "bg-blue-500 shadow-[0_0_6px_#3b82f6]")
                                : "bg-black/80 border border-white/5"
                        }`}
                    />
                ))}
            </div>

            {/* DIGITAL HUD OVERLAY (The "Screen") */}
            {/* Shrunk and centered strictly inside the image's physical display area */}
            <div className="absolute top-[27.8%] left-[50%] -translate-x-1/2 w-[23%] h-[17.5%] bg-black/98 rounded-[1px] overflow-hidden flex flex-col p-2 font-mono border border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05)_0%,transparent_100%)]"></div>
                
                {/* HUD Header - More compact */}
                <div className="flex justify-between items-center text-[7px] font-bold text-gray-500 uppercase tracking-tighter">
                    <span className="text-[#ff2800] flex items-center gap-1">
                        <div className="w-1 h-1 bg-[#ff2800] rounded-full animate-pulse"></div>
                        TELEMETRY
                    </span>
                    <span className="flex gap-2 font-mono">
                        <span>G <span className="text-white">8</span></span>
                        <span>L <span className="text-white">1</span></span>
                    </span>
                </div>

                {/* Status Ticker Inside Screen */}
                <div className="text-center mt-1">
                    <p className="text-[#00d2ff] text-[6px] tracking-[0.1em] font-black uppercase opacity-60">
                        {status || 'Optimizing Logic'}
                    </p>
                </div>

                {/* Progress Value - Scaled for the smaller HUD */}
                <div className="flex-1 flex flex-col items-center justify-center -mt-1">
                    <div className="flex items-baseline gap-0.5 scale-[0.6]">
                        <span className="text-7xl font-black text-white leading-none tracking-tighter filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                            {displayProgress}
                        </span>
                        <span className="text-xl font-bold text-gray-600">%</span>
                    </div>
                </div>

                {/* HUD Footer - Ultra compact */}
                <div className="flex justify-between items-center border-t border-white/5 pt-1 mt-auto text-[6px] font-bold">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-[4px] uppercase">Tyre</span>
                        <span className="text-[#ff2800]">SOFT</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-gray-500 text-[4px] uppercase">Mix</span>
                        <span className="text-yellow-400">RACE</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500 text-[4px] uppercase">Bal</span>
                        <span className="text-white">52.0</span>
                    </div>
                </div>
            </div>
            
            {/* Bottom Info Bar - Minimalist */}
            <div className="absolute bottom-[9%] left-[50%] -translate-x-1/2 flex flex-col items-center gap-1 opacity-40 scale-[0.55]">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-red-600 animate-ping"></div>
                    <span className="text-[10px] text-gray-400 font-mono tracking-[0.3em] uppercase">Hyper Extraction Link</span>
                </div>
            </div>
        </div>

      </div>

    </motion.div>
  );
};

export default TelemetryLoading;
