const Room = require('../models/Room');
const User = require('../models/User');

// GET /api/rooms — all rooms the user belongs to
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate('members', 'username avatar isOnline lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rooms — create group room
exports.createRoom = async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;
    const allMembers = [...new Set([req.user._id.toString(), ...members])];

    const room = await Room.create({
      name,
      description,
      type: 'group',
      members: allMembers,
      admins: [req.user._id],
    });

    await room.populate('members', 'username avatar isOnline');
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rooms/direct — create or fetch DM room
exports.createDirect = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const members = [req.user._id, targetUserId].sort(); // deterministic order

    let room = await Room.findOne({ type: 'direct', members: { $all: members, $size: 2 } });
    if (!room) {
      room = await Room.create({ name: 'direct', type: 'direct', members });
    }

    await room.populate('members', 'username avatar isOnline lastSeen');
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rooms/:roomId/join
exports.joinRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.roomId,
      { $addToSet: { members: req.user._id } },
      { new: true }
    ).populate('members', 'username avatar isOnline');

    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
