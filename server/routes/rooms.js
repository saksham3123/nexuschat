const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getRooms, createRoom, createDirect, joinRoom } = require('../controllers/rooms');

router.get('/',              protect, getRooms);
router.post('/',             protect, createRoom);
router.post('/direct',       protect, createDirect);
router.post('/:roomId/join', protect, joinRoom);

module.exports = router;
