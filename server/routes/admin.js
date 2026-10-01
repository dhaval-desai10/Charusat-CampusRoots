import express from 'express';
import { verifyAdminToken } from '../middleware/adminAuth.js';
import {
   adminLogin,
   verifyAdmin,
   getDashboardStats,
   getAllUsers,
   getUserById,
   updateUserRole,
   deleteUser,
   getAllPosts,
   deletePost,
   getAllReunions,
   createReunion,
   deleteReunion,
   getRolePermissions,
   updateRolePermission
} from '../controllers/adminController.js';

const router = express.Router();

// Public routes
router.post('/login', adminLogin);

// Protected routes (require admin token)
router.get('/verify', verifyAdminToken, verifyAdmin);
router.get('/dashboard/stats', verifyAdminToken, getDashboardStats);

// User management
router.get('/users', verifyAdminToken, getAllUsers);
router.get('/users/:userId', verifyAdminToken, getUserById);
router.put('/users/:userId/role', verifyAdminToken, updateUserRole);
router.delete('/users/:userId', verifyAdminToken, deleteUser);

// Post management
router.get('/posts', verifyAdminToken, getAllPosts);
router.delete('/posts/:postId', verifyAdminToken, deletePost);

// Reunion management
router.get('/reunions', verifyAdminToken, getAllReunions);
router.post('/reunions', verifyAdminToken, createReunion);
router.delete('/reunions/:reunionId', verifyAdminToken, deleteReunion);

// RBAC management
router.get('/rbac/permissions', verifyAdminToken, getRolePermissions);
router.put('/rbac/permissions', verifyAdminToken, updateRolePermission);

export default router;
