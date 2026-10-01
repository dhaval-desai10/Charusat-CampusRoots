import express from 'express';
import { uploadGalleryPhotos } from '../config/cloudinary.js';
import { verifyAdminToken } from '../middleware/adminAuth.js';
import { isAuthenticated } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { MODULES } from '../constants/rbac.js';
import {
   getAllGalleries,
   getGalleryById,
   adminGetAllGalleries,
   createGallery,
   updateGallery,
   deleteGallery,
   toggleGalleryStatus,
   addPhotosToGallery
} from '../controllers/galleryController.js';

const router = express.Router();

// Public routes (for authenticated users - students, faculty, alumni)
router.get('/', isAuthenticated, requirePermission(MODULES.GALLERY), getAllGalleries);
router.get('/:id', isAuthenticated, requirePermission(MODULES.GALLERY), getGalleryById);

// Admin routes
router.get('/admin/all', verifyAdminToken, adminGetAllGalleries);
router.post('/admin/create', verifyAdminToken, uploadGalleryPhotos.array('photos', 20), createGallery);
router.put('/admin/:id', verifyAdminToken, uploadGalleryPhotos.array('photos', 20), updateGallery);
router.delete('/admin/:id', verifyAdminToken, deleteGallery);
router.patch('/admin/:id/toggle', verifyAdminToken, toggleGalleryStatus);
router.post('/admin/:id/photos', verifyAdminToken, uploadGalleryPhotos.array('photos', 20), addPhotosToGallery);

export default router;
