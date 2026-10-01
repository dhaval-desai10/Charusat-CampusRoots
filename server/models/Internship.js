import mongoose from 'mongoose';

const internshipSchema = new mongoose.Schema({
   postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
   },
   company: {
      type: String,
      required: true,
      trim: true
   },
   location: {
      type: String,
      required: true,
      trim: true
   },
   locationType: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'onsite'
   },
   description: {
      type: String,
      required: true,
      maxlength: 5000
   },
   requirements: {
      type: String,
      maxlength: 2000
   },
   skills: [{
      type: String,
      trim: true
   }],
   duration: {
      type: String,
      required: true
   },
   stipend: {
      amount: {
         type: Number,
         default: 0
      },
      currency: {
         type: String,
         default: 'INR'
      },
      isPaid: {
         type: Boolean,
         default: true
      }
   },
   applicationDeadline: {
      type: Date,
      required: true
   },
   startDate: {
      type: Date
   },
   openings: {
      type: Number,
      default: 1,
      min: 1
   },
   status: {
      type: String,
      enum: ['active', 'closed', 'draft', 'expired'],
      default: 'active'
   },
   applicationsCount: {
      type: Number,
      default: 0
   },
   contactEmail: {
      type: String,
      trim: true
   },
   externalLink: {
      type: String,
      trim: true
   },
   isApproved: {
      type: Boolean,
      default: true
   },
   adminNotes: {
      type: String
   }
}, {
   timestamps: true
});

// Index for searching
internshipSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });
internshipSchema.index({ status: 1, applicationDeadline: 1 });
internshipSchema.index({ postedBy: 1 });

// Pre-save middleware to check if deadline has passed
internshipSchema.pre('save', function(next) {
   if (this.applicationDeadline < new Date() && this.status === 'active') {
      this.status = 'expired';
   }
   next();
});

// Only alumni can post internships
internshipSchema.pre('save', async function(next) {
   if (this.isNew) {
      const User = mongoose.model('User');
      const user = await User.findById(this.postedBy);
      if (!user || user.role !== 'alumni') {
         throw new Error('Only alumni can post internships');
      }
   }
   next();
});

const Internship = mongoose.model('Internship', internshipSchema);

export default Internship;
