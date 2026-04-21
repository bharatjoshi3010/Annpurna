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

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Update transaction status
            const transaction = await Transaction.findOneAndUpdate(
                { stripePaymentIntentId: paymentIntentId },
                { status: 'success' },
                { new: true }
            );

            if (transaction) {
                // Update student balance
                const student = await Student.findByIdAndUpdate(
                    studentId,
                    { $inc: { walletBalance: transaction.amount } },
                    { new: true }
                );

                return res.json({ 
                    message: 'Payment successful', 
                    balance: student.walletBalance,
                    transaction 
                });
            }
        }

        res.status(400).json({ message: 'Payment not successful' });
    } catch (error) {
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
