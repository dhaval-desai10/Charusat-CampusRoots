import Reunion from '../models/Reunion.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

// Create a new reunion (faculty only)
export const createReunion = async (req, res) => {
   try {
      // Check if user is faculty
      if (req.user.role !== 'faculty') {
         return res.status(403).json({
            success: false,
            message: 'Only faculty members can create reunion events'
         });
      }

      const {
         title,
         description,
         targetBatches,
         targetDepartments,
         eventDate,
         eventTime,
         venue,
         meetingLink,
         eventType,
         maxAttendees,
         contactEmail,
         contactPhone
      } = req.body;

      // Validate required fields
      if (!title || !description || !targetBatches || !eventDate || !eventTime || !venue) {
         return res.status(400).json({
            success: false,
            message: 'Title, description, target batches, event date, time, and venue are required'
         });
      }

      // Parse targetBatches if it's a string
      let parsedBatches = targetBatches;
      if (typeof targetBatches === 'string') {
         parsedBatches = JSON.parse(targetBatches);
      }

      // Parse targetDepartments if provided
      let parsedDepartments = targetDepartments || [];
      if (typeof targetDepartments === 'string') {
         parsedDepartments = JSON.parse(targetDepartments);
      }

      const reunionData = {
         title: title.trim(),
         description: description.trim(),
         organizer: req.user._id,
         targetBatches: parsedBatches,
         targetDepartments: parsedDepartments,
         eventDate: new Date(eventDate),
         eventTime,
         venue: venue.trim(),
         meetingLink: meetingLink || '',
         eventType: eventType || 'in-person',
         maxAttendees: maxAttendees || 0,
         contactEmail: contactEmail || req.user.email,
         contactPhone: contactPhone || ''
      };

      // Handle cover image from Cloudinary upload
      if (req.file) {
         reunionData.coverImage = req.file.path;
         reunionData.coverImagePublicId = req.file.filename;
      }

      const reunion = await Reunion.create(reunionData);

      // Populate organizer info
      await reunion.populate('organizer', 'name profilePicture role department');

      // Send notifications to alumni in target batches
      const targetAlumni = await User.find({
         role: 'alumni',
         batch: { $in: parsedBatches },
         ...(parsedDepartments.length > 0 && { department: { $in: parsedDepartments } })
      }).select('_id');

      // Create notifications for target alumni
      const notifications = targetAlumni.map(alumni => ({
         recipient: alumni._id,
         sender: req.user._id,
         type: 'reunion',
         title: 'You are invited to a reunion!',
         content: `${title} - scheduled for ${new Date(eventDate).toLocaleDateString()}`,
         reference: reunion._id,
         referenceModel: 'Reunion'
      }));

      if (notifications.length > 0) {
         await Notification.insertMany(notifications);
      }

      res.status(201).json({
         success: true,
         message: 'Reunion event created successfully',
         reunion,
         notifiedCount: targetAlumni.length
      });
   } catch (error) {
      console.error('Create reunion error:', error);

      // Clean up uploaded file if creation fails
      if (req.file?.filename) {
         try {
            await deleteFromCloudinary(req.file.filename, 'image');
         } catch (cleanupError) {
            console.error('Failed to cleanup uploaded file:', cleanupError);
         }
      }

      res.status(500).json({
         success: false,
         message: 'Failed to create reunion event',
         error: error.message
      });
   }
};

// Get all reunions (with filters)
export const getReunions = async (req, res) => {
   try {
      const { status, batch, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      let query = {};

      // Filter by status
      if (status) {
         query.status = status;
      }

      // Filter by batch (for alumni to see their relevant reunions)
      if (batch) {
         query.targetBatches = batch;
      }

      // For alumni, show only reunions targeting their batch
      if (req.user.role === 'alumni' && req.user.batch) {
         query.targetBatches = req.user.batch;
      }

      const [reunions, total] = await Promise.all([
         Reunion.find(query)
            .populate('organizer', 'name profilePicture role department')
            .populate('attendees.user', 'name profilePicture email batch department')
            .sort({ eventDate: 1 })
            .skip(skip)
            .limit(parseInt(limit)),
         Reunion.countDocuments(query)
      ]);

      res.json({
         success: true,
         reunions,
         pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            hasMore: skip + reunions.length < total
         }
      });
   } catch (error) {
      console.error('Get reunions error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch reunions'
      });
   }
};

// Get a single reunion by ID
export const getReunionById = async (req, res) => {
   try {
      const { reunionId } = req.params;

      const reunion = await Reunion.findById(reunionId)
         .populate('organizer', 'name profilePicture role department email')
         .populate('attendees.user', 'name profilePicture batch department');

      if (!reunion) {
         return res.status(404).json({
            success: false,
            message: 'Reunion not found'
         });
      }

      // Check if current user has RSVPed
      const userRsvp = reunion.attendees.find(
         a => a.user._id.toString() === req.user._id.toString()
      );

      res.json({
         success: true,
         reunion,
         userRsvpStatus: userRsvp?.status || null
      });
   } catch (error) {
      console.error('Get reunion error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch reunion'
      });
   }
};

// RSVP to a reunion (alumni only)
export const rsvpReunion = async (req, res) => {
   try {
      const { reunionId } = req.params;
      const { status } = req.body; // 'going', 'interested', 'not-going'

      if (!['going', 'interested', 'not-going'].includes(status)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid RSVP status'
         });
      }

      const reunion = await Reunion.findById(reunionId);

      if (!reunion) {
         return res.status(404).json({
            success: false,
            message: 'Reunion not found'
         });
      }

      // Check if reunion is for user's batch (for alumni)
      if (req.user.role === 'alumni' && !reunion.targetBatches.includes(req.user.batch)) {
         return res.status(403).json({
            success: false,
            message: 'This reunion is not for your batch'
         });
      }

      // Check max attendees limit
      if (status === 'going' && reunion.maxAttendees > 0) {
         const goingCount = reunion.attendees.filter(a => a.status === 'going').length;
         if (goingCount >= reunion.maxAttendees) {
            return res.status(400).json({
               success: false,
               message: 'This event has reached maximum capacity'
            });
         }
      }

      // Check if user already RSVPed
      const existingRsvpIndex = reunion.attendees.findIndex(
         a => a.user.toString() === req.user._id.toString()
      );

      if (existingRsvpIndex > -1) {
         // Update existing RSVP
         reunion.attendees[existingRsvpIndex].status = status;
         reunion.attendees[existingRsvpIndex].rsvpDate = new Date();
      } else {
         // Add new RSVP
         reunion.attendees.push({
            user: req.user._id,
            status,
            rsvpDate: new Date()
         });
      }

      await reunion.save();

      // Notify organizer about RSVP
      if (status === 'going') {
         await Notification.create({
            recipient: reunion.organizer,
            sender: req.user._id,
            type: 'reunion_rsvp',
            title: 'New RSVP for your reunion',
            content: `${req.user.name} is attending "${reunion.title}"`,
            reference: reunion._id,
            referenceModel: 'Reunion'
         });
      }

      await reunion.populate('attendees.user', 'name profilePicture');

      res.json({
         success: true,
         message: `RSVP updated to "${status}"`,
         attendees: reunion.attendees,
         attendeeCount: reunion.attendees.filter(a => a.status === 'going').length,
         interestedCount: reunion.attendees.filter(a => a.status === 'interested').length
      });
   } catch (error) {
      console.error('RSVP error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update RSVP'
      });
   }
};

// Update reunion (organizer/faculty only)
export const updateReunion = async (req, res) => {
   try {
      const { reunionId } = req.params;

      const reunion = await Reunion.findById(reunionId);

      if (!reunion) {
         return res.status(404).json({
            success: false,
            message: 'Reunion not found'
         });
      }

      // Check if user is the organizer
      if (reunion.organizer.toString() !== req.user._id.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the organizer can update this reunion'
         });
      }

      const updateFields = [
         'title', 'description', 'targetBatches', 'targetDepartments',
         'eventDate', 'eventTime', 'venue', 'meetingLink', 'eventType',
         'maxAttendees', 'contactEmail', 'contactPhone', 'status'
      ];

      updateFields.forEach(field => {
         if (req.body[field] !== undefined) {
            let value = req.body[field];
            // Parse JSON strings for arrays
            if ((field === 'targetBatches' || field === 'targetDepartments') && typeof value === 'string') {
               value = JSON.parse(value);
            }
            reunion[field] = value;
         }
      });

      // Handle cover image update
      if (req.file) {
         // Delete old image if exists
         if (reunion.coverImagePublicId) {
            try {
               await deleteFromCloudinary(reunion.coverImagePublicId, 'image');
            } catch (err) {
               console.error('Failed to delete old cover image:', err);
            }
         }
         reunion.coverImage = req.file.path;
         reunion.coverImagePublicId = req.file.filename;
      }

      await reunion.save();
      await reunion.populate('organizer', 'name profilePicture role department');

      res.json({
         success: true,
         message: 'Reunion updated successfully',
         reunion
      });
   } catch (error) {
      console.error('Update reunion error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update reunion'
      });
   }
};

// Delete reunion (organizer/faculty only)
export const deleteReunion = async (req, res) => {
   try {
      const { reunionId } = req.params;

      const reunion = await Reunion.findById(reunionId);

      if (!reunion) {
         return res.status(404).json({
            success: false,
            message: 'Reunion not found'
         });
      }

      // Check if user is the organizer
      if (reunion.organizer.toString() !== req.user._id.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the organizer can delete this reunion'
         });
      }

      // Delete cover image if exists
      if (reunion.coverImagePublicId) {
         try {
            await deleteFromCloudinary(reunion.coverImagePublicId, 'image');
         } catch (err) {
            console.error('Failed to delete cover image:', err);
         }
      }

      await Reunion.findByIdAndDelete(reunionId);

      // Delete related notifications
      await Notification.deleteMany({
         reference: reunionId,
         referenceModel: 'Reunion'
      });

      res.json({
         success: true,
         message: 'Reunion deleted successfully'
      });
   } catch (error) {
      console.error('Delete reunion error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete reunion'
      });
   }
};

// Get reunions organized by specific faculty
export const getMyReunions = async (req, res) => {
   try {
      const reunions = await Reunion.find({ organizer: req.user._id })
         .populate('attendees.user', 'name profilePicture batch')
         .sort({ eventDate: -1 });

      res.json({
         success: true,
         reunions
      });
   } catch (error) {
      console.error('Get my reunions error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch your reunions'
      });
   }
};

// Get available batches for faculty to target
export const getAvailableBatches = async (req, res) => {
   try {
      // Get distinct batches from alumni users
      const batches = await User.distinct('batch', { 
         role: 'alumni',
         batch: { $ne: null, $ne: '' }
      });

      // Sort batches
      batches.sort((a, b) => {
         const yearA = parseInt(a.split('-')[0]);
         const yearB = parseInt(b.split('-')[0]);
         return yearB - yearA; // Newest first
      });

      res.json({
         success: true,
         batches
      });
   } catch (error) {
      console.error('Get batches error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch batches'
      });
   }
};
