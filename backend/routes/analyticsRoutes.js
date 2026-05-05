import express from 'express';
import { getAdminAnalytics, getRestaurantAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/admin', protectAdmin, getAdminAnalytics);
router.get('/restaurant', protect, getRestaurantAnalytics);

export default router;
