const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getUsers } = require('../controllers/users');

router.get('/', protect, getUsers);

module.exports = router;
