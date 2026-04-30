import express from 'express';
const router = express.Router();
import { registerUser, loginUser, updateProfile, getProfile, getAllRestaurants, getMyStudents } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/restaurants', getAllRestaurants);
router.get('/my-students', protect, getMyStudents);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

export default router;
