import express from 'express';
import { updateMenu, getRestaurantMenu, deleteMenuItem } from '../controllers/menuController.js';

const router = express.Router();

router.post('/update', updateMenu);
router.get('/:restaurantId', getRestaurantMenu);
router.delete('/:menuId', deleteMenuItem);

export default router;
