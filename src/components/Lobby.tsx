import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/store';
import { socket } from './NetworkManager';
import { PlayerColor } from '../game/constants';

export function Lobby() {
  const { setGameState, initializeGame, gameMode } = useGameStore();
  const [roomState, setRoomState] = useState<any>(null);
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
     if (!socket) return;
     
     const onRoomCreated = (room: any) => setRoomState(room);
     const onRoomUpdated = (room: any) => setRoomState(room);
     const onGameStarted = (config: any) => {
        initializeGame(config);
     };

     socket.on('room-created', onRoomCreated);
     socket.on('room-updated', onRoomUpdated);
     socket.on('game-started', onGameStarted);

     return () => {
        socket.off('room-created', onRoomCreated);
        socket.off('room-updated', onRoomUpdated);
        socket.off('game-started', onGameStarted);
     };
  }, []);

  const createRoom = () => {
     socket.emit('create-room', { name: playerName || 'Host', gameConfig: { mode: gameMode } });
  };

  const joinRoom = () => {
     if (joinCode) {
        socket.emit('join-room', { roomId: joinCode.toUpperCase(), name: playerName || 'Guest' });
     }
  };

  const startGame = () => {
     if (roomState && roomState.isHost) {
        if (roomState.players.length < 2) {
           alert("You need at least 2 players to start a multiplayer game!");
           return;
        }
     }
     
     // actually let's just initialize using local UI for now and broadcast to others
     const configs = roomState.players.map((p: any) => ({
        color: p.color as PlayerColor,
        isBot: !!p.isBot,
        name: p.name,
        botDifficulty: 'medium'
     }));
     socket.emit('start-game', { roomId: roomState.roomId, config: configs });
  };

  const addBot = () => {
     if (roomState && roomState.roomId) {
        socket.emit('add-bot', { roomId: roomState.roomId });
     }
  };

  const removePlayer = (playerId: string) => {
     if (roomState && roomState.roomId) {
        socket.emit('remove-player', { roomId: roomState.roomId, playerId });
     }
  };

  if (roomState) {
      return (
         <div className="flex flex-col items-center p-8 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl text-white max-w-md w-full">
            <h1 className="text-3xl font-black mb-2">Room: {roomState.roomId}</h1>
            <div className="w-full bg-black/20 rounded-xl p-4 mb-6">
                <h2 className="text-lg font-bold mb-3 border-b border-white/20 pb-2">Players in Lobby</h2>
                <div className="space-y-2">
                   {roomState.players.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                         <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${p.color}-500`} style={{ backgroundColor: p.color }} />
                            <span className="font-semibold">{p.name} {p.isBot && "(Bot)"}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            {p.isHost && <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">Host</span>}
                            {roomState.players.find((me: any) => me.id === socket?.id)?.isHost && !p.isHost && (
                               <button 
                                 onClick={() => removePlayer(p.id)}
                                 className="text-red-400 hover:text-red-300 p-1"
                                 title="Kick"
                               >
                                 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                               </button>
                            )}
                         </div>
                      </div>
                   ))}
                   {roomState.players.length < 4 && roomState.players.find((me: any) => me.id === socket?.id)?.isHost && (
                      <button 
                        onClick={addBot}
                        className="w-full flex items-center justify-center gap-2 py-2 mt-2 border-2 border-dashed border-white/20 rounded-lg text-sm text-white/50 hover:text-white hover:border-white/40 transition"
                      >
                         <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                         Add Bot
                      </button>
                   )}
                </div>
            </div>
            
            {roomState.players.find((p: any) => p.id === socket?.id)?.isHost ? (
                <button
                   onClick={startGame}
                   className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition shadow-[0_4px_0_rgb(37,99,235)] hover:shadow-[0_2px_0_rgb(37,99,235)] hover:translate-y-[2px]"
                >
                   Start Game
                </button>
            ) : (
                <div className="text-center italic text-white/70 animate-pulse">Waiting for host to start...</div>
            )}
            
            <button
               onClick={() => { setRoomState(null); setGameState('menu'); }}
               className="mt-4 text-sm text-white/60 hover:text-white underline"
            >
               Leave Room
            </button>
         </div>
      );
  }

  return (
    <div className="flex flex-col p-8 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl text-white max-w-md w-full">
       <h1 className="text-3xl font-black mb-6 text-center">Multiplayer Lobby</h1>
       
       <div className="mb-6 space-y-2">
          <label className="text-sm font-semibold opacity-80 uppercase tracking-widest pl-1">Your Name</label>
          <input 
             type="text" 
             value={playerName}
             onChange={e => setPlayerName(e.target.value)}
             placeholder="Enter your name..."
             className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-black/40 transition" 
          />
       </div>

       <button
          onClick={createRoom}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white font-bold py-3 rounded-xl transition shadow-[0_4px_0_rgb(5,150,105)] hover:shadow-[0_2px_0_rgb(5,150,105)] hover:translate-y-[2px] mb-8"
       >
          Create Room
       </button>

       <div className="relative flex items-center justify-center my-4">
          <div className="absolute w-full border-t border-white/20"></div>
          <span className="relative bg-transparent bg-[#1e293b] px-4 text-xs font-bold uppercase tracking-widest text-white/50 rounded-full">OR</span>
       </div>

       <div className="space-y-4 mt-8">
          <div className="flex gap-2">
              <input 
                 type="text" 
                 value={joinCode}
                 onChange={e => setJoinCode(e.target.value.toUpperCase())}
                 placeholder="Room Code"
                 maxLength={4}
                 className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-black/40 transition text-center font-bold tracking-widest uppercase" 
              />
              <button
                 onClick={joinRoom}
                 disabled={joinCode.length !== 4}
                 className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition shadow-[0_4px_0_rgb(37,99,235)] disabled:shadow-none hover:shadow-[0_2px_0_rgb(37,99,235)] hover:translate-y-[2px]"
              >
                 Join
              </button>
          </div>
       </div>

       <div className="mt-8 bg-slate-800/40 p-4 rounded-2xl border border-white/5">
          <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2">
             <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 2v20m0-20l7 7-14 7 14 7-7 7"></path></svg>
             Connectivity Options
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
             <button 
                onClick={() => alert("WiFi / Local Network: Ensure all players are on the same WiFi. The Host should create a room and share the 4-digit code.")}
                className="flex flex-col items-center gap-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition"
             >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"></path></svg>
                <span className="text-[10px] font-bold">WiFi / LAN</span>
             </button>
             <button 
                onClick={async () => {
                   if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
                     try {
                       await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
                       alert("Bluetooth ready for pairing! (Experimental)");
                     } catch(err) {
                       alert("Bluetooth pairing canceled or not supported on this browser/OS.");
                     }
                   } else {
                     alert("Web Bluetooth not supported by your browser. Use WiFi/Local Network instead.");
                   }
                }}
                className="flex flex-col items-center gap-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition"
             >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"></path></svg>
                <span className="text-[10px] font-bold">Bluetooth</span>
             </button>
          </div>
          <p className="text-[9px] text-slate-400 text-center leading-tight">
             Shared connectivity allows for direct low-latency play. <br/>
             Bluetooth depends on browser capabilities.
          </p>
       </div>

       <button
          onClick={() => setGameState('menu')}
          className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition"
       >
          Back to Main Menu
       </button>
    </div>
  );
}
