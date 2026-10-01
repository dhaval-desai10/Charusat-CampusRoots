import Otp from '../models/Otp.js';
import User from '../models/User.js';
import twilio from 'twilio';

// Twilio configuration - Add these to your .env file
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const twilioClient = twilio(accountSid, authToken);

// Generate random 6-digit OTP
const generateOTP = () => {
   return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS using Twilio
const sendSMS = async (mobileNumber, otp) => {
   try {
      // Also log to console for debugging
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱 SMS OTP VERIFICATION (Twilio)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📞 Mobile: ${mobileNumber}`);
      console.log(`🔐 OTP: ${otp}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // // Send SMS via Twilio
      // const message = await twilioClient.messages.create({
      //    body: `Your CampusRoots verification code is: ${otp}. Valid for 10 minutes.`,
      //    from: twilioPhoneNumber,
      //    to: mobileNumber
      // });

      // console.log(`✅ SMS sent successfully! SID: ${message.sid}`);
      // return true;
   } catch (error) {
      console.error('❌ Twilio SMS Error:', error.message);
      throw new Error('Failed to send SMS. Please try again later.');
   }
};

// Validate Indian mobile number format
const validateMobileNumber = (number) => {
   // Remove spaces, dashes, and country code
   const cleaned = number.replace(/[\s\-]/g, '').replace(/^\+91/, '');
   // Check if it's a valid 10-digit Indian mobile number
   const regex = /^[6-9]\d{9}$/;
   return regex.test(cleaned);
};

// Format mobile number to standard format
const formatMobileNumber = (number) => {
   const cleaned = number.replace(/[\s\-]/g, '').replace(/^\+91/, '');
   return `+91${cleaned}`;
};

// Send OTP
export const sendOtp = async (req, res) => {
   try {
      const { mobileNumber } = req.body;
      const userId = req.user._id;

      if (!mobileNumber) {
         return res.status(400).json({
            success: false,
            message: 'Mobile number is required'
         });
      }

      // Validate mobile number format
      if (!validateMobileNumber(mobileNumber)) {
         return res.status(400).json({
            success: false,
            message: 'Please enter a valid 10-digit Indian mobile number'
         });
      }

      const formattedNumber = formatMobileNumber(mobileNumber);

      // Check if this number is already verified by another user
      const existingUser = await User.findOne({ 
         mobileNumber: formattedNumber, 
         mobileVerified: true,
         _id: { $ne: userId }
      });

      if (existingUser) {
         return res.status(400).json({
            success: false,
            message: 'This mobile number is already registered with another account'
         });
      }

      // Rate limiting - check if OTP was sent recently (1 minute cooldown)
      const recentOtp = await Otp.findOne({
         mobileNumber: formattedNumber,
         userId,
         createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
      });

      if (recentOtp) {
         const timeLeft = Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000);
         return res.status(429).json({
            success: false,
            message: `Please wait ${timeLeft} seconds before requesting a new OTP`
         });
      }

      // Delete any existing OTPs for this user and number
      await Otp.deleteMany({ mobileNumber: formattedNumber, userId });

      // Generate new OTP
      const otp = generateOTP();

      // Save OTP to database (expires in 10 minutes)
      const otpDoc = await Otp.create({
         mobileNumber: formattedNumber,
         otp,
         userId,
         expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      // Send OTP via SMS
      await sendSMS(formattedNumber, otp);

      res.json({
         success: true,
         message: 'OTP sent successfully',
         mobileNumber: formattedNumber
      });

   } catch (error) {
      console.error('Send OTP Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to send OTP',
         error: error.message
      });
   }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
   try {
      const { mobileNumber, otp } = req.body;
      const userId = req.user._id;

      if (!mobileNumber || !otp) {
         return res.status(400).json({
            success: false,
            message: 'Mobile number and OTP are required'
         });
      }

      const formattedNumber = formatMobileNumber(mobileNumber);

      // Find the OTP record
      const otpRecord = await Otp.findOne({
         mobileNumber: formattedNumber,
         userId,
         verified: false
      });

      if (!otpRecord) {
         return res.status(400).json({
            success: false,
            message: 'OTP not found or expired. Please request a new OTP'
         });
      }

      // Check if OTP is expired
      if (otpRecord.expiresAt < new Date()) {
         await Otp.deleteOne({ _id: otpRecord._id });
         return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new OTP'
         });
      }

      // Check attempts (max 3)
      if (otpRecord.attempts >= 3) {
         await Otp.deleteOne({ _id: otpRecord._id });
         return res.status(400).json({
            success: false,
            message: 'Too many failed attempts. Please request a new OTP'
         });
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
         otpRecord.attempts += 1;
         await otpRecord.save();
         
         const attemptsLeft = 3 - otpRecord.attempts;
         return res.status(400).json({
            success: false,
            message: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining`
         });
      }

      // OTP verified successfully - update user
      await User.findByIdAndUpdate(userId, {
         mobileNumber: formattedNumber,
         mobileVerified: true
      });

      // Mark OTP as verified and delete it
      await Otp.deleteOne({ _id: otpRecord._id });

      console.log('✅ Mobile verified successfully:', formattedNumber);

      res.json({
         success: true,
         message: 'Mobile number verified successfully',
         mobileNumber: formattedNumber
      });

   } catch (error) {
      console.error('Verify OTP Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to verify OTP',
         error: error.message
      });
   }
};

// Resend OTP
export const resendOtp = async (req, res) => {
   try {
      const { mobileNumber } = req.body;
      const userId = req.user._id;

      if (!mobileNumber) {
         return res.status(400).json({
            success: false,
            message: 'Mobile number is required'
         });
      }

      const formattedNumber = formatMobileNumber(mobileNumber);

      // Rate limiting - check if OTP was sent recently (30 seconds for resend)
      const recentOtp = await Otp.findOne({
         mobileNumber: formattedNumber,
         userId,
         createdAt: { $gt: new Date(Date.now() - 30 * 1000) }
      });

      if (recentOtp) {
         const timeLeft = Math.ceil((recentOtp.createdAt.getTime() + 30000 - Date.now()) / 1000);
         return res.status(429).json({
            success: false,
            message: `Please wait ${timeLeft} seconds before resending OTP`
         });
      }

      // Delete existing OTPs
      await Otp.deleteMany({ mobileNumber: formattedNumber, userId });

      // Generate and save new OTP
      const otp = generateOTP();
      await Otp.create({
         mobileNumber: formattedNumber,
         otp,
         userId,
         expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });

      // Send OTP
      await sendSMS(formattedNumber, otp);

      res.json({
         success: true,
         message: 'OTP resent successfully'
      });

   } catch (error) {
      console.error('Resend OTP Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to resend OTP',
         error: error.message
      });
   }
};
