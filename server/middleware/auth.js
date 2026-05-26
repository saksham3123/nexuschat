const jwt = require('jsonwebtoken');
const { getRedis } = require('../config/redis');
const User = require('../models/User');

// ── REST middleware ────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // Check if token is blacklisted (logout)
    const redis = getRedis();
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) return res.status(401).json({ message: 'Token revoked' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ── Socket.io middleware ───────────────────────────────────────────────────────
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    const redis = getRedis();
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) return next(new Error('Token revoked'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
};

module.exports = { protect, socketAuth };
