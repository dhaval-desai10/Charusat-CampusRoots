import mongoose from 'mongoose';

const reunionSchema = new mongoose.Schema({
   title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
   },
   description: {
      type: String,
      required: true,
      maxlength: 2000
   },
   organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   // Target batches for this reunion (e.g., ["2018-2022", "2019-2023"])
   targetBatches: [{
      type: String,
      required: true
   }],
   // Target departments (optional - if empty, all departments)
   targetDepartments: [{
      type: String
   }],
   // Event details
   eventDate: {
      type: Date,
      required: true
   },
   eventTime: {
      type: String,
      required: true
   },
   venue: {
      type: String,
      required: true,
      maxlength: 500
   },
   // Online meeting link (optional)
   meetingLink: {
      type: String,
      default: ''
   },
   // Event type
   eventType: {
      type: String,
      enum: ['in-person', 'online', 'hybrid'],
      default: 'in-person'
   },
   // Maximum attendees (0 = unlimited)
   maxAttendees: {
      type: Number,
      default: 0
   },
   // RSVPs
   attendees: [{
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      },
      status: {
         type: String,
         enum: ['going', 'interested', 'not-going'],
         default: 'interested'
      },
      rsvpDate: {
         type: Date,
         default: Date.now
      }
   }],
   // Event status
   status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming'
   },
   // Cover image
   coverImage: {
      type: String,
      default: ''
   },
   coverImagePublicId: {
      type: String,
      default: ''
   },
   // Contact information
   contactEmail: {
      type: String,
      default: ''
   },
   contactPhone: {
      type: String,
      default: ''
   }
}, {
   timestamps: true
});

// Index for efficient queries
reunionSchema.index({ targetBatches: 1, eventDate: 1 });
reunionSchema.index({ organizer: 1 });
reunionSchema.index({ status: 1, eventDate: 1 });

// Virtual for attendee count
reunionSchema.virtual('attendeeCount').get(function() {
   return this.attendees.filter(a => a.status === 'going').length;
});

// Virtual for interested count
reunionSchema.virtual('interestedCount').get(function() {
   return this.attendees.filter(a => a.status === 'interested').length;
});

// Ensure virtuals are included in JSON output
reunionSchema.set('toJSON', { virtuals: true });
reunionSchema.set('toObject', { virtuals: true });

const Reunion = mongoose.model('Reunion', reunionSchema);

export default Reunion;
