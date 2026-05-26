const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { register, login, logout, refresh, me } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many attempts' });

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.post('/refresh',  refresh);
router.post('/logout',   protect, logout);
router.get('/me',        protect, me);

module.exports = router;
