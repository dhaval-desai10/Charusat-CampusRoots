import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { verifyAdminToken } from '../middleware/adminAuth.js';
import {
   createFeedback,
   getPublicFeedback,
   getMyFeedback,
   deleteMyFeedback,
   adminGetAllFeedback,
   adminMarkAsRead,
   adminRespondToFeedback,
   adminDeleteFeedback
} from '../controllers/feedbackController.js';

const router = express.Router();

// User routes (authenticated)
router.get('/public', isAuthenticated, getPublicFeedback);
router.get('/my', isAuthenticated, getMyFeedback);
router.post('/', isAuthenticated, createFeedback);
router.delete('/:id', isAuthenticated, deleteMyFeedback);

// Admin routes
router.get('/admin/all', verifyAdminToken, adminGetAllFeedback);
router.patch('/admin/:id/read', verifyAdminToken, adminMarkAsRead);
router.post('/admin/:id/respond', verifyAdminToken, adminRespondToFeedback);
router.delete('/admin/:id', verifyAdminToken, adminDeleteFeedback);

export default router;
