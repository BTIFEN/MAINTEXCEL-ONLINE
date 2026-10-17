import React from 'react';
import { DOMAINS_CONFIG, getIconByString, COLOR_PALETTES } from '../config/domainsConfig';
import { Plus, Minus } from 'lucide-react';

interface RadialNavigationProps {
  activeDomainId: string | null;
  onToggleDomain: (id: string) => void;
}

export default function RadialNavigation({ activeDomainId, onToggleDomain }: RadialNavigationProps) {
  // Center of our 560x560 canvas
  const cx = 280;
  const cy = 280;
  
  // Outer and Inner Radii for the continuous donut wedges
  const rOut = 265;
  const rIn = 180;
  const rMid = (rOut + rIn) / 2; // Radius for placing text, icon, and button (approx 222.5)

  // Helper to draw a precise SVG path for a circular donut slice
  const getWedgePath = (startAngleDeg: number, endAngleDeg: number) => {
    const toRad = Math.PI / 180;
    const startAngleRad = startAngleDeg * toRad;
    const endAngleRad = endAngleDeg * toRad;

    // Coordinates of 4 corner points of the wedge
    const xos = cx + rOut * Math.cos(startAngleRad);
    const yos = cy + rOut * Math.sin(startAngleRad);
    
    const xoe = cx + rOut * Math.cos(endAngleRad);
    const yoe = cy + rOut * Math.sin(endAngleRad);
    
    const xie = cx + rIn * Math.cos(endAngleRad);
    const yie = cy + rIn * Math.sin(endAngleRad);
    
    const xis = cx + rIn * Math.cos(startAngleRad);
    const yis = cy + rIn * Math.sin(startAngleRad);

    return `M ${xos} ${yos} A ${rOut} ${rOut} 0 0 1 ${xoe} ${yoe} L ${xie} ${yie} A ${rIn} ${rIn} 0 0 0 ${xis} ${yis} Z`;
  };

  return (
    <div className="relative w-[560px] h-[560px] shrink-0 select-none">
      
      {/* 1. Behind-Wheel SVG Layer: Continuous circular wedges & connecting bezier lines */}
      <svg className="absolute inset-0 w-full h-full z-0 overflow-visible" viewBox="0 0 560 560">
        
        {/* Soft back shadows for the main wheel */}
        <circle cx={cx} cy={cy} r={rOut} fill="#000000" fillOpacity="0.04" className="blur-md" />
        
        {/* The 12 continuous wedges forming the donut */}
        {DOMAINS_CONFIG.map((domain, index) => {
          // Span 30 degrees for each segment, centered around the hour ticks (e.g. index 0 is at -90 deg / 12:00)
          const startAngle = index * 30 - 105;
          const endAngle = (index + 1) * 30 - 105;
          
          const isActive = activeDomainId === domain.id;
          
          return (
            <path
              key={domain.id}
              d={getWedgePath(startAngle, endAngle)}
              fill={domain.hexColor}
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinejoin="round"
              className={`transition-all duration-300 cursor-pointer ${
                isActive 
                  ? 'brightness-110 drop-shadow-xl scale-[1.02] transform origin-center' 
                  : 'hover:brightness-105'
              }`}
              onClick={() => onToggleDomain(domain.id)}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />
          );
        })}

        {/* Dynamic Curved dotted connector leading to the side panel if a domain is open */}
        {activeDomainId && (
          (() => {
            const activeIndex = DOMAINS_CONFIG.findIndex(d => d.id === activeDomainId);
            if (activeIndex !== -1) {
              const activeDomain = DOMAINS_CONFIG[activeIndex];
              const midAngle = activeIndex * 30 - 90;
              const rad = (midAngle * Math.PI) / 180;
              
              // Start coordinate at the outer edge of the active segment
              const startX = cx + rOut * Math.cos(rad);
              const startY = cy + rOut * Math.sin(rad);
              
              // End coordinate targeting the side panel's menu icon position (approx 580px X, 150px Y)
              const endX = 640;
              const endY = 130;
              
              return (
                <g className="animate-in fade-in duration-300">
                  <path
                    d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY - 40}, ${endX} ${endY}`}
                    fill="none"
                    stroke={activeDomain.hexColor}
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    className="animate-[dash_10s_linear_infinite]"
                  />
                  {/* Miniature connection circles following the path */}
                  <circle cx={startX} cy={startY} r="5" fill="#FFFFFF" stroke={activeDomain.hexColor} strokeWidth="2.5" />
                  <circle cx={(startX + endX) / 2} cy={(startY - 40 + startY) / 2} r="4" fill={activeDomain.hexColor} />
                  <circle cx={endX} cy={endY} r="5" fill={activeDomain.hexColor} stroke="#FFFFFF" strokeWidth="2.5" />
                </g>
              );
            }
            return null;
          })()
        )}
      </svg>

      {/* 2. Overlaid Absolute Flex Nodes: Placement of icons, text & action buttons */}
      {DOMAINS_CONFIG.map((domain, index) => {
        const midAngle = index * 30 - 90; // Align straight UP at 12:00
        const rad = (midAngle * Math.PI) / 180;
        
        // Compute precise absolute center coordinates over the mid-point of the wedge
        const x = cx + rMid * Math.cos(rad);
        const y = cy + rMid * Math.sin(rad);

        const IconComponent = getIconByString(domain.iconName);
        const isActive = activeDomainId === domain.id;

        return (
          <div
            key={domain.id}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="z-10 w-[110px] flex flex-col items-center justify-center text-center pointer-events-none"
          >
            {/* White/light domain icon */}
            <IconComponent className="w-5 h-5 text-white/90 drop-shadow-sm mb-1.5 shrink-0" />

            {/* Domain Name text wrapped nicely */}
            <span className="text-[10px] font-extrabold text-white leading-tight mb-1.5 px-1 block select-none drop-shadow-sm truncate w-full">
              {domain.name}
            </span>

            {/* Action Trigger circular button (+ / -) exactly matching the image */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDomain(domain.id);
              }}
              className="w-5.5 h-5.5 rounded-full bg-white shadow-md flex items-center justify-center pointer-events-auto transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              {isActive ? (
                <Minus className="w-3.5 h-3.5" style={{ color: domain.hexColor }} strokeWidth="3" />
              ) : (
                <Plus className="w-3.5 h-3.5" style={{ color: domain.hexColor }} strokeWidth="3" />
              )}
            </button>
          </div>
        );
      })}

      {/* 3. The Central Hole Cover Circle: White industrial card containing the MAINTeX logo */}
      <div 
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        className="w-[340px] h-[340px] rounded-full bg-white border-8 border-slate-100/60 shadow-2xl flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none select-none"
      >
        {/* Large brand graphic */}
        <div className="w-24 h-24 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner mb-4 border border-slate-100">
          <svg className="w-18 h-18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15 C42 15, 39 8, 31 11 C24 14, 26 23, 20 27 C13 31, 7 26, 5 34 C3 42, 11 45, 11 53 C11 61, 3 64, 5 72 C7 80, 13 75, 20 79 C26 83, 24 92, 31 95 C39 98, 42 90, 50 90 C58 90, 61 98, 69 95 C76 92, 74 83, 80 79 C86 75, 93 80, 95 72 C97 64, 89 61, 89 53 C89 45, 97 42, 95 34 C93 26, 86 31, 80 27 C74 23, 76 14, 69 11 C61 8, 58 15, 50 15 Z" 
                  fill="none" stroke="#0B3C8F" strokeWidth="5.5" strokeLinejoin="round" />
            <circle cx="50" cy="53" r="18" fill="#FFFFFF" stroke="#0B3C8F" strokeWidth="3" />
            <path d="M37 62 L48 48 L62 41" stroke="#1C64F2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="37" cy="62" r="5" fill="#0B3C8F" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="48" cy="48" r="5" fill="#1C64F2" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="62" cy="41" r="6.5" fill="#1C64F2" stroke="#FFFFFF" strokeWidth="2" />
          </svg>
        </div>
        
        {/* Central Logo title matching Châtelet brand */}
        <div className="flex items-baseline font-extrabold tracking-tight leading-none text-4xl">
          <span className="text-[#0B3C8F]">MAIN</span>
          <span className="text-[#1C64F2]">TeX</span>
        </div>
        <div className="h-0.5 w-12 bg-blue-600 my-2.5 rounded-full" />
        <span className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase leading-none">
          Maintenance Excellence
        </span>
      </div>

    </div>
  );
}
