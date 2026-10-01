import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ALL_ROLES, ROLES } from '../constants/rbac.js';

const userSchema = new mongoose.Schema({
   googleId: {
      type: String,
      unique: true,
      sparse: true // Allow null/missing values while maintaining uniqueness
   },
   email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
         validator: function(v) {
            return v.endsWith('@charusat.edu.in') || v.endsWith('@charusat.ac.in');
         },
         message: 'Only @charusat.edu.in and @charusat.ac.in emails are allowed'
      }
   },
   password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters']
   },
   authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
   },
   name: {
      type: String,
      required: true,
      trim: true
   },
   profilePicture: {
      type: String,
      default: ''
   },
   profilePicturePublicId: {
      type: String,
      default: ''
   },
   // Role Management
   role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.ALUMNI
   },
   // Privacy Settings
   privacy: {
      profileVisibility: {
         type: String,
         enum: ['public', 'alumni-only', 'connections-only', 'private'],
         default: 'alumni-only'
      },
      showEmail: {
         type: Boolean,
         default: false
      },
      showMobile: {
         type: Boolean,
         default: false
      },
      showCurrentCompany: {
         type: Boolean,
         default: true
      },
      showSkills: {
         type: Boolean,
         default: true
      },
      showSocialLinks: {
         type: Boolean,
         default: true
      },
      allowMessaging: {
         type: String,
         enum: ['everyone', 'alumni-only', 'connections-only', 'none'],
         default: 'alumni-only'
      },
      showInAlumniDirectory: {
         type: Boolean,
         default: true
      },
      allowConnectionRequests: {
         type: Boolean,
         default: true
      }
   },
   batch: {
      type: String,
      default: ''
   },
   department: {
      type: String,
      default: ''
   },
   currentCompany: {
      type: String,
      default: ''
   },
   currentRole: {
      type: String,
      default: ''
   },
   skills: [{
      type: String
   }],
   linkedIn: {
      type: String,
      default: ''
   },
   github: {
      type: String,
      default: ''
   },
   portfolioUrl: {
      type: String,
      default: ''
   },
   bio: {
      type: String,
      maxlength: 500,
      default: ''
   },
   currentEducation: {
      type: String,
      default: ''
   },
   mobileNumber: {
      type: String,
      default: ''
   },
   mobileVerified: {
      type: Boolean,
      default: false
   },
   isProfileComplete: {
      type: Boolean,
      default: false
   }
}, {
   timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
   if (!this.isModified('password') || !this.password) {
      return next();
   }
   
   // Skip hashing if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
   if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      return next();
   }
   
   try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
   } catch (error) {
      next(error);
   }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
   if (!this.password) return false;
   return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
