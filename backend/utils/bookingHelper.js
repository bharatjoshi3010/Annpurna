/**
 * bookingHelper.js
 *
 * Shared utility for creating or updating bookings in bulk.
 * Used by:
 *  - paymentController  → on new subscription (create remaining meals for today)
 *  - cronJobs           → at 4 AM daily (create all 3 meals for every active subscriber)
 *  - mealController     → on restaurant switch (update today's bookings to new restaurant)
 */

import Booking from '../models/Booking.js';

// ─── Cutoff & end times (kept in sync with mealController) ───────────────────
const MEAL_TIMES = {
    Breakfast: { cutoffHour: 7,  cutoffMinute: 30, endHour: 10, endMinute: 30 },
    Lunch:     { cutoffHour: 12, cutoffMinute: 30, endHour: 15, endMinute: 30 },
    Dinner:    { cutoffHour: 18, cutoffMinute: 45, endHour: 22, endMinute: 30 },
};

const ALL_MEALS = ['Breakfast', 'Lunch', 'Dinner'];

/** Returns start-of-day and end-of-day for a given Date (or today). */
export const dayRange = (date = new Date()) => {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);
    return { start, end };
};

/**
 * Returns which meals are still valid to auto-book right now.
 * A meal is bookable if its CUTOFF time has not yet passed
 * (i.e. you could still place an order for it).
 *
 * Examples:
 *   6:00 AM  → Breakfast + Lunch + Dinner (all cutoffs ahead)
 *   2:00 PM  → Dinner only (Breakfast cutoff 7:30 AM passed, Lunch cutoff 12:30 PM passed)
 *  10:00 PM  → none (Dinner cutoff 6:45 PM passed)
 */
export const getRemainingMeals = () => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();

    return ALL_MEALS.filter(meal => {
        const { cutoffHour, cutoffMinute } = MEAL_TIMES[meal];
        const cutoffMins = cutoffHour * 60 + cutoffMinute;
        return mins < cutoffMins;  // only book meals whose cutoff hasn't passed
    });
};

/**
 * Upsert (create-or-update) bookings for a student.
 *
 * @param {string}   studentId
 * @param {string}   restaurantId
 * @param {string[]} mealTypes    – e.g. ['Breakfast','Lunch','Dinner']
 * @param {Date}     [forDate]    – defaults to today
 * @param {object}   [io]         – socket.io instance for notifications
 * @returns created/updated booking documents
 */
export const upsertBookings = async (studentId, restaurantId, mealTypes, forDate = new Date(), io = null) => {
    const { start, end } = dayRange(forDate);
    const results = [];

    for (const mealType of mealTypes) {
        try {
            const existing = await Booking.findOne({
                student:  studentId,
                mealType,
                date: { $gte: start, $lte: end }
            });

            if (existing) {
                // Only update restaurant if booking is still open and not yet switched
                if (existing.status === 'booked' && !existing.restaurantSwitched) {
                    existing.restaurant = restaurantId;
                    await existing.save();
                    results.push(existing);

                    if (io) io.to(restaurantId.toString()).emit('newBooking', existing);
                }
                // else leave it untouched
            } else {
                // No booking yet — create one
                const booking = await Booking.create({
                    student:           studentId,
                    restaurant:        restaurantId,
                    mealType,
                    date:              forDate,
                    status:            'booked',
                    restaurantSwitched: false,
                });
                results.push(booking);

                if (io) io.to(restaurantId.toString()).emit('newBooking', booking);
            }
        } catch (err) {
            // Duplicate key on race — ignore
            if (err.code !== 11000) {
                console.error(`[upsertBookings] ${mealType} for ${studentId}:`, err.message);
            }
        }
    }

    return results;
};
