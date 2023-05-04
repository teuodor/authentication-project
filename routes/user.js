const router = require('express').Router();
const userController = require('../controllers/user');
const { protect } = require('../middlewares/auth');

router.get('/me', protect, userController.me);
router.get('/allUsers', protect, userController.allUsers);
router.post('/uploadUserPhoto', protect, userController.uploadUserPhoto);

module.exports = router;
