/**
 * cronJobs.js
 *
 * Scheduled jobs for the Annpurna backend.
 *
 * Job: "Daily Booking Creator"
 *   - Runs at 4:00 AM every day
 *   - For every student with an active subscription and a defaultRestaurantId,
 *     creates Breakfast + Lunch + Dinner bookings at that restaurant.
 *   - Uses upsertBookings so it never duplicates — safe to re-run.
 */

import cron from 'node-cron';
import Student from './models/Student.js';
import { upsertBookings } from './utils/bookingHelper.js';

const ALL_MEALS = ['Breakfast', 'Lunch', 'Dinner'];

export const startCronJobs = (io) => {

    // ── 4:00 AM daily — create today's bookings for all active subscribers ────
    cron.schedule('0 4 * * *', async () => {
        console.log('[CRON] 04:00 AM — Running daily booking creator...');

        try {
            const activeStudents = await Student.find({
                subscriptionStatus: 'active',
                defaultRestaurantId: { $ne: null },
            }).select('_id defaultRestaurantId');

            let created = 0;
            const today = new Date();

            for (const student of activeStudents) {
                const bookings = await upsertBookings(
                    student._id,
                    student.defaultRestaurantId,
                    ALL_MEALS,
                    today,
                    io
                );
                created += bookings.length;
            }

            console.log(`[CRON] Done — ${created} bookings created/updated for ${activeStudents.length} students.`);
        } catch (err) {
            console.error('[CRON] Daily booking creator failed:', err.message);
        }
    }, {
        timezone: 'Asia/Kolkata'  // IST
    });

    console.log('[CRON] Daily booking creator registered (runs at 04:00 IST).');
};
