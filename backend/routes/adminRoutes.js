import express from 'express';
import {
    getAllStudents,
    updateStudent,
    deleteStudent,
    getAllRestaurants,
    updateRestaurant,
    deleteRestaurant
} from '../controllers/adminController.js';

const router = express.Router();

// Student Routes
router.get('/students', getAllStudents);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Restaurant Routes
router.get('/restaurants', getAllRestaurants);
router.put('/restaurants/:id', updateRestaurant);
router.delete('/restaurants/:id', deleteRestaurant);

export default router;
