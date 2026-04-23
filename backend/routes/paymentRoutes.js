import express from 'express';
import { createPaymentIntent, confirmPayment, getTransactionHistory, buySubscription, getRefundPreview, cancelSubscription } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/history/:studentId', getTransactionHistory);
router.post('/subscribe', buySubscription);
router.get('/refund-preview/:studentId', getRefundPreview);
router.post('/cancel-subscription', cancelSubscription);

export default router;
