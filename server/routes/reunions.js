import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { MODULES } from '../constants/rbac.js';
import upload from '../config/cloudinary.js';
import {
   createReunion,
   getReunions,
   getReunionById,
   rsvpReunion,
   updateReunion,
   deleteReunion,
   getMyReunions,
   getAvailableBatches
} from '../controllers/reunionController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);
router.use(requirePermission(MODULES.REUNION));

// Get available batches for faculty to target
router.get('/batches', getAvailableBatches);

// Get all reunions (with filters)
router.get('/', getReunions);

// Get reunions organized by current faculty
router.get('/my-reunions', getMyReunions);

// Get a single reunion by ID
router.get('/:reunionId', getReunionById);

// Create a new reunion (faculty only)
router.post('/', upload.single('coverImage'), createReunion);

// Update a reunion (organizer only)
router.put('/:reunionId', upload.single('coverImage'), updateReunion);

// Delete a reunion (organizer only)
router.delete('/:reunionId', deleteReunion);

// RSVP to a reunion
router.post('/:reunionId/rsvp', rsvpReunion);

export default router;
