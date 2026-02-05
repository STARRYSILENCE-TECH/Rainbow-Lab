import React, { useMemo, useRef, useState } from 'react';

interface MacroViewCanvasProps {
  sunAngle: number; // 0 to 60 degrees
  setSunAngle: (a: number) => void;
  step: number;
}

const MacroViewCanvas: React.FC<MacroViewCanvasProps> = ({ sunAngle, setSunAngle, step }) => {
  // Canvas Dimensions
  const width = 600;
  const height = 450;
  
  // Key Coordinates
  const observerX = 240; 
  const groundY = 320;
  const eyeY = groundY - 60; 
  
  // Rain sheet position
  const rainX = 520;
  
  // Math: Sun Orbit
  const sunOrbitRadius = 180; 
  const sunRad = (sunAngle * Math.PI) / 180;
  
  // Sun Position
  const sunX = observerX - sunOrbitRadius * Math.cos(sunRad);
  const sunY = eyeY - sunOrbitRadius * Math.sin(sunRad);

  const antisolarRad = sunRad; 
  const rainbowAngleRad = (42 * Math.PI) / 180;
  const lineOfSightAngleRad = antisolarRad - rainbowAngleRad; 
  
  // Calculate Rainbow Intersection with Rain Plane
  const dx = rainX - observerX;
  const rbYAtRain = eyeY + dx * Math.tan(lineOfSightAngleRad);
  
  // Antisolar Point Line End
  const asLen = 600;
  const asEndX = observerX + asLen * Math.cos(antisolarRad);
  const asEndY = eyeY + asLen * Math.sin(antisolarRad);

  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag Interaction Logic
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const mx = (e.clientX - CTM.e) / CTM.a;
    const my = (e.clientY - CTM.f) / CTM.d;

    // Calculate angle relative to Observer Eye
    // Vector Observer -> Mouse: (mx - observerX, my - eyeY)
    // Note SVG Y is positive down.
    // dx = observerX - mx (positive to left, where sun is)
    // dy = eyeY - my (positive UP)
    const deltaX = observerX - mx;
    const deltaY = eyeY - my;

    // Angle = atan2(dy, dx)
    const angleRad = Math.atan2(deltaY, deltaX);
    let angleDeg = (angleRad * 180) / Math.PI;

    // Clamp between 0 and 60
    angleDeg = Math.max(0, Math.min(60, angleDeg));
    
    setSunAngle(angleDeg);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const rainbowElevationDeg = 42 - sunAngle;

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden relative cursor-crosshair">
      <svg 
        ref={svgRef}
        width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="60%" stopColor="#334155" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="20%" stopColor="#eab308" />
            <stop offset="40%" stopColor="#22c55e" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="rainCurtainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0)" />
            <stop offset="30%" stopColor="rgba(56, 189, 248, 0.15)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0.05)" />
          </linearGradient>
          <filter id="glowSun">
             <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>
        
        {/* Background Sky */}
        <rect width={width} height={height} fill="url(#skyGradient)" />
        
        {/* Ground */}
        <path d={`M0 ${groundY} L${width} ${groundY}`} stroke="#64748b" strokeWidth="2" />
        <rect x="0" y={groundY} width={width} height={height-groundY} fill="#1e293b" opacity="0.8" />
        
        {/* --- RAIN CURTAIN VISUAL --- */}
        <g>
            {/* 1. The Curtain Area (Gradient) */}
            <rect 
                x={rainX - 50} 
                y={60} 
                width={100} 
                height={height} 
                fill="url(#rainCurtainGrad)" 
            />

            {/* 2. Falling Rain Drops (SVG Animation) */}
            <g clipPath="inset(0 0 0 0)">
                 {[...Array(9)].map((_, i) => (
                     <line 
                        key={i}
                        x1={rainX - 40 + i * 10} 
                        y1={70} 
                        x2={rainX - 40 + i * 10} 
                        y2={height} 
                        stroke="#bae6fd" 
                        strokeWidth="1.5" 
                        strokeDasharray="15 25"
                        opacity="0.5"
                     >
                        <animate 
                            attributeName="stroke-dashoffset" 
                            from={40} 
                            to={0} 
                            dur={`${0.6 + (i % 3) * 0.3}s`} 
                            repeatCount="indefinite" 
                        />
                     </line>
                 ))}
            </g>

            {/* 3. The Cloud (Source of rain) */}
            <g transform={`translate(${rainX}, 60)`}>
                {/* Stylized Cloud Path */}
                <path 
                    d="M -40 0 Q -40 -25 -15 -25 Q -10 -40 15 -40 Q 40 -40 40 -15 Q 55 -15 55 5 Q 55 25 35 25 L -35 25 Q -55 25 -55 5 Q -55 0 -40 0 Z"
                    fill="#cbd5e1" 
                    stroke="#94a3b8" 
                    strokeWidth="2"
                    filter="drop-shadow(2px 4px 6px rgba(0,0,0,0.3))"
                />
                <text x="0" y="-50" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold">🌧️ 雨幕</text>
            </g>
        </g>

        {/* Horizontal Eye Level Line (Reference) */}
        <line 
            x1={0} y1={eyeY} 
            x2={width} y2={eyeY} 
            stroke="#475569" 
            strokeWidth="1" 
            strokeDasharray="2 2"
        />

        {/* Sun Rays (Dynamic) */}
        {step >= 0 && (
          <g>
            {/* Main beam from sun to observer */}
            <line 
                x1={sunX} y1={sunY}
                x2={observerX} y2={eyeY}
                stroke="#fbbf24" strokeWidth="2" opacity="0.3" strokeDasharray="5 5"
            />
            {/* Sun Angle Arc (Left side) */}
            <path 
                d={`M ${observerX - 60} ${eyeY} A 60 60 0 0 1 ${observerX - 60 * Math.cos(sunRad)} ${eyeY - 60 * Math.sin(sunRad)}`}
                fill="none" 
                stroke="#fbbf24" 
                strokeWidth="1.5" 
            />
            <text x={observerX - 80} y={eyeY - 10} fill="#fbbf24" fontSize="10">
                {sunAngle.toFixed(1)}°
            </text>
          </g>
        )}

        {/* Sun Object - DRAGGABLE */}
        <g 
            transform={`translate(${sunX}, ${sunY})`}
            onPointerDown={handlePointerDown}
            className="cursor-grab active:cursor-grabbing hover:brightness-110"
        >
            <circle r="18" fill="#fbbf24" filter="url(#glowSun)" opacity="1" />
            <circle r="22" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.5">
               <animate attributeName="r" values="22;25;22" dur="3s" repeatCount="indefinite" />
            </circle>
            {/* Drag Hint */}
             <text y="35" fill="#fbbf24" fontSize="10" textAnchor="middle" opacity="0.8" style={{pointerEvents: 'none'}}>
                     ↔ 拖动
             </text>
        </g>

        {/* Observer Stick Figure */}
        <g stroke="white" strokeWidth="2" fill="none">
            {/* Head */}
            <circle cx={observerX} cy={eyeY} r="10" fill="#0f172a" />
            {/* Body */}
            <line x1={observerX} y1={eyeY+10} x2={observerX} y2={groundY-20} />
            {/* Legs */}
            <line x1={observerX} y1={groundY-20} x2={observerX-12} y2={groundY} />
            <line x1={observerX} y1={groundY-20} x2={observerX+12} y2={groundY} />
            {/* Arms pointing at rainbow */}
            <line x1={observerX} y1={eyeY+15} x2={observerX+15} y2={eyeY+10} />
        </g>

        {/* Antisolar Point Line */}
        {step >= 1 && (
            <g>
                <line 
                    x1={observerX} y1={eyeY} 
                    x2={asEndX} y2={asEndY} 
                    stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4"
                />
                
                <circle cx={observerX + 200 * Math.cos(antisolarRad)} cy={eyeY + 200 * Math.sin(antisolarRad)} r="3" fill="#94a3b8" />
                <text x={observerX + 210 * Math.cos(antisolarRad)} y={eyeY + 200 * Math.sin(antisolarRad) + 15} fill="#94a3b8" fontSize="12" textAnchor="middle">
                    反日点方向
                </text>
            </g>
        )}

        {/* Rainbow Ray & Angles */}
        {step >= 2 && (
            <g>
                <line 
                    x1={observerX} y1={eyeY} 
                    x2={rainX} y2={rbYAtRain} 
                    stroke="url(#rainbowGrad)" strokeWidth="2" opacity="0.8"
                />
                
                {/* 42 Degree Arc (Relative to Antisolar Line) */}
                <path 
                    d={`M ${observerX + 50 * Math.cos(antisolarRad)} ${eyeY + 50 * Math.sin(antisolarRad)} 
                        A 50 50 0 0 0 
                        ${observerX + 50 * Math.cos(lineOfSightAngleRad)} ${eyeY + 50 * Math.sin(lineOfSightAngleRad)}`}
                    fill="none" stroke="white" strokeWidth="1" opacity="0.5"
                />
                <text x={observerX + 60} y={eyeY + 20} fill="white" fontSize="10">42°</text>

                {/* Rainbow Elevation Angle Arc (Relative to Horizon) */}
                {/* Only draw if visible above horizon */}
                { rainbowElevationDeg > 0 && (
                    <g>
                        <path 
                            d={`M ${observerX + 80} ${eyeY} 
                                A 80 80 0 0 0 
                                ${observerX + 80 * Math.cos(lineOfSightAngleRad)} ${eyeY + 80 * Math.sin(lineOfSightAngleRad)}`}
                            fill="none" stroke="#a855f7" strokeWidth="1.5"
                        />
                         <text x={observerX + 90} y={eyeY - 20} fill="#a855f7" fontSize="10" fontWeight="bold">
                            {rainbowElevationDeg.toFixed(1)}°
                        </text>
                    </g>
                )}
            </g>
        )}

        {/* Rainbow Strip on Rain Sheet */}
        {step >= 2 && (
            <g>
                 <defs>
                    <filter id="blurRainbow">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                    </filter>
                 </defs>
                 
                 <rect 
                    x={rainX - 5} 
                    y={rbYAtRain - 20} 
                    width="10" 
                    height="40" 
                    fill="url(#rainbowGrad)" 
                    filter="url(#blurRainbow)"
                    opacity={rbYAtRain > groundY ? 0.3 : 1} 
                 />
                 
                 <text 
                    x={rainX + 10} 
                    y={rbYAtRain} 
                    fill={rbYAtRain > groundY ? "#ef4444" : "white"} 
                    fontSize="12" 
                    fontWeight="bold"
                    alignmentBaseline="middle"
                 >
                    {rbYAtRain > groundY ? "看不见 (地下)" : "彩虹"}
                 </text>
            </g>
        )}
        
        {/* INFO BOX */}
        <rect x="10" y="10" width="140" height="60" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="#334155" strokeWidth="1" />
        <text x="20" y="32" fill="#fbbf24" fontSize="12" fontWeight="bold">☀️ 太阳高度: {sunAngle.toFixed(1)}°</text>
        <text x="20" y="54" fill={rainbowElevationDeg < 0 ? "#94a3b8" : "#a855f7"} fontSize="12" fontWeight="bold">
            🌈 彩虹高度: {rainbowElevationDeg.toFixed(1)}°
        </text>

      </svg>
    </div>
  );
};

export default MacroViewCanvas;