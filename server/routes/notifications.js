import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {
   getNotifications,
   getUnreadCount,
   markAsRead,
   markAllAsRead,
   deleteNotification,
   clearAllNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Get all notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark single notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete single notification
router.delete('/:notificationId', deleteNotification);

// Clear all notifications
router.delete('/', clearAllNotifications);

export default router;
