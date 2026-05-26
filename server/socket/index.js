const { socketAuth } = require('../middleware/auth');
const { getRedis } = require('../config/redis');
const Message = require('../models/Message');
const User = require('../models/User');
const Room = require('../models/Room');

// Track socket connections per user for presence
const userSockets = new Map(); // userId -> Set<socketId>

const initSocket = (io) => {
  // ── Auth middleware ────────────────────────────────────────────────────────
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 ${socket.user.username} connected (${socket.id})`);

    // ── Presence tracking ─────────────────────────────────────────────────
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    const redis = getRedis();
    await redis.setex(`presence:${userId}`, 120, 'online');
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast online status to all rooms this user belongs to
    const rooms = await Room.find({ members: userId }).select('_id');
    const roomIds = rooms.map((r) => r._id.toString());
    roomIds.forEach((roomId) => socket.join(roomId));
    io.emit('user:online', { userId, username: socket.user.username });

    // ── Heartbeat — refresh presence TTL ────────────────────────────────
    const presenceInterval = setInterval(async () => {
      await redis.setex(`presence:${userId}`, 120, 'online');
    }, 60_000);

    // ── JOIN ROOM ─────────────────────────────────────────────────────────
    socket.on('room:join', async (roomId) => {
      try {
        const room = await Room.findOne({ _id: roomId, members: userId });
        if (!room) return socket.emit('error', { message: 'Not a member of this room' });
        socket.join(roomId);
        socket.emit('room:joined', { roomId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── SEND MESSAGE (primary path — sub-100ms delivery) ────────────────
    socket.on('message:send', async ({ roomId, content, type = 'text' }) => {
      try {
        if (!content?.trim()) return;

        // Check room membership
        const room = await Room.findOne({ _id: roomId, members: userId });
        if (!room) return socket.emit('error', { message: 'Access denied' });

        const message = await Message.create({
          content: content.trim(),
          sender: userId,
          room: roomId,
          type,
        });

        await message.populate('sender', 'username avatar isOnline');
        await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });

        // Broadcast to ALL sockets in the room (including sender)
        io.to(roomId).emit('message:new', message);

        // Cache latest message in Redis for fast loading
        await redis.lpush(`messages:${roomId}`, JSON.stringify(message));
        await redis.ltrim(`messages:${roomId}`, 0, 49); // keep last 50
        await redis.expire(`messages:${roomId}`, 3600);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── TYPING INDICATORS ─────────────────────────────────────────────────
    socket.on('typing:start', ({ roomId }) => {
      socket.to(roomId).emit('typing:update', {
        userId,
        username: socket.user.username,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(roomId).emit('typing:update', {
        userId,
        username: socket.user.username,
        isTyping: false,
      });
    });

    // ── READ RECEIPTS ──────────────────────────────────────────────────────
    socket.on('message:read', async ({ messageId, roomId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { $addToSet: { readBy: userId } });
        socket.to(roomId).emit('message:readReceipt', { messageId, userId });
      } catch (err) {
        console.error('Read receipt error:', err);
      }
    });

    // ── REACTIONS ─────────────────────────────────────────────────────────
    socket.on('message:react', async ({ messageId, emoji, roomId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const reaction = message.reactions.find((r) => r.emoji === emoji);
        if (reaction) {
          const idx = reaction.users.indexOf(userId);
          if (idx >= 0) reaction.users.splice(idx, 1);
          else reaction.users.push(userId);
        } else {
          message.reactions.push({ emoji, users: [userId] });
        }

        await message.save();
        io.to(roomId).emit('message:reacted', { messageId, reactions: message.reactions });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      clearInterval(presenceInterval);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          // Only mark offline if ALL their tabs/devices disconnected
          userSockets.delete(userId);
          await redis.del(`presence:${userId}`);
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
          io.emit('user:offline', { userId, lastSeen: new Date() });
          console.log(`❌ ${socket.user.username} went offline`);
        }
      }
    });
  });
};

module.exports = initSocket;
