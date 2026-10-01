import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

// Helper to check messaging permission
function checkMessagePermission(privacy, isConnected, viewerRole) {
   const messageSetting = privacy?.allowMessaging || 'everyone';
   
   if (messageSetting === 'everyone') return true;
   if (messageSetting === 'alumni-only') return viewerRole !== 'student';
   if (messageSetting === 'connections-only') return isConnected;
   if (messageSetting === 'none') return false;
   
   return true;
}

// Get all users for network discovery (with filters)
export const discoverUsers = async (req, res) => {
   try {
      const userId = req.user._id;
      const { 
         role, 
         department, 
         batch, 
         search, 
         page = 1, 
         limit = 12 
      } = req.query;

      // Get current user's role for role-based privacy checks
      const currentUser = await User.findById(userId).select('role');

      // Build query - exclude current user and require complete profile
      const query = { 
         _id: { $ne: userId },
         isProfileComplete: true,
         // Only show users who want to appear in alumni directory
         'privacy.showInAlumniDirectory': { $ne: false }
      };

      // Filter by role
      if (role && role !== 'all') {
         query.role = role;
      }

      // Filter by department
      if (department && department !== 'all') {
         query.department = department;
      }

      // Filter by batch
      if (batch && batch !== 'all') {
         query.batch = batch;
      }

      // Search by name or company
      if (search) {
         query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { currentCompany: { $regex: search, $options: 'i' } },
            { currentRole: { $regex: search, $options: 'i' } }
         ];
      }
      
      // Get total count
      const total = await User.countDocuments(query);

      // Get users with pagination
      const users = await User.find(query)
         .select('name email mobile profilePicture role batch department currentCompany currentRole skills bio privacy socialLinks')
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(parseInt(limit));

      // Get connection status and mutual connections for each user
      const usersWithConnectionInfo = await Promise.all(
         users.map(async (user) => {
            const connectionStatus = await Connection.getConnectionStatus(userId, user._id);
            const mutualConnectionIds = await Connection.getMutualConnections(userId, user._id);
            const isConnected = connectionStatus === 'connected';
            
            // Get mutual connection details (limited to 3)
            const mutualConnections = await User.find({ 
               _id: { $in: mutualConnectionIds.slice(0, 3) } 
            }).select('name profilePicture');

            // Apply privacy filtering
            const userData = user.toObject();
            const privacy = userData.privacy || {};

            // Check if user should be visible based on privacy settings
            if (privacy.profileVisibility === 'private') {
               return null;
            }
            if (privacy.profileVisibility === 'connections-only' && !isConnected) {
               return null;
            }
            if (privacy.profileVisibility === 'alumni-only' && currentUser.role === 'student') {
               // Students can still see basic info but limited
            }

            // Filter sensitive info based on privacy
            if (!privacy.showEmail) delete userData.email;
            if (!privacy.showMobile) delete userData.mobile;
            if (!privacy.showCurrentCompany) {
               delete userData.currentCompany;
               delete userData.currentRole;
            }
            if (!privacy.showSkills) delete userData.skills;
            if (!privacy.showSocialLinks) delete userData.socialLinks;

            // Add flags for UI to know what actions are allowed
            const canSendConnectionRequest = privacy.allowConnectionRequests !== false;
            const canMessage = checkMessagePermission(privacy, isConnected, currentUser.role);
            
            // Remove privacy object from response (internal use only)
            delete userData.privacy;

            return {
               ...userData,
               connectionStatus,
               mutualConnections,
               mutualConnectionCount: mutualConnectionIds.length,
               canSendConnectionRequest,
               canMessage
            };
         })
      );

      // Filter out null values and already connected users (they appear in My Network tab)
      const filteredUsers = usersWithConnectionInfo.filter(u => u !== null && u.connectionStatus !== 'connected');

      res.json({
         success: true,
         users: filteredUsers,
         pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            hasMore: page * limit < total
         }
      });
   } catch (error) {
      console.error('Discover users error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch users'
      });
   }
};

// Send connection request
export const sendConnectionRequest = async (req, res) => {
   try {
      const requesterId = req.user._id;
      const { recipientId, message } = req.body;

      if (!recipientId) {
         return res.status(400).json({
            success: false,
            message: 'Recipient ID is required'
         });
      }

      if (requesterId.toString() === recipientId) {
         return res.status(400).json({
            success: false,
            message: 'Cannot send connection request to yourself'
         });
      }

      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Check recipient's privacy settings
      if (!recipient.privacy?.allowConnectionRequests) {
         return res.status(403).json({
            success: false,
            message: 'This user is not accepting connection requests'
         });
      }

      // Check if connection already exists
      const existingConnection = await Connection.findOne({
         $or: [
            { requester: requesterId, recipient: recipientId },
            { requester: recipientId, recipient: requesterId }
         ]
      });

      if (existingConnection) {
         if (existingConnection.status === 'accepted') {
            return res.status(400).json({
               success: false,
               message: 'You are already connected with this user'
            });
         }
         if (existingConnection.status === 'pending') {
            return res.status(400).json({
               success: false,
               message: 'A connection request already exists'
            });
         }
         if (existingConnection.status === 'blocked') {
            return res.status(403).json({
               success: false,
               message: 'Unable to send connection request'
            });
         }
      }

      // Create new connection request
      const connection = new Connection({
         requester: requesterId,
         recipient: recipientId,
         message: message || '',
         status: 'pending'
      });

      await connection.save();

      // Create notification for the recipient
      const requester = await User.findById(requesterId).select('name');
      const io = req.app.get('io');
      
      // Get mutual connections count
      const mutualConnectionIds = await Connection.getMutualConnections(requesterId, recipientId);
      const mutualCount = mutualConnectionIds.length;
      
      const notification = await Notification.create({
         recipient: recipientId,
         sender: requesterId,
         type: 'connection_request',
         title: `${requester.name} sent you a connection request`,
         content: message || 'Would like to connect with you',
         reference: connection._id,
         referenceModel: 'Connection',
         mutualConnectionCount: mutualCount
      });

      // Emit real-time notification
      if (io) {
         const populatedNotification = await notification.populate('sender', 'name profilePicture');
         io.to(`user:${recipientId}`).emit('notification:new', populatedNotification);
         const unreadCount = await Notification.getUnreadCount(recipientId);
         io.to(`user:${recipientId}`).emit('notification:count', unreadCount);
      }

      res.status(201).json({
         success: true,
         message: 'Connection request sent successfully',
         connection: {
            id: connection._id,
            status: 'pending_sent'
         }
      });
   } catch (error) {
      console.error('Send connection request error:', error);
      if (error.code === 11000) {
         return res.status(400).json({
            success: false,
            message: 'Connection request already exists'
         });
      }
      res.status(500).json({
         success: false,
         message: 'Failed to send connection request'
      });
   }
};

// Accept connection request
export const acceptConnectionRequest = async (req, res) => {
   try {
      const userId = req.user._id;
      const { connectionId } = req.params;

      const connection = await Connection.findOne({
         _id: connectionId,
         recipient: userId,
         status: 'pending'
      });

      if (!connection) {
         return res.status(404).json({
            success: false,
            message: 'Connection request not found'
         });
      }

      connection.status = 'accepted';
      await connection.save();

      // Get requester details
      const requester = await User.findById(connection.requester)
         .select('name profilePicture');

      // Create notification for the requester (person who sent the request)
      const acceptor = await User.findById(userId).select('name');
      const io = req.app.get('io');
      
      const notification = await Notification.create({
         recipient: connection.requester,
         sender: userId,
         type: 'connection_accepted',
         title: `${acceptor.name} accepted your connection request`,
         content: 'You are now connected',
         reference: connection._id,
         referenceModel: 'Connection'
      });

      // Emit real-time notification
      if (io) {
         const populatedNotification = await notification.populate('sender', 'name profilePicture');
         io.to(`user:${connection.requester}`).emit('notification:new', populatedNotification);
         const unreadCount = await Notification.getUnreadCount(connection.requester);
         io.to(`user:${connection.requester}`).emit('notification:count', unreadCount);
      }

      res.json({
         success: true,
         message: 'Connection request accepted',
         connection: {
            id: connection._id,
            user: requester
         }
      });
   } catch (error) {
      console.error('Accept connection error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to accept connection request'
      });
   }
};

// Reject connection request
export const rejectConnectionRequest = async (req, res) => {
   try {
      const userId = req.user._id;
      const { connectionId } = req.params;

      const connection = await Connection.findOne({
         _id: connectionId,
         recipient: userId,
         status: 'pending'
      });

      if (!connection) {
         return res.status(404).json({
            success: false,
            message: 'Connection request not found'
         });
      }

      // Delete the connection request
      await Connection.findByIdAndDelete(connectionId);

      res.json({
         success: true,
         message: 'Connection request rejected'
      });
   } catch (error) {
      console.error('Reject connection error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to reject connection request'
      });
   }
};

// Cancel sent connection request
export const cancelConnectionRequest = async (req, res) => {
   try {
      const userId = req.user._id;
      const { connectionId } = req.params;

      const connection = await Connection.findOne({
         _id: connectionId,
         requester: userId,
         status: 'pending'
      });

      if (!connection) {
         return res.status(404).json({
            success: false,
            message: 'Connection request not found'
         });
      }

      await Connection.findByIdAndDelete(connectionId);

      res.json({
         success: true,
         message: 'Connection request cancelled'
      });
   } catch (error) {
      console.error('Cancel connection error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to cancel connection request'
      });
   }
};

// Remove connection
export const removeConnection = async (req, res) => {
   try {
      const userId = req.user._id;
      const { connectionId } = req.params;

      const connection = await Connection.findOne({
         _id: connectionId,
         $or: [
            { requester: userId },
            { recipient: userId }
         ],
         status: 'accepted'
      });

      if (!connection) {
         return res.status(404).json({
            success: false,
            message: 'Connection not found'
         });
      }

      await Connection.findByIdAndDelete(connectionId);

      res.json({
         success: true,
         message: 'Connection removed successfully'
      });
   } catch (error) {
      console.error('Remove connection error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to remove connection'
      });
   }
};

// Get user's connections
export const getMyConnections = async (req, res) => {
   try {
      const userId = req.user._id;
      const { page = 1, limit = 20 } = req.query;

      const connections = await Connection.find({
         $or: [
            { requester: userId, status: 'accepted' },
            { recipient: userId, status: 'accepted' }
         ]
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

      // Get the other user's details for each connection
      const connectionDetails = await Promise.all(
         connections.map(async (conn) => {
            const otherUserId = conn.requester.toString() === userId.toString() 
               ? conn.recipient 
               : conn.requester;
            
            const user = await User.findById(otherUserId)
               .select('name email profilePicture role batch department currentCompany currentRole');

            return {
               connectionId: conn._id,
               connectedAt: conn.updatedAt,
               user
            };
         })
      );

      const total = await Connection.countDocuments({
         $or: [
            { requester: userId, status: 'accepted' },
            { recipient: userId, status: 'accepted' }
         ]
      });

      res.json({
         success: true,
         connections: connectionDetails,
         pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
         }
      });
   } catch (error) {
      console.error('Get connections error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch connections'
      });
   }
};

// Get pending connection requests (received)
export const getPendingRequests = async (req, res) => {
   try {
      const userId = req.user._id;

      const requests = await Connection.find({
         recipient: userId,
         status: 'pending'
      })
      .sort({ createdAt: -1 })
      .populate('requester', 'name email profilePicture role batch department currentCompany currentRole');

      res.json({
         success: true,
         requests: requests.map(req => ({
            connectionId: req._id,
            message: req.message,
            sentAt: req.createdAt,
            user: req.requester
         }))
      });
   } catch (error) {
      console.error('Get pending requests error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch pending requests'
      });
   }
};

// Get sent connection requests
export const getSentRequests = async (req, res) => {
   try {
      const userId = req.user._id;

      const requests = await Connection.find({
         requester: userId,
         status: 'pending'
      })
      .sort({ createdAt: -1 })
      .populate('recipient', 'name email profilePicture role batch department currentCompany currentRole');

      res.json({
         success: true,
         requests: requests.map(req => ({
            connectionId: req._id,
            message: req.message,
            sentAt: req.createdAt,
            user: req.recipient
         }))
      });
   } catch (error) {
      console.error('Get sent requests error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch sent requests'
      });
   }
};

// Get connection stats
export const getConnectionStats = async (req, res) => {
   try {
      const userId = req.user._id;

      const [connectionsCount, pendingReceivedCount, pendingSentCount] = await Promise.all([
         Connection.countDocuments({
            $or: [
               { requester: userId, status: 'accepted' },
               { recipient: userId, status: 'accepted' }
            ]
         }),
         Connection.countDocuments({
            recipient: userId,
            status: 'pending'
         }),
         Connection.countDocuments({
            requester: userId,
            status: 'pending'
         })
      ]);

      res.json({
         success: true,
         stats: {
            connections: connectionsCount,
            pendingReceived: pendingReceivedCount,
            pendingSent: pendingSentCount
         }
      });
   } catch (error) {
      console.error('Get connection stats error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch connection stats'
      });
   }
};

// Get user profile with connection info
export const getUserProfile = async (req, res) => {
   try {
      const currentUserId = req.user._id;
      const { userId } = req.params;

      const user = await User.findById(userId)
         .select('-googleId');

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Get connection status
      const connectionStatus = await Connection.getConnectionStatus(currentUserId, userId);
      
      // Get mutual connections
      const mutualConnectionIds = await Connection.getMutualConnections(currentUserId, userId);
      const mutualConnections = await User.find({ 
         _id: { $in: mutualConnectionIds } 
      }).select('name profilePicture role');

      // Get connection ID if exists
      const connection = await Connection.findOne({
         $or: [
            { requester: currentUserId, recipient: userId },
            { requester: userId, recipient: currentUserId }
         ]
      });

      // Apply privacy settings
      const userData = user.toObject();
      const privacy = userData.privacy || {};

      if (connectionStatus !== 'connected') {
         if (!privacy.showEmail) delete userData.email;
         if (!privacy.showMobile) delete userData.mobileNumber;
         if (!privacy.showCurrentCompany) {
            delete userData.currentCompany;
            delete userData.currentRole;
         }
         if (!privacy.showSkills) delete userData.skills;
         if (!privacy.showSocialLinks) {
            delete userData.linkedIn;
            delete userData.github;
            delete userData.portfolioUrl;
         }
      }

      res.json({
         success: true,
         user: userData,
         connectionStatus,
         connectionId: connection?._id,
         mutualConnections,
         mutualConnectionCount: mutualConnectionIds.length
      });
   } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch user profile'
      });
   }
};
