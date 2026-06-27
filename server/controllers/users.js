const User = require('../models/User');

// GET /api/users — all users except self, with online status
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username avatar isOnline lastSeen')
      .sort({ isOnline: -1, username: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
