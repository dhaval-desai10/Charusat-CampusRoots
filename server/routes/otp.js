import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { sendOtp, verifyOtp, resendOtp } from '../controllers/otpController.js';

const router = express.Router();

// Send OTP to mobile number
router.post('/send', isAuthenticated, sendOtp);

// Verify OTP
router.post('/verify', isAuthenticated, verifyOtp);

// Resend OTP
router.post('/resend', isAuthenticated, resendOtp);

export default router;
