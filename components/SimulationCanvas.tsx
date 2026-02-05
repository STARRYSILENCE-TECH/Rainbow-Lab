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
  microMode: 'primary' | 'secondary' | 'dual';
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ inputY, setInputY, showSpectrum, step, microMode }) => {
  const width = 600;
  const height = 450; 
  const centerX = 300;
  const centerY = 225; 
  const radius = 100;
  
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Hover states for tooltips
  const [hoverPrimary, setHoverPrimary] = useState(false);
  const [hoverSecondary, setHoverSecondary] = useState(false);

  // Visibility flags based on mode
  const showPrimary = microMode === 'primary' || microMode === 'dual';
  const showSecondary = microMode === 'secondary' || microMode === 'dual';

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
   * New Synchronized Rendering Logic with Hit Area Support
   */
  const renderRaySegment = (path: RayPath, currentStep: number, isSec: boolean, index: number, isHitArea: boolean = false) => {
    const segments = [];
    
    // Configuration for Hit Area vs Visual Area
    const strokeColor = isHitArea ? "transparent" : (showSpectrum ? path.color : "white");
    const baseWidth = showSpectrum ? 3 : 2;
    const strokeW = isHitArea ? 16 : baseWidth; // Thick line for hit area
    
    // Opacity
    const strokeOp = isHitArea ? 1 : (isSec ? (showSpectrum ? 0.6 : 0.5) : (showSpectrum ? 0.9 : 0.8));
    
    // Line Styles (Dashed for Secondary)
    // For HitArea, we use solid lines to ensure mouse events are captured even in the gaps of dashed lines
    const lineStyle = (isSec && !isHitArea) ? "5 3" : "none"; 
    const inputDash = (isSec && !isHitArea) ? "6 4" : "0"; 

    const keySuffix = isHitArea ? 'hit' : 'vis';

    // 1. Incoming (Visible from Start)
    if (currentStep >= 0) {
        segments.push(
            <line key={`seg1-${isSec}-${index}-${keySuffix}`} 
                x1={path.start.x} y1={path.start.y} 
                x2={path.entry.x} y2={path.entry.y}
                stroke={strokeColor} 
                strokeWidth={strokeW} 
                strokeOpacity={strokeOp} 
                strokeDasharray={inputDash}
            />
        );
    }
    
    // 2. Refraction / Inside Leg 1 (Step 1+)
    if (currentStep >= 1) {
      segments.push(
        <line key={`seg2-${isSec}-${index}-${keySuffix}`} 
            x1={path.entry.x} y1={path.entry.y} 
            x2={path.back.x} y2={path.back.y}
            stroke={strokeColor} 
            strokeWidth={isHitArea ? strokeW : (showSpectrum ? 2 : 2)} 
            strokeOpacity={strokeOp} 
            strokeDasharray={lineStyle}
        />
      );
    }

    // 3. Reflection 1 (Step 2+)
    if (currentStep >= 2) {
       if (!isSec) {
           segments.push(
                <line key={`seg3-${isSec}-${index}-${keySuffix}`} 
                    x1={path.back.x} y1={path.back.y} 
                    x2={path.exit.x} y2={path.exit.y}
                    stroke={strokeColor} 
                    strokeWidth={isHitArea ? strokeW : (showSpectrum ? 2 : 2)} 
                    strokeOpacity={strokeOp} 
                    strokeDasharray={lineStyle}
                />
           );
       } else if (path.back2) {
           segments.push(
                <line key={`seg3-sec-${isSec}-${index}-${keySuffix}`} 
                    x1={path.back.x} y1={path.back.y} 
                    x2={path.back2.x} y2={path.back2.y}
                    stroke={strokeColor} 
                    strokeWidth={isHitArea ? strokeW : (showSpectrum ? 2 : 2)} 
                    strokeOpacity={strokeOp} 
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
            <line key={`segExit-${isSec}-${index}-${keySuffix}`} 
                x1={path.exit.x} y1={path.exit.y} 
                x2={path.end.x} y2={path.end.y}
                stroke={strokeColor} 
                strokeWidth={isHitArea ? strokeW : (showSpectrum ? 4 : 4)} 
                strokeOpacity={isHitArea ? 1 : 1} 
                strokeDasharray={lineStyle}
            />
          );
      } else if (path.back2) {
          // Secondary Internal Leg 3 (Dashed)
          segments.push(
            <line key={`seg4-sec-${isSec}-${index}-${keySuffix}`} 
                x1={path.back2.x} y1={path.back2.y} 
                x2={path.exit.x} y2={path.exit.y}
                stroke={strokeColor} 
                strokeWidth={isHitArea ? strokeW : (showSpectrum ? 2 : 2)} 
                strokeOpacity={strokeOp} 
                strokeDasharray={lineStyle}
            />
       );
      }
    }

    // 5. Secondary Exit (Step 4+)
    if (currentStep >= 4) {
        if (isSec) {
            segments.push(
                <line key={`segExit-${isSec}-${index}-${keySuffix}`} 
                    x1={path.exit.x} y1={path.exit.y} 
                    x2={path.end.x} y2={path.end.y}
                    stroke={strokeColor} 
                    strokeWidth={isHitArea ? strokeW : (showSpectrum ? 3 : 2)} 
                    strokeOpacity={isHitArea ? 1 : 0.7} 
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
      // Offset legend to the right of the label to avoid blocking rays
      const lx = x + 35; 
      const ly = y - 35;
      
      const gradId = isPrimary ? "gradPrimary" : "gradSecondary";

      return (
          <g transform={`translate(${lx}, ${ly})`} className="pointer-events-none" opacity="0.95">
              {/* Connector Line to Label */}
              <line x1="-15" y1="35" x2="-5" y2="35" stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" />

              {/* Background Box */}
              <rect x="-5" y="-10" width="80" height="80" rx="6" fill="rgba(15, 23, 42, 0.95)" stroke="#475569" strokeWidth="1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"/>
              
              {/* Spectrum Strip */}
              <rect x="15" y="5" width="20" height="50" rx="2" fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              
              {/* Labels */}
              <text x="45" y="12" fill={isPrimary ? "#ef4444" : "#a855f7"} fontSize="10" fontWeight="bold">
                  {isPrimary ? "红" : "紫"}
              </text>
              <text x="45" y="52" fill={isPrimary ? "#a855f7" : "#ef4444"} fontSize="10" fontWeight="bold">
                  {isPrimary ? "紫" : "红"}
              </text>
              
              <text x="35" y="66" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">光谱顺序</text>
          </g>
      );
  };
  
  // Render annotated points for single-track mode
  const renderEventPoints = () => {
      // Only for single track modes
      if (microMode === 'dual') return null;

      // Use the middle ray (index 2 - Yellow) for positioning text centrally
      const ray = microMode === 'primary' ? primaryRays[2] : secondaryRays[2];
      const labels = [];

      // Common style for label
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const TextLabel = ({ x, y, text, align = "middle", dy = -10 }: any) => (
          <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
              <circle r="4" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />
              <text y={dy} textAnchor={align} fill="#fbbf24" fontSize="11" fontWeight="bold" 
                    style={{ textShadow: "0px 1px 3px #000" }}>
                  {text}
              </text>
          </g>
      );

      // Primary Sequence
      if (microMode === 'primary') {
          // Step 1: Entry Refraction
          if (step >= 1) {
             labels.push(<TextLabel key="p1" x={ray.entry.x} y={ray.entry.y} text="1.折射" align="end" dy={-10} />);
          }
          // Step 2: Back Reflection
          if (step >= 2) {
             labels.push(<TextLabel key="p2" x={ray.back.x} y={ray.back.y} text="2.反射" align="start" dy={-10} />);
          }
          // Step 3: Exit Refraction
          if (step >= 3) {
             labels.push(<TextLabel key="p3" x={ray.exit.x} y={ray.exit.y} text="3.折射" align="end" dy={15} />);
          }
      }

      // Secondary Sequence
      if (microMode === 'secondary') {
          // Step 1: Entry Refraction
          if (step >= 1) {
             labels.push(<TextLabel key="s1" x={ray.entry.x} y={ray.entry.y} text="1.折射" align="end" dy={15} />);
          }
          // Step 2: Back 1 Reflection
          if (step >= 2) {
             labels.push(<TextLabel key="s2" x={ray.back.x} y={ray.back.y} text="2.反射" align="start" dy={-10} />);
          }
           // Step 3: Back 2 Reflection
          if (step >= 3 && ray.back2) {
             labels.push(<TextLabel key="s3" x={ray.back2.x} y={ray.back2.y} text="3.反射" align="middle" dy={-12} />);
          }
          // Step 4: Exit Refraction
          if (step >= 4) {
             labels.push(<TextLabel key="s4" x={ray.exit.x} y={ray.exit.y} text="4.折射" align="start" dy={-10} />);
          }
      }
      
      return <g>{labels}</g>;
  };

  // Label Generation based on mode
  const getModeLabel = () => {
      if (microMode === 'primary') return "模式: 主虹单轨 (Primary)";
      if (microMode === 'secondary') return "模式: 副虹单轨 (Secondary)";
      return "模式: 双轨演示 (Dual)";
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
        {/* Primary Beam Area */}
        {showPrimary && (
            <rect 
                x="0" 
                y={centerY - inputY} 
                width={centerX - Math.sqrt(radius*radius - inputY*inputY)} 
                height={inputY} 
                fill="url(#beamGradient)" 
            />
        )}
        {/* Secondary Beam Area */}
        {showSecondary && (
            <rect 
                x="0" 
                y={centerY} 
                width={centerX - Math.sqrt(radius*radius - inputY*inputY)} 
                height={inputY} 
                fill="url(#beamGradient)" 
            />
        )}
        
        {/* Beam Input Labels */}
        <g opacity="0.8">
            {showPrimary && (
                <text x="10" y={centerY - inputY - 10} fill="#fbbf24" fontSize="11" fontWeight="bold">光线 A</text>
            )}
            {showSecondary && (
                <text x="10" y={centerY + inputY + 20} fill="#fbbf24" fontSize="11" fontWeight="bold">光线 B</text>
            )}
        </g>

        {/* Hero Drop */}
        <circle cx={centerX} cy={centerY} r={radius} fill="url(#dropGradient)" stroke="#38bdf8" strokeWidth="3" filter="drop-shadow(0 0 10px rgba(56, 189, 248, 0.3))" />

        {/* --- RAYS --- */}
        {/* We use groups with pointer events to detect hover on the entire ray path bundle */}
        <g filter="url(#glow)">
            
            {/* PRIMARY RAYS GROUP (Solid) */}
            {showPrimary && (
                <g 
                    onPointerEnter={() => setHoverPrimary(true)} 
                    onPointerLeave={() => setHoverPrimary(false)}
                    className="cursor-help"
                >
                    {/* Visual Rays */}
                    {primaryRays.map((ray, idx) => (
                        showSpectrum 
                        ? renderRaySegment(ray, step, false, idx, false)
                        : renderRaySegment({...ray, color: 'white'}, step, false, idx, false)
                    ))}
                    
                    {/* HIT AREA (Thick Transparent Lines for easy hovering) */}
                    {primaryRays.map((ray, idx) => renderRaySegment(ray, step, false, idx, true))}
                </g>
            )}

            {/* SECONDARY RAYS GROUP (Dashed) */}
            {showSecondary && (
                <g 
                    onPointerEnter={() => setHoverSecondary(true)} 
                    onPointerLeave={() => setHoverSecondary(false)}
                    className="cursor-help"
                >
                    {/* Visual Rays */}
                    {secondaryRays.map((ray, idx) => (
                        showSpectrum 
                        ? renderRaySegment(ray, step, true, idx, false)
                        : renderRaySegment({...ray, color: 'white'}, step, true, idx, false)
                    ))}

                    {/* HIT AREA (Thick Transparent Lines) */}
                    {secondaryRays.map((ray, idx) => renderRaySegment(ray, step, true, idx, true))}
                </g>
            )}
        </g>
        
        {/* --- EVENT LABELS (New) --- */}
        {renderEventPoints()}

        {/* --- DRAGGABLE CONTROLS --- */}
        <g onPointerDown={handlePointerDown} className="cursor-grab active:cursor-grabbing hover:brightness-110 transition-all">
             {/* Top Handle (Primary) */}
             {showPrimary && (
                 <g transform={`translate(25, ${centerY - inputY})`}>
                     <g stroke="#fbbf24" strokeWidth="2">
                         {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                             <line key={deg} x1={0} y1={0} x2={22} y2={0} transform={`rotate(${deg})`} />
                         ))}
                     </g>
                     <circle r="12" fill="url(#sunGrad)" stroke="#fcd34d" strokeWidth="2" />
                 </g>
             )}

             {/* Bottom Handle (Secondary) */}
             {showSecondary && (
                 <g transform={`translate(25, ${centerY + inputY})`}>
                      <line x1={0} y1={-inputY*2} x2={0} y2={0} stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                      <circle r="8" fill="#fbbf24" opacity="0.8" />
                 </g>
             )}
        </g>
        
        {/* --- LABELS & ORDER LEGEND --- */}
        {/* Step 3+ : Primary Exits */}
        {showPrimary && step >= 3 && (
            <g className="pointer-events-none">
                <text x={primaryLabelX} y={primaryLabelY} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 1px 2px black)">
                    🌈 主虹
                </text>
                
                {/* Render the Primary Color Order Legend ON HOVER only */}
                {showSpectrum && hoverPrimary && renderSpectrumLegend(primaryLabelX, primaryLabelY, true)}
                
                <text x={primaryLabelRef.back.x + 15} y={primaryLabelRef.back.y} fill="rgba(255,255,255,0.7)" fontSize="10">1次反射</text>
            </g>
        )}
        
        {/* Step 4+ : Secondary Exits */}
        {showSecondary && step >= 4 && (
            <g className="pointer-events-none">
                <text x={secondaryLabelX} y={secondaryLabelY} fill="#f472b6" fontSize="14" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 1px 2px black)">
                    🌈 副虹
                </text>
                
                {/* Render the Secondary Color Order Legend ON HOVER only */}
                {showSpectrum && hoverSecondary && renderSpectrumLegend(secondaryLabelX, secondaryLabelY, false)}

                <text x={secondaryLabelRef.back.x + 10} y={secondaryLabelRef.back.y - 10} fill="rgba(255,255,255,0.5)" fontSize="10">1</text>
                <text x={secondaryLabelRef.back2!.x} y={secondaryLabelRef.back2!.y - 15} fill="rgba(255,255,255,0.5)" fontSize="10">2</text>
            </g>
        )}

        {/* Info Box */}
        <rect x="10" y="10" width="180" height="90" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="#334155" strokeWidth="1" />
        <text x="20" y="32" fill="#38bdf8" fontSize="12" fontWeight="bold">{getModeLabel()}</text>
        <text x="20" y="52" fill="#94a3b8" fontSize="11">⚡️ 光束宽度: {inputY.toFixed(1)}</text>
        <g fontSize="11">
             <text x="20" y="68" fill="#fbbf24" opacity={showPrimary ? 1 : 0.3}>─ 光线 A (实线): 主虹 (Primary)</text>
             <text x="20" y="84" fill="#fbbf24" opacity={showSecondary ? 0.7 : 0.2}>┄ 光线 B (虚线): 副虹 (Secondary)</text>
        </g>

      </svg>
    </div>
  );
};

export default SimulationCanvas;