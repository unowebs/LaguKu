/* eslint-disable */
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('LaguKu Realtime Collaboration Server Active\n');
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Map room code to set of connected collaborators
// roomCode -> Map(socket.id -> collaboratorInfo)
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', ({ roomCode, userId, name, color }) => {
    socket.join(roomCode);
    console.log(`User ${name} (${userId}) joined room: ${roomCode}`);

    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, new Map());
    }

    const collaboratorInfo = {
      socketId: socket.id,
      userId,
      name,
      color,
      cursor: null,
      isTyping: false,
    };

    rooms.get(roomCode).set(socket.id, collaboratorInfo);

    // Notify others in room
    io.to(roomCode).emit('collaborators-changed', Array.from(rooms.get(roomCode).values()));
  });

  // Handle document edits
  socket.on('song-edit', ({ roomCode, song }) => {
    socket.to(roomCode).emit('song-updated', song);
  });

  // Handle cursor moves
  socket.on('cursor-move', ({ roomCode, selection }) => {
    const room = rooms.get(roomCode);
    if (room && room.has(socket.id)) {
      room.get(socket.id).cursor = selection;
      io.to(roomCode).emit('collaborators-changed', Array.from(room.values()));
    }
  });

  // Handle typing indicator
  socket.on('typing-status', ({ roomCode, isTyping }) => {
    const room = rooms.get(roomCode);
    if (room && room.has(socket.id)) {
      room.get(socket.id).isTyping = isTyping;
      io.to(roomCode).emit('collaborators-changed', Array.from(room.values()));
    }
  });

  // Handle chat messages
  socket.on('send-message', ({ roomCode, message }) => {
    io.to(roomCode).emit('receive-message', message);
  });

  // Handle comments
  socket.on('add-comment', ({ roomCode, comment }) => {
    io.to(roomCode).emit('comment-added', comment);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find rooms user was in and clean up
    for (const [roomCode, members] of rooms.entries()) {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        if (members.size === 0) {
          rooms.delete(roomCode);
        } else {
          io.to(roomCode).emit('collaborators-changed', Array.from(members.values()));
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Realtime server listening on port ${PORT}`);
});
