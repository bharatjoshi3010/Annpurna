const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateProfile, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

module.exports = router;
