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
import Booking from './models/Booking.js';
import { upsertBookings, dayRange } from './utils/bookingHelper.js';

const ALL_MEALS = ['Breakfast', 'Lunch', 'Dinner'];

/**
 * Immediately creates today's bookings for all active subscribers who
 * don't already have them.  Called on server start AND can be triggered
 * manually via the /api/admin/run-booking-job route.
 */
export const runStartupBookings = async (io = null) => {
    const now   = new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { start, end } = dayRange(today);

    console.log(`[STARTUP] Running catch-up booking job for ${today.toDateString()}...`);

    try {
        const activeStudents = await Student.find({
            subscriptionStatus: 'active',
            $or: [
                { subscriptionEndDate: { $exists: false } },
                { subscriptionEndDate: null },
                { subscriptionEndDate: { $gte: now } },
            ],
            defaultRestaurantId: { $exists: true, $ne: null },
        }).select('_id defaultRestaurantId subscriptionEndDate');

        console.log(`[STARTUP] Found ${activeStudents.length} active subscriber(s).`);

        let totalCreated = 0;

        for (const student of activeStudents) {
            try {
                // Check which meals already exist for today
                const existing = await Booking.find({
                    student: student._id,
                    date:    { $gte: start, $lte: end },
                }).select('mealType');

                const alreadyBooked = existing.map(b => b.mealType);
                const missing = ALL_MEALS.filter(m => !alreadyBooked.includes(m));

                if (missing.length === 0) {
                    console.log(`[STARTUP] Student ${student._id}: all 3 meals already booked — skipping.`);
                    continue;
                }

                const bookings = await upsertBookings(
                    student._id,
                    student.defaultRestaurantId,
                    missing,
                    today,
                    io
                );
                totalCreated += bookings.length;
                console.log(`[STARTUP] Student ${student._id}: created ${bookings.length} missing booking(s) → [${missing.join(', ')}]`);
            } catch (studentErr) {
                console.error(`[STARTUP] Failed for student ${student._id}:`, studentErr.message);
            }
        }

        console.log(`[STARTUP] Catch-up complete — ${totalCreated} booking(s) created.`);
        return { studentsFound: activeStudents.length, bookingsCreated: totalCreated };
    } catch (err) {
        console.error('[STARTUP] Catch-up booking job failed:', err.message);
        return { error: err.message };
    }
};


export const startCronJobs = (io) => {

    // ── Run immediately on startup to catch up any missed bookings ─────────────
    // (handles server restarts mid-day where the 4 AM cron already passed)
    setImmediate(() => runStartupBookings(io));

    // ── 4:00 AM IST daily — create today's bookings for all active subscribers ─
    cron.schedule('0 4 * * *', async () => {
        const now = new Date();
        console.log(`[CRON] 04:00 AM IST — Running daily booking creator... (${now.toISOString()})`);

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const activeStudents = await Student.find({
                subscriptionStatus: 'active',
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
                        today,
                        io
                    );
                    totalCreated += bookings.length;
                    console.log(`[CRON] Student ${student._id}: created/updated ${bookings.length} booking(s).`);
                } catch (studentErr) {
                    totalSkipped++;
                    console.error(`[CRON] Failed for student ${student._id}:`, studentErr.message);
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
        timezone: 'Asia/Kolkata',
    });

    console.log('[CRON] Daily booking creator registered (runs at 04:00 IST daily).');
};

