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
  microMode: 'primary' | 'secondary' | 'dual';
  setMicroMode: (m: 'primary' | 'secondary' | 'dual') => void;
}

const microSteps = [
  {
    title: "1. 准备出发 (Start)",
    content: "想象你是一束阳光（白光），正准备冲向一颗圆圆的小水滴。主虹的光线通常瞄准水滴的“上半身”，而副虹的光线则喜欢钻“下半身”。",
    highlight: "点击“下一步”，看看光线进入水滴后会发生什么神奇的变化！"
  },
  {
    title: "2. 第一次折射 (Refraction)",
    content: "哎呀！光线进入水里时仿佛被“刹车”了一下，方向发生了偏折。这叫**折射**。这时候，白光里藏着的七种颜色开始偷偷分开了！",
    highlight: "就像彩虹糖洒出来一样，颜色开始分离了。"
  },
  {
    title: "3. 第一次反射 (Reflection 1)",
    content: "光线撞到了水滴的后壁。砰！它像乒乓球一样被弹了回来。这是**反射**。主虹和副虹的光线都必须经历这一次撞击。",
    highlight: "注意看画面中的红色闪光点，那就是撞击的地方！"
  },
  {
    title: "4. 命运的分岔路 (Divergence)",
    content: "关键时刻到了！\n🌈 **主虹**的光线运气好，直接钻出去了。\n🌙 **副虹**的光线角度太刁钻，被困住了！它撞向了水滴顶端，发生了**第二次反射**！",
    highlight: "主虹逃走了，副虹还在水滴肚子里打转呢。"
  },
  {
    title: "5. 最终形成 (Formation)",
    content: "终于，光线都跑出来了！\n主虹只要1次反射，比较亮。\n副虹因为多撞了1次墙（2次反射），能量损失了，所以看起来比较暗，而且颜色顺序反过来了！",
    highlight: "副虹是主虹的“镜像兄弟”，颜色是倒着的哦！"
  },
  {
    title: "6. 光谱全开 (Full Spectrum)",
    content: "现在我们开启上帝视角，看看完整的七彩色带！\n主虹：外红内紫。\n副虹：外紫内红。",
    highlight: "试着拖动上面的滑块，改变光线进入的位置！"
  }
];

const macroSteps = [
  {
    title: "1. 找好站位 (Positioning)",
    content: "想要看到彩虹，口诀很简单：**背对太阳**！\n太阳在你的后脑勺，雨在你的正前方。如果你面对太阳，是绝对看不到彩虹的。",
    highlight: "太阳、你、雨滴，三点一线。"
  },
  {
    title: "2. 神秘的反日点 (Antisolar Point)",
    content: "你的影子头部的那个点，就是**反日点**。它是彩虹圆环的圆心！虽然彩虹看起来是拱桥，其实它原本是一个完整的圆哦！",
    highlight: "看图上虚线指向的地方，那是彩虹的圆心。"
  },
  {
    title: "3. 42度的魔法 (The 42° Cone)",
    content: "由于水滴的光学特性，光线总是倾向于以**42度**角射出。所以彩虹总是出现在离反日点42度的地方。",
    highlight: "不管你在哪，这个角度永远是42度。"
  },
  {
    title: "4. 太阳高，彩虹低 (Sun Angle)",
    content: "这是一个跷跷板游戏：太阳升得越高，反日点就钻地越深，彩虹也就跟着沉入地下。当太阳超过42度时，彩虹就彻底看不见啦！",
    highlight: "试着拖动图上的小太阳，看看彩虹怎么动！"
  }
];

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ 
    viewMode, setViewMode,
    step, setStep, 
    showSpectrum, setShowSpectrum, 
    inputY, setInputY,
    sunAngle, setSunAngle,
    microMode, setMicroMode
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
                 // Step 5 corresponds to index 5. Enable spectrum there.
                 if (prev + 1 === 5) setShowSpectrum(true);
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
      // Reset micro view state
      if (mode === 'micro') {
          setShowSpectrum(false);
          setInputY(60);
          setMicroMode('primary');
      }
  };

  const handleMicroModeClick = (mode: 'primary' | 'secondary' | 'dual') => {
      setMicroMode(mode);
      setStep(0);
      setIsPlaying(false);
      setShowSpectrum(false);
  };

  const togglePlay = () => {
      if (!isPlaying && step === maxSteps) {
          setStep(0); // Restart if at end
          if (viewMode === 'micro') setShowSpectrum(false);
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
                    // Hide spectrum if going back from last step in micro view
                    if(viewMode === 'micro' && step === 5) setShowSpectrum(false);
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
                        if(viewMode === 'micro' && step + 1 === 5) setShowSpectrum(true);
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
                    {/* Micro Mode Switcher */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg">
                        <button 
                            onClick={() => handleMicroModeClick('primary')}
                            className={`py-1.5 rounded text-xs font-bold transition-all ${
                                microMode === 'primary' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            🔴 主虹单轨
                        </button>
                         <button 
                            onClick={() => handleMicroModeClick('secondary')}
                            className={`py-1.5 rounded text-xs font-bold transition-all ${
                                microMode === 'secondary' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            🟣 副虹单轨
                        </button>
                         <button 
                            onClick={() => handleMicroModeClick('dual')}
                            className={`py-1.5 rounded text-xs font-bold transition-all ${
                                microMode === 'dual' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            🌈 双轨演示
                        </button>
                    </div>

                    <div>
                        <label className="flex justify-between text-sm font-bold text-sky-400 mb-2">
                            <span className="flex items-center gap-2">☀️ 阳光入射位置 <span className="text-[10px] text-slate-500 font-normal">(Impact)</span></span>
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