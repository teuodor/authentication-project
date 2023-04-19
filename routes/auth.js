const router = require('express').Router();
const authController = require('../controllers/auth');
const { protect } = require('../middlewares/auth');

router.post('/login', authController.login);
router.get('/logout', protect, authController.logout);
router.post('/register', authController.register);
router.post('/password/reset', authController.resetPassword);
router.post('/password/change', protect, authController.changePassword);
router.patch('/password', authController.createPassword);
router.get('/me', protect, authController.me);

module.exports = router;
