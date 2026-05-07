import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../game/store';

export let socket: any = null;

export function NetworkManager() {
  const { moveToken, rollDice } = useGameStore();

  useEffect(() => {
    socket = io();

    socket.on('connect', () => {
      console.log('Connected to socket', socket.id);
    });

    socket.on('room-created', (room: any) => {
      // Handled by UI
    });

    socket.on('room-updated', (room: any) => {
      // Handled by UI
    });

    socket.on('game-action', (data: any) => {
      if (data.type === 'ROLL') {
          rollDice(data.value);
      } else if (data.type === 'MOVE') {
          moveToken(data.color, data.tokenId, data.diceIdx || 0);
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return null;
}
