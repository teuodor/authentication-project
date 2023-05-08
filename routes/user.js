const router = require('express').Router();
const userController = require('../controllers/user');
const { protect } = require('../middlewares/auth');

router.get('/', protect, userController.getAll);
router.get('/me', protect, userController.me);
router.post('/uploadUserPhoto', protect, userController.uploadUserPhoto);

module.exports = router;
