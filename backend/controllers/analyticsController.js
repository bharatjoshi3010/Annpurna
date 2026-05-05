import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';

// Constants
const MEAL_PRICES = { Breakfast: 20, Lunch: 40, Dinner: 40 };

// Helper to calculate booking value
const getBookingValue = (mealType) => MEAL_PRICES[mealType] || 0;

/**
 * @desc    Get global and student-wise analytics for Admin
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
export const getAdminAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, mealType, studentId } = req.query;

        // Build Booking filter
        let matchStage = {};
        if (startDate && endDate) {
            matchStage.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (mealType && mealType !== 'all') {
            matchStage.mealType = { $regex: new RegExp(`^${mealType}$`, 'i') };
        }
        if (studentId && studentId !== 'all') {
            matchStage.student = mongoose.Types.ObjectId(studentId);
        }

        // 1. Get all students to calculate wallet & sub total
        const students = await Student.find().lean();
        const totalWalletBalance = students.reduce((sum, s) => sum + (s.walletBalance || 0), 0);

        // 2. Get total subscription revenue from Transactions
        const subTransactions = await Transaction.aggregate([
            { $match: { type: 'credit', status: 'success' } },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
        ]);
        const totalSubscriptionRevenue = subTransactions.length ? subTransactions[0].totalRevenue : 0;

        // 3. Aggregate bookings for global & student-wise stats
        const bookings = await Booking.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$student',
                    consumedCount: { $sum: { $cond: [{ $eq: ['$status', 'consumed'] }, 1, 0] } },
                    missedCount: { $sum: { $cond: [{ $eq: ['$status', 'not_consumed'] }, 1, 0] } },
                    bookings: { $push: '$$ROOT' }
                }
            }
        ]);

        let globalConsumedValue = 0;
        let globalMissedValue = 0;

        const studentDataMap = {};
        students.forEach(s => {
            studentDataMap[s._id.toString()] = {
                student: s,
                walletBalance: s.walletBalance || 0,
                totalSubscriptionSpend: 0, // Simplified: Could calculate from Transaction
                mealsConsumed: 0,
                consumedValue: 0,
                mealsMissed: 0,
                missedValue: 0
            };
        });

        // Add subscription spend from history
        students.forEach(s => {
            let spend = 0;
            if (s.subscriptionHistory) {
                s.subscriptionHistory.forEach(h => spend += (h.price || 0));
            }
            studentDataMap[s._id.toString()].totalSubscriptionSpend = spend;
        });

        // Process booking data
        bookings.forEach(b => {
            const sid = b._id.toString();
            if (!studentDataMap[sid]) return;

            let consumedVal = 0;
            let missedVal = 0;
            let consumedCnt = 0;
            let missedCnt = 0;

            b.bookings.forEach(booking => {
                const val = getBookingValue(booking.mealType);
                if (booking.status === 'consumed') {
                    consumedVal += val;
                    consumedCnt++;
                    globalConsumedValue += val;
                } else if (booking.status === 'not_consumed') {
                    missedVal += val;
                    missedCnt++;
                    globalMissedValue += val;
                }
            });

            studentDataMap[sid].mealsConsumed = consumedCnt;
            studentDataMap[sid].consumedValue = consumedVal;
            studentDataMap[sid].mealsMissed = missedCnt;
            studentDataMap[sid].missedValue = missedVal;
            
            const efficiency = studentDataMap[sid].totalSubscriptionSpend > 0 
                ? (consumedVal / studentDataMap[sid].totalSubscriptionSpend) * 100 
                : 0;
            studentDataMap[sid].efficiencyScore = efficiency;
        });

        const studentData = Object.values(studentDataMap);

        res.json({
            global: {
                totalWalletBalance,
                totalSubscriptionRevenue,
                totalConsumedValue: globalConsumedValue,
                totalMissedValue: globalMissedValue
            },
            students: studentData
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};

/**
 * @desc    Get analytics for a Restaurant
 * @route   GET /api/meals/restaurant/analytics
 * @access  Private/Restaurant
 */
export const getRestaurantAnalytics = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { startDate, endDate } = req.query;

        let matchStage = { restaurant: restaurantId };
        if (startDate && endDate) {
            matchStage.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const bookings = await Booking.find(matchStage).lean();

        let totalEarnings = 0;
        let revenueLost = 0;
        let mealsServed = 0;
        let mealsMissed = 0;

        const breakdown = {
            Breakfast: { count: 0, revenue: 0, missedCount: 0, missedRevenue: 0 },
            Lunch: { count: 0, revenue: 0, missedCount: 0, missedRevenue: 0 },
            Dinner: { count: 0, revenue: 0, missedCount: 0, missedRevenue: 0 }
        };

        const weeklyTrend = {};

        bookings.forEach(b => {
            const val = getBookingValue(b.mealType);
            const dateStr = b.date.toISOString().split('T')[0];

            if (!weeklyTrend[dateStr]) {
                weeklyTrend[dateStr] = { consumed: 0, missed: 0 };
            }

            if (b.status === 'consumed') {
                totalEarnings += val;
                mealsServed++;
                if (breakdown[b.mealType]) {
                    breakdown[b.mealType].count++;
                    breakdown[b.mealType].revenue += val;
                }
                weeklyTrend[dateStr].consumed += val;
            } else if (b.status === 'not_consumed') {
                revenueLost += val;
                mealsMissed++;
                if (breakdown[b.mealType]) {
                    breakdown[b.mealType].missedCount++;
                    breakdown[b.mealType].missedRevenue += val;
                }
                weeklyTrend[dateStr].missed += val;
            }
        });

        // Convert weeklyTrend to array
        const trendData = Object.keys(weeklyTrend).sort().map(date => ({
            date,
            ...weeklyTrend[date]
        }));

        res.json({
            totalEarnings,
            revenueLost,
            mealsServed,
            mealsMissed,
            breakdown,
            trendData
        });

    } catch (error) {
        console.error('Restaurant Analytics Error:', error);
        res.status(500).json({ message: 'Failed to fetch restaurant analytics' });
    }
};
