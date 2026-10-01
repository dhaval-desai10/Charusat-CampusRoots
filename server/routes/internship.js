import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { MODULES } from '../constants/rbac.js';
import {
   // Alumni functions
   createInternship,
   getMyInternships,
   updateInternship,
   deleteInternship,
   getInternshipApplications,
   updateApplicationStatus,

   // Student functions
   getAllInternships,
   getInternshipDetails,
   applyForInternship,
   getMyApplications,
   withdrawApplication,

   // Admin functions
   adminGetAllInternships,
   adminGetInternshipDetails,
   adminUpdateInternship,
   adminDeleteInternship
} from '../controllers/internshipController.js';

const router = express.Router();

// All routes are protected
router.use(isAuthenticated);
router.use(requirePermission(MODULES.INTERNSHIP));

// ==================== Admin Routes (Specific paths first) ====================
// Get all internships (admin view with additional data)
router.get('/admin/all', adminGetAllInternships);

// Get internship details with applications (admin view)
router.get('/admin/:id', adminGetInternshipDetails);

// Update internship (admin can approve/modify)
router.put('/admin/:id', adminUpdateInternship);

// Delete internship (admin)
router.delete('/admin/:id', adminDeleteInternship);

// ==================== Alumni Routes (Specific paths) ====================
// Get alumni's own internship postings
router.get('/alumni/my-postings', getMyInternships);

// ==================== Student Routes (Specific paths) ====================
// Get student's own applications
router.get('/student/my-applications', getMyApplications);

// Update application status (accept/reject/shortlist)
router.put('/applications/:applicationId/status', updateApplicationStatus);

// Withdraw application
router.delete('/applications/:applicationId/withdraw', withdrawApplication);

// ==================== General Routes ====================
// Get all active internships (students, alumni, faculty can view)
router.get('/', getAllInternships);

// Create new internship posting (alumni only - checked in controller)
router.post('/', createInternship);

// Get applications for a specific internship
router.get('/:id/applications', getInternshipApplications);

// Apply for an internship
router.post('/:id/apply', applyForInternship);

// Get internship details (must be after other /:id/* routes)
router.get('/:id', getInternshipDetails);

// Update internship posting
router.put('/:id', updateInternship);

// Delete internship posting
router.delete('/:id', deleteInternship);

export default router;
