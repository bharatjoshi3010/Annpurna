/**
 * cronJobs.js
 *
 * Scheduled jobs for the Annpurna backend.
 *
 * Job: "Daily Booking Creator"
 *   - Runs at 4:00 AM IST every day
 *   - For every student with an active, non-expired subscription and a
 *     defaultRestaurantId, creates Breakfast + Lunch + Dinner bookings
 *     for TODAY at that restaurant.
 *   - Uses upsertBookings so it never duplicates — safe to re-run.
 */

import cron from 'node-cron';
import Student from './models/Student.js';
import { upsertBookings, dayRange } from './utils/bookingHelper.js';

const ALL_MEALS = ['Breakfast', 'Lunch', 'Dinner'];

export const startCronJobs = (io) => {

    // ── 4:00 AM IST daily — create today's bookings for all active subscribers ─
    cron.schedule('0 4 * * *', async () => {
        const now = new Date();
        console.log(`[CRON] 04:00 AM IST — Running daily booking creator... (${now.toISOString()})`);

        try {
            // Normalize "today" to midnight so all 3 bookings share the same
            // calendar-day date (avoids unique-index confusion on exact timestamps)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Only select students whose subscription is active AND not yet expired
            const activeStudents = await Student.find({
                subscriptionStatus: 'active',
                // Either no endDate was set (legacy rows) OR endDate is in the future
                $or: [
                    { subscriptionEndDate: { $exists: false } },
                    { subscriptionEndDate: null },
                    { subscriptionEndDate: { $gte: now } },
                ],
                defaultRestaurantId: { $exists: true, $ne: null },
            }).select('_id defaultRestaurantId subscriptionEndDate');

            console.log(`[CRON] Found ${activeStudents.length} active subscriber(s) with a default restaurant.`);

            let totalCreated = 0;
            let totalSkipped = 0;

            for (const student of activeStudents) {
                try {
                    const bookings = await upsertBookings(
                        student._id,
                        student.defaultRestaurantId,
                        ALL_MEALS,   // always all 3 at 4 AM — cutoffs haven't passed yet
                        today,       // midnight-normalized date so index works cleanly
                        io
                    );
                    totalCreated += bookings.length;
                    console.log(
                        `[CRON] Student ${student._id}: created/updated ${bookings.length} booking(s).`
                    );
                } catch (studentErr) {
                    totalSkipped++;
                    console.error(
                        `[CRON] Failed for student ${student._id}:`,
                        studentErr.message
                    );
                }
            }

            console.log(
                `[CRON] Done — ${totalCreated} booking(s) created/updated across ` +
                `${activeStudents.length} student(s). ${totalSkipped} student(s) skipped due to errors.`
            );
        } catch (err) {
            console.error('[CRON] Daily booking creator failed:', err.message);
        }
    }, {
        timezone: 'Asia/Kolkata',  // IST — ensures "4 AM" means 4 AM India time
    });

    console.log('[CRON] Daily booking creator registered (runs at 04:00 IST daily).');
};
