import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {
   getSettings,
   updateRole,
   updatePrivacy,
   getRolePermissions
} from '../controllers/settingsController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Get all settings
router.get('/', getSettings);

// Update role
router.put('/role', updateRole);

// Update privacy settings
router.put('/privacy', updatePrivacy);

// Get role-based permissions
router.get('/permissions', getRolePermissions);

export default router;
