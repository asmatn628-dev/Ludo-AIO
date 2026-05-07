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
    if (gameState === 'finished' && winner) {
      import('./game/sounds').then(s => s.playSound('win'));
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [
           winner === 'red' ? '#ef4444' : 
           winner === 'green' ? '#22c55e' : 
           winner === 'yellow' ? '#facc15' : '#3b82f6'
        ]
      });
    }
  }, [gameState, winner]);

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
             <div className={`absolute text-green-400 animate-bounce pointer-events-none drop-shadow-md ${
                  isLeft 
                     ? "-rotate-90 -left-6" 
                     : "rotate-90 -right-6"
             }`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-9-9h6V3h6v9h6z"/></svg>
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
              onClick={() => setGameState('menu')}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg flex items-center justify-center shadow-xl backdrop-blur transition active:scale-95"
              title="Quit"
           >
             <svg fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"></path></svg>
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
        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-[800px] mx-auto p-2 pb-8">
           
           {/* Top Row Players */}
           <div className="w-full max-w-[600px] flex justify-between px-2 mb-2 lg:mb-4 pt-12 md:pt-4">
              {renderPlayerCorner('green', true, true)}
              {renderPlayerCorner('yellow', true, false)}
           </div>

           {/* The Board container */}
           <div className="w-full sm:w-[90%] md:w-[80%] max-w-[600px] shrink-0 p-1.5 md:p-3 bg-gradient-to-br from-[#80512f] via-[#5c3a21] to-[#3d2413] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_4px_10px_rgba(255,255,255,0.1)] border-b-[6px] md:border-b-[10px] border-r-[3px] md:border-r-[6px] border-[#382212]">
             <Board />
           </div>
           
           {/* Bottom Row Players */}
           <div className="w-full max-w-[600px] flex justify-between px-2 mt-2 lg:mt-4">
              {renderPlayerCorner('red', false, true)}
              {renderPlayerCorner('blue', false, false)}
           </div>

        </div>
      )}

      {gameState === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[100] backdrop-blur-sm">
          <div className="text-center p-12 bg-white text-slate-900 rounded-3xl shadow-2xl">
             <h1 className="text-6xl font-black mb-4 uppercase" style={{
               color: winner === 'red' ? '#ef4444' : winner === 'green' ? '#22c55e' : winner === 'yellow' ? '#eab308' : '#3b82f6'
             }}>{winner} WINS!</h1>
             <button 
               onClick={() => setGameState('menu')}
               className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
             >
               Play Again
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
