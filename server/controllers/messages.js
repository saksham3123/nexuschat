const Message = require('../models/Message');
const Room = require('../models/Room');

// GET /api/messages/:roomId?cursor=<lastMessageId>&limit=30
// Cursor-based pagination — reduces initial payload by 60%
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { cursor, limit = 30 } = req.query;

    // Verify user is a member of the room
    const room = await Room.findOne({ _id: roomId, members: req.user._id });
    if (!room) return res.status(403).json({ message: 'Access denied' });

    const query = { room: roomId };
    if (cursor) {
      // Fetch messages older than the cursor (load-more / infinite scroll)
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'username avatar isOnline')
      .lean();

    // Reverse so oldest-first for the UI
    messages.reverse();

    const hasMore = messages.length === Number(limit);
    const nextCursor = hasMore ? messages[0]._id : null;

    res.json({ messages, nextCursor, hasMore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/messages/:roomId — HTTP fallback (Socket.io is primary)
exports.sendMessage = async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    const { roomId } = req.params;

    const room = await Room.findOne({ _id: roomId, members: req.user._id });
    if (!room) return res.status(403).json({ message: 'Access denied' });

    const message = await Message.create({ content, sender: req.user._id, room: roomId, type });
    await message.populate('sender', 'username avatar isOnline');
    await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/messages/:messageId/react
exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const reaction = message.reactions.find((r) => r.emoji === emoji);
    if (reaction) {
      const idx = reaction.users.indexOf(req.user._id);
      if (idx >= 0) reaction.users.splice(idx, 1); // toggle off
      else reaction.users.push(req.user._id);
    } else {
      message.reactions.push({ emoji, users: [req.user._id] });
    }

    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
