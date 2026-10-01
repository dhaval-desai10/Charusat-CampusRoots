import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Notification from '../models/Notification.js';

// Create a new group
export const createGroup = async (req, res) => {
   try {
      const userId = req.user._id;
      const { name, bio, invitedUsers } = req.body;

      if (!name?.trim()) {
         return res.status(400).json({
            success: false,
            message: 'Group name is required'
         });
      }

      if (name.trim().length < 3 || name.trim().length > 50) {
         return res.status(400).json({
            success: false,
            message: 'Group name must be between 3 and 50 characters'
         });
      }

      if (!invitedUsers || !Array.isArray(invitedUsers) || invitedUsers.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'At least one user must be invited to create a group'
         });
      }

      // Verify all invited users are connections
      for (const invitedUserId of invitedUsers) {
         const areConnected = await Connection.areConnected(userId, invitedUserId);
         if (!areConnected) {
            return res.status(403).json({
               success: false,
               message: 'You can only invite connected users to a group'
            });
         }
      }

      // Create members array with creator as accepted admin and invited users as pending
      const members = [
         {
            user: userId,
            status: 'accepted',
            role: 'admin',
            joinedAt: new Date()
         },
         ...invitedUsers.map(invitedId => ({
            user: invitedId,
            status: 'pending',
            role: 'member',
            invitedAt: new Date()
         }))
      ];

      // Create unread count entries for all members
      const unreadCount = members.map(member => ({
         user: member.user,
         count: 0
      }));

      const group = await Group.create({
         name: name.trim(),
         bio: bio?.trim() || '',
         createdBy: userId,
         members,
         unreadCount
      });

      await group.populate([
         { path: 'createdBy', select: 'name profilePicture' },
         { path: 'members.user', select: 'name profilePicture email' }
      ]);

      // Create notifications for invited users
      const creator = await User.findById(userId).select('name');
      const io = req.app.get('io');
      
      for (const invitedUserId of invitedUsers) {
         const notification = await Notification.create({
            recipient: invitedUserId,
            sender: userId,
            type: 'group_invitation',
            title: `${creator.name} invited you to join "${name.trim()}"`,
            content: bio?.trim() || 'You have been invited to a group',
            reference: group._id,
            referenceModel: 'Group',
            groupName: name.trim()
         });

         // Emit real-time notification
         if (io) {
            const populatedNotification = await notification.populate('sender', 'name profilePicture');
            io.to(`user:${invitedUserId}`).emit('notification:new', populatedNotification);
            const unreadCount = await Notification.getUnreadCount(invitedUserId);
            io.to(`user:${invitedUserId}`).emit('notification:count', unreadCount);
         }
      }

      res.status(201).json({
         success: true,
         message: 'Group created successfully. Invitations sent to members.',
         group
      });
   } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to create group'
      });
   }
};

// Get all groups for current user (where user is accepted member)
export const getMyGroups = async (req, res) => {
   try {
      const userId = req.user._id;

      const groups = await Group.find({
         'members': { $elemMatch: { user: userId, status: 'accepted' } },
         isActive: true
      })
      .populate('createdBy', 'name profilePicture')
      .populate('members.user', 'name profilePicture')
      .populate({
         path: 'lastMessage',
         select: 'content createdAt sender',
         populate: { path: 'sender', select: 'name' }
      })
      .sort({ lastMessageAt: -1 });

      // Format groups with unread count
      const formattedGroups = groups.map(group => {
         const unread = group.unreadCount.find(
            u => u.user.toString() === userId.toString()
         );
         const acceptedMembers = group.members.filter(m => m.status === 'accepted');

         return {
            _id: group._id,
            name: group.name,
            bio: group.bio,
            profilePicture: group.profilePicture,
            createdBy: group.createdBy,
            members: acceptedMembers,
            membersCount: acceptedMembers.length,
            lastMessage: group.lastMessage,
            lastMessageAt: group.lastMessageAt,
            unreadCount: unread?.count || 0,
            createdAt: group.createdAt
         };
      });

      res.json({
         success: true,
         groups: formattedGroups
      });
   } catch (error) {
      console.error('Get groups error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch groups'
      });
   }
};

// Get pending group invitations for current user
export const getPendingInvitations = async (req, res) => {
   try {
      const userId = req.user._id;

      const invitations = await Group.find({
         'members': { $elemMatch: { user: userId, status: 'pending' } },
         isActive: true
      })
      .populate('createdBy', 'name profilePicture')
      .populate('members.user', 'name profilePicture')
      .select('name bio profilePicture createdBy members createdAt');

      // Format invitations
      const formattedInvitations = invitations.map(group => {
         const acceptedMembers = group.members.filter(m => m.status === 'accepted');
         return {
            _id: group._id,
            name: group.name,
            bio: group.bio,
            profilePicture: group.profilePicture,
            createdBy: group.createdBy,
            membersCount: acceptedMembers.length,
            members: acceptedMembers.map(m => m.user),
            createdAt: group.createdAt
         };
      });

      res.json({
         success: true,
         invitations: formattedInvitations
      });
   } catch (error) {
      console.error('Get invitations error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch invitations'
      });
   }
};

// Accept group invitation
export const acceptInvitation = async (req, res) => {
   try {
      const userId = req.user._id;
      const { groupId } = req.params;

      const group = await Group.findOne({
         _id: groupId,
         'members': { $elemMatch: { user: userId, status: 'pending' } },
         isActive: true
      });

      if (!group) {
         return res.status(404).json({
            success: false,
            message: 'Invitation not found or already processed'
         });
      }

      // Update member status to accepted
      await Group.findOneAndUpdate(
         { _id: groupId, 'members.user': userId },
         { 
            $set: { 
               'members.$.status': 'accepted',
               'members.$.joinedAt': new Date()
            }
         }
      );

      // Create system message
      const user = await User.findById(userId).select('name');
      await GroupMessage.create({
         group: groupId,
         sender: userId,
         content: `${user.name} joined the group`,
         messageType: 'system'
      });

      res.json({
         success: true,
         message: 'You have joined the group'
      });
   } catch (error) {
      console.error('Accept invitation error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to accept invitation'
      });
   }
};

// Reject group invitation
export const rejectInvitation = async (req, res) => {
   try {
      const userId = req.user._id;
      const { groupId } = req.params;

      const group = await Group.findOne({
         _id: groupId,
         'members': { $elemMatch: { user: userId, status: 'pending' } },
         isActive: true
      });

      if (!group) {
         return res.status(404).json({
            success: false,
            message: 'Invitation not found or already processed'
         });
      }

      // Remove user from members
      await Group.findByIdAndUpdate(groupId, {
         $pull: { 
            members: { user: userId },
            unreadCount: { user: userId }
         }
      });

      res.json({
         success: true,
         message: 'Invitation rejected'
      });
   } catch (error) {
      console.error('Reject invitation error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to reject invitation'
      });
   }
};

// Get group details
export const getGroupDetails = async (req, res) => {
   try {
      const userId = req.user._id;
      const { groupId } = req.params;

      const group = await Group.findOne({
         _id: groupId,
         'members': { $elemMatch: { user: userId, status: 'accepted' } },
         isActive: true
      })
      .populate('createdBy', 'name profilePicture email')
      .populate('members.user', 'name profilePicture email role currentCompany');

      if (!group) {
         return res.status(404).json({
            success: false,
            message: 'Group not found or access denied'
         });
      }

      const isAdmin = group.createdBy._id.toString() === userId.toString() ||
         group.members.some(m => 
            m.user._id.toString() === userId.toString() && 
            m.role === 'admin' && 
            m.status === 'accepted'
         );

      res.json({
         success: true,
         group: {
            _id: group._id,
            name: group.name,
            bio: group.bio,
            profilePicture: group.profilePicture,
            createdBy: group.createdBy,
            members: group.members.filter(m => m.status === 'accepted'),
            pendingMembers: isAdmin ? group.members.filter(m => m.status === 'pending') : [],
            isAdmin,
            createdAt: group.createdAt
         }
      });
   } catch (error) {
      console.error('Get group details error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch group details'
      });
   }
};

// Get messages for a group
export const getGroupMessages = async (req, res) => {
   try {
      const userId = req.user._id;
      const { groupId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Verify user is a member of this group
      const isMember = await Group.isMember(groupId, userId);
      if (!isMember) {
         return res.status(403).json({
            success: false,
            message: 'Access denied to this group'
         });
      }

      // Get messages with pagination
      const messages = await GroupMessage.find({
         group: groupId,
         isDeleted: false
      })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

      // Reset unread count
      await Group.resetUnreadCount(groupId, userId);

      // Reverse for chronological order
      messages.reverse();

      const total = await GroupMessage.countDocuments({
         group: groupId,
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
      console.error('Get group messages error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch messages'
      });
   }
};

// Send message to group (HTTP fallback)
export const sendGroupMessage = async (req, res) => {
   try {
      const userId = req.user._id;
      const { groupId } = req.params;
      const { content } = req.body;

      if (!content?.trim()) {
         return res.status(400).json({
            success: false,
            message: 'Message content is required'
         });
      }

      // Verify user is a member
      const isMember = await Group.isMember(groupId, userId);
      if (!isMember) {
         return res.status(403).json({
            success: false,
            message: 'Access denied to this group'
         });
      }

      // Create message
      const message = await GroupMessage.create({
         group: groupId,
         sender: userId,
         content: content.trim(),
         readBy: [{ user: userId, readAt: new Date() }]
      });

      await message.populate('sender', 'name profilePicture');

      // Update group
      await Group.findByIdAndUpdate(groupId, {
         lastMessage: message._id,
         lastMessageAt: new Date()
      });

      // Increment unread count for all other members
      await Group.incrementUnreadCount(groupId, userId);

      res.json({
         success: true,
         message
      });
   } catch (error) {
      console.error('Send group message error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to send message'
      });
   }
};

// Invite more users to group (admin only)
export const inviteToGroup = async (req, res) => {
   try {
      const userId = req.user._id;
      const { groupId } = req.params;
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'At least one user must be selected'
         });
      }

      // Check if user is admin
      const isAdmin = await Group.isAdmin(groupId, userId);
      if (!isAdmin) {
         return res.status(403).json({
            success: false,
            message: 'Only admins can invite members'
         });
      }

      const group = await Group.findById(groupId);
      if (!group || !group.isActive) {
         return res.status(404).json({
            success: false,
            message: 'Group not found'
         });
      }

      // Filter out users already in the group
      const existingMemberIds = group.members.map(m => m.user.toString());
      const newUserIds = userIds.filter(id => !existingMemberIds.includes(id));

      if (newUserIds.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'All selected users are already members or invited'
         });
      }

      // Verify all new users are connections of the inviter
      for (const invitedUserId of newUserIds) {
         const areConnected = await Connection.areConnected(userId, invitedUserId);
         if (!areConnected) {
            return res.status(403).json({
               success: false,
               message: 'You can only invite connected users'
            });
         }
      }

      // Add new members as pending
      const newMembers = newUserIds.map(id => ({
         user: id,
         status: 'pending',
         role: 'member',
         invitedAt: new Date()
      }));

      const newUnreadCounts = newUserIds.map(id => ({
         user: id,
         count: 0
      }));

      await Group.findByIdAndUpdate(groupId, {
         $push: { 
            members: { $each: newMembers },
            unreadCount: { $each: newUnreadCounts }
         }
      });

      // Create notifications for newly invited users
      const inviter = await User.findById(userId).select('name');
      const io = req.app.get('io');
      
      for (const invitedUserId of newUserIds) {
         const notification = await Notification.create({
            recipient: invitedUserId,
            sender: userId,
            type: 'group_invitation',
            title: `${inviter.name} invited you to join "${group.name}"`,
            content: group.bio || 'You have been invited to a group',
            reference: group._id,
            referenceModel: 'Group',
            groupName: group.name
         });

         // Emit real-time notification
         if (io) {
            const populatedNotification = await notification.populate('sender', 'name profilePicture');
            io.to(`user:${invitedUserId}`).emit('notification:new', populatedNotification);
            const unreadCount = await Notification.getUnreadCount(invitedUserId);
            io.to(`user:${invitedUserId}`).emit('notification:count', unreadCount);
         }
      }

      res.json({
         success: true,
         message: `Invitations sent to ${newUserIds.length} user(s)`
      });
   } catch (error) {
      console.error('Invite to group error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to send invitations'
      });
   }
};

// Leave group
export const leaveGroup = async (req, res) => {
   try {
      const userId = req.user._id;
      const { groupId } = req.params;

      const group = await Group.findOne({
         _id: groupId,
         'members': { $elemMatch: { user: userId, status: 'accepted' } },
         isActive: true
      });

      if (!group) {
         return res.status(404).json({
            success: false,
            message: 'Group not found or you are not a member'
         });
      }

      // Check if user is the creator
      if (group.createdBy.toString() === userId.toString()) {
         // Transfer admin to another member or delete group
         const otherMembers = group.members.filter(
            m => m.user.toString() !== userId.toString() && m.status === 'accepted'
         );

         if (otherMembers.length === 0) {
            // No other members, deactivate group
            await Group.findByIdAndUpdate(groupId, { isActive: false });
            return res.json({
               success: true,
               message: 'Group deleted as you were the only member'
            });
         }

         // Transfer admin to the first accepted member
         const newAdmin = otherMembers[0];
         await Group.findOneAndUpdate(
            { _id: groupId, 'members.user': newAdmin.user },
            { 
               $set: { 
                  createdBy: newAdmin.user,
                  'members.$.role': 'admin'
               }
            }
         );
      }

      // Remove user from group
      await Group.findByIdAndUpdate(groupId, {
         $pull: { 
            members: { user: userId },
            unreadCount: { user: userId }
         }
      });

      // Create system message
      const user = await User.findById(userId).select('name');
      await GroupMessage.create({
         group: groupId,
         sender: userId,
         content: `${user.name} left the group`,
         messageType: 'system'
      });

      res.json({
         success: true,
         message: 'You have left the group'
      });
   } catch (error) {
      console.error('Leave group error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to leave group'
      });
   }
};

// Update group details (admin only)
export const updateGroup = async (req, res) => {
   try {
      const userId = req.user._id;
      const { groupId } = req.params;
      const { name, bio } = req.body;

      const isAdmin = await Group.isAdmin(groupId, userId);
      if (!isAdmin) {
         return res.status(403).json({
            success: false,
            message: 'Only admins can update group details'
         });
      }

      const updates = {};
      if (name?.trim()) {
         if (name.trim().length < 3 || name.trim().length > 50) {
            return res.status(400).json({
               success: false,
               message: 'Group name must be between 3 and 50 characters'
            });
         }
         updates.name = name.trim();
      }
      if (bio !== undefined) {
         updates.bio = bio.trim().slice(0, 200);
      }

      const group = await Group.findByIdAndUpdate(
         groupId,
         { $set: updates },
         { new: true }
      )
      .populate('createdBy', 'name profilePicture')
      .populate('members.user', 'name profilePicture');

      res.json({
         success: true,
         message: 'Group updated successfully',
         group
      });
   } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update group'
      });
   }
};

// Remove member from group (admin only)
export const removeMember = async (req, res) => {
   try {
      const userId = req.user._id;
      const { groupId, memberId } = req.params;

      const isAdmin = await Group.isAdmin(groupId, userId);
      if (!isAdmin) {
         return res.status(403).json({
            success: false,
            message: 'Only admins can remove members'
         });
      }

      const group = await Group.findById(groupId);
      if (!group) {
         return res.status(404).json({
            success: false,
            message: 'Group not found'
         });
      }

      // Cannot remove the creator
      if (group.createdBy.toString() === memberId) {
         return res.status(403).json({
            success: false,
            message: 'Cannot remove the group creator'
         });
      }

      await Group.findByIdAndUpdate(groupId, {
         $pull: { 
            members: { user: memberId },
            unreadCount: { user: memberId }
         }
      });

      // Create system message
      const removedUser = await User.findById(memberId).select('name');
      await GroupMessage.create({
         group: groupId,
         sender: userId,
         content: `${removedUser.name} was removed from the group`,
         messageType: 'system'
      });

      res.json({
         success: true,
         message: 'Member removed from group'
      });
   } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to remove member'
      });
   }
};

// Get group unread count
export const getGroupUnreadCount = async (req, res) => {
   try {
      const userId = req.user._id;
      const count = await Group.getTotalUnreadCount(userId);

      res.json({
         success: true,
         unreadCount: count
      });
   } catch (error) {
      console.error('Get group unread count error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to get unread count'
      });
   }
};
