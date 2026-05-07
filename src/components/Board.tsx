import React, { useState } from 'react';
import { useGameStore } from '../game/store';
import { isValidMove } from '../game/store';
import { PlayerColor, TokenState } from '../game/constants';
import { pathGridMap, homePathGridMap, baseGridMap, getCenter } from '../game/gridMap';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = {
  red: '#F60018',
  green: '#00B140',
  yellow: '#FFD400',
  blue: '#007DFF',
  white: '#FFFFFF',
  line: '#2A2A2A',
  bg: '#F8F9FA'
};

const StarShape = ({ cx, cy, fill }: { cx: number; cy: number; fill: string }) => (
  <polygon
    points="0,-4 1.2,-1.2 4.2,-1.2 1.8,0.6 2.7,3.6 0,1.8 -2.7,3.6 -1.8,0.6 -4.2,-1.2 -1.2,-1.2"
    fill={fill}
    transform={`translate(${cx}, ${cy}) scale(1.1)`}
  />
);

const ArrowShape = ({ cx, cy, rotation, fill }: { cx: number; cy: number; rotation: number; fill: string }) => (
  <polygon
    points="-2,-2.5 2,-2.5 4,0 2,2.5 -2,2.5 0,0"
    fill={fill}
    transform={`translate(${cx}, ${cy}) rotate(${rotation}) scale(1.5)`}
  />
);

export function Board() {
  const { players, turnIndex, moveToken, diceValue, diceValues, hasRolled, isMoving } = useGameStore();
  const gameMode = useGameStore(state => state.gameMode);

  const [selectedOptions, setSelectedOptions] = useState<{tokenId: number, color: PlayerColor, validIndices: number[]} | null>(null);

  const handleTokenClick = (color: PlayerColor, tokenId: number) => {
    const currPlayer = players[turnIndex];
    if (!currPlayer || currPlayer.color !== color) return;
    if (!hasRolled || diceValues.length === 0 || isMoving) return;

    const token = currPlayer.tokens.find(t => t.id === tokenId);
    if (!token) return;

    const validIndices: number[] = [];
    const seenVals = new Set<number>();
    diceValues.forEach((val, idx) => {
       if (isValidMove(token, val, gameMode, currPlayer) && !seenVals.has(val)) {
           validIndices.push(idx);
           seenVals.add(val);
       }
    });

    if (validIndices.length === 0) return;

    if (validIndices.length === 1) {
       moveToken(color, tokenId, validIndices[0]);
       setSelectedOptions(null);
    } else {
       setSelectedOptions({ tokenId, color, validIndices });
    }
  };

  const drawGridLines = () => {
    const lines = [];
    // draw grid for arms
    for (let i = 0; i <= 6; i++) {
        // Horizontal arm lines
        lines.push(<line key={`h1-${i}`} x1="0" y1={60 + i * 10} x2="60" y2={60 + i * 10} stroke={COLORS.line} strokeWidth="0.5" />);
        lines.push(<line key={`h2-${i}`} x1="90" y1={60 + i * 10} x2="150" y2={60 + i * 10} stroke={COLORS.line} strokeWidth="0.5" />);
        // Vertical arm lines
        lines.push(<line key={`v1-${i}`} x1={60 + i * 10} y1="0" x2={60 + i * 10} y2="60" stroke={COLORS.line} strokeWidth="0.5" />);
        lines.push(<line key={`v2-${i}`} x1={60 + i * 10} y1="90" x2={60 + i * 10} y2="150" stroke={COLORS.line} strokeWidth="0.5" />);
    }
    // Cross lines inside arms
    for (let i = 1; i < 6; i++) {
        // Left arm verticals
        lines.push(<line key={`al-${i}`} x1={i * 10} y1="60" x2={i * 10} y2="90" stroke={COLORS.line} strokeWidth="0.5" />);
        // Right arm verticals
        lines.push(<line key={`ar-${i}`} x1={90 + i * 10} y1="60" x2={90 + i * 10} y2="90" stroke={COLORS.line} strokeWidth="0.5" />);
        // Top arm horizontals
        lines.push(<line key={`at-${i}`} x1="60" y1={i * 10} x2="90" y2={i * 10} stroke={COLORS.line} strokeWidth="0.5" />);
        // Bottom arm horizontals
        lines.push(<line key={`ab-${i}`} x1="60" y1={90 + i * 10} x2="90" y2={90 + i * 10} stroke={COLORS.line} strokeWidth="0.5" />);
    }
    return lines;
  };

  return (
    <div className="relative w-full aspect-square max-w-[650px] shadow-2xl rounded-2xl bg-slate-900 mx-auto select-none" onClick={() => setSelectedOptions(null)}>
      
      {/* Game Controls Overlay */}
      <div className="absolute -top-12 left-0 right-0 flex justify-between items-center px-2 z-[60]">
        <div className="flex gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const name = prompt("Enter a name for this save:", `Game ${new Set(players.filter(p=>p.isActive).map(p=>p.name)).size} Players`);
              if (name) {
                useGameStore.getState().saveGame(name);
                alert("Game saved!");
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-600 transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path><path d="M17 21v-8H7v8M7 3v5h8"></path></svg>
            SAVE
          </button>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Exit to main menu? Your current progress might be lost if unsaved.")) {
              useGameStore.getState().setGameState('menu');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold border border-red-500 transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          EXIT
        </button>
      </div>

      {/* SVG Board Base */}
      <svg viewBox="0 0 150 150" className="w-full h-full bg-white">
        
        {/* Safe Spaces & Starts (Colored Tiles) */}
        <rect x="60" y="130" width="10" height="10" fill={COLORS.red} />
        <rect x="10" y="60" width="10" height="10" fill={COLORS.green} />
        <rect x="80" y="10" width="10" height="10" fill={COLORS.yellow} />
        <rect x="130" y="80" width="10" height="10" fill={COLORS.blue} />

        {/* Home Paths */}
        <rect x="70" y="90" width="10" height="50" fill={COLORS.red} />
        <rect x="10" y="70" width="50" height="10" fill={COLORS.green} />
        <rect x="70" y="10" width="10" height="50" fill={COLORS.yellow} />
        <rect x="90" y="70" width="50" height="10" fill={COLORS.blue} />

        {/* Gray Safe spots */}
        <rect x="20" y="80" width="10" height="10" fill="#E2E8F0" />
        <rect x="60" y="20" width="10" height="10" fill="#E2E8F0" />
        <rect x="120" y="60" width="10" height="10" fill="#E2E8F0" />
        <rect x="80" y="120" width="10" height="10" fill="#E2E8F0" />

        {drawGridLines()}

        {/* Center Triangles */}
        <polygon points="60,60 75,75 60,90" fill={COLORS.green} stroke={COLORS.line} strokeWidth="0.5" />
        <polygon points="60,60 90,60 75,75" fill={COLORS.yellow} stroke={COLORS.line} strokeWidth="0.5" />
        <polygon points="90,60 90,90 75,75" fill={COLORS.blue} stroke={COLORS.line} strokeWidth="0.5" />
        <polygon points="60,90 90,90 75,75" fill={COLORS.red} stroke={COLORS.line} strokeWidth="0.5" />
        
        {/* 4 Large Corner Bases */}
        {/* Green TL */}
        <rect x="0" y="0" width="60" height="60" fill={COLORS.green} stroke={COLORS.line} strokeWidth="2" />
        <rect x="10" y="10" width="40" height="40" fill={COLORS.white} rx="6" />
        <circle cx="21" cy="21" r="5" fill={COLORS.green} opacity="0.3" />
        <circle cx="39" cy="21" r="5" fill={COLORS.green} opacity="0.3" />
        <circle cx="21" cy="39" r="5" fill={COLORS.green} opacity="0.3" />
        <circle cx="39" cy="39" r="5" fill={COLORS.green} opacity="0.3" />

        {/* Yellow TR */}
        <rect x="90" y="0" width="60" height="60" fill={COLORS.yellow} stroke={COLORS.line} strokeWidth="2" />
        <rect x="100" y="10" width="40" height="40" fill={COLORS.white} rx="6" />
        <circle cx="111" cy="21" r="5" fill={COLORS.yellow} opacity="0.3" />
        <circle cx="129" cy="21" r="5" fill={COLORS.yellow} opacity="0.3" />
        <circle cx="111" cy="39" r="5" fill={COLORS.yellow} opacity="0.3" />
        <circle cx="129" cy="39" r="5" fill={COLORS.yellow} opacity="0.3" />

        {/* Red BL */}
        <rect x="0" y="90" width="60" height="60" fill={COLORS.red} stroke={COLORS.line} strokeWidth="2" />
        <rect x="10" y="100" width="40" height="40" fill={COLORS.white} rx="6" />
        <circle cx="21" cy="111" r="5" fill={COLORS.red} opacity="0.3" />
        <circle cx="39" cy="111" r="5" fill={COLORS.red} opacity="0.3" />
        <circle cx="21" cy="129" r="5" fill={COLORS.red} opacity="0.3" />
        <circle cx="39" cy="129" r="5" fill={COLORS.red} opacity="0.3" />

        {/* Blue BR */}
        <rect x="90" y="90" width="60" height="60" fill={COLORS.blue} stroke={COLORS.line} strokeWidth="2" />
        <rect x="100" y="100" width="40" height="40" fill={COLORS.white} rx="6" />
        <circle cx="111" cy="111" r="5" fill={COLORS.blue} opacity="0.3" />
        <circle cx="129" cy="111" r="5" fill={COLORS.blue} opacity="0.3" />
        <circle cx="111" cy="129" r="5" fill={COLORS.blue} opacity="0.3" />
        <circle cx="129" cy="129" r="5" fill={COLORS.blue} opacity="0.3" />

        {/* Stars */}
        <StarShape cx={25} cy={85} fill="#94A3B8" /> {/* Green Safe */}
        <StarShape cx={85} cy={125} fill="#94A3B8" /> {/* Red Safe */}
        <StarShape cx={125} cy={65} fill="#94A3B8" /> {/* Blue Safe */}
        <StarShape cx={65} cy={25} fill="#94A3B8" /> {/* Yellow Safe */}

        {/* Arrows on starting positions */}
        <ArrowShape cx={15} cy={65} rotation={0} fill="rgba(255,255,255,0.7)" /> 
        <ArrowShape cx={65} cy={135} rotation={-90} fill="rgba(255,255,255,0.7)" />
        <ArrowShape cx={135} cy={85} rotation={180} fill="rgba(255,255,255,0.7)" />
        <ArrowShape cx={85} cy={15} rotation={90} fill="rgba(255,255,255,0.7)" />

        {/* Entrance Locks for Master and Blitz Mode */}
        {(gameMode === 'master' || gameMode === 'blitz') && players.map(p => {
           if (p.hasKilled) return null;
           let dx = 0; let dy = 0;
           let rotation = 0;
           if (p.color === 'red') { dx = 75; dy = 135; rotation = 0; }
           else if (p.color === 'green') { dx = 15; dy = 75; rotation = 90; }
           else if (p.color === 'yellow') { dx = 75; dy = 15; rotation = 180; }
           else if (p.color === 'blue') { dx = 135; dy = 75; rotation = -90; }
           
           return (
             <g key={`lock-${p.color}`} transform={`translate(${dx}, ${dy})`}>
               <g transform={`rotate(${rotation}) scale(0.35) translate(-12, -12)`}>
                 {/* Lucide Lock shape */}
                 <rect x="5" y="11" width="14" height="10" rx="2" ry="2" fill="#334155" stroke="white" strokeWidth="2" />
                 <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
               </g>
             </g>
           )
        })}
      </svg>

      {/* Render Tokens as HTML floating over SVG */}
      {players.map(player => 
        player.isActive && player.tokens.map((token, i) => {
          let x = 0, y = 0;
          let inHome = false;

          if (token.state === TokenState.BASE) {
            const pos = baseGridMap[token.color][token.id];
            x = pos.x; y = pos.y;
          } else if (token.state === TokenState.ACTIVE) {
            const pos = pathGridMap[token.position];
            x = pos.x; y = pos.y;
          } else if (token.state === TokenState.HOME_PATH) {
            const pos = homePathGridMap[token.color][token.position];
            x = pos.x; y = pos.y;
          } else if (token.state === TokenState.HOME) {
            // Put inside center triangle
            if (token.color === 'green') { x = 65; y = 75; }
            if (token.color === 'yellow') { x = 75; y = 65; }
            if (token.color === 'blue') { x = 85; y = 75; }
            if (token.color === 'red') { x = 75; y = 85; }
            inHome = true;
          }

          // Optional: slight offset if multiple tokens on same spot
          let numOnSameSpot = 0;
          let myIndexOnSpot = 0;
          if (token.state === TokenState.ACTIVE || token.state === TokenState.HOME_PATH) {
             const allTokens = players.flatMap(p => p.tokens);
             const onSame = allTokens.filter(t => t.state === token.state && t.position === token.position);
             if (onSame.length > 1) {
                numOnSameSpot = onSame.length;
                myIndexOnSpot = onSame.findIndex(t => t.color === token.color && t.id === token.id);
             }
          }

          let offsetX = 0, offsetY = 0;
          if (numOnSameSpot > 1) {
             const shift = 2; // SVG units
             if (numOnSameSpot === 2) {
               offsetX = myIndexOnSpot === 0 ? -shift : shift;
             } else if (numOnSameSpot === 3) {
               offsetX = myIndexOnSpot === 0 ? -shift : myIndexOnSpot === 1 ? shift : 0;
               offsetY = myIndexOnSpot === 2 ? shift : -shift;
             } else {
               offsetX = myIndexOnSpot % 2 === 0 ? -shift : shift;
               offsetY = myIndexOnSpot < 2 ? -shift : shift;
             }
          }
          if (inHome) {
             // overlap slightly inside home
             offsetX = (i%2===0?-2:2);
             offsetY = (i<2?-2:2);
          }

          const finalX = x + offsetX;
          const finalY = y + offsetY;

          const isCurrentPlayer = players[turnIndex]?.color === token.color;
          const isSelectable = isCurrentPlayer && hasRolled && diceValues.length > 0 && !isMoving && isValidMove(token, diceValues[0], gameMode, players[turnIndex]);

          return (
            <React.Fragment key={`${token.color}-${token.id}`}>
              <div
                tabIndex={isSelectable ? 0 : -1}
                onClick={(e) => { e.stopPropagation(); handleTokenClick(token.color, token.id); }}
                onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTokenClick(token.color, token.id);
                   }
                }}
                className={cn(
                  "absolute cursor-pointer transition-all duration-300 z-10 outline-none flex items-center justify-center p-[1%]",
                  "rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.6)] border border-black/20",
                  isSelectable ? "animate-bounce ring-2 ring-yellow-300 scale-125 z-40" : "hover:scale-110 z-20"
                )}
                style={{
                  background: 'linear-gradient(135deg, #fceabb 0%, #f8b500 100%)', // Gold outer rim
                  width: '5.5%',
                  height: '5.5%',
                  left: `${(finalX / 150) * 100}%`,
                  top: `${(finalY / 150) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] relative"
                  style={{ backgroundColor: COLORS[token.color] }}
                >
                   {/* Crown icon on inner part */}
                   <svg viewBox="0 0 24 24" fill="white" className="w-[60%] h-[60%] opacity-90 drop-shadow-md">
                     <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z" />
                   </svg>
                </div>
              </div>

              {/* Multi-Options UI */}
              {selectedOptions?.tokenId === token.id && selectedOptions?.color === token.color && (
                <div 
                  className="absolute z-[100] flex gap-1.5 p-1.5 bg-slate-800 border border-slate-600 rounded-full shadow-2xl animate-bounce"
                  style={{
                    left: `${(finalX / 150) * 100}%`,
                    top: `${(finalY / 150) * 100}%`,
                    transform: `translate(-50%, ${finalY < 30 ? '80%' : '-130%'})`,
                  }}
                >
                  {selectedOptions.validIndices.map(idx => (
                     <button
                       key={idx}
                       onClick={(e) => {
                          e.stopPropagation();
                          moveToken(token.color, token.id, idx);
                          setSelectedOptions(null);
                       }}
                       className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-400 active:scale-95 text-white rounded-full font-black text-sm shadow-md border-2 border-blue-300 transition-transform"
                     >
                       {diceValues[idx]}
                     </button>
                  ))}
                  <button
                     onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOptions(null);
                     }}
                     className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-400 active:scale-95 text-white rounded-full font-bold text-lg shadow-md border-2 border-red-300 transition-transform"
                  >
                     ×
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })
      )}
    </div>
  );
}

export function Dice({ color }: { color?: string }) {
  const { turnIndex, players, rollDice, diceValue, diceValues, hasRolled, isMoving, isRolling } = useGameStore();
  const current = players[turnIndex];

  if (!current) return null;
  if (color && current.color !== color) return null;

  const disabled = hasRolled || isMoving || isRolling;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative">
      <button 
        onClick={(e) => { e.stopPropagation(); rollDice(); }}
        disabled={disabled}
        className={cn(
          "relative w-full h-full aspect-square rounded-2xl flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-all shrink-0 border-[3px]",
          !disabled ? "hover:scale-105 active:scale-95 cursor-pointer bg-gradient-to-b from-white to-slate-200 border-white ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#3a1d3f]" : "bg-gradient-to-b from-slate-300 to-slate-400 border-slate-300 opacity-90 cursor-not-allowed",
          isRolling && "animate-flip"
        )}
      >
         {/* Simple dot representation for the dice */}
         {(diceValue && !isRolling) && (
            <div className={`grid gap-1 p-2 w-full h-full pointer-events-none ${
               diceValue === 1 ? 'place-content-center' :
               diceValue === 2 ? 'grid-cols-2 grid-rows-2' :
               diceValue === 3 ? 'grid-cols-3 grid-rows-3' :
               diceValue === 4 ? 'grid-cols-2 grid-rows-2' :
               diceValue === 5 ? 'grid-cols-3 grid-rows-3' :
               'grid-cols-3 grid-rows-2'
            }`}>
               {/* 1 dot */}
               {diceValue === 1 && <div className="w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full" />}
               
               {/* 2 dots */}
               {diceValue === 2 && <>
                 <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-slate-900 rounded-full self-start justify-self-start"></div>
                 <div></div>
                 <div></div>
                 <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-slate-900 rounded-full self-end justify-self-end"></div>
               </>}

               {/* 3 dots */}
               {diceValue === 3 && <>
                 <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-900 rounded-full"></div>
                 <div></div><div></div><div></div>
                 <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-900 rounded-full justify-self-center self-center"></div>
                 <div></div><div></div><div></div>
                 <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-900 rounded-full justify-self-end self-end"></div>
               </>}

               {/* 4 dots */}
               {diceValue === 4 && Array(4).fill(0).map((_,i) => <div key={i} className="w-2.5 h-2.5 md:w-3 md:h-3 bg-slate-900 rounded-full place-self-center"></div>)}

               {/* 5 dots */}
               {diceValue === 5 && <>
                 <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-900 rounded-full"></div><div></div><div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-900 rounded-full justify-self-end"></div>
                 <div></div><div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-900 rounded-full justify-self-center self-center"></div><div></div>
                 <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-900 rounded-full self-end"></div><div></div><div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-900 rounded-full justify-self-end self-end"></div>
               </>}

               {/* 6 dots */}
               {diceValue === 6 && Array(6).fill(0).map((_,i) => <div key={i} className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-900 rounded-full place-self-center"></div>)}
            </div>
         )}
         {(!diceValue && !isRolling) && <span className="opacity-40 text-slate-800 text-[10px] md:text-xs font-black">ROLL</span>}
      </button>
    </div>
  );
}
