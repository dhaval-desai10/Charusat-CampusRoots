import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { getUserProfile, getMutualConnections } from '../controllers/profileController.js';

const router = express.Router();

// Get user profile
router.get('/:userId', isAuthenticated, getUserProfile);

// Get mutual connections
router.get('/:userId/mutual-connections', isAuthenticated, getMutualConnections);

export default router;
