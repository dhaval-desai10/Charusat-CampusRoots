import Feedback from '../models/Feedback.js';

// Create feedback or suggestion (alumni only)
export const createFeedback = async (req, res) => {
   try {
      const { type, rating, message } = req.body;
      
      // Check if user is alumni
      if (req.user.role !== 'alumni') {
         return res.status(403).json({
            success: false,
            message: 'Only alumni can submit feedback'
         });
      }

      if (!type || !message) {
         return res.status(400).json({
            success: false,
            message: 'Type and message are required'
         });
      }

      if (type === 'feedback' && (!rating || rating < 1 || rating > 5)) {
         return res.status(400).json({
            success: false,
            message: 'Rating (1-5) is required for feedback'
         });
      }

      const feedback = new Feedback({
         user: req.user._id,
         type,
         rating: type === 'feedback' ? rating : undefined,
         message,
         isPublic: type === 'feedback'
      });

      await feedback.save();
      await feedback.populate('user', 'name profilePicture batch department');

      res.status(201).json({
         success: true,
         message: type === 'feedback' ? 'Thank you for your feedback!' : 'Your suggestion has been sent to admin.',
         feedback
      });
   } catch (error) {
      console.error('Error creating feedback:', error);
      res.status(500).json({
         success: false,
         message: error.message || 'Failed to submit feedback'
      });
   }
};

// Get all public feedback (visible to all users)
export const getPublicFeedback = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const feedback = await Feedback.find({ type: 'feedback', isPublic: true })
         .populate('user', 'name profilePicture batch department')
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit);

      const total = await Feedback.countDocuments({ type: 'feedback', isPublic: true });

      // Calculate average rating
      const avgRating = await Feedback.aggregate([
         { $match: { type: 'feedback', isPublic: true } },
         { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);

      res.json({
         success: true,
         feedback,
         pagination: {
            current: page,
            total: Math.ceil(total / limit),
            totalFeedback: total
         },
         stats: {
            averageRating: avgRating[0]?.avgRating?.toFixed(1) || 0,
            totalReviews: avgRating[0]?.count || 0
         }
      });
   } catch (error) {
      console.error('Error fetching public feedback:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch feedback'
      });
   }
};

// Get user's own feedback
export const getMyFeedback = async (req, res) => {
   try {
      const feedback = await Feedback.find({ user: req.user._id })
         .sort({ createdAt: -1 });

      res.json({
         success: true,
         feedback
      });
   } catch (error) {
      console.error('Error fetching user feedback:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch your feedback'
      });
   }
};

// Delete own feedback
export const deleteMyFeedback = async (req, res) => {
   try {
      const feedback = await Feedback.findOne({
         _id: req.params.id,
         user: req.user._id
      });

      if (!feedback) {
         return res.status(404).json({
            success: false,
            message: 'Feedback not found'
         });
      }

      await Feedback.findByIdAndDelete(req.params.id);

      res.json({
         success: true,
         message: 'Feedback deleted successfully'
      });
   } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete feedback'
      });
   }
};

// ADMIN: Get all feedback and suggestions
export const adminGetAllFeedback = async (req, res) => {
   try {
      const { type, isRead } = req.query;
      const filter = {};
      
      if (type) filter.type = type;
      if (isRead !== undefined) filter.isRead = isRead === 'true';

      const feedback = await Feedback.find(filter)
         .populate('user', 'name email profilePicture batch department')
         .sort({ createdAt: -1 });

      // Get counts
      const feedbackCount = await Feedback.countDocuments({ type: 'feedback' });
      const suggestionCount = await Feedback.countDocuments({ type: 'suggestion' });
      const unreadSuggestions = await Feedback.countDocuments({ type: 'suggestion', isRead: false });

      res.json({
         success: true,
         feedback,
         stats: {
            totalFeedback: feedbackCount,
            totalSuggestions: suggestionCount,
            unreadSuggestions
         }
      });
   } catch (error) {
      console.error('Error fetching all feedback:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch feedback'
      });
   }
};

// ADMIN: Mark suggestion as read
export const adminMarkAsRead = async (req, res) => {
   try {
      const feedback = await Feedback.findByIdAndUpdate(
         req.params.id,
         { isRead: true },
         { new: true }
      ).populate('user', 'name email profilePicture batch department');

      if (!feedback) {
         return res.status(404).json({
            success: false,
            message: 'Feedback not found'
         });
      }

      res.json({
         success: true,
         feedback
      });
   } catch (error) {
      console.error('Error marking feedback as read:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update feedback'
      });
   }
};

// ADMIN: Respond to suggestion
export const adminRespondToFeedback = async (req, res) => {
   try {
      const { response } = req.body;
      
      if (!response) {
         return res.status(400).json({
            success: false,
            message: 'Response is required'
         });
      }

      const feedback = await Feedback.findByIdAndUpdate(
         req.params.id,
         { 
            adminResponse: response,
            respondedAt: new Date(),
            isRead: true
         },
         { new: true }
      ).populate('user', 'name email profilePicture batch department');

      if (!feedback) {
         return res.status(404).json({
            success: false,
            message: 'Feedback not found'
         });
      }

      res.json({
         success: true,
         message: 'Response sent successfully',
         feedback
      });
   } catch (error) {
      console.error('Error responding to feedback:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to respond'
      });
   }
};

// ADMIN: Delete feedback
export const adminDeleteFeedback = async (req, res) => {
   try {
      const feedback = await Feedback.findByIdAndDelete(req.params.id);

      if (!feedback) {
         return res.status(404).json({
            success: false,
            message: 'Feedback not found'
         });
      }

      res.json({
         success: true,
         message: 'Feedback deleted successfully'
      });
   } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete feedback'
      });
   }
};
