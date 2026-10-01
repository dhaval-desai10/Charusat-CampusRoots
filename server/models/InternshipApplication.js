import mongoose from 'mongoose';

const internshipApplicationSchema = new mongoose.Schema({
   internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: true
   },
   applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   coverLetter: {
      type: String,
      maxlength: 2000
   },
   resume: {
      type: String // URL to uploaded resume
   },
   portfolio: {
      type: String // URL to portfolio/GitHub
   },
   expectedStipend: {
      type: Number
   },
   availableFrom: {
      type: Date
   },
   status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
   },
   alumniNotes: {
      type: String,
      maxlength: 1000
   },
   reviewedAt: {
      type: Date
   }
}, {
   timestamps: true
});

// Ensure one application per student per internship
internshipApplicationSchema.index({ internship: 1, applicant: 1 }, { unique: true });
internshipApplicationSchema.index({ applicant: 1 });
internshipApplicationSchema.index({ internship: 1, status: 1 });

// Only students can apply
internshipApplicationSchema.pre('save', async function(next) {
   if (this.isNew) {
      const User = mongoose.model('User');
      const user = await User.findById(this.applicant);
      if (!user || user.role !== 'student') {
         throw new Error('Only students can apply for internships');
      }
   }
   next();
});

// Update applications count on internship when application is created
internshipApplicationSchema.post('save', async function() {
   const Internship = mongoose.model('Internship');
   const count = await mongoose.model('InternshipApplication').countDocuments({ 
      internship: this.internship 
   });
   await Internship.findByIdAndUpdate(this.internship, { applicationsCount: count });
});

const InternshipApplication = mongoose.model('InternshipApplication', internshipApplicationSchema);

export default InternshipApplication;
