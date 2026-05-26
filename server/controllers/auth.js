const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRedis } = require('../config/redis');

const signTokens = (userId) => {
  const access = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'RS256' in process.env ? 'RS256' : 'HS256',
  });
  const refresh = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { access, refresh };
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ message: 'Username or email already taken' });

    const user = await User.create({ username, email, password });
    const tokens = signTokens(user._id);

    // Store refresh token in Redis (TTL 30 days)
    const redis = getRedis();
    await redis.setex(`refresh:${user._id}`, 30 * 24 * 3600, tokens.refresh);

    res.status(201).json({ user, ...tokens });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const tokens = signTokens(user._id);
    const redis = getRedis();
    await redis.setex(`refresh:${user._id}`, 30 * 24 * 3600, tokens.refresh);

    // Mark user online
    await User.findByIdAndUpdate(user._id, { isOnline: true });

    res.json({ user, ...tokens });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const redis = getRedis();
    const stored = await redis.get(`refresh:${decoded.id}`);
    if (stored !== refreshToken) return res.status(401).json({ message: 'Invalid refresh token' });

    const tokens = signTokens(decoded.id);
    await redis.setex(`refresh:${decoded.id}`, 30 * 24 * 3600, tokens.refresh);

    res.json(tokens);
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const redis = getRedis();

    // Blacklist access token until its natural expiry (~7d)
    await redis.setex(`blacklist:${token}`, 7 * 24 * 3600, '1');
    // Delete refresh token
    await redis.del(`refresh:${req.user._id}`);
    // Mark offline
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });

    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  res.json(req.user);
};
