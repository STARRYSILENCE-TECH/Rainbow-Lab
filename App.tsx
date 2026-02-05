
import React, { useState } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import MacroViewCanvas from './components/MacroViewCanvas';
import ExplanationPanel from './components/ExplanationPanel';
import AiTutor from './components/AiTutor';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'micro' | 'macro'>('micro');
  
  // Shared step state
  const [step, setStep] = useState<number>(0);
  
  // Micro View State
  const [showSpectrum, setShowSpectrum] = useState<boolean>(false);
  const [inputY, setInputY] = useState<number>(60); 
  // New: Simulation Mode State (primary | secondary | dual)
  const [microMode, setMicroMode] = useState<'primary' | 'secondary' | 'dual'>('primary');

  // Macro View State
  const [sunAngle, setSunAngle] = useState<number>(20); 

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      
      {/* Header */}
      <header className="shrink-0 py-2 px-4 md:px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-[10px]">🌈</div>
           <h1 className="text-base md:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-400">
            Rainbow Lab
          </h1>
        </div>
        <p className="hidden sm:block text-slate-400 text-xs">
           探索光的折射、反射与色散原理
        </p>
      </header>

      {/* Main Content - Grid Layout */}
      {/* 
         Mobile: Single column. Main scroll on the container.
         Desktop: Two columns. No main scroll (inner scrolls).
      */}
      <main className="
        flex-1 min-h-0 
        overflow-y-auto md:overflow-hidden
        grid gap-3 p-3
        
        /* Mobile Layout: Stacked, Auto height rows */
        grid-cols-1 
        grid-rows-[auto_auto_auto]
        
        /* Desktop Layout: Main Col + Side Col */
        md:grid-cols-[1fr_20rem] lg:grid-cols-[1fr_24rem]
        /* Row 1 (Canvas): 1.5fr, Row 2 (Chat): 1fr - Better balance than fixed height */
        md:grid-rows-[1.5fr_1fr]
      ">
        
        {/* 1. Canvas Container */}
        {/* Mobile: ~45vh to allow Controls to fit on screen. Desktop: Fills row 1. */}
        <div className="
          bg-slate-900 rounded-xl border border-slate-700 relative overflow-hidden flex items-center justify-center
          h-[45vh] min-h-[300px] md:h-auto md:min-h-0
          md:col-start-1 md:row-start-1
        ">
             {/* Aspect Ratio Enforcer for Physics Accuracy */}
             <div className="w-full h-full max-w-full max-h-full aspect-[4/3] relative shadow-2xl">
                {viewMode === 'micro' ? (
                    <SimulationCanvas 
                        inputY={inputY} 
                        setInputY={setInputY}
                        showSpectrum={showSpectrum} 
                        step={step} 
                        microMode={microMode}
                    />
                ) : (
                    <MacroViewCanvas 
                        sunAngle={sunAngle}
                        setSunAngle={setSunAngle}
                        step={step}
                    />
                )}
             </div>
        </div>

        {/* 2. Explanation Panel (Controls) */}
        {/* Mobile: Flows naturally after canvas. Desktop: Right sidebar spanning both rows. */}
        <div className="
          flex flex-col
          md:col-start-2 md:row-start-1 md:row-span-2
          h-auto md:h-full
        ">
            <ExplanationPanel 
              viewMode={viewMode}
              setViewMode={setViewMode}
              step={step} 
              setStep={setStep}
              showSpectrum={showSpectrum}
              setShowSpectrum={setShowSpectrum}
              inputY={inputY}
              setInputY={setInputY}
              sunAngle={sunAngle}
              setSunAngle={setSunAngle}
              microMode={microMode}
              setMicroMode={setMicroMode}
            />
        </div>

        {/* 3. AI Tutor (Questions) */}
        {/* Mobile: At the bottom with fixed height. Desktop: Bottom left cell. */}
        <div className="
          h-[500px] md:h-full
          md:col-start-1 md:row-start-2
        ">
             <AiTutor />
        </div>

      </main>
    </div>
  );
};

export default App;
