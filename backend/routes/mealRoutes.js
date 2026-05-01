import express from 'express';
import {
    bookMeal,
    cancelMeal,
    getIncomingStudents,
    getStudentBookings,
    getStudentMealStatus,
    getRestaurantsForMeal,
    markConsumed,
    getRestaurantMealHistory,
    generateQR,
    validateQR,
} from '../controllers/mealController.js';

const router = express.Router();

router.post('/book',                       bookMeal);
router.post('/cancel',                     cancelMeal);
router.post('/consume',                    markConsumed);
router.post('/generate-qr',               generateQR);   // Restaurant: creates one-time token
router.post('/validate-qr',               validateQR);   // Student:    submits token → consumed
router.get('/restaurants-for-meal/:mealType', getRestaurantsForMeal);
router.get('/incoming/:restaurantId',     getIncomingStudents);
router.get('/history/:restaurantId',      getRestaurantMealHistory);
router.get('/student/:studentId',         getStudentBookings);
router.get('/status/:studentId',          getStudentMealStatus);

export default router;
