import Stripe from 'stripe';
import Donation from '../models/Donation.js';
import User from '../models/User.js';

// Initialize Stripe lazily to ensure env vars are loaded
let stripe = null;
const getStripe = () => {
   if (!stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
         throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
   }
   return stripe;
};

// Create payment intent for donation
export const createPaymentIntent = async (req, res) => {
   try {
      const { amount, purpose, message, isAnonymous } = req.body;
      const userId = req.user._id;

      // Verify user is alumni
      const user = await User.findById(userId);
      if (!user || user.role !== 'alumni') {
         return res.status(403).json({ message: 'Only alumni can make donations' });
      }

      if (!amount || amount < 100) {
         return res.status(400).json({ message: 'Minimum donation amount is ₹100' });
      }

      // Create payment intent with Stripe
      const paymentIntent = await getStripe().paymentIntents.create({
         amount: Math.round(amount * 100), // Convert to paise
         currency: 'inr',
         metadata: {
            userId: userId.toString(),
            purpose: purpose || 'general',
            isAnonymous: isAnonymous ? 'true' : 'false'
         },
         description: `Donation for ${purpose || 'general'} from ${isAnonymous ? 'Anonymous' : user.name}`
      });

      // Create donation record with pending status
      const donation = new Donation({
         user: userId,
         amount,
         purpose: purpose || 'general',
         message,
         isAnonymous,
         stripePaymentIntentId: paymentIntent.id,
         paymentStatus: 'pending'
      });

      await donation.save();

      res.json({
         clientSecret: paymentIntent.client_secret,
         donationId: donation._id
      });

   } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
   }
};

// Confirm donation after successful payment
export const confirmDonation = async (req, res) => {
   try {
      const { donationId, paymentIntentId } = req.body;
      const userId = req.user._id;

      const donation = await Donation.findOne({
         _id: donationId,
         user: userId,
         stripePaymentIntentId: paymentIntentId
      });

      if (!donation) {
         return res.status(404).json({ message: 'Donation not found' });
      }

      // Verify payment with Stripe
      const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
         donation.paymentStatus = 'succeeded';
         donation.stripeChargeId = paymentIntent.latest_charge;
         
         // Get receipt URL if available
         if (paymentIntent.latest_charge) {
            const charge = await getStripe().charges.retrieve(paymentIntent.latest_charge);
            donation.receiptUrl = charge.receipt_url;
         }
      } else {
         donation.paymentStatus = paymentIntent.status === 'processing' ? 'processing' : 'failed';
      }

      await donation.save();

      res.json({
         success: donation.paymentStatus === 'succeeded',
         donation: {
            _id: donation._id,
            amount: donation.amount,
            purpose: donation.purpose,
            paymentStatus: donation.paymentStatus,
            receiptUrl: donation.receiptUrl
         }
      });

   } catch (error) {
      console.error('Confirm donation error:', error);
      res.status(500).json({ message: 'Failed to confirm donation', error: error.message });
   }
};

// Get user's donation history
export const getMyDonations = async (req, res) => {
   try {
      const userId = req.user._id;

      const donations = await Donation.find({
         user: userId,
         paymentStatus: { $in: ['succeeded', 'processing'] }
      })
         .sort({ createdAt: -1 })
         .select('-stripePaymentIntentId -stripeChargeId');

      const totalDonated = donations.reduce((sum, d) => 
         d.paymentStatus === 'succeeded' ? sum + d.amount : sum, 0
      );

      res.json({
         donations,
         totalDonated,
         donationCount: donations.filter(d => d.paymentStatus === 'succeeded').length
      });

   } catch (error) {
      console.error('Get my donations error:', error);
      res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
   }
};

// Get public donor list (excluding anonymous)
export const getPublicDonors = async (req, res) => {
   try {
      const donations = await Donation.find({
         paymentStatus: 'succeeded',
         isAnonymous: false
      })
         .populate('user', 'name profilePicture graduationYear branch')
         .sort({ amount: -1, createdAt: -1 })
         .limit(50)
         .select('user amount purpose createdAt');

      // Get total stats
      const stats = await Donation.aggregate([
         { $match: { paymentStatus: 'succeeded' } },
         {
            $group: {
               _id: null,
               totalAmount: { $sum: '$amount' },
               totalDonors: { $addToSet: '$user' },
               donationCount: { $sum: 1 }
            }
         }
      ]);

      const totalStats = stats[0] || { totalAmount: 0, totalDonors: [], donationCount: 0 };

      res.json({
         topDonors: donations,
         stats: {
            totalAmount: totalStats.totalAmount,
            uniqueDonors: totalStats.totalDonors.length,
            donationCount: totalStats.donationCount
         }
      });

   } catch (error) {
      console.error('Get public donors error:', error);
      res.status(500).json({ message: 'Failed to fetch donors', error: error.message });
   }
};

// ============ ADMIN FUNCTIONS ============

// Get all donations for admin
export const adminGetAllDonations = async (req, res) => {
   try {
      const { page = 1, limit = 20, status, purpose, search } = req.query;

      const query = {};
      
      if (status && status !== 'all') {
         query.paymentStatus = status;
      }
      
      if (purpose && purpose !== 'all') {
         query.purpose = purpose;
      }

      const donations = await Donation.find(query)
         .populate('user', 'name email profilePicture graduationYear branch role')
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(parseInt(limit));

      const total = await Donation.countDocuments(query);

      // Get statistics
      const stats = await Donation.aggregate([
         { $match: { paymentStatus: 'succeeded' } },
         {
            $group: {
               _id: null,
               totalAmount: { $sum: '$amount' },
               totalDonors: { $addToSet: '$user' }
            }
         }
      ]);

      const purposeStats = await Donation.aggregate([
         { $match: { paymentStatus: 'succeeded' } },
         {
            $group: {
               _id: '$purpose',
               total: { $sum: '$amount' },
               count: { $sum: 1 }
            }
         }
      ]);

      const monthlyStats = await Donation.aggregate([
         { $match: { paymentStatus: 'succeeded' } },
         {
            $group: {
               _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
               },
               total: { $sum: '$amount' },
               count: { $sum: 1 }
            }
         },
         { $sort: { '_id.year': -1, '_id.month': -1 } },
         { $limit: 12 }
      ]);

      res.json({
         donations,
         pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: total
         },
         stats: {
            totalAmount: stats[0]?.totalAmount || 0,
            uniqueDonors: stats[0]?.totalDonors?.length || 0,
            byPurpose: purposeStats,
            monthly: monthlyStats
         }
      });

   } catch (error) {
      console.error('Admin get donations error:', error);
      res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
   }
};

// Get single donation details for admin
export const adminGetDonationDetails = async (req, res) => {
   try {
      const { id } = req.params;

      const donation = await Donation.findById(id)
         .populate('user', 'name email profilePicture graduationYear branch role');

      if (!donation) {
         return res.status(404).json({ message: 'Donation not found' });
      }

      res.json(donation);

   } catch (error) {
      console.error('Admin get donation details error:', error);
      res.status(500).json({ message: 'Failed to fetch donation details', error: error.message });
   }
};

// Add admin note to donation
export const adminAddNote = async (req, res) => {
   try {
      const { id } = req.params;
      const { note } = req.body;

      const donation = await Donation.findByIdAndUpdate(
         id,
         { adminNotes: note },
         { new: true }
      ).populate('user', 'name email profilePicture');

      if (!donation) {
         return res.status(404).json({ message: 'Donation not found' });
      }

      res.json({ message: 'Note added successfully', donation });

   } catch (error) {
      console.error('Admin add note error:', error);
      res.status(500).json({ message: 'Failed to add note', error: error.message });
   }
};

// Acknowledge donation
export const adminAcknowledgeDonation = async (req, res) => {
   try {
      const { id } = req.params;

      const donation = await Donation.findByIdAndUpdate(
         id,
         { acknowledgedAt: new Date() },
         { new: true }
      ).populate('user', 'name email profilePicture');

      if (!donation) {
         return res.status(404).json({ message: 'Donation not found' });
      }

      res.json({ message: 'Donation acknowledged', donation });

   } catch (error) {
      console.error('Admin acknowledge donation error:', error);
      res.status(500).json({ message: 'Failed to acknowledge donation', error: error.message });
   }
};

// Export donations as CSV
export const adminExportDonations = async (req, res) => {
   try {
      const { startDate, endDate, status } = req.query;

      const query = { paymentStatus: 'succeeded' };
      
      if (startDate && endDate) {
         query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
         };
      }

      const donations = await Donation.find(query)
         .populate('user', 'name email graduationYear branch')
         .sort({ createdAt: -1 });

      // Generate CSV
      const headers = ['Date', 'Donor Name', 'Email', 'Amount', 'Purpose', 'Anonymous', 'Status', 'Graduation Year', 'Branch'];
      const rows = donations.map(d => [
         new Date(d.createdAt).toLocaleDateString(),
         d.isAnonymous ? 'Anonymous' : d.user?.name || 'N/A',
         d.isAnonymous ? 'Hidden' : d.user?.email || 'N/A',
         d.amount,
         d.purpose,
         d.isAnonymous ? 'Yes' : 'No',
         d.paymentStatus,
         d.user?.graduationYear || 'N/A',
         d.user?.branch || 'N/A'
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=donations.csv');
      res.send(csv);

   } catch (error) {
      console.error('Admin export donations error:', error);
      res.status(500).json({ message: 'Failed to export donations', error: error.message });
   }
};

// Stripe webhook handler
export const stripeWebhook = async (req, res) => {
   const sig = req.headers['stripe-signature'];
   const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

   let event;

   try {
      event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
   } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
   }

   // Handle the event
   switch (event.type) {
      case 'payment_intent.succeeded':
         const paymentIntent = event.data.object;
         await Donation.findOneAndUpdate(
            { stripePaymentIntentId: paymentIntent.id },
            { 
               paymentStatus: 'succeeded',
               stripeChargeId: paymentIntent.latest_charge
            }
         );
         break;

      case 'payment_intent.payment_failed':
         const failedPayment = event.data.object;
         await Donation.findOneAndUpdate(
            { stripePaymentIntentId: failedPayment.id },
            { paymentStatus: 'failed' }
         );
         break;

      default:
         console.log(`Unhandled event type ${event.type}`);
   }

   res.json({ received: true });
};
