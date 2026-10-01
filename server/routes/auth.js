import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { uploadProfilePhoto } from '../config/cloudinary.js';
import {
   testAuth,
   register,
   login,
   googleAuth,
   googleAuthCallback,
   googleAuthCallbackHandler,
   getCurrentUser,
   getUserPermissions,
   updateProfile,
   logout
} from '../controllers/authController.js';

const router = express.Router();

// Test endpoint
router.get('/test', testAuth);

// Email/Password Authentication
router.post('/register', uploadProfilePhoto.single('profilePhoto'), register);
router.post('/login', login);

// Initiate Google OAuth
router.get('/google', googleAuth);

// Google OAuth callback
router.get('/google/callback', googleAuthCallback, googleAuthCallbackHandler);

// Get current user
router.get('/me', isAuthenticated, getCurrentUser);

// Get current user's module permissions
router.get('/permissions', isAuthenticated, getUserPermissions);

// Update user profile
router.put('/profile', isAuthenticated, updateProfile);

// Logout
router.get('/logout', logout);

export default router;
