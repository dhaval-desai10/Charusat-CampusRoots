import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   amount: {
      type: Number,
      required: true,
      min: 1
   },
   currency: {
      type: String,
      default: 'inr'
   },
   purpose: {
      type: String,
      enum: ['general', 'scholarship', 'infrastructure', 'events', 'other'],
      default: 'general'
   },
   message: {
      type: String,
      maxlength: 500
   },
   isAnonymous: {
      type: Boolean,
      default: false
   },
   // Stripe payment details
   stripePaymentIntentId: {
      type: String
   },
   stripeChargeId: {
      type: String
   },
   paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
      default: 'pending'
   },
   paymentMethod: {
      type: String,
      default: 'card'
   },
   receiptUrl: {
      type: String
   },
   // For admin notes
   adminNotes: {
      type: String
   },
   acknowledgedAt: {
      type: Date
   }
}, {
   timestamps: true
});

// Pre-save hook to ensure only alumni can donate
donationSchema.pre('save', async function(next) {
   if (this.isNew) {
      const User = mongoose.model('User');
      const user = await User.findById(this.user);
      if (!user || user.role !== 'alumni') {
         const error = new Error('Only alumni can make donations');
         error.statusCode = 403;
         return next(error);
      }
   }
   next();
});

// Index for efficient queries
donationSchema.index({ user: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ purpose: 1 });

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
