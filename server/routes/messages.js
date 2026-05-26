const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getMessages, sendMessage, reactToMessage } = require('../controllers/messages');

router.get('/:roomId',              protect, getMessages);
router.post('/:roomId',             protect, sendMessage);
router.patch('/:messageId/react',   protect, reactToMessage);

module.exports = router;
