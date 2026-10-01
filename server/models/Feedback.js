import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   type: {
      type: String,
      enum: ['feedback', 'suggestion'],
      required: true
   },
   rating: {
      type: Number,
      min: 1,
      max: 5,
      required: function() {
         return this.type === 'feedback';
      }
   },
   message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
   },
   isPublic: {
      type: Boolean,
      default: function() {
         return this.type === 'feedback';
      }
   },
   isRead: {
      type: Boolean,
      default: false
   },
   adminResponse: {
      type: String,
      trim: true
   },
   respondedAt: {
      type: Date
   }
}, { timestamps: true });

// Only alumni can submit feedback
feedbackSchema.pre('save', async function(next) {
   if (this.isNew) {
      const User = mongoose.model('User');
      const user = await User.findById(this.user);
      if (!user || user.role !== 'alumni') {
         throw new Error('Only alumni can submit feedback');
      }
   }
   next();
});

export default mongoose.model('Feedback', feedbackSchema);
