import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const rooms: Record<string, {
    roomId: string;
    players: { id: string; name: string; color: string; isHost: boolean; isBot: boolean }[];
    gameConfig: any;
  }> = {};

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("create-room", (data) => {
      const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      socket.join(roomId);
      rooms[roomId] = {
        roomId,
        players: [{ id: socket.id, name: data.name || "Player 1", color: 'red', isHost: true, isBot: false }],
        gameConfig: data.gameConfig || {}
      };
      socket.emit("room-created", rooms[roomId]);
    });

    socket.on("join-room", (data) => {
      const room = rooms[data.roomId];
      if (room) {
        socket.join(data.roomId);
        const colors = ['red', 'green', 'yellow', 'blue'];
        const usedColors = room.players.map(p => p.color);
        const color = colors.find(c => !usedColors.includes(c)) || 'red';
        
        room.players.push({
          id: socket.id,
          name: data.name || `Player ${room.players.length + 1}`,
          color,
          isHost: false,
          isBot: false
        });
        io.to(data.roomId).emit("room-updated", room);
      } else {
        socket.emit("room-error", "Room not found");
      }
    });

    socket.on("add-bot", (data) => {
       const room = rooms[data.roomId];
       if (room && room.players.some(p => p.id === socket.id && p.isHost)) {
          if (room.players.length < 4) {
             const colors = ['red', 'green', 'yellow', 'blue'];
             const usedColors = room.players.map(p => p.color);
             const color = colors.find(c => !usedColors.includes(c));
             if (color) {
                room.players.push({
                   id: "bot-" + Math.random().toString(36).substring(2, 6),
                   name: `Bot ${color.toUpperCase()}`,
                   color,
                   isHost: false,
                   isBot: true
                });
                io.to(data.roomId).emit("room-updated", room);
             }
          }
       }
    });

    socket.on("remove-player", (data) => {
        const room = rooms[data.roomId];
        if (room && room.players.some(p => p.id === socket.id && p.isHost)) {
           const idx = room.players.findIndex(p => p.id === data.playerId);
           if (idx !== -1 && !room.players[idx].isHost) {
              const p = room.players[idx];
              room.players.splice(idx, 1);
              if (!p.isBot) {
                 const targetSocket = io.sockets.sockets.get(p.id);
                 if (targetSocket) targetSocket.leave(data.roomId);
              }
              io.to(data.roomId).emit("room-updated", room);
           }
        }
    });

    socket.on("start-game", (data) => {
       io.to(data.roomId).emit("game-started", data.config);
    });

    socket.on("game-action", (data) => {
      socket.to(data.roomId).emit("game-action", data);
    });

    socket.on("disconnect", () => {
       console.log("User disconnected:", socket.id);
       for (const roomId in rooms) {
          const room = rooms[roomId];
          const playerIdx = room.players.findIndex(p => p.id === socket.id);
          if (playerIdx !== -1) {
             room.players.splice(playerIdx, 1);
             io.to(roomId).emit("room-updated", room);
             if (room.players.length === 0) {
               delete rooms[roomId];
             } else if (!room.players.some(p => p.isHost)) {
               room.players[0].isHost = true;
               io.to(roomId).emit("room-updated", room);
             }
             break;
          }
       }
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve sounds
  app.use('/Sounds', express.static(path.join(process.cwd(), 'Sounds')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
