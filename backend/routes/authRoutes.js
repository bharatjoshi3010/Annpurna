import express from 'express';
const router = express.Router();
import { registerUser, loginUser, updateProfile, getProfile, getAllRestaurants } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/restaurants', getAllRestaurants);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

export default router;
