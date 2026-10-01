import { Server } from 'socket.io';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';

// Store online users: { userId: [socketIds] }
const onlineUsers = new Map();

export const initializeSocket = (server) => {
   const io = new Server(server, {
      cors: {
         origin: ["http://localhost:5173", "http://localhost:5174"],
         methods: ["GET", "POST"],
         credentials: true
      },
      // Optimize socket.io performance
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      allowUpgrades: true,
      perMessageDeflate: {
         threshold: 1024
      },
      maxHttpBufferSize: 1e6 // 1MB
   });

   io.on('connection', (socket) => {
      console.log('🔌 User connected:', socket.id);

      // User joins with their ID
      socket.on('user:join', async (userId) => {
         if (!userId) return;
         
         // Add user to online users map
         if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, []);
         }
         onlineUsers.get(userId).push(socket.id);
         
         // Store userId on socket for easy access
         socket.userId = userId;
         
         // Join personal room for notifications
         socket.join(`user:${userId}`);
         
         // Broadcast online status to connections
         socket.broadcast.emit('user:online', userId);
         
         // Send current online users to this user
         const onlineUserIds = Array.from(onlineUsers.keys());
         socket.emit('users:online-list', onlineUserIds);
         
         console.log(`👤 User ${userId} is now online`);
      });

      // Join a conversation room
      socket.on('conversation:join', (conversationId) => {
         socket.join(`conversation:${conversationId}`);
         console.log(`💬 Socket ${socket.id} joined conversation ${conversationId}`);
      });

      // Leave a conversation room
      socket.on('conversation:leave', (conversationId) => {
         socket.leave(`conversation:${conversationId}`);
      });

      // Handle new message - optimized with acknowledgment
      socket.on('message:send', async (data, callback) => {
         const startTime = Date.now();
         try {
            const { conversationId, senderId, recipientId, content, tempId } = data;

            if (!conversationId || !senderId || !content) {
               const error = { message: 'Missing required fields' };
               socket.emit('message:error', error);
               if (callback) callback({ success: false, error });
               return;
            }

            // Create message immediately for speed
            const message = await Message.create({
               conversation: conversationId,
               sender: senderId,
               content,
               readBy: [{ user: senderId, readAt: new Date() }]
            });

            // Populate sender info
            await message.populate('sender', 'name profilePicture');

            // Send acknowledgment to sender immediately
            if (callback) {
               callback({ success: true, message, tempId });
            }
            
            // Emit to sender for confirmation
            socket.emit('message:sent', { message, tempId });

            // Emit to conversation room EXCEPT sender (use socket.to instead of io.to)
            socket.to(`conversation:${conversationId}`).emit('message:received', message);

            // Background tasks - don't wait for these
            Promise.all([
               Conversation.findByIdAndUpdate(conversationId, {
                  lastMessage: message._id,
                  lastMessageAt: new Date()
               }),
               Conversation.incrementUnreadCount(conversationId, recipientId),
               Conversation.getTotalUnreadCount(recipientId).then(count => {
                  io.to(`user:${recipientId}`).emit('message:unread-count', count);
               })
            ]).catch(err => console.error('Background task error:', err));

            console.log(`⚡ Message sent in ${Date.now() - startTime}ms`);

         } catch (error) {
            console.error('Message send error:', error);
            const errorObj = { message: 'Failed to send message' };
            socket.emit('message:error', errorObj);
            if (callback) callback({ success: false, error: errorObj });
         }
      });

      // Mark messages as read
      socket.on('message:read', async (data) => {
         try {
            const { conversationId, userId } = data;

            // Update messages as read
            await Message.updateMany(
               { 
                  conversation: conversationId, 
                  sender: { $ne: userId },
                  'readBy.user': { $ne: userId }
               },
               { 
                  $push: { readBy: { user: userId, readAt: new Date() } }
               }
            );

            // Reset unread count
            await Conversation.resetUnreadCount(conversationId, userId);

            // Notify sender that messages were read
            socket.to(`conversation:${conversationId}`).emit('message:seen', {
               conversationId,
               readBy: userId
            });

         } catch (error) {
            console.error('Mark read error:', error);
         }
      });

      // Typing indicator
      socket.on('typing:start', (data) => {
         const { conversationId, userId, userName } = data;
         socket.to(`conversation:${conversationId}`).emit('typing:update', {
            userId,
            userName,
            isTyping: true
         });
      });

      socket.on('typing:stop', (data) => {
         const { conversationId, userId } = data;
         socket.to(`conversation:${conversationId}`).emit('typing:update', {
            userId,
            isTyping: false
         });
      });

      // =================== GROUP CHAT EVENTS ===================

      // Join all user's groups on connection
      socket.on('groups:join-all', async (userId) => {
         try {
            const groups = await Group.find({
               'members.user': userId,
               'members.status': 'accepted'
            }).select('_id');
            
            groups.forEach(group => {
               socket.join(`group:${group._id}`);
            });
            
            console.log(`👥 User ${userId} joined ${groups.length} group rooms`);
         } catch (error) {
            console.error('Failed to join group rooms:', error);
         }
      });

      // Join a group chat room
      socket.on('group:join', (groupId) => {
         socket.join(`group:${groupId}`);
         console.log(`👥 Socket ${socket.id} joined group ${groupId}`);
      });

      // Leave a group chat room
      socket.on('group:leave', (groupId) => {
         socket.leave(`group:${groupId}`);
      });

      // Handle group message - optimized with acknowledgment
      socket.on('group:message:send', async (data, callback) => {
         const startTime = Date.now();
         try {
            const { groupId, senderId, content, tempId } = data;

            if (!groupId || !senderId || !content) {
               const error = { message: 'Missing required fields' };
               socket.emit('group:message:error', error);
               if (callback) callback({ success: false, error });
               return;
            }

            // Create message immediately for speed
            const message = await GroupMessage.create({
               group: groupId,
               sender: senderId,
               content,
               readBy: [{ user: senderId, readAt: new Date() }]
            });

            // Populate sender info
            await message.populate('sender', 'name profilePicture');

            // Send acknowledgment to sender immediately
            if (callback) {
               callback({ success: true, message, tempId });
            }
            
            // Emit to sender for confirmation
            socket.emit('group:message:sent', { message, tempId });

            // Emit to group room EXCEPT sender (use socket.to instead of io.to)
            socket.to(`group:${groupId}`).emit('group:message:received', message);

            // Background tasks - don't wait for these
            Promise.all([
               Group.findByIdAndUpdate(groupId, {
                  lastMessage: message._id,
                  lastMessageAt: new Date()
               }),
               Group.incrementUnreadCount(groupId, senderId),
               // Notify members about unread counts in background
               (async () => {
                  const group = await Group.findById(groupId).select('members');
                  const acceptedMembers = group.members.filter(
                     m => m.status === 'accepted' && m.user.toString() !== senderId.toString()
                  );
                  for (const member of acceptedMembers) {
                     const unreadCount = await Group.getTotalUnreadCount(member.user);
                     io.to(`user:${member.user}`).emit('group:unread-count', unreadCount);
                  }
               })()
            ]).catch(err => console.error('Background task error:', err));

            console.log(`⚡ Group message sent in ${Date.now() - startTime}ms`);

         } catch (error) {
            console.error('Group message send error:', error);
            const errorObj = { message: 'Failed to send message' };
            socket.emit('group:message:error', errorObj);
            if (callback) callback({ success: false, error: errorObj });
         }
      });

      // Mark group messages as read
      socket.on('group:message:read', async (data) => {
         try {
            const { groupId, userId } = data;

            // Update messages as read
            await GroupMessage.updateMany(
               {
                  group: groupId,
                  sender: { $ne: userId },
                  'readBy.user': { $ne: userId }
               },
               {
                  $push: { readBy: { user: userId, readAt: new Date() } }
               }
            );

            // Reset unread count
            await Group.resetUnreadCount(groupId, userId);

            // Notify group that messages were read
            socket.to(`group:${groupId}`).emit('group:message:seen', {
               groupId,
               readBy: userId
            });

         } catch (error) {
            console.error('Group mark read error:', error);
         }
      });

      // Group typing indicator
      socket.on('group:typing:start', (data) => {
         const { groupId, userId, userName } = data;
         socket.to(`group:${groupId}`).emit('group:typing:update', {
            userId,
            userName,
            isTyping: true
         });
      });

      socket.on('group:typing:stop', (data) => {
         const { groupId, userId } = data;
         socket.to(`group:${groupId}`).emit('group:typing:update', {
            userId,
            isTyping: false
         });
      });

      // Notify users about new group invitation
      socket.on('group:invite:notify', async (data) => {
         const { groupId, invitedUserIds } = data;
         
         for (const userId of invitedUserIds) {
            io.to(`user:${userId}`).emit('group:invitation:received', {
               groupId,
               message: 'You have been invited to a group'
            });
         }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
         // Find and remove user from online users
         for (const [userId, sockets] of onlineUsers.entries()) {
            const index = sockets.indexOf(socket.id);
            if (index !== -1) {
               sockets.splice(index, 1);
               if (sockets.length === 0) {
                  onlineUsers.delete(userId);
                  // Broadcast offline status
                  socket.broadcast.emit('user:offline', userId);
               }
               break;
            }
         }
         console.log('🔌 User disconnected:', socket.id);
      });
   });

   return io;
};

// Helper function to emit to specific user
export const emitToUser = (io, userId, event, data) => {
   io.to(`user:${userId}`).emit(event, data);
};

// Helper function to check if user is online
export const isUserOnline = (userId) => {
   return onlineUsers.has(userId) && onlineUsers.get(userId).length > 0;
};

export { onlineUsers };
