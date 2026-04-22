import express from 'express';
import { bookMeal, cancelMeal, getIncomingStudents, getStudentBookings, getStudentMealStatus, markConsumed } from '../controllers/mealController.js';

const router = express.Router();

router.post('/book', bookMeal);
router.post('/cancel', cancelMeal);
router.post('/consume', markConsumed);
router.get('/incoming/:restaurantId', getIncomingStudents);
router.get('/student/:studentId', getStudentBookings);
router.get('/status/:studentId', getStudentMealStatus);

export default router;
