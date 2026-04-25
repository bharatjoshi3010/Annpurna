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
import { runStartupBookings } from '../cronJobs.js';

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

// ── Manual trigger: create today's missing bookings for all active subscribers ─
// POST /api/admin/run-booking-job
router.post('/run-booking-job', protectAdmin, async (req, res) => {
    try {
        const result = await runStartupBookings(req.io);
        res.json({ message: 'Booking job completed', ...result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
