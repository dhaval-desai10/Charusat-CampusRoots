import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { verifyAdminToken } from '../middleware/adminAuth.js';
import { MODULES } from '../constants/rbac.js';
import {
   createPaymentIntent,
   confirmDonation,
   getMyDonations,
   getPublicDonors,
   adminGetAllDonations,
   adminGetDonationDetails,
   adminAddNote,
   adminAcknowledgeDonation,
   adminExportDonations,
   stripeWebhook
} from '../controllers/donationController.js';

const router = express.Router();

// ============ USER ROUTES (Alumni only) ============

// Create payment intent for donation
router.post('/create-payment-intent', isAuthenticated, requirePermission(MODULES.CONTRIBUTION), createPaymentIntent);

// Confirm donation after payment
router.post('/confirm', isAuthenticated, requirePermission(MODULES.CONTRIBUTION), confirmDonation);

// Get user's donation history
router.get('/my-donations', isAuthenticated, requirePermission(MODULES.CONTRIBUTION), getMyDonations);

// Get public donor list
router.get('/public-donors', getPublicDonors);

// ============ ADMIN ROUTES ============

// Get all donations
router.get('/admin/all', verifyAdminToken, adminGetAllDonations);

// Get donation details
router.get('/admin/:id', verifyAdminToken, adminGetDonationDetails);

// Add admin note
router.patch('/admin/:id/note', verifyAdminToken, adminAddNote);

// Acknowledge donation
router.patch('/admin/:id/acknowledge', verifyAdminToken, adminAcknowledgeDonation);

// Export donations as CSV
router.get('/admin/export/csv', verifyAdminToken, adminExportDonations);

// Stripe webhook (needs raw body, so this should be handled in index.js)
// router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
