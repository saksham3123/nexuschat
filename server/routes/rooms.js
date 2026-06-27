const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getRooms, createRoom, createDirect, joinRoom, browseRooms } = require('../controllers/rooms');

router.get('/browse',        protect, browseRooms);
router.get('/',              protect, getRooms);
router.post('/',             protect, createRoom);
router.post('/direct',       protect, createDirect);
router.post('/:roomId/join', protect, joinRoom);

module.exports = router;
