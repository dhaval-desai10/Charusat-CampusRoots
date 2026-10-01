import Notification from '../models/Notification.js';

// Get all notifications for current user
export const getNotifications = async (req, res) => {
   try {
      const userId = req.user._id;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const query = { recipient: userId };
      if (unreadOnly === 'true') {
         query.isRead = false;
      }

      const notifications = await Notification.find(query)
         .populate('sender', 'name profilePicture')
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(parseInt(limit));

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.getUnreadCount(userId);

      res.json({
         success: true,
         notifications,
         unreadCount,
         pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            hasMore: page * limit < total
         }
      });
   } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch notifications'
      });
   }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
   try {
      const userId = req.user._id;
      const count = await Notification.getUnreadCount(userId);

      res.json({
         success: true,
         unreadCount: count
      });
   } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to get unread count'
      });
   }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
   try {
      const userId = req.user._id;
      const { notificationId } = req.params;

      const notification = await Notification.findOneAndUpdate(
         { _id: notificationId, recipient: userId },
         { isRead: true, readAt: new Date() },
         { new: true }
      );

      if (!notification) {
         return res.status(404).json({
            success: false,
            message: 'Notification not found'
         });
      }

      const unreadCount = await Notification.getUnreadCount(userId);

      res.json({
         success: true,
         notification,
         unreadCount
      });
   } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to mark notification as read'
      });
   }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
   try {
      const userId = req.user._id;

      await Notification.markAllAsRead(userId);

      res.json({
         success: true,
         message: 'All notifications marked as read',
         unreadCount: 0
      });
   } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to mark notifications as read'
      });
   }
};

// Delete notification
export const deleteNotification = async (req, res) => {
   try {
      const userId = req.user._id;
      const { notificationId } = req.params;

      const notification = await Notification.findOneAndDelete({
         _id: notificationId,
         recipient: userId
      });

      if (!notification) {
         return res.status(404).json({
            success: false,
            message: 'Notification not found'
         });
      }

      const unreadCount = await Notification.getUnreadCount(userId);

      res.json({
         success: true,
         message: 'Notification deleted',
         unreadCount
      });
   } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete notification'
      });
   }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
   try {
      const userId = req.user._id;

      await Notification.deleteMany({ recipient: userId });

      res.json({
         success: true,
         message: 'All notifications cleared'
      });
   } catch (error) {
      console.error('Clear notifications error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to clear notifications'
      });
   }
};

// Create notification (internal use)
export const createNotification = async (io, data) => {
   try {
      const notification = await Notification.createNotification(data);
      
      // Emit to user via socket
      if (io) {
         io.to(`user:${data.recipient}`).emit('notification:new', notification);
         const unreadCount = await Notification.getUnreadCount(data.recipient);
         io.to(`user:${data.recipient}`).emit('notification:count', unreadCount);
      }

      return notification;
   } catch (error) {
      console.error('Create notification error:', error);
      throw error;
   }
};
