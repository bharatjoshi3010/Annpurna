import Stripe from 'stripe';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';
import dotenv from 'dotenv';

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
        student.walletBalance -= price;
        student.selectedPlan = planName;
        student.defaultRestaurantId = defaultRestaurantId;
        student.subscriptionDate = new Date();
        student.subscriptionStatus = 'active';
        
        student.subscriptionHistory.push({
            planName,
            price,
            startDate: new Date(),
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

        res.json({ message: 'Subscription successful', student });
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

        // Update history
        const activeSub = student.subscriptionHistory.find(h => h.status === 'active');
        if (activeSub) {
            activeSub.status = 'cancelled';
            activeSub.endDate = new Date();
        }

        student.selectedPlan = null;
        student.subscriptionStatus = 'cancelled';
        
        await student.save();

        res.json({ message: 'Subscription cancelled successfully', student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
