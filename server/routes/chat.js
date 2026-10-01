import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {
   getConversations,
   getOrCreateConversation,
   getMessages,
   sendMessage,
   deleteMessage,
   getUnreadCount,
   getChattableConnections
} from '../controllers/chatController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Get all conversations
router.get('/conversations', getConversations);

// Get chattable connections
router.get('/connections', getChattableConnections);

// Get unread messages count
router.get('/unread-count', getUnreadCount);

// Get or create conversation with a user
router.get('/conversation/:recipientId', getOrCreateConversation);

// Get messages for a conversation
router.get('/messages/:conversationId', getMessages);

// Send message in a conversation
router.post('/messages/:conversationId', sendMessage);

// Delete a message
router.delete('/messages/:messageId', deleteMessage);

export default router;
