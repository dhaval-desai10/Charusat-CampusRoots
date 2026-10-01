import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {
   createGroup,
   getMyGroups,
   getPendingInvitations,
   acceptInvitation,
   rejectInvitation,
   getGroupDetails,
   getGroupMessages,
   sendGroupMessage,
   inviteToGroup,
   leaveGroup,
   updateGroup,
   removeMember,
   getGroupUnreadCount
} from '../controllers/groupChatController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Create a new group
router.post('/create', createGroup);

// Get all groups for current user
router.get('/my-groups', getMyGroups);

// Get pending group invitations
router.get('/invitations', getPendingInvitations);

// Get group unread messages count
router.get('/unread-count', getGroupUnreadCount);

// Accept group invitation
router.post('/invitations/:groupId/accept', acceptInvitation);

// Reject group invitation
router.post('/invitations/:groupId/reject', rejectInvitation);

// Get group details
router.get('/:groupId', getGroupDetails);

// Update group details (admin only)
router.put('/:groupId', updateGroup);

// Get messages for a group
router.get('/:groupId/messages', getGroupMessages);

// Send message to group
router.post('/:groupId/messages', sendGroupMessage);

// Invite users to group (admin only)
router.post('/:groupId/invite', inviteToGroup);

// Leave group
router.post('/:groupId/leave', leaveGroup);

// Remove member from group (admin only)
router.delete('/:groupId/members/:memberId', removeMember);

export default router;
