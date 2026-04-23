import express from 'express';
import {
    adminLogin,
    adminMe,
    getAllStudents,
    updateStudent,
    deleteStudent,
    getAllRestaurants,
    updateRestaurant,
    deleteRestaurant,
} from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// ── Public: Admin login ───────────────────────────────────────────────────────
router.post('/login', adminLogin);

// ── Protected: session restore (admin web calls this on page load) ────────────
router.get('/me', protectAdmin, adminMe);

// ── Protected: Student Routes ─────────────────────────────────────────────────
router.get('/students',      protectAdmin, getAllStudents);
router.put('/students/:id',  protectAdmin, updateStudent);
router.delete('/students/:id', protectAdmin, deleteStudent);

// ── Protected: Restaurant Routes ──────────────────────────────────────────────
router.get('/restaurants',        protectAdmin, getAllRestaurants);
router.put('/restaurants/:id',    protectAdmin, updateRestaurant);
router.delete('/restaurants/:id', protectAdmin, deleteRestaurant);

export default router;
