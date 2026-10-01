import express from 'express';
import { uploadProfilePhoto } from '../config/cloudinary.js';
import { sendEmailOtp, verifyEmailOtp, resendEmailOtp } from '../controllers/emailOtpController.js';

const router = express.Router();

// Send OTP to email for signup verification (no auth required)
router.post('/send', sendEmailOtp);

// Verify OTP and complete registration (no auth required)
router.post('/verify', verifyEmailOtp);

// Resend OTP (no auth required)
router.post('/resend', resendEmailOtp);

export default router;
