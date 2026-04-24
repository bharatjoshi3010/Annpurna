/**
 * testCron.js
 *
 * Manual test runner for the "Daily Booking Creator" cron logic.
 * Runs the exact same code that executes at 4 AM, right now.
 *
 * Usage:
 *   node testCron.js
 *
 * Safe to run multiple times — upsertBookings never creates duplicates.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Student from './models/Student.js';
import { upsertBookings, dayRange } from './utils/bookingHelper.js';
import Booking from './models/Booking.js';
import Restaurant from './models/Restaurant.js'; // needed for .populate('restaurant')

const ALL_MEALS = ['Breakfast', 'Lunch', 'Dinner'];

async function runDailyBookingJob() {
    // ── Connect to DB ────────────────────────────────────────────────────────
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.\n');

    const now = new Date();

    // Normalize today to midnight (same as real cron)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`📅 Running daily booking creator for: ${today.toDateString()}`);
    console.log(`🕐 Current time: ${now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n`);

    // ── Find all eligible active subscribers ─────────────────────────────────
    const activeStudents = await Student.find({
        subscriptionStatus: 'active',
        $or: [
            { subscriptionEndDate: { $exists: false } },
            { subscriptionEndDate: null },
            { subscriptionEndDate: { $gte: now } },
        ],
        defaultRestaurantId: { $exists: true, $ne: null },
    }).select('_id name email defaultRestaurantId subscriptionEndDate subscriptionStatus');

    console.log(`👥 Found ${activeStudents.length} active subscriber(s) with a default restaurant:`);
    activeStudents.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name || s.email || s._id}  |  restaurant: ${s.defaultRestaurantId}  |  expires: ${s.subscriptionEndDate ? s.subscriptionEndDate.toDateString() : 'N/A (legacy)'}`);
    });

    if (activeStudents.length === 0) {
        console.log('\n⚠️  No eligible students found. Check:');
        console.log('   • subscriptionStatus === "active"');
        console.log('   • subscriptionEndDate is in the future (or field does not exist)');
        console.log('   • defaultRestaurantId is set\n');
        await mongoose.disconnect();
        return;
    }

    console.log('\n📋 Creating bookings...\n');
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const student of activeStudents) {
        try {
            const bookings = await upsertBookings(
                student._id,
                student.defaultRestaurantId,
                ALL_MEALS,
                today,
                null  // no socket.io in test mode
            );

            if (bookings.length > 0) {
                console.log(`✅ ${student.name || student._id}: created/updated ${bookings.length} booking(s) → [${bookings.map(b => b.mealType).join(', ')}]`);
                totalCreated += bookings.length;
            } else {
                console.log(`⏭️  ${student.name || student._id}: all 3 meals already booked (skipped — no duplicates).`);
                totalSkipped++;
            }
        } catch (err) {
            console.error(`❌ ${student.name || student._id}: ERROR — ${err.message}`);
            totalSkipped++;
        }
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────────────');
    console.log(`📊 Summary:`);
    console.log(`   Students processed : ${activeStudents.length}`);
    console.log(`   Bookings created   : ${totalCreated}`);
    console.log(`   Students skipped   : ${totalSkipped} (already had bookings or errored)`);
    console.log('─────────────────────────────────────────────\n');

    // ── Show today's bookings from DB for verification ───────────────────────
    const { start, end } = dayRange(today);
    const allTodaysBookings = await Booking.find({ date: { $gte: start, $lte: end } })
        .populate('student', 'name email')
        .populate('restaurant', 'name')
        .sort({ mealType: 1 });

    console.log(`📅 All bookings in DB for today (${today.toDateString()}):\n`);
    if (allTodaysBookings.length === 0) {
        console.log('   (none)\n');
    } else {
        allTodaysBookings.forEach(b => {
            const studentLabel = b.student?.name || b.student?.email || b.student?._id || '?';
            const restLabel    = b.restaurant?.name || b.restaurant || '?';
            console.log(`   [${b.mealType.padEnd(9)}]  ${studentLabel.padEnd(25)}  → ${restLabel}  [${b.status}]`);
        });
        console.log();
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected. Test complete.\n');
}

runDailyBookingJob().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
