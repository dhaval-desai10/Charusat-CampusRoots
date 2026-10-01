import mongoose from 'mongoose';

const emailOtpSchema = new mongoose.Schema({
   email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
   },
   otp: {
      type: String,
      required: true
   },
   name: {
      type: String,
      trim: true
   },
   password: {
      type: String,
      select: false // Don't include in queries by default
   },
   profilePicture: {
      type: String
   },
   profilePicturePublicId: {
      type: String
   },
   verified: {
      type: Boolean,
      default: false
   },
   attempts: {
      type: Number,
      default: 0
   },
   expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Auto-delete when expired
   }
}, { timestamps: true });

// Index for faster queries
emailOtpSchema.index({ email: 1, createdAt: -1 });

const EmailOtp = mongoose.model('EmailOtp', emailOtpSchema);

export default EmailOtp;
