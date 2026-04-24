import Stripe from 'stripe';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';
import Booking from '../models/Booking.js';
import dotenv from 'dotenv';
import { upsertBookings, getRemainingMeals } from '../utils/bookingHelper.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
    try {
        const { amount, studentId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency: 'inr',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                studentId: studentId.toString(),
            }
        });

        // Create a pending transaction record
        await Transaction.create({
            user: studentId,
            amount,
            type: 'credit',
            status: 'pending',
            stripePaymentIntentId: paymentIntent.id
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId, studentId } = req.body;
        console.log('Verifying payment for Intent:', paymentIntentId);

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log('Stripe status:', paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
            // Update transaction status
            const transaction = await Transaction.findOneAndUpdate(
                { stripePaymentIntentId: paymentIntentId },
                { status: 'success' },
                { new: true }
            );

            if (transaction) {
                console.log('Transaction found and updated:', transaction._id);
                // Update student balance
                const student = await Student.findByIdAndUpdate(
                    studentId,
                    { $inc: { walletBalance: transaction.amount } },
                    { new: true }
                );

                console.log('Student balance updated to:', student.walletBalance);
                return res.json({ 
                    message: 'Payment successful', 
                    balance: student.walletBalance,
                    transaction 
                });
            } else {
                console.log('ERROR: Transaction record not found for Intent:', paymentIntentId);
            }
        }

        res.status(400).json({ message: `Payment status is ${paymentIntent.status}. Expected "succeeded".` });
    } catch (error) {
        console.error('Confirmation error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getTransactionHistory = async (req, res) => {
    try {
        const { studentId } = req.params;
        const transactions = await Transaction.find({ user: studentId }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const buySubscription = async (req, res) => {
    try {
        const { studentId, planName, price, defaultRestaurantId } = req.body;
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (student.walletBalance < price) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Deduct balance and update subscription
        const subscriptionStart = new Date();
        const subscriptionEnd   = new Date(subscriptionStart);
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 30); // 30-day plan

        student.walletBalance -= price;
        student.selectedPlan = planName;
        student.defaultRestaurantId = defaultRestaurantId;
        student.subscriptionDate = subscriptionStart;
        student.subscriptionEndDate = subscriptionEnd;
        student.subscriptionStatus = 'active';
        
        student.subscriptionHistory.push({
            planName,
            price,
            startDate: subscriptionStart,
            endDate:   subscriptionEnd,
            status: 'active'
        });

        await student.save();

        // Create a transaction record
        await Transaction.create({
            user: studentId,
            amount: price,
            type: 'debit',
            status: 'success',
            description: `Subscription: ${planName}`
        });

        // ── Auto-create bookings for remaining meals today ───────────────────────
        // Uses cutoff times: e.g. plan bought at 2 PM → only Dinner is still bookable
        const remainingMeals = getRemainingMeals(); // cutoff-based, no arg needed
        if (remainingMeals.length > 0 && defaultRestaurantId) {
            await upsertBookings(
                studentId,
                defaultRestaurantId,
                remainingMeals,
                new Date(),
                req.io
            );
            console.log(`[Subscription] Auto-booked ${remainingMeals.length} meal(s) for student ${studentId}: ${remainingMeals.join(', ')}`);
        } else if (remainingMeals.length === 0) {
            console.log(`[Subscription] All meal cutoffs passed for today — bookings will be created by 4 AM cron.`);
        }

        res.json({ message: 'Subscription successful', student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Shared refund calculation (pure, no DB writes) ──────────────────────────
const calcRefund = async (student) => {
    const MEAL_COST = { Breakfast: 26, Lunch: 40, Dinner: 40 };
    const EARLY_CANCELLATION_CHARGE = 100;

    const activeSub = student.subscriptionHistory.find(h => h.status === 'active');
    const subscriptionPrice = activeSub?.price || 0;
    const subscriptionStart = activeSub?.startDate || student.subscriptionDate || new Date(0);

    const consumedBookings = await Booking.find({
        student: student._id,
        status: 'consumed',
        date: { $gte: subscriptionStart }
    });

    let mealDeduction = 0;
    const mealBreakdown = { Breakfast: 0, Lunch: 0, Dinner: 0 };

    for (const booking of consumedBookings) {
        const cost = MEAL_COST[booking.mealType] || 40;
        mealDeduction += cost;
        if (mealBreakdown[booking.mealType] !== undefined) {
            mealBreakdown[booking.mealType]++;
        }
    }

    const refundAmount = Math.max(0, subscriptionPrice - mealDeduction - EARLY_CANCELLATION_CHARGE);

    return {
        subscriptionPrice,
        totalMealsConsumed: consumedBookings.length,
        mealBreakdown,
        mealDeduction,
        earlyCancellationCharge: EARLY_CANCELLATION_CHARGE,
        refundAmount
    };
};

export const getRefundPreview = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId);

        if (!student) return res.status(404).json({ message: 'User not found' });
        if (student.subscriptionStatus !== 'active') {
            return res.status(400).json({ message: 'No active subscription found' });
        }

        const refund = await calcRefund(student);
        res.json({ refund });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const cancelSubscription = async (req, res) => {
    try {
        const { studentId } = req.body;
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (student.subscriptionStatus !== 'active') {
            return res.status(400).json({ message: 'No active subscription found' });
        }

        // ── Shared helper computes refund without any DB writes ────────────────
        const planName = student.selectedPlan || '';
        const { subscriptionPrice, mealBreakdown, mealDeduction,
                earlyCancellationCharge, refundAmount,
                totalMealsConsumed } = await calcRefund(student);

        // ── Cancel subscription in student record ──────────────────────────────
        const activeSub = student.subscriptionHistory.find(h => h.status === 'active');
        if (activeSub) {
            activeSub.status  = 'cancelled';
            activeSub.endDate = new Date();
        }
        student.selectedPlan        = null;
        student.subscriptionStatus  = 'cancelled';
        student.defaultRestaurantId = null;

        // ── Credit refund to wallet ────────────────────────────────────────────
        student.walletBalance += refundAmount;
        await student.save();

        // ── Record a detailed refund transaction ───────────────────────────────
        const breakdownText =
            `Meals deducted — ` +
            `Breakfast ×${mealBreakdown.Breakfast} (₹${mealBreakdown.Breakfast * 26}), ` +
            `Lunch ×${mealBreakdown.Lunch} (₹${mealBreakdown.Lunch * 40}), ` +
            `Dinner ×${mealBreakdown.Dinner} (₹${mealBreakdown.Dinner * 40}). ` +
            `Early cancellation: ₹${earlyCancellationCharge}. ` +
            `Refund: ₹${refundAmount}.`;

        await Transaction.create({
            user:        studentId,
            amount:      refundAmount,
            type:        'credit',
            status:      'success',
            description: `Subscription Cancellation Refund — ${planName || 'Plan'}. ${breakdownText}`
        });

        res.json({
            message: 'Subscription cancelled successfully',
            refund: {
                subscriptionPrice,
                totalMealsConsumed,
                mealBreakdown,
                mealDeduction,
                earlyCancellationCharge,
                refundAmount,
                newWalletBalance: student.walletBalance
            },
            student
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ message: error.message });
    }
};
