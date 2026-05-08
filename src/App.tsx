import React, { useEffect } from 'react';
import { useGameStore } from './game/store';
import { Board, Dice } from './components/Board';
import { Menu } from './components/Menu';
import { Lobby } from './components/Lobby';
import { NetworkManager } from './components/NetworkManager';
import confetti from 'canvas-confetti';
import { getBestMove } from './game/bot';

export default function App() {
  const { gameState, winner, setGameState, players, turnIndex, rollDice, moveToken, diceValues, hasRolled, isMoving, isRolling } = useGameStore();

  useEffect(() => {
    if (gameState === 'finished') {
      import('./game/sounds').then(s => s.playSound('win'));
      const topRanked = players.find(p => p.rank === 1);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: topRanked ? [
           topRanked.color === 'red' ? '#ef4444' : 
           topRanked.color === 'green' ? '#22c55e' : 
           topRanked.color === 'yellow' ? '#facc15' : '#3b82f6'
        ] : undefined
      });
    }
  }, [gameState]);

  // Bot logic
  useEffect(() => {
    if (gameState !== 'playing') return;

    const currPlayer = players[turnIndex];
    if (!currPlayer || !currPlayer.isBot || isMoving) return;

    let timeoutId: any;

    if (!hasRolled || (diceValues.length === 0 && !hasRolled)) {
      timeoutId = setTimeout(() => {
        rollDice();
      }, 1000);
    } else if (hasRolled && diceValues.length > 0) {
      timeoutId = setTimeout(async () => {
         const state = useGameStore.getState();
         const bestTokenId = getBestMove(state, currPlayer);
         if (bestTokenId !== null) {
           await moveToken(currPlayer.color, bestTokenId, 0);
         }
      }, 1000);
    }

    return () => clearTimeout(timeoutId);
  }, [gameState, players, turnIndex, hasRolled, diceValues, isMoving]);

  const renderPlayerCorner = (color: 'red' | 'green' | 'yellow' | 'blue', isTop: boolean, isLeft: boolean) => {
    const p = players.find(x => x.color === color);
    if (!p || !p.isActive) return <div className="w-20 md:w-32 h-20 md:h-32" />; // empty placeholder
    const isMyTurn = turnIndex === players.indexOf(p);
    
    return (
      <div className={`flex flex-col items-center justify-center relative transition-all duration-300 w-24 h-24 md:w-32 md:h-32 ${isMyTurn ? 'scale-110 z-20' : 'opacity-70 scale-90'}`}>
        <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full border-[3px] bg-slate-100 flex items-center justify-center overflow-hidden shadow-xl mb-1 ${isMyTurn ? 'border-yellow-400 ring-4 ring-yellow-400/50' : 'border-slate-400'}`}>
           <svg className="w-10 h-10 md:w-16 md:h-16 text-slate-300 mt-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        </div>
        <span className="text-xs md:text-sm font-bold drop-shadow-md text-white whitespace-nowrap">{p.name}</span>
        
        {isMyTurn && (
          <div className={`absolute z-30 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center top-1/2 -translate-y-1/2 ${
            isLeft 
               ? "left-[100%] ml-2" 
               : "right-[100%] mr-2"
          }`}>
             <div className={`absolute pointer-events-none drop-shadow-md flex items-center justify-center w-6 h-6 z-50 ${
                  isLeft 
                     ? "rotate-90 -left-6" 
                     : "-rotate-90 -right-6"
             }`}>
               <div className="text-green-400 animate-bounce">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-9-9h6V3h6v9h6z"/></svg>
               </div>
             </div>
             <Dice color={color} />
             
             {/* Pending Dice Values - facing the board */}
             {diceValues && diceValues.length > 0 && !isRolling && (
               <div className={`absolute flex gap-1 flex-wrap items-center justify-center pointer-events-none z-50 w-24 ${
                  isTop
                     ? "top-[110%] "
                     : "bottom-[110%] "
               }`}>
                  {diceValues.map((val, idx) => (
                     <div key={idx} className="w-5 h-5 md:w-8 md:h-8 bg-blue-500 text-white rounded font-black flex items-center justify-center border-[2px] border-white shadow-lg flex-shrink-0 animate-bounce text-xs md:text-base pointer-events-auto">
                        {val}
                     </div>
                  ))}
               </div>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] text-slate-100 font-sans flex flex-col overflow-hidden relative selection:bg-blue-500/30"
         style={{ backgroundImage: 'radial-gradient(circle at center, #4b2a52 0%, #29122d 100%)' }}>
      
      {gameState === 'playing' && (
        <div className="absolute top-2 left-2 z-50 flex gap-2">
           <button 
              onClick={() => {
                if (confirm("Do you want to save the game before exiting?")) {
                  const name = prompt("Enter a name for this save:", `Game ${new Set(players.filter(p=>p.isActive).map(p=>p.name)).size} Players`);
                  if (name) {
                    useGameStore.getState().saveGame(name);
                    alert("Game saved!");
                  }
                }
                if (confirm("Are you sure you want to exit to the main menu?")) {
                  setGameState('menu');
                }
              }}
              className="bg-red-500/80 hover:bg-red-600 text-white p-2 text-xs font-bold rounded-lg flex items-center justify-center shadow-xl backdrop-blur transition active:scale-95"
              title="Quit"
           >
             <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5 mr-1"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"></path></svg>
             EXIT
           </button>
           <button 
              onClick={() => {
                const name = prompt("Enter a name for this save:", `Game ${new Set(players.filter(p=>p.isActive).map(p=>p.name)).size} Players`);
                if (name) {
                  useGameStore.getState().saveGame(name);
                  alert("Game saved!");
                }
              }}
              className="bg-blue-500/80 hover:bg-blue-600 text-white p-2 text-xs font-bold flex items-center gap-1 rounded-lg justify-center shadow-xl backdrop-blur transition active:scale-95"
              title="Save Game"
           >
             <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path><path d="M17 21v-8H7v8M7 3v5h8"></path></svg>
             SAVE
           </button>
           <button 
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg flex items-center justify-center shadow-xl backdrop-blur transition active:scale-95"
              title="Settings"
           >
             <svg fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>
           </button>
        </div>
      )}
      
      <NetworkManager />
      
      {gameState === 'menu' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Menu />
        </div>
      )}

      {gameState === 'lobby' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Lobby />
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex-1 w-full max-w-[1200px] mx-auto p-2 md:p-4 pb-8 flex flex-col justify-center items-center pt-24 md:pt-16">
            <div className="grid grid-cols-2 landscape:grid-cols-[auto_1fr_auto] gap-y-6 landscape:gap-y-10 landscape:gap-x-12 items-center justify-center w-full max-w-[600px] landscape:max-w-none px-2 mb-2">
              
              {/* Green: Top Left */}
              <div className="col-start-1 landscape:col-start-1 landscape:row-start-1 flex justify-start landscape:justify-end landscape:items-end w-full h-full">
                 {renderPlayerCorner('green', true, true)}
              </div>
              
              {/* Yellow: Top Right */}
              <div className="col-start-2 landscape:col-start-3 landscape:row-start-1 flex justify-end landscape:justify-start landscape:items-end w-full h-full">
                 {renderPlayerCorner('yellow', true, false)}
              </div>

              {/* Board */}
              <div className="col-span-2 landscape:col-span-1 landscape:col-start-2 landscape:row-start-1 landscape:row-span-2 flex justify-center w-full my-4 landscape:my-0">
                 <div className="w-full sm:w-[90%] md:w-[80%] landscape:w-[80vh] landscape:max-w-[700px] max-w-[600px] shrink-0 p-1.5 md:p-3 bg-gradient-to-br from-[#80512f] via-[#5c3a21] to-[#3d2413] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-b-[6px] md:border-b-[10px] border-r-[3px] md:border-r-[6px] border-[#382212] z-10 flex items-center justify-center">
                   <Board />
                 </div>
              </div>

              {/* Red: Bottom Left */}
              <div className="col-start-1 landscape:col-start-1 landscape:row-start-2 flex justify-start landscape:justify-end landscape:items-start w-full h-full">
                 {renderPlayerCorner('red', false, true)}
              </div>

              {/* Blue: Bottom Right */}
              <div className="col-start-2 landscape:col-start-3 landscape:row-start-2 flex justify-end landscape:justify-start landscape:items-start w-full h-full">
                 {renderPlayerCorner('blue', false, false)}
              </div>

            </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[100] backdrop-blur-sm p-4">
          <div className="text-center p-8 bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-[400px]">
             <h1 className="text-4xl font-black mb-6 uppercase text-slate-800">Game Over</h1>
             
             <div className="flex flex-col gap-3 mb-8">
               {players.filter(p => p.isActive && p.rank).sort((a,b) => (a.rank||10) - (b.rank||10)).map(p => (
                 <div key={p.color} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                       <span className={`w-4 h-4 rounded-full ${
                          p.color === 'red' ? 'bg-red-500 shadow-[0_0_8px_theme(colors.red.400)]' :
                          p.color === 'green' ? 'bg-green-500 shadow-[0_0_8px_theme(colors.green.400)]' :
                          p.color === 'yellow' ? 'bg-yellow-400 shadow-[0_0_8px_theme(colors.yellow.300)]' : 
                          'bg-blue-500 shadow-[0_0_8px_theme(colors.blue.400)]'
                       }`}></span>
                       <span className="font-bold text-slate-700">{p.name} {p.isBot && '(Bot)'}</span>
                    </div>
                    <span className="font-black text-lg text-slate-900">
                      {p.rank === 1 ? '1st 🏆' : p.rank === 2 ? '2nd 🥈' : p.rank === 3 ? '3rd 🥉' : '4th 😭'}
                    </span>
                 </div>
               ))}
             </div>

             <button 
               onClick={() => setGameState('menu')}
               className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 w-full transition-transform active:scale-95"
             >
               Main Menu
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
