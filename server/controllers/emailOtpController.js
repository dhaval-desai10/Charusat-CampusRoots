import EmailOtp from '../models/EmailOtp.js';
import User from '../models/User.js';
import { sendOtpEmail } from '../config/nodemailer.js';
import { getBatchFromEmail, getRoleFromEmail } from './authController.js';
import bcrypt from 'bcryptjs';

// Generate random 6-digit OTP
const generateOTP = () => {
   return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate CHARUSAT email
const isValidCharusatEmail = (email) => {
   return email.endsWith('@charusat.edu.in') || email.endsWith('@charusat.ac.in');
};

// Send OTP for email verification during signup
export const sendEmailOtp = async (req, res) => {
   try {
      const { email, name, password, profilePicture, profilePicturePublicId } = req.body;

      // Validate required fields
      if (!email) {
         return res.status(400).json({
            success: false,
            message: 'Email is required'
         });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Validate email domain
      if (!isValidCharusatEmail(normalizedEmail)) {
         return res.status(400).json({
            success: false,
            message: 'Only @charusat.edu.in and @charusat.ac.in emails are allowed'
         });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
         return res.status(400).json({
            success: false,
            message: 'An account with this email already exists'
         });
      }

      // Rate limiting - check if OTP was sent recently (1 minute cooldown)
      const recentOtp = await EmailOtp.findOne({
         email: normalizedEmail,
         createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
      });

      if (recentOtp) {
         const timeLeft = Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000);
         return res.status(429).json({
            success: false,
            message: `Please wait ${timeLeft} seconds before requesting a new OTP`
         });
      }

      // Delete any existing OTPs for this email
      await EmailOtp.deleteMany({ email: normalizedEmail });

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Hash password for temporary storage
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

      // Store OTP with registration data
      await EmailOtp.create({
         email: normalizedEmail,
         otp,
         name: name?.trim(),
         password: hashedPassword,
         profilePicture,
         profilePicturePublicId,
         expiresAt
      });

      // Send OTP email
      await sendOtpEmail(normalizedEmail, otp, name || 'User');

      res.json({
         success: true,
         message: 'OTP sent successfully to your email'
      });

   } catch (error) {
      console.error('Send Email OTP Error:', error);
      res.status(500).json({
         success: false,
         message: error.message || 'Failed to send OTP. Please try again.'
      });
   }
};

// Verify OTP and complete registration
export const verifyEmailOtp = async (req, res) => {
   try {
      const { email, otp } = req.body;

      if (!email || !otp) {
         return res.status(400).json({
            success: false,
            message: 'Email and OTP are required'
         });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Find the OTP record with password
      const otpRecord = await EmailOtp.findOne({ email: normalizedEmail }).select('+password');

      if (!otpRecord) {
         return res.status(400).json({
            success: false,
            message: 'OTP expired or not found. Please request a new one.'
         });
      }

      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
         await EmailOtp.deleteOne({ _id: otpRecord._id });
         return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new one.'
         });
      }

      // Check attempts (max 5)
      if (otpRecord.attempts >= 5) {
         await EmailOtp.deleteOne({ _id: otpRecord._id });
         return res.status(400).json({
            success: false,
            message: 'Too many failed attempts. Please request a new OTP.'
         });
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
         otpRecord.attempts += 1;
         await otpRecord.save();
         return res.status(400).json({
            success: false,
            message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`
         });
      }

      // OTP is valid - Create the user
      const userData = {
         name: otpRecord.name,
         email: normalizedEmail,
         password: otpRecord.password, // Already hashed
         authProvider: 'local',
         role: getRoleFromEmail(normalizedEmail),
         batch: getBatchFromEmail(normalizedEmail),
         emailVerified: true
      };

      if (otpRecord.profilePicture) {
         userData.profilePicture = otpRecord.profilePicture;
         userData.profilePicturePublicId = otpRecord.profilePicturePublicId;
      }

      // Create user (password is already hashed, need to save directly)
      const user = new User(userData);
      // Skip password hashing since it's already hashed
      user.$skipPasswordHash = true;
      await user.save();

      // Delete the OTP record
      await EmailOtp.deleteOne({ _id: otpRecord._id });

      // Log the user in
      req.login(user, (err) => {
         if (err) {
            console.error('Auto-login error:', err);
            return res.status(500).json({
               success: false,
               message: 'Account created but failed to login. Please login manually.'
            });
         }

         // Return user data (without password)
         const userResponse = user.toObject();
         delete userResponse.password;

         res.json({
            success: true,
            message: 'Email verified and account created successfully!',
            user: userResponse
         });
      });

   } catch (error) {
      console.error('Verify Email OTP Error:', error);
      res.status(500).json({
         success: false,
         message: error.message || 'Failed to verify OTP. Please try again.'
      });
   }
};

// Resend OTP
export const resendEmailOtp = async (req, res) => {
   try {
      const { email } = req.body;

      if (!email) {
         return res.status(400).json({
            success: false,
            message: 'Email is required'
         });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Find existing OTP record
      const existingRecord = await EmailOtp.findOne({ email: normalizedEmail }).select('+password');

      if (!existingRecord) {
         return res.status(400).json({
            success: false,
            message: 'No pending verification found. Please start signup again.'
         });
      }

      // Rate limiting - 1 minute cooldown
      const timeSinceLastOtp = Date.now() - existingRecord.updatedAt.getTime();
      if (timeSinceLastOtp < 60000) {
         const timeLeft = Math.ceil((60000 - timeSinceLastOtp) / 1000);
         return res.status(429).json({
            success: false,
            message: `Please wait ${timeLeft} seconds before resending OTP`
         });
      }

      // Generate new OTP
      const newOtp = generateOTP();
      existingRecord.otp = newOtp;
      existingRecord.attempts = 0;
      existingRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await existingRecord.save();

      // Send new OTP email
      await sendOtpEmail(normalizedEmail, newOtp, existingRecord.name || 'User');

      res.json({
         success: true,
         message: 'New OTP sent successfully'
      });

   } catch (error) {
      console.error('Resend Email OTP Error:', error);
      res.status(500).json({
         success: false,
         message: error.message || 'Failed to resend OTP. Please try again.'
      });
   }
};
