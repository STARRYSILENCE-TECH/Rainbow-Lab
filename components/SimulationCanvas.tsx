
import React, { useRef, useState, useMemo } from 'react';
import { calculateRayPath, calculateDoubleReflectionRayPath, REFRACTIVE_INDEX_RED, REFRACTIVE_INDEX_GREEN, REFRACTIVE_INDEX_VIOLET, RayPath } from '../utils/physics';

interface SimulationCanvasProps {
  inputY: number; // Controlled by slider
  setInputY: (y: number) => void;
  showSpectrum: boolean;
  step: number; // 0-3: Primary only, 4-5: Both
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ inputY, setInputY, showSpectrum, step }) => {
  const width = 600;
  const height = 450; 
  const centerX = 300;
  const centerY = 225; 
  const radius = 100;
  
  const showSecondary = step >= 4;

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
  const primaryRed = calculateRayPath(inputY, radius, REFRACTIVE_INDEX_RED, '#ef4444', centerX, centerY);
  const primaryGreen = calculateRayPath(inputY, radius, REFRACTIVE_INDEX_GREEN, '#22c55e', centerX, centerY);
  const primaryViolet = calculateRayPath(inputY, radius, REFRACTIVE_INDEX_VIOLET, '#a855f7', centerX, centerY);

  const secondaryRed = calculateDoubleReflectionRayPath(inputY, radius, REFRACTIVE_INDEX_RED, '#ef4444', centerX, centerY);
  const secondaryGreen = calculateDoubleReflectionRayPath(inputY, radius, REFRACTIVE_INDEX_GREEN, '#22c55e', centerX, centerY);
  const secondaryViolet = calculateDoubleReflectionRayPath(inputY, radius, REFRACTIVE_INDEX_VIOLET, '#a855f7', centerX, centerY);

  // Helper to clamp coordinates inside canvas (with padding)
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  
  // Safe Label Positions
  const primaryLabelX = clamp(primaryRed.end.x, 50, width - 120);
  const primaryLabelY = clamp(primaryRed.end.y, 50, height - 30);
  
  const secondaryLabelX = clamp(secondaryRed.end.x, 50, width - 120);
  const secondaryLabelY = clamp(secondaryRed.end.y, 50, height - 50);

  const renderRaySegment = (path: RayPath, segmentStep: number, isSec: boolean) => {
    const segments = [];
    const strokeW = showSpectrum ? 2 : 3;
    const strokeOp = isSec ? (showSpectrum ? 0.5 : 0.6) : (showSpectrum ? 0.8 : 0.9); 
    
    // Incoming
    segments.push(
      <line key={`seg1-${isSec}`} x1={path.start.x} y1={path.start.y} x2={path.entry.x} y2={path.entry.y}
        stroke={showSpectrum ? path.color : "white"} strokeWidth={strokeW} strokeOpacity={strokeOp} />
    );
    
    // Internal 1
    if (segmentStep >= 1) {
      segments.push(
        <line key={`seg2-${isSec}`} x1={path.entry.x} y1={path.entry.y} x2={path.back.x} y2={path.back.y}
          stroke={path.color} strokeWidth={2} strokeOpacity={strokeOp} />
      );
    }

    // Internal 2
    if (segmentStep >= 2) {
       if (isSec && path.back2) {
           segments.push(
                <line key={`seg3-sec-${isSec}`} x1={path.back.x} y1={path.back.y} x2={path.back2.x} y2={path.back2.y}
                stroke={path.color} strokeWidth={2} strokeOpacity={strokeOp} />
           );
           segments.push(
                <line key={`seg4-sec-${isSec}`} x1={path.back2.x} y1={path.back2.y} x2={path.exit.x} y2={path.exit.y}
                stroke={path.color} strokeWidth={2} strokeOpacity={strokeOp} />
           );
       } else {
           segments.push(
                <line key={`seg3-${isSec}`} x1={path.back.x} y1={path.back.y} x2={path.exit.x} y2={path.exit.y}
                stroke={path.color} strokeWidth={2} strokeOpacity={strokeOp} />
           );
       }
    }

    // Exit
    if ((!isSec && segmentStep >= 3) || (isSec && segmentStep >= 4)) {
      segments.push(
        <line key={`segExit-${isSec}`} x1={path.exit.x} y1={path.exit.y} x2={path.end.x} y2={path.end.y}
          stroke={path.color} strokeWidth={isSec ? 2 : 4} strokeOpacity={isSec ? 0.6 : 1} />
      );
    }

    return segments;
  };

  /**
   * Renders a "Sky Slice" Legend next to the ray exit to show Inner vs Outer clearly.
   */
  const renderOrderLegend = (x: number, y: number, isPrimary: boolean) => {
      // Offset for drawing the mini-legend relative to the ray end
      const lx = x + 15;
      const ly = y - 30;

      // Primary: Outer=Red, Inner=Violet. (Red is 'Higher' in angle, Visually Top here)
      // Secondary: Outer=Violet, Inner=Red.
      
      const topColor = isPrimary ? '#ef4444' : '#a855f7';
      const bottomColor = isPrimary ? '#a855f7' : '#ef4444';
      const topLabel = isPrimary ? '红' : '紫';
      const bottomLabel = isPrimary ? '紫' : '红';

      return (
          <g transform={`translate(${lx}, ${ly})`} className="pointer-events-none">
              <rect x="-5" y="-5" width="90" height="60" rx="4" fill="rgba(0,0,0,0.7)" stroke="#475569" strokeWidth="1"/>
              
              {/* Outer Arc Segment */}
              <path d="M 0 0 Q 40 -10 80 0" fill="none" stroke={topColor} strokeWidth="4" />
              <text x="85" y="4" fill={topColor} fontSize="10" fontWeight="bold">{topLabel}</text>
              <text x="0" y="-12" fill="#94a3b8" fontSize="9">⬆️ 外圈 (Outer)</text>

              {/* Inner Arc Segment */}
              <path d="M 0 20 Q 40 10 80 20" fill="none" stroke={bottomColor} strokeWidth="4" />
              <text x="85" y="24" fill={bottomColor} fontSize="10" fontWeight="bold">{bottomLabel}</text>
              <text x="0" y="40" fill="#94a3b8" fontSize="9">⬇️ 内圈 (Inner)</text>
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
        </defs>
        
        {/* Background Layer */}
        <g>
            {backgroundDrops.map((drop, i) => (
                <circle key={i} cx={drop.cx} cy={drop.cy} r={drop.r} fill="url(#bgDropGradient)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.2" />
            ))}
        </g>

        {/* Center Axis */}
        <line x1="0" y1={centerY} x2={centerX} y2={centerY} stroke="#334155" strokeDasharray="5 5" strokeWidth="1" />

        {/* --- SUNLIGHT BEAM --- */}
        {showSecondary ? (
            <rect 
                x="0" 
                y={centerY - inputY} 
                width={centerX - Math.sqrt(radius*radius - inputY*inputY)} 
                height={inputY * 2} 
                fill="url(#beamGradient)" 
            />
        ) : (
            <rect 
                x="0" 
                y={centerY - inputY - 4} 
                width={centerX - Math.sqrt(radius*radius - inputY*inputY)} 
                height={8} 
                fill="url(#beamGradient)" 
            />
        )}

        {/* Hero Drop */}
        <circle cx={centerX} cy={centerY} r={radius} fill="url(#dropGradient)" stroke="#38bdf8" strokeWidth="3" filter="drop-shadow(0 0 10px rgba(56, 189, 248, 0.3))" />

        {/* --- RAYS --- */}
        <g filter="url(#glow)">
            {/* Primary Rays (Top) */}
            {showSpectrum ? (
                <>
                    {renderRaySegment(primaryRed, step, false)}
                    {renderRaySegment(primaryGreen, step, false)}
                    {renderRaySegment(primaryViolet, step, false)}
                </>
            ) : (
                renderRaySegment({...primaryRed, color: 'white'}, step, false)
            )}

            {/* Secondary Rays (Bottom) - Only if Step >= 4 */}
            {showSecondary && (
                 showSpectrum ? (
                    <>
                        {renderRaySegment(secondaryRed, step, true)}
                        {renderRaySegment(secondaryGreen, step, true)}
                        {renderRaySegment(secondaryViolet, step, true)}
                    </>
                ) : (
                    renderRaySegment({...secondaryRed, color: 'white'}, step, true)
                )
            )}
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

             {/* Bottom Handle (Secondary) */}
             {showSecondary && (
                 <g transform={`translate(25, ${centerY + inputY})`}>
                      <line x1={0} y1={-inputY*2} x2={0} y2={0} stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                      <circle r="8" fill="#fbbf24" opacity="0.8" />
                 </g>
             )}
        </g>
        
        {/* --- LABELS & ORDER LEGEND --- */}
        {(step >= 3) && (
            <g>
                <text x={primaryLabelX} y={primaryLabelY} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 1px 2px black)">
                    🌈 主虹 (Primary)
                </text>
                {/* Render the Primary Color Order Legend if spectrum is shown */}
                {showSpectrum && renderOrderLegend(primaryLabelX, primaryLabelY, true)}
                
                <text x={primaryRed.back.x + 15} y={primaryRed.back.y} fill="rgba(255,255,255,0.7)" fontSize="10">1次反射</text>
            </g>
        )}
        
        {showSecondary && (
            <g>
                <text x={secondaryLabelX} y={secondaryLabelY} fill="#f472b6" fontSize="14" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 1px 2px black)">
                    🌈 副虹 (Secondary)
                </text>
                {/* Render the Secondary Color Order Legend */}
                {showSpectrum && renderOrderLegend(secondaryLabelX, secondaryLabelY, false)}

                <text x={secondaryRed.back.x + 10} y={secondaryRed.back.y - 10} fill="rgba(255,255,255,0.5)" fontSize="10">1</text>
                <text x={secondaryRed.back2!.x} y={secondaryRed.back2!.y - 15} fill="rgba(255,255,255,0.5)" fontSize="10">2</text>
            </g>
        )}

        {/* Info Box */}
        <rect x="10" y="10" width="180" height="90" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="#334155" strokeWidth="1" />
        <text x="20" y="32" fill="#38bdf8" fontSize="12" fontWeight="bold">模式: {showSecondary ? "全貌 (主虹 + 副虹)" : "主虹演示"}</text>
        <text x="20" y="52" fill="#94a3b8" fontSize="11">⚡️ 光束宽度: {inputY.toFixed(1)}</text>
        <text x="20" y="68" fill="#ef4444" fontSize="11">⬆️ 上方入射 → 主虹 (红在外)</text>
        {showSecondary && <text x="20" y="84" fill="#f472b6" fontSize="11">⬇️ 下方入射 → 副虹 (紫在外)</text>}

      </svg>
    </div>
  );
};

export default SimulationCanvas;
