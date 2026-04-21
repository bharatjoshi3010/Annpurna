import express from 'express';
import { createPaymentIntent, confirmPayment, getTransactionHistory } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/history/:studentId', getTransactionHistory);

export default router;
