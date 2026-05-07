import React, { useState } from 'react';
import { useGameStore } from '../game/store';
import { BASE_COLORS, GameMode, PlayerColor } from '../game/constants';
import { cn } from './Board';

export function Menu() {
  const { initializeGame, setGameMode, gameMode, setGameState, setIsTeamMode, isTeamMode } = useGameStore();
  const [playersConfig, setPlayersConfig] = useState([
    { color: 'red' as PlayerColor, enabled: true, isBot: false, name: 'Player 1', botDifficulty: 'medium' as 'easy'|'medium'|'hard' },
    { color: 'green' as PlayerColor, enabled: true, isBot: true, name: 'Bot Green', botDifficulty: 'medium' as 'easy'|'medium'|'hard' },
    { color: 'yellow' as PlayerColor, enabled: false, isBot: false, name: 'Player 3', botDifficulty: 'medium' as 'easy'|'medium'|'hard' },
    { color: 'blue' as PlayerColor, enabled: false, isBot: false, name: 'Player 4', botDifficulty: 'medium' as 'easy'|'medium'|'hard' },
  ]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const togglePlayer = (index: number) => {
    const newConfig = [...playersConfig];
    newConfig[index].enabled = !newConfig[index].enabled;
    setPlayersConfig(newConfig);
  };

  const toggleBot = (index: number) => {
    const newConfig = [...playersConfig];
    newConfig[index].isBot = !newConfig[index].isBot;
    setPlayersConfig(newConfig);
  };

  const startGame = () => {
    const active = playersConfig.filter(p => p.enabled);
    if (active.length < 2) {
      alert("Select at least 2 players!");
      return;
    }
    initializeGame(active.map(a => ({ color: a.color, isBot: a.isBot, name: a.name, botDifficulty: a.botDifficulty })));
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/90 rounded-3xl shadow-2xl max-w-lg w-full">
      <h1 className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500">
        LUDO UNIVERSE
      </h1>

      <div className="w-full mb-8">
        <h2 className="text-xl font-bold mb-4 text-slate-700">Game Mode</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
          {(['classic', 'quick', 'blitz', 'master'] as GameMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setGameMode(mode)}
              className={cn(
                "py-2 px-4 rounded-xl border-2 font-bold capitalize transition-all",
                gameMode === mode 
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                  : "border-slate-200 text-slate-500 hover:border-blue-300"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
           <div>
              <span className="font-bold text-orange-800 block text-sm">Team Mode</span>
              <span className="text-xs text-orange-600">Red & Yellow VS Green & Blue</span>
           </div>
           <button 
              onClick={() => setIsTeamMode(!isTeamMode)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isTeamMode ? "bg-orange-500" : "bg-slate-300"
              )}
           >
              <span className={cn(
                 "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                 isTeamMode ? "translate-x-6" : "translate-x-1"
              )} />
           </button>
        </div>

        <p className="text-sm text-slate-500 mt-2 text-center h-5">
           {gameMode === 'classic' && "Standard rules. All 4 tokens must reach home."}
           {gameMode === 'quick' && "Fastest wins! Only 1 token needs to reach home."}
           {gameMode === 'blitz' && "Exit base on 1 or 6! First to 1 token home wins."}
           {gameMode === 'master' && "Master rules: You MUST kill an opponent's token before you can enter home."}
        </p>
      </div>

      <div className="w-full mb-8">
        <h2 className="text-xl font-bold mb-4 text-slate-700">Players</h2>
        <div className="space-y-3">
          {playersConfig.map((config, i) => (
            <div key={config.color} className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePlayer(i)}
                      className={cn(
                        "w-8 h-8 shrink-0 rounded-full border-2 transition-transform",
                        config.enabled ? "scale-110" : "opacity-30 grayscale",
                        config.color === 'red' && "bg-red-500 border-red-600",
                        config.color === 'green' && "bg-green-500 border-green-600",
                        config.color === 'yellow' && "bg-yellow-400 border-yellow-500",
                        config.color === 'blue' && "bg-blue-500 border-blue-600",
                      )}
                    />
                    {config.enabled ? (
                      <input 
                        type="text" 
                        value={config.name}
                        onChange={(e) => {
                          const newConfig = [...playersConfig];
                          newConfig[i].name = e.target.value;
                          setPlayersConfig(newConfig);
                        }}
                        className="bg-transparent border-b border-slate-300 px-1 py-0.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 w-24 sm:w-32"
                      />
                    ) : (
                      <span className="font-bold capitalize text-slate-400">{config.color}</span>
                    )}
                  </div>
                  
                  {config.enabled && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 bg-slate-200 rounded-lg p-1">
                        <button
                          onClick={() => config.isBot && toggleBot(i)}
                          className={cn(
                            "px-2 py-1 rounded-md text-xs font-semibold transition-colors",
                            !config.isBot ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          Human
                        </button>
                        <button
                          onClick={() => !config.isBot && toggleBot(i)}
                          className={cn(
                            "px-2 py-1 rounded-md text-xs font-semibold transition-colors",
                            config.isBot ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          Bot
                        </button>
                      </div>
                      {config.isBot && (
                        <select 
                          value={config.botDifficulty}
                          onChange={(e) => {
                            const newConfig = [...playersConfig];
                            newConfig[i].botDifficulty = e.target.value as 'easy'|'medium'|'hard';
                            setPlayersConfig(newConfig);
                          }}
                          className="text-xs bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-700 outline-none"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 w-full">
        <button
          onClick={startGame}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xl shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all active:translate-y-0"
        >
          START GAME
        </button>
        <button
          onClick={() => setGameState('lobby')}
          className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-xl shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all active:translate-y-0"
        >
          MULTIPLAYER
        </button>
      </div>

      <div className="flex flex-col gap-2 w-full mt-4">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-sm shadow-lg hover:bg-slate-700 transition flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            INSTALL APP (OFFLINE PLAY)
          </button>
        )}
      </div>

      <LoadGameSection />

      <div className="mt-8 text-center bg-blue-50 p-4 rounded-xl border border-blue-100">
         <h4 className="font-bold text-blue-800 text-sm mb-1">TV & Mobile Ready</h4>
         <p className="text-xs text-blue-600 leading-tight">
            Use your TV remote (D-pad) or touch/mouse to interact. <br/> 
            <span className="font-bold text-blue-700">Open in a new tab to see the "Install" option (PWA).</span>
         </p>
      </div>
    </div>
  );
}

function LoadGameSection() {
  const { savedGames, loadGame, deleteGame } = useGameStore();

  if (!savedGames || savedGames.length === 0) return null;

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl font-bold mb-4 text-slate-700">Saved Games</h2>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {savedGames.map((game, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 group">
            <div className="flex flex-col">
              <span className="font-bold text-slate-700 text-sm">{game.name}</span>
              <span className="text-[10px] text-slate-400">{game.date}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadGame(game.name)}
                className="p-1 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-md transition-colors"
              >
                Load
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete save "${game.name}"?`)) deleteGame(game.name);
                }}
                className="p-1 px-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
