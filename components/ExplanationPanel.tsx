
import React, { useState, useEffect } from 'react';

interface ExplanationPanelProps {
  viewMode: 'micro' | 'macro';
  setViewMode: (mode: 'micro' | 'macro') => void;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  showSpectrum: boolean;
  setShowSpectrum: (v: boolean) => void;
  inputY: number;
  setInputY: (y: number) => void;
  sunAngle: number;
  setSunAngle: (a: number) => void;
}

const microSteps = [
  {
    title: "1. 阳光入场 (Sunlight)",
    content: "想象一束白色的阳光（包含了所有颜色）照射到空中的小水滴上。为了看到彩虹，太阳必须在你的身后，而雨在你的前方。",
    highlight: "尝试上方滑块改变阳光位置！"
  },
  {
    title: "2. 折射与色散 (Refraction)",
    content: "当光线从空气进入水中时，它会减速并改变方向，这叫**折射**。不同颜色的光弯曲程度不同：红光弯得少，紫光弯得多。这就像棱镜一样把白光拆开了！",
    highlight: "看！白光分成了彩色光束。"
  },
  {
    title: "3. 内部反射 (Reflection)",
    content: "光线撞到了水滴的后壁。就像照镜子一样，大部分光线被**反射**回来，继续在水滴内部旅行。",
    highlight: "光线在水滴内部掉了个头。"
  },
  {
    title: "4. 出射主虹 (Primary Rainbow)",
    content: "光线离开水滴再次折射。红光总是在与入射光成约42°角的方向射出。无数个这样的水滴组合起来，就形成了我们眼中的主虹（颜色：外红内紫）。",
    highlight: "这是最常见的彩虹！"
  },
  {
    title: "5. 副虹诞生 (Secondary Rainbow)",
    content: "看！同一束阳光照射整个水滴。射入**上方**的光形成了主虹，而射入**下方**的光在水滴内发生了**两次反射**，形成了副虹（霓）！多一次反射让光线更暗。",
    highlight: "上进下出是主虹，下进上出是副虹。"
  },
  {
    title: "6. 颜色反转与排序 (Color Order)",
    content: "仔细看光线出射处的图示！主虹因为只反射一次，保持**红在外圈，紫在内圈**。而副虹反射了两次，颜色顺序反转了，变成了**紫在外圈，红在内圈**。",
    highlight: "注意看旁边的小图标，箭头指向内圈和外圈的方向。"
  }
];

const macroSteps = [
  {
    title: "1. 宏观站位 (Positioning)",
    content: "想要看到彩虹，第一法则：背对太阳！你（观察者）站在中间，太阳在身后，雨幕在前方。",
    highlight: "太阳、你、雨滴在一条线上。"
  },
  {
    title: "2. 寻找反日点 (Antisolar Point)",
    content: "想象一条线，从太阳出发，穿过你的眼睛，一直延伸到你前方的无限远处（或地下）。这个点叫**反日点**。它是彩虹圆环的圆心！",
    highlight: "反日点就是你头部阴影的中心。"
  },
  {
    title: "3. 42度的魔法 (The 42° Cone)",
    content: "由于水滴的光学特性，彩虹总是出现在离反日点**42度**的圆环上。这是一个固定的角度。",
    highlight: "彩虹是一个以反日点为中心的圆。"
  },
  {
    title: "4. 太阳决定高度 (Sun Angle)",
    content: "因为42度是固定的，所以当太阳升高，反日点就会降低（钻入地下），带着彩虹一起下降。如果太阳高度超过42度，彩虹就完全在地平线以下，你就看不见啦！",
    highlight: "拖动滑块观察太阳和彩虹的关系！"
  }
];

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ 
    viewMode, setViewMode,
    step, setStep, 
    showSpectrum, setShowSpectrum, 
    inputY, setInputY,
    sunAngle, setSunAngle
}) => {
  const currentSteps = viewMode === 'micro' ? microSteps : macroSteps;
  const currentInfo = currentSteps[step] || currentSteps[0];
  const maxSteps = currentSteps.length - 1;

  // Auto Play State
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto Play Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setStep(prev => {
          if (prev < maxSteps) {
             // Side effects for automation
             if(viewMode === 'micro') {
                 if (prev + 1 >= 4 && !showSpectrum) setShowSpectrum(true);
                 if (prev + 1 === 3) setInputY(90);
             }
             return prev + 1;
          } else {
             setIsPlaying(false); // Stop at end
             return prev;
          }
        });
      }, 5000); // 5 seconds per step
    }
    return () => clearInterval(interval);
  }, [isPlaying, maxSteps, viewMode, setStep, showSpectrum, setShowSpectrum, setInputY]);

  const handleModeSwitch = (mode: 'micro' | 'macro') => {
      setViewMode(mode);
      setStep(0); 
      setIsPlaying(false);
  };

  const togglePlay = () => {
      if (!isPlaying && step === maxSteps) {
          setStep(0); // Restart if at end
      }
      setIsPlaying(!isPlaying);
  };

  // Dynamic Styles for Slider
  const thumbColor = viewMode === 'micro' ? '#0ea5e9' : '#eab308'; // Sky or Yellow (for Sun)
  
  const sliderStyle = `
    .custom-slider {
      -webkit-appearance: none;
      width: 100%;
      background: transparent;
      outline: none;
    }
    
    /* Track */
    .custom-slider::-webkit-slider-runnable-track {
      width: 100%;
      height: 8px;
      background: #334155;
      border-radius: 999px;
      cursor: pointer;
    }
    .custom-slider::-moz-range-track {
      width: 100%;
      height: 8px;
      background: #334155;
      border-radius: 999px;
      cursor: pointer;
    }

    /* Thumb */
    .custom-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 24px;
      width: 24px;
      border-radius: 50%;
      background: ${thumbColor};
      border: 3px solid #0f172a;
      box-shadow: 0 0 0 2px ${thumbColor}, 0 4px 6px rgba(0,0,0,0.3);
      cursor: grab;
      margin-top: -8px; /* (8px track - 24px thumb) / 2 */
      transition: transform 0.1s;
    }
    .custom-slider::-webkit-slider-thumb:active {
      transform: scale(1.1);
      cursor: grabbing;
    }

    .custom-slider::-moz-range-thumb {
      height: 24px;
      width: 24px;
      border-radius: 50%;
      background: ${thumbColor};
      border: 3px solid #0f172a;
      box-shadow: 0 0 0 2px ${thumbColor}, 0 4px 6px rgba(0,0,0,0.3);
      cursor: grab;
      transition: transform 0.1s;
    }
    .custom-slider::-moz-range-thumb:active {
      transform: scale(1.1);
      cursor: grabbing;
    }
  `;

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col h-full shadow-lg relative">
      <style>{sliderStyle}</style>

      {/* --- TOP ZONE: CONTROLS & NAVIGATION --- */}
      {/* This section contains the primary interaction elements: Navigation Buttons and Physics Sliders */}
      <div className="shrink-0 flex flex-col gap-4 border-b border-slate-700/50 pb-5 mb-4">
          
          {/* 1. Navigation Buttons (Priority #1: Top of Panel) */}
          <div className="flex gap-3">
            <button 
                onClick={() => {
                    setStep(Math.max(0, step - 1));
                    setIsPlaying(false);
                }}
                disabled={step === 0}
                className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-300 text-sm font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
                <span>⬅️</span> 上一步
            </button>
            <button 
                onClick={() => {
                    if(step < maxSteps) {
                        setStep(step + 1);
                        if(viewMode === 'micro' && !showSpectrum && step === 0) setShowSpectrum(true);
                        if(viewMode === 'micro' && !showSpectrum && step >= 4) setShowSpectrum(true);
                        if(viewMode === 'micro' && step === 3) setInputY(90);
                        setIsPlaying(false);
                    }
                }}
                disabled={step === maxSteps}
                className={`flex-1 py-3 rounded-lg text-white text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    viewMode === 'micro' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-purple-600 hover:bg-purple-500'
                }`}
            >
                下一步 <span>➡️</span>
            </button>
          </div>

          {/* 2. Progress Indicators */}
          <div className="flex gap-1.5 px-1">
            {currentSteps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  idx <= step ? (viewMode === 'micro' ? 'bg-sky-500' : 'bg-purple-500') : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* 3. Physics Controls (Slider) (Priority #2) */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            {viewMode === 'micro' ? (
                <div className="space-y-4">
                    <div>
                        <label className="flex justify-between text-sm font-bold text-sky-400 mb-2">
                            <span className="flex items-center gap-2">☀️ 阳光位置 <span className="text-[10px] text-slate-500 font-normal">(Impact)</span></span>
                            <span className="font-mono text-slate-300">{inputY.toFixed(1)}</span>
                        </label>
                        <input 
                            type="range" 
                            min="1" 
                            max="95"
                            step="0.1"
                            value={inputY} 
                            onChange={(e) => setInputY(Number(e.target.value))}
                            className="custom-slider"
                        />
                    </div>
                    <button 
                        onClick={() => setShowSpectrum(!showSpectrum)}
                        className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            showSpectrum 
                            ? 'bg-gradient-to-r from-red-500/20 via-green-500/20 to-purple-500/20 text-white border border-slate-500' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                    >
                        {showSpectrum ? '🌈 已显示光谱' : '🔦 显示光谱'}
                    </button>
                </div>
            ) : (
                <div>
                    <label className="flex justify-between text-sm font-bold text-yellow-400 mb-2">
                        <span>☀️ 太阳高度角 (Angle)</span>
                        <span className="font-mono text-slate-300">{sunAngle.toFixed(1)}°</span>
                    </label>
                    <input 
                        type="range" 
                        min="0" 
                        max="60"
                        step="0.1"
                        value={sunAngle} 
                        onChange={(e) => setSunAngle(Number(e.target.value))}
                        className="custom-slider"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                        <span>Low (0°)</span>
                        <span>High (60°)</span>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* --- BOTTOM ZONE: INFORMATION & CONTEXT --- */}
      {/* This section contains the reading material and view switching, less critical for immediate interaction */}
      <div className="overflow-y-auto pr-1 scrollbar-thin flex-1 min-h-0 space-y-5">
          
          {/* 4. View Mode Tabs (Moved Below Controls) */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => handleModeSwitch('micro')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    viewMode === 'micro' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔬 微观视角
              </button>
              <div className="w-px bg-slate-800 my-1 mx-1"></div>
              <button
                onClick={() => handleModeSwitch('macro')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    viewMode === 'macro' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌍 宏观视角
              </button>
          </div>

          {/* 5. Explanatory Text */}
          <div>
            <div className="flex justify-between items-start gap-4 mb-3">
                <h3 className="text-lg font-bold text-white">{currentInfo.title}</h3>
                <button 
                    onClick={togglePlay}
                    className={`shrink-0 px-2.5 py-1.5 rounded-md text-[10px] font-bold border transition-colors flex items-center gap-1 ${isPlaying ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`}
                >
                    {isPlaying ? '⏸ 暂停' : '▶️ 自动演示'}
                </button>
            </div>

            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
                <p className="text-slate-300 text-sm leading-relaxed">
                {currentInfo.content}
                </p>
            </div>
          </div>

          {/* 6. Highlight / Tip */}
          <div className={`flex gap-3 items-start p-3 rounded-lg border-l-4 bg-slate-900/50 ${viewMode === 'micro' ? 'border-sky-500' : 'border-purple-500'}`}>
             <div className="text-lg">💡</div>
             <p className={`text-xs md:text-sm font-medium ${viewMode === 'micro' ? 'text-sky-300' : 'text-purple-300'}`}>
                {currentInfo.highlight}
             </p>
          </div>

          {/* Bottom spacer for safe scrolling */}
          <div className="h-4"></div>
      </div>
    </div>
  );
};

export default ExplanationPanel;
