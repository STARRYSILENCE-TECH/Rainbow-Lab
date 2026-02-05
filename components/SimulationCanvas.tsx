import React, { useRef, useState, useMemo } from 'react';
import { 
    calculateRayPath, 
    calculateDoubleReflectionRayPath, 
    REFRACTIVE_INDEX_RED, 
    REFRACTIVE_INDEX_ORANGE,
    REFRACTIVE_INDEX_YELLOW,
    REFRACTIVE_INDEX_GREEN, 
    REFRACTIVE_INDEX_BLUE,
    REFRACTIVE_INDEX_VIOLET, 
    RayPath 
} from '../utils/physics';

interface SimulationCanvasProps {
  inputY: number; // Controlled by slider
  setInputY: (y: number) => void;
  showSpectrum: boolean;
  step: number; // 0-5 for new synchronized flow
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ inputY, setInputY, showSpectrum, step }) => {
  const width = 600;
  const height = 450; 
  const centerX = 300;
  const centerY = 225; 
  const radius = 100;
  
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Generate background "Layer" of drops
  const backgroundDrops = useMemo(() => {
    const drops = [];
    const smallR = 25;
    const xSpacing = smallR * 2 + 5;
    const ySpacing = smallR * 1.732 + 5; 

    for (let y = -50; y < height + 50; y += ySpacing) {
        const rowIdx = Math.round(y / ySpacing);
        const xOffset = (rowIdx % 2) * (xSpacing / 2);
        
        for (let x = -50; x < width + 50; x += xSpacing) {
            const cx = x + xOffset;
            const cy = y;
            const dist = Math.sqrt(Math.pow(cx - centerX, 2) + Math.pow(cy - centerY, 2));
            if (dist > radius + 10) { 
                drops.push({ cx, cy, r: smallR });
            }
        }
    }
    return drops;
  }, []);

  // Dragging Logic
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const svgY = (e.clientY - CTM.f) / CTM.d;

    const dist = Math.abs(svgY - centerY);
    const offset = Math.max(1, Math.min(95, dist));
    
    setInputY(offset);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  // --- Calculations ---
  // Define full spectrum colors
  const spectrumColors = [
      { n: REFRACTIVE_INDEX_RED, hex: '#ef4444' },     // Red
      { n: REFRACTIVE_INDEX_ORANGE, hex: '#f97316' },  // Orange
      { n: REFRACTIVE_INDEX_YELLOW, hex: '#eab308' },  // Yellow
      { n: REFRACTIVE_INDEX_GREEN, hex: '#22c55e' },   // Green
      { n: REFRACTIVE_INDEX_BLUE, hex: '#3b82f6' },    // Blue
      { n: REFRACTIVE_INDEX_VIOLET, hex: '#a855f7' }   // Violet
  ];

  // Calculate paths for Primary and Secondary
  const primaryRays = spectrumColors.map(c => 
    calculateRayPath(inputY, radius, c.n, c.hex, centerX, centerY)
  );

  const secondaryRays = spectrumColors.map(c => 
    calculateDoubleReflectionRayPath(inputY, radius, c.n, c.hex, centerX, centerY)
  );

  // Helper to clamp coordinates inside canvas (with padding)
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  
  // Use Red ray for Label Position reference (Primary)
  const primaryLabelRef = primaryRays[0];
  const primaryLabelX = clamp(primaryLabelRef.end.x, 50, width - 120);
  const primaryLabelY = clamp(primaryLabelRef.end.y, 50, height - 30);
  
  // Use Red ray for Label Position reference (Secondary)
  const secondaryLabelRef = secondaryRays[0];
  const secondaryLabelX = clamp(secondaryLabelRef.end.x, 50, width - 120);
  const secondaryLabelY = clamp(secondaryLabelRef.end.y, 50, height - 50);

  /**
   * New Synchronized Rendering Logic
   */
  const renderRaySegment = (path: RayPath, currentStep: number, isSec: boolean, index: number) => {
    const segments = [];
    // Increase thickness if spectrum to make it look like a continuous band
    const strokeW = showSpectrum ? 3 : 2; 
    const strokeOp = isSec ? (showSpectrum ? 0.6 : 0.5) : (showSpectrum ? 0.9 : 0.8); 
    
    // Distinguish Input Rays AND Internal Rays:
    // Secondary Path (isSec=true) will be DASHED everywhere
    // Primary Path (isSec=false) will be SOLID everywhere
    const lineStyle = isSec ? "5 3" : "none"; 

    // 1. Incoming (Visible from Start)
    if (currentStep >= 0) {
        segments.push(
            <line key={`seg1-${isSec}-${index}`} 
                x1={path.start.x} y1={path.start.y} 
                x2={path.entry.x} y2={path.entry.y}
                stroke={showSpectrum ? path.color : "white"} 
                strokeWidth={strokeW} 
                strokeOpacity={strokeOp} 
                strokeDasharray={lineStyle}
            />
        );
    }
    
    // 2. Refraction / Inside Leg 1 (Step 1+)
    if (currentStep >= 1) {
      segments.push(
        <line key={`seg2-${isSec}-${index}`} 
            x1={path.entry.x} y1={path.entry.y} 
            x2={path.back.x} y2={path.back.y}
            stroke={path.color} 
            strokeWidth={showSpectrum ? 2 : 2} 
            strokeOpacity={strokeOp} 
            strokeDasharray={lineStyle}
        />
      );
    }

    // 3. Reflection 1 (Step 2+)
    if (currentStep >= 2) {
       if (!isSec) {
           segments.push(
                <line key={`seg3-${isSec}-${index}`} 
                    x1={path.back.x} y1={path.back.y} 
                    x2={path.exit.x} y2={path.exit.y}
                    stroke={path.color} strokeWidth={showSpectrum ? 2 : 2} strokeOpacity={strokeOp} 
                    strokeDasharray={lineStyle}
                />
           );
       } else if (path.back2) {
           segments.push(
                <line key={`seg3-sec-${isSec}-${index}`} 
                    x1={path.back.x} y1={path.back.y} 
                    x2={path.back2.x} y2={path.back2.y}
                    stroke={path.color} strokeWidth={showSpectrum ? 2 : 2} strokeOpacity={strokeOp} 
                    strokeDasharray={lineStyle}
                />
           );
       }
    }

    // 4. Divergence (Step 3+)
    if (currentStep >= 3) {
      if (!isSec) {
          // Primary Exit (Solid)
          segments.push(
            <line key={`segExit-${isSec}-${index}`} 
                x1={path.exit.x} y1={path.exit.y} 
                x2={path.end.x} y2={path.end.y}
                stroke={path.color} strokeWidth={showSpectrum ? 4 : 4} strokeOpacity={1} 
                strokeDasharray={lineStyle}
            />
          );
      } else if (path.back2) {
          // Secondary Internal Leg 3 (Dashed)
          segments.push(
            <line key={`seg4-sec-${isSec}-${index}`} 
                x1={path.back2.x} y1={path.back2.y} 
                x2={path.exit.x} y2={path.exit.y}
                stroke={path.color} strokeWidth={showSpectrum ? 2 : 2} strokeOpacity={strokeOp} 
                strokeDasharray={lineStyle}
            />
       );
      }
    }

    // 5. Secondary Exit (Step 4+)
    if (currentStep >= 4) {
        if (isSec) {
            segments.push(
                <line key={`segExit-${isSec}-${index}`} 
                    x1={path.exit.x} y1={path.exit.y} 
                    x2={path.end.x} y2={path.end.y}
                    stroke={path.color} strokeWidth={showSpectrum ? 3 : 2} strokeOpacity={0.7} 
                    strokeDasharray={lineStyle}
                />
              );
        }
    }

    return segments;
  };

  /**
   * Renders a realistic spectrum legend without "Inner/Outer" labels.
   */
  const renderSpectrumLegend = (x: number, y: number, isPrimary: boolean) => {
      const lx = x + 20;
      const ly = y - 25;
      
      // Gradient definition is handled in <defs> below, we just use rects filled with gradient
      // We need two distinct gradients: Red-Violet and Violet-Red
      const gradId = isPrimary ? "gradPrimary" : "gradSecondary";

      return (
          <g transform={`translate(${lx}, ${ly})`} className="pointer-events-none">
              {/* Background Box */}
              <rect x="-10" y="-10" width="80" height="70" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#475569" strokeWidth="1"/>
              
              {/* Spectrum Strip */}
              <rect x="15" y="0" width="30" height="50" rx="4" fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              
              {/* Labels */}
              <text x="50" y="8" fill={isPrimary ? "#ef4444" : "#a855f7"} fontSize="10" fontWeight="bold">
                  {isPrimary ? "红" : "紫"}
              </text>
              <text x="50" y="48" fill={isPrimary ? "#a855f7" : "#ef4444"} fontSize="10" fontWeight="bold">
                  {isPrimary ? "紫" : "红"}
              </text>
              
              <text x="30" y="65" textAnchor="middle" fill="#94a3b8" fontSize="9">光谱顺序</text>
          </g>
      );
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden relative cursor-crosshair">
      <svg 
        ref={svgRef}
        width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
            <radialGradient id="dropGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
                <stop offset="90%" stopColor="rgba(148, 163, 184, 0.1)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0.4)" />
            </radialGradient>
            <radialGradient id="bgDropGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.05)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0.1)" />
            </radialGradient>
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor="transparent" />
                 <stop offset="20%" stopColor="rgba(251, 191, 36, 0.1)" />
                 <stop offset="80%" stopColor="rgba(251, 191, 36, 0.1)" />
                 <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <radialGradient id="sunGrad">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="80%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
            
            {/* Legend Gradients */}
            <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="20%" stopColor="#f97316" />
                <stop offset="40%" stopColor="#eab308" />
                <stop offset="60%" stopColor="#22c55e" />
                <stop offset="80%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
             <linearGradient id="gradSecondary" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="20%" stopColor="#3b82f6" />
                <stop offset="40%" stopColor="#22c55e" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="80%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
        </defs>
        
        {/* Background Layer */}
        <g>
            {backgroundDrops.map((drop, i) => (
                <circle key={i} cx={drop.cx} cy={drop.cy} r={drop.r} fill="url(#bgDropGradient)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.2" />
            ))}
        </g>

        {/* Center Axis */}
        <line x1="0" y1={centerY} x2={centerX} y2={centerY} stroke="#334155" strokeDasharray="5 5" strokeWidth="1" />

        {/* --- SUNLIGHT BEAM BACKGROUND (Optional, showing area) --- */}
        <rect 
            x="0" 
            y={centerY - inputY} 
            width={centerX - Math.sqrt(radius*radius - inputY*inputY)} 
            height={inputY * 2} 
            fill="url(#beamGradient)" 
        />
        
        {/* Beam Input Labels */}
        <g opacity="0.8">
            <text x="10" y={centerY - inputY - 10} fill="#fbbf24" fontSize="11" fontWeight="bold">光线 A</text>
            <text x="10" y={centerY + inputY + 20} fill="#fbbf24" fontSize="11" fontWeight="bold">光线 B</text>
        </g>

        {/* Hero Drop */}
        <circle cx={centerX} cy={centerY} r={radius} fill="url(#dropGradient)" stroke="#38bdf8" strokeWidth="3" filter="drop-shadow(0 0 10px rgba(56, 189, 248, 0.3))" />

        {/* --- RAYS --- */}
        <g filter="url(#glow)">
            {/* Primary Rays (Top Input) */}
            {primaryRays.map((ray, idx) => (
                 showSpectrum 
                 ? renderRaySegment(ray, step, false, idx)
                 : renderRaySegment({...ray, color: 'white'}, step, false, idx)
            ))}

            {/* Secondary Rays (Bottom Input) */}
            {secondaryRays.map((ray, idx) => (
                 showSpectrum 
                 ? renderRaySegment(ray, step, true, idx)
                 : renderRaySegment({...ray, color: 'white'}, step, true, idx)
            ))}
        </g>

        {/* --- DRAGGABLE CONTROLS --- */}
        <g onPointerDown={handlePointerDown} className="cursor-grab active:cursor-grabbing hover:brightness-110 transition-all">
             {/* Top Handle (Primary) */}
             <g transform={`translate(25, ${centerY - inputY})`}>
                 <g stroke="#fbbf24" strokeWidth="2">
                     {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                         <line key={deg} x1={0} y1={0} x2={22} y2={0} transform={`rotate(${deg})`} />
                     ))}
                 </g>
                 <circle r="12" fill="url(#sunGrad)" stroke="#fcd34d" strokeWidth="2" />
             </g>

             {/* Bottom Handle (Secondary) - Visual Indicator */}
             <g transform={`translate(25, ${centerY + inputY})`}>
                  <line x1={0} y1={-inputY*2} x2={0} y2={0} stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                  <circle r="8" fill="#fbbf24" opacity="0.8" />
             </g>
        </g>
        
        {/* --- LABELS & ORDER LEGEND --- */}
        {/* Step 3+ : Primary Exits */}
        {(step >= 3) && (
            <g>
                <text x={primaryLabelX} y={primaryLabelY} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 1px 2px black)">
                    🌈 主虹
                </text>
                {/* Render the Primary Color Order Legend if spectrum is shown */}
                {showSpectrum && renderSpectrumLegend(primaryLabelX, primaryLabelY, true)}
                
                <text x={primaryLabelRef.back.x + 15} y={primaryLabelRef.back.y} fill="rgba(255,255,255,0.7)" fontSize="10">1次反射</text>
            </g>
        )}
        
        {/* Step 4+ : Secondary Exits */}
        {step >= 4 && (
            <g>
                <text x={secondaryLabelX} y={secondaryLabelY} fill="#f472b6" fontSize="14" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 1px 2px black)">
                    🌈 副虹
                </text>
                {/* Render the Secondary Color Order Legend */}
                {showSpectrum && renderSpectrumLegend(secondaryLabelX, secondaryLabelY, false)}

                <text x={secondaryLabelRef.back.x + 10} y={secondaryLabelRef.back.y - 10} fill="rgba(255,255,255,0.5)" fontSize="10">1</text>
                <text x={secondaryLabelRef.back2!.x} y={secondaryLabelRef.back2!.y - 15} fill="rgba(255,255,255,0.5)" fontSize="10">2</text>
            </g>
        )}

        {/* Info Box */}
        <rect x="10" y="10" width="180" height="90" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="#334155" strokeWidth="1" />
        <text x="20" y="32" fill="#38bdf8" fontSize="12" fontWeight="bold">模式: 双轨演示 (Dual Path)</text>
        <text x="20" y="52" fill="#94a3b8" fontSize="11">⚡️ 光束宽度: {inputY.toFixed(1)}</text>
        <g fontSize="11">
             <text x="20" y="68" fill="#fbbf24" opacity="0.9">─ 光线 A (实线): 主虹 (Primary)</text>
             <text x="20" y="84" fill="#fbbf24" opacity="0.7">┄ 光线 B (虚线): 副虹 (Secondary)</text>
        </g>

      </svg>
    </div>
  );
};

export default SimulationCanvas;