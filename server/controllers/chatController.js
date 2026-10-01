import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';

// Get all conversations for current user
export const getConversations = async (req, res) => {
   try {
      const userId = req.user._id;

      const conversations = await Conversation.find({
         participants: userId,
         isActive: true
      })
      .populate('participants', 'name email profilePicture role currentCompany currentRole')
      .populate({
         path: 'lastMessage',
         select: 'content createdAt sender'
      })
      .sort({ lastMessageAt: -1 });

      // Format conversations
      const formattedConversations = conversations.map(conv => {
         const otherParticipant = conv.participants.find(
            p => p._id.toString() !== userId.toString()
         );
         const unread = conv.unreadCount.find(
            u => u.user.toString() === userId.toString()
         );

         return {
            _id: conv._id,
            participant: otherParticipant,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount: unread?.count || 0,
            createdAt: conv.createdAt
         };
      });

      res.json({
         success: true,
         conversations: formattedConversations
      });
   } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch conversations'
      });
   }
};

// Get or create conversation with a user
export const getOrCreateConversation = async (req, res) => {
   try {
      const userId = req.user._id;
      const { recipientId } = req.params;

      // Check if users are connected
      const areConnected = await Connection.areConnected(userId, recipientId);

      // Check recipient's privacy settings
      const recipient = await User.findById(recipientId).select('privacy name profilePicture role currentCompany currentRole');
      if (!recipient) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Get sender info for role-based checks
      const sender = await User.findById(userId).select('role');
      const messageSetting = recipient.privacy?.allowMessaging || 'everyone';

      // Check messaging permission based on setting
      if (messageSetting === 'none') {
         return res.status(403).json({
            success: false,
            message: 'This user has disabled messages'
         });
      }
      if (messageSetting === 'connections-only' && !areConnected) {
         return res.status(403).json({
            success: false,
            message: 'This user only accepts messages from connections'
         });
      }
      if (messageSetting === 'alumni-only' && sender.role === 'student') {
         return res.status(403).json({
            success: false,
            message: 'This user only accepts messages from alumni'
         });
      }

      // Get or create conversation
      const conversation = await Conversation.getOrCreateConversation(userId, recipientId);
      
      await conversation.populate('participants', 'name email profilePicture role currentCompany currentRole');

      res.json({
         success: true,
         conversation: {
            _id: conversation._id,
            participant: recipient,
            createdAt: conversation.createdAt
         }
      });
   } catch (error) {
      console.error('Get/create conversation error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to get conversation'
      });
   }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
   try {
      const userId = req.user._id;
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Verify user is part of this conversation
      const conversation = await Conversation.findOne({
         _id: conversationId,
         participants: userId
      });

      if (!conversation) {
         return res.status(403).json({
            success: false,
            message: 'Access denied to this conversation'
         });
      }

      // Get messages with pagination (newest first)
      const messages = await Message.find({
         conversation: conversationId,
         isDeleted: false
      })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

      // Reset unread count when fetching messages
      await Conversation.resetUnreadCount(conversationId, userId);

      // Reverse to get chronological order
      messages.reverse();

      const total = await Message.countDocuments({
         conversation: conversationId,
         isDeleted: false
      });

      res.json({
         success: true,
         messages,
         pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            hasMore: page * limit < total
         }
      });
   } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch messages'
      });
   }
};

// Send message (HTTP fallback)
export const sendMessage = async (req, res) => {
   try {
      const userId = req.user._id;
      const { conversationId } = req.params;
      const { content } = req.body;

      if (!content?.trim()) {
         return res.status(400).json({
            success: false,
            message: 'Message content is required'
         });
      }

      // Verify user is part of this conversation
      const conversation = await Conversation.findOne({
         _id: conversationId,
         participants: userId
      }).populate('participants', 'privacy name role');

      if (!conversation) {
         return res.status(403).json({
            success: false,
            message: 'Access denied to this conversation'
         });
      }

      // Get sender and recipient
      const sender = await User.findById(userId).select('role');
      const recipient = conversation.participants.find(
         p => p._id.toString() !== userId.toString()
      );

      // Check privacy settings
      const messageSetting = recipient.privacy?.allowMessaging || 'everyone';
      const areConnected = await Connection.areConnected(userId, recipient._id);

      if (messageSetting === 'none') {
         return res.status(403).json({
            success: false,
            message: 'This user has disabled messages'
         });
      }
      if (messageSetting === 'connections-only' && !areConnected) {
         return res.status(403).json({
            success: false,
            message: 'This user only accepts messages from connections'
         });
      }
      if (messageSetting === 'alumni-only' && sender.role === 'student') {
         return res.status(403).json({
            success: false,
            message: 'This user has disabled messages from students'
         });
      }

      // Create message
      const message = await Message.create({
         conversation: conversationId,
         sender: userId,
         content: content.trim(),
         readBy: [{ user: userId, readAt: new Date() }]
      });

      await message.populate('sender', 'name profilePicture');

      // Update conversation
      await Conversation.findByIdAndUpdate(conversationId, {
         lastMessage: message._id,
         lastMessageAt: new Date()
      });

      // Increment unread count for recipient
      await Conversation.incrementUnreadCount(conversationId, recipient._id);

      res.json({
         success: true,
         message
      });
   } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to send message'
      });
   }
};

// Delete message (soft delete)
export const deleteMessage = async (req, res) => {
   try {
      const userId = req.user._id;
      const { messageId } = req.params;

      const message = await Message.findOne({
         _id: messageId,
         sender: userId
      });

      if (!message) {
         return res.status(404).json({
            success: false,
            message: 'Message not found or not authorized'
         });
      }

      message.isDeleted = true;
      await message.save();

      res.json({
         success: true,
         message: 'Message deleted'
      });
   } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete message'
      });
   }
};

// Get total unread messages count
export const getUnreadCount = async (req, res) => {
   try {
      const userId = req.user._id;
      const count = await Conversation.getTotalUnreadCount(userId);

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

// Get chattable connections (users you can chat with)
export const getChattableConnections = async (req, res) => {
   try {
      const userId = req.user._id;

      // Get all accepted connections
      const connections = await Connection.find({
         $or: [
            { requester: userId, status: 'accepted' },
            { recipient: userId, status: 'accepted' }
         ]
      });

      // Get user IDs of connections
      const connectionUserIds = connections.map(conn => 
         conn.requester.toString() === userId.toString() 
            ? conn.recipient 
            : conn.requester
      );

      // Get user details with privacy check
      const users = await User.find({
         _id: { $in: connectionUserIds }
      }).select('name email profilePicture role currentCompany currentRole privacy');

      // Filter users who allow messages
      const chattableUsers = users.filter(user => {
         const privacy = user.privacy || {};
         return privacy.allowMessaging !== 'none';
      });

      res.json({
         success: true,
         users: chattableUsers
      });
   } catch (error) {
      console.error('Get chattable connections error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch connections'
      });
   }
};
