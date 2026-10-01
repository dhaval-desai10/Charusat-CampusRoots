import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {
   discoverUsers,
   sendConnectionRequest,
   acceptConnectionRequest,
   rejectConnectionRequest,
   cancelConnectionRequest,
   removeConnection,
   getMyConnections,
   getPendingRequests,
   getSentRequests,
   getConnectionStats,
   getUserProfile
} from '../controllers/connectionController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Discover users (alumni directory)
router.get('/discover', discoverUsers);

// Connection stats
router.get('/stats', getConnectionStats);

// Get my connections
router.get('/my-connections', getMyConnections);

// Get pending requests (received)
router.get('/requests/pending', getPendingRequests);

// Get sent requests
router.get('/requests/sent', getSentRequests);

// Send connection request
router.post('/request', sendConnectionRequest);

// Accept connection request
router.put('/request/:connectionId/accept', acceptConnectionRequest);

// Reject connection request
router.put('/request/:connectionId/reject', rejectConnectionRequest);

// Cancel sent request
router.delete('/request/:connectionId/cancel', cancelConnectionRequest);

// Remove connection
router.delete('/:connectionId', removeConnection);

// Get user profile with connection info
router.get('/user/:userId', getUserProfile);

export default router;
