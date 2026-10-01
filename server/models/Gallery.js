import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
   title: {
      type: String,
      required: true,
      trim: true
   },
   description: {
      type: String,
      trim: true
   },
   category: {
      type: String,
      enum: ['convocation', 'spoural', 'other'],
      default: 'other',
      required: true
   },
   photos: [{
      url: {
         type: String,
         required: true
      },
      publicId: {
         type: String
      },
      caption: {
         type: String,
         trim: true
      }
   }],
   coverImage: {
      type: String
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   isActive: {
      type: Boolean,
      default: true
   }
}, { timestamps: true });

export default mongoose.model('Gallery', gallerySchema);
