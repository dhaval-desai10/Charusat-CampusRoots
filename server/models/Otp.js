import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
   mobileNumber: {
      type: String,
      required: true,
      index: true
   },
   otp: {
      type: String,
      required: true
   },
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
otpSchema.index({ mobileNumber: 1, userId: 1 });

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
