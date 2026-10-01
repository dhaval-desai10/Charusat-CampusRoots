import Internship from '../models/Internship.js';
import InternshipApplication from '../models/InternshipApplication.js';
import User from '../models/User.js';

// ==================== ALUMNI FUNCTIONS ====================

// Create new internship (Alumni only)
export const createInternship = async (req, res) => {
   try {
      if (req.user.role !== 'alumni') {
         return res.status(403).json({ message: 'Only alumni can post internships' });
      }

      const {
         title,
         company,
         location,
         locationType,
         description,
         requirements,
         skills,
         duration,
         stipend,
         applicationDeadline,
         startDate,
         openings,
         contactEmail,
         externalLink
      } = req.body;

      const internship = new Internship({
         postedBy: req.user._id,
         title,
         company,
         location,
         locationType,
         description,
         requirements,
         skills: skills || [],
         duration,
         stipend: {
            amount: stipend?.amount || 0,
            currency: stipend?.currency || 'INR',
            isPaid: stipend?.isPaid !== false
         },
         applicationDeadline: new Date(applicationDeadline),
         startDate: startDate ? new Date(startDate) : null,
         openings: openings || 1,
         contactEmail: contactEmail || req.user.email,
         externalLink
      });

      await internship.save();

      res.status(201).json({
         success: true,
         message: 'Internship posted successfully',
         internship
      });
   } catch (error) {
      console.error('Create internship error:', error);
      res.status(500).json({ message: error.message || 'Failed to create internship' });
   }
};

// Get alumni's posted internships
export const getMyInternships = async (req, res) => {
   try {
      if (req.user.role !== 'alumni') {
         return res.status(403).json({ message: 'Access denied' });
      }

      const internships = await Internship.find({ postedBy: req.user._id })
         .sort({ createdAt: -1 });

      res.json({ success: true, internships });
   } catch (error) {
      console.error('Get my internships error:', error);
      res.status(500).json({ message: 'Failed to fetch internships' });
   }
};

// Update internship (Alumni - own posts only)
export const updateInternship = async (req, res) => {
   try {
      const { id } = req.params;
      const internship = await Internship.findById(id);

      if (!internship) {
         return res.status(404).json({ message: 'Internship not found' });
      }

      if (internship.postedBy.toString() !== req.user._id.toString()) {
         return res.status(403).json({ message: 'You can only update your own posts' });
      }

      const allowedUpdates = [
         'title', 'company', 'location', 'locationType', 'description',
         'requirements', 'skills', 'duration', 'stipend', 'applicationDeadline',
         'startDate', 'openings', 'status', 'contactEmail', 'externalLink'
      ];

      allowedUpdates.forEach(field => {
         if (req.body[field] !== undefined) {
            if (field === 'applicationDeadline' || field === 'startDate') {
               internship[field] = req.body[field] ? new Date(req.body[field]) : null;
            } else {
               internship[field] = req.body[field];
            }
         }
      });

      await internship.save();

      res.json({ success: true, message: 'Internship updated', internship });
   } catch (error) {
      console.error('Update internship error:', error);
      res.status(500).json({ message: 'Failed to update internship' });
   }
};

// Delete internship (Alumni - own posts only)
export const deleteInternship = async (req, res) => {
   try {
      const { id } = req.params;
      const internship = await Internship.findById(id);

      if (!internship) {
         return res.status(404).json({ message: 'Internship not found' });
      }

      if (internship.postedBy.toString() !== req.user._id.toString()) {
         return res.status(403).json({ message: 'You can only delete your own posts' });
      }

      // Delete all applications for this internship
      await InternshipApplication.deleteMany({ internship: id });
      await Internship.findByIdAndDelete(id);

      res.json({ success: true, message: 'Internship deleted' });
   } catch (error) {
      console.error('Delete internship error:', error);
      res.status(500).json({ message: 'Failed to delete internship' });
   }
};

// Get applications for an internship (Alumni - own posts only)
export const getInternshipApplications = async (req, res) => {
   try {
      const { id } = req.params;
      const { status } = req.query;

      const internship = await Internship.findById(id);

      if (!internship) {
         return res.status(404).json({ message: 'Internship not found' });
      }

      if (internship.postedBy.toString() !== req.user._id.toString()) {
         return res.status(403).json({ message: 'Access denied' });
      }

      const query = { internship: id };
      if (status) query.status = status;

      const applications = await InternshipApplication.find(query)
         .populate('applicant', 'name email profilePicture graduationYear branch department')
         .sort({ createdAt: -1 });

      res.json({ success: true, applications, internship });
   } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
   }
};

// Update application status (Alumni - own posts only)
export const updateApplicationStatus = async (req, res) => {
   try {
      const { applicationId } = req.params;
      const { status, alumniNotes } = req.body;

      const application = await InternshipApplication.findById(applicationId)
         .populate('internship');

      if (!application) {
         return res.status(404).json({ message: 'Application not found' });
      }

      if (application.internship.postedBy.toString() !== req.user._id.toString()) {
         return res.status(403).json({ message: 'Access denied' });
      }

      if (status) {
         application.status = status;
         application.reviewedAt = new Date();
      }
      if (alumniNotes !== undefined) {
         application.alumniNotes = alumniNotes;
      }

      await application.save();

      res.json({ success: true, message: 'Application updated', application });
   } catch (error) {
      console.error('Update application error:', error);
      res.status(500).json({ message: 'Failed to update application' });
   }
};

// ==================== STUDENT FUNCTIONS ====================

// Get all active internships (Students & Faculty can view)
export const getAllInternships = async (req, res) => {
   try {
      const { page = 1, limit = 20, search, locationType, skills } = req.query;

      const query = { 
         status: 'active',
         isApproved: true,
         applicationDeadline: { $gte: new Date() }
      };

      if (search) {
         query.$text = { $search: search };
      }

      if (locationType) {
         query.locationType = locationType;
      }

      if (skills) {
         const skillsArray = skills.split(',').map(s => s.trim());
         query.skills = { $in: skillsArray };
      }

      const total = await Internship.countDocuments(query);
      const internships = await Internship.find(query)
         .populate('postedBy', 'name profilePicture company graduationYear')
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(parseInt(limit));

      // If user is a student, check which ones they've applied to
      let appliedIds = [];
      if (req.user.role === 'student') {
         const applications = await InternshipApplication.find({
            applicant: req.user._id,
            internship: { $in: internships.map(i => i._id) }
         }).select('internship status');
         
         appliedIds = applications.reduce((acc, app) => {
            acc[app.internship.toString()] = app.status;
            return acc;
         }, {});
      }

      res.json({
         success: true,
         internships: internships.map(int => ({
            ...int.toObject(),
            hasApplied: !!appliedIds[int._id.toString()],
            applicationStatus: appliedIds[int._id.toString()] || null
         })),
         pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: total
         }
      });
   } catch (error) {
      console.error('Get all internships error:', error);
      res.status(500).json({ message: 'Failed to fetch internships' });
   }
};

// Get internship details
export const getInternshipDetails = async (req, res) => {
   try {
      const { id } = req.params;

      const internship = await Internship.findById(id)
         .populate('postedBy', 'name email profilePicture company graduationYear branch linkedin');

      if (!internship) {
         return res.status(404).json({ message: 'Internship not found' });
      }

      // Check if student has applied
      let application = null;
      if (req.user.role === 'student') {
         application = await InternshipApplication.findOne({
            internship: id,
            applicant: req.user._id
         });
      }

      res.json({
         success: true,
         internship,
         hasApplied: !!application,
         application
      });
   } catch (error) {
      console.error('Get internship details error:', error);
      res.status(500).json({ message: 'Failed to fetch internship details' });
   }
};

// Apply for internship (Students only)
export const applyForInternship = async (req, res) => {
   try {
      if (req.user.role !== 'student') {
         return res.status(403).json({ message: 'Only students can apply for internships' });
      }

      const { id } = req.params;
      const { coverLetter, resume, portfolio, expectedStipend, availableFrom } = req.body;

      const internship = await Internship.findById(id);

      if (!internship) {
         return res.status(404).json({ message: 'Internship not found' });
      }

      if (internship.status !== 'active') {
         return res.status(400).json({ message: 'This internship is no longer accepting applications' });
      }

      if (new Date(internship.applicationDeadline) < new Date()) {
         return res.status(400).json({ message: 'Application deadline has passed' });
      }

      // Check if already applied
      const existingApplication = await InternshipApplication.findOne({
         internship: id,
         applicant: req.user._id
      });

      if (existingApplication) {
         return res.status(400).json({ message: 'You have already applied for this internship' });
      }

      const application = new InternshipApplication({
         internship: id,
         applicant: req.user._id,
         coverLetter,
         resume,
         portfolio,
         expectedStipend,
         availableFrom: availableFrom ? new Date(availableFrom) : null
      });

      await application.save();

      res.status(201).json({
         success: true,
         message: 'Application submitted successfully',
         application
      });
   } catch (error) {
      console.error('Apply for internship error:', error);
      res.status(500).json({ message: error.message || 'Failed to submit application' });
   }
};

// Get student's applications
export const getMyApplications = async (req, res) => {
   try {
      if (req.user.role !== 'student') {
         return res.status(403).json({ message: 'Access denied' });
      }

      const applications = await InternshipApplication.find({ applicant: req.user._id })
         .populate({
            path: 'internship',
            populate: {
               path: 'postedBy',
               select: 'name company profilePicture'
            }
         })
         .sort({ createdAt: -1 });

      res.json({ success: true, applications });
   } catch (error) {
      console.error('Get my applications error:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
   }
};

// Withdraw application (Students)
export const withdrawApplication = async (req, res) => {
   try {
      const { applicationId } = req.params;

      const application = await InternshipApplication.findOne({
         _id: applicationId,
         applicant: req.user._id
      });

      if (!application) {
         return res.status(404).json({ message: 'Application not found' });
      }

      if (['accepted', 'rejected'].includes(application.status)) {
         return res.status(400).json({ message: 'Cannot withdraw this application' });
      }

      application.status = 'withdrawn';
      await application.save();

      res.json({ success: true, message: 'Application withdrawn' });
   } catch (error) {
      console.error('Withdraw application error:', error);
      res.status(500).json({ message: 'Failed to withdraw application' });
   }
};

// ==================== ADMIN FUNCTIONS ====================

// Get all internships (Admin)
export const adminGetAllInternships = async (req, res) => {
   try {
      const { page = 1, limit = 20, status, search } = req.query;

      const query = {};
      if (status) query.status = status;
      if (search) {
         query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } }
         ];
      }

      const total = await Internship.countDocuments(query);
      const internships = await Internship.find(query)
         .populate('postedBy', 'name email profilePicture')
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(parseInt(limit));

      // Get stats
      const stats = {
         total: await Internship.countDocuments(),
         active: await Internship.countDocuments({ status: 'active' }),
         closed: await Internship.countDocuments({ status: 'closed' }),
         expired: await Internship.countDocuments({ status: 'expired' }),
         totalApplications: await InternshipApplication.countDocuments()
      };

      res.json({
         success: true,
         internships,
         stats,
         pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: total
         }
      });
   } catch (error) {
      console.error('Admin get internships error:', error);
      res.status(500).json({ message: 'Failed to fetch internships' });
   }
};

// Get internship details with applications (Admin)
export const adminGetInternshipDetails = async (req, res) => {
   try {
      const { id } = req.params;

      const internship = await Internship.findById(id)
         .populate('postedBy', 'name email profilePicture graduationYear branch');

      if (!internship) {
         return res.status(404).json({ message: 'Internship not found' });
      }

      const applications = await InternshipApplication.find({ internship: id })
         .populate('applicant', 'name email profilePicture graduationYear branch department')
         .sort({ createdAt: -1 });

      const applicationStats = {
         total: applications.length,
         pending: applications.filter(a => a.status === 'pending').length,
         reviewing: applications.filter(a => a.status === 'reviewing').length,
         shortlisted: applications.filter(a => a.status === 'shortlisted').length,
         accepted: applications.filter(a => a.status === 'accepted').length,
         rejected: applications.filter(a => a.status === 'rejected').length
      };

      res.json({
         success: true,
         internship,
         applications,
         applicationStats
      });
   } catch (error) {
      console.error('Admin get internship details error:', error);
      res.status(500).json({ message: 'Failed to fetch internship details' });
   }
};

// Update internship status/approval (Admin)
export const adminUpdateInternship = async (req, res) => {
   try {
      const { id } = req.params;
      const { status, isApproved, adminNotes } = req.body;

      const internship = await Internship.findById(id);

      if (!internship) {
         return res.status(404).json({ message: 'Internship not found' });
      }

      if (status) internship.status = status;
      if (isApproved !== undefined) internship.isApproved = isApproved;
      if (adminNotes !== undefined) internship.adminNotes = adminNotes;

      await internship.save();

      res.json({ success: true, message: 'Internship updated', internship });
   } catch (error) {
      console.error('Admin update internship error:', error);
      res.status(500).json({ message: 'Failed to update internship' });
   }
};

// Delete internship (Admin)
export const adminDeleteInternship = async (req, res) => {
   try {
      const { id } = req.params;

      const internship = await Internship.findById(id);

      if (!internship) {
         return res.status(404).json({ message: 'Internship not found' });
      }

      await InternshipApplication.deleteMany({ internship: id });
      await Internship.findByIdAndDelete(id);

      res.json({ success: true, message: 'Internship deleted' });
   } catch (error) {
      console.error('Admin delete internship error:', error);
      res.status(500).json({ message: 'Failed to delete internship' });
   }
};
