import User from '../models/User.js';
import Post from '../models/Post.js';
import Reunion from '../models/Reunion.js';
import RolePermission, { VALID_ROLES, VALID_MODULES } from '../models/RolePermission.js';
import { ROLES, ALL_ROLES } from '../constants/rbac.js';
import jwt from 'jsonwebtoken';

// Fixed Admin Credentials (In production, use environment variables)
const ADMIN_CREDENTIALS = {
   username: process.env.ADMIN_USERNAME || 'admin',
   password: process.env.ADMIN_PASSWORD || 'CampusRoots@2024'
};

// Generate JWT for admin
const generateAdminToken = () => {
   return jwt.sign(
      { role: 'admin', username: ADMIN_CREDENTIALS.username },
      process.env.JWT_SECRET || 'campusroots-admin-secret',
      { expiresIn: '24h' }
   );
};

// Admin Login
export const adminLogin = async (req, res) => {
   try {
      const { username, password } = req.body;

      if (!username || !password) {
         return res.status(400).json({
            success: false,
            message: 'Username and password are required'
         });
      }

      if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
         return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
         });
      }

      const token = generateAdminToken();

      res.json({
         success: true,
         message: 'Login successful',
         token,
         admin: {
            username: ADMIN_CREDENTIALS.username,
            role: 'admin'
         }
      });
   } catch (error) {
      console.error('Admin Login Error:', error);
      res.status(500).json({
         success: false,
         message: 'Login failed'
      });
   }
};

// Verify Admin Token
export const verifyAdmin = async (req, res) => {
   try {
      res.json({
         success: true,
         admin: {
            username: req.admin.username,
            role: 'admin'
         }
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Verification failed'
      });
   }
};

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
   try {
      const totalUsers = await User.countDocuments();
      const totalPosts = await Post.countDocuments();
      const totalReunions = await Reunion.countDocuments();
      
      // Users by role
      const usersByRole = await User.aggregate([
         { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      // Users by batch
      const usersByBatch = await User.aggregate([
         { $match: { batch: { $ne: null } } },
         { $group: { _id: '$batch', count: { $sum: 1 } } },
         { $sort: { _id: -1 } }
      ]);

      // Recent signups (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentSignups = await User.countDocuments({
         createdAt: { $gte: thirtyDaysAgo }
      });

      // Upcoming reunions
      const upcomingReunions = await Reunion.countDocuments({
         date: { $gte: new Date() }
      });

      res.json({
         success: true,
         stats: {
            totalUsers,
            totalPosts,
            totalReunions,
            recentSignups,
            upcomingReunions,
            usersByRole: usersByRole.reduce((acc, curr) => {
               acc[curr._id] = curr.count;
               return acc;
            }, {}),
            usersByBatch
         }
      });
   } catch (error) {
      console.error('Dashboard Stats Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch dashboard stats'
      });
   }
};

// Get All Users with Filters
export const getAllUsers = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 20,
         batch,
         role,
         department,
         search,
         sortBy = 'createdAt',
         sortOrder = 'desc'
      } = req.query;

      const query = {};

      if (batch) query.batch = batch;
      if (role) query.role = role;
      if (department) query.department = new RegExp(department, 'i');
      if (search) {
         query.$or = [
            { name: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') }
         ];
      }

      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const users = await User.find(query)
         .select('-password')
         .sort(sort)
         .skip((page - 1) * limit)
         .limit(parseInt(limit));

      const total = await User.countDocuments(query);

      // Get unique batches and departments for filters
      const batches = await User.distinct('batch', { batch: { $ne: null } });
      const departments = await User.distinct('department', { department: { $ne: null, $ne: '' } });

      res.json({
         success: true,
         users,
         pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            totalUsers: total
         },
         filters: {
            batches: batches.sort().reverse(),
            departments: departments.sort()
         }
      });
   } catch (error) {
      console.error('Get All Users Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch users'
      });
   }
};

// Get User by ID (Full Details)
export const getUserById = async (req, res) => {
   try {
      const { userId } = req.params;

      const user = await User.findById(userId).select('-password');

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Get user's posts
      const posts = await Post.find({ author: userId })
         .sort({ createdAt: -1 })
         .limit(10);

      res.json({
         success: true,
         user,
         posts
      });
   } catch (error) {
      console.error('Get User By ID Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch user'
      });
   }
};

// Update User Role
export const updateUserRole = async (req, res) => {
   try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!ALL_ROLES.includes(role)) {
         return res.status(400).json({
            success: false,
            message: `Invalid role. Must be one of: ${ALL_ROLES.join(', ')}`
         });
      }

      const user = await User.findByIdAndUpdate(
         userId,
         { role },
         { new: true }
      ).select('-password');

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      res.json({
         success: true,
         message: 'User role updated',
         user
      });
   } catch (error) {
      console.error('Update User Role Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update user role'
      });
   }
};

// Delete User
export const deleteUser = async (req, res) => {
   try {
      const { userId } = req.params;

      const user = await User.findByIdAndDelete(userId);

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Also delete user's posts
      await Post.deleteMany({ author: userId });

      res.json({
         success: true,
         message: 'User and their posts deleted successfully'
      });
   } catch (error) {
      console.error('Delete User Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete user'
      });
   }
};

// Get All Posts with Filters
export const getAllPosts = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 20,
         search,
         sortBy = 'createdAt',
         sortOrder = 'desc'
      } = req.query;

      const query = {};

      if (search) {
         query.$or = [
            { content: new RegExp(search, 'i') }
         ];
      }

      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const posts = await Post.find(query)
         .populate('author', 'name email profilePicture batch department')
         .sort(sort)
         .skip((page - 1) * limit)
         .limit(parseInt(limit));

      const total = await Post.countDocuments(query);

      res.json({
         success: true,
         posts,
         pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            totalPosts: total
         }
      });
   } catch (error) {
      console.error('Get All Posts Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch posts'
      });
   }
};

// Delete Post (Admin)
export const deletePost = async (req, res) => {
   try {
      const { postId } = req.params;

      const post = await Post.findByIdAndDelete(postId);

      if (!post) {
         return res.status(404).json({
            success: false,
            message: 'Post not found'
         });
      }

      res.json({
         success: true,
         message: 'Post deleted successfully'
      });
   } catch (error) {
      console.error('Delete Post Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete post'
      });
   }
};

// Get All Reunions
export const getAllReunions = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 20,
         status,
         sortBy = 'eventDate',
         sortOrder = 'desc'
      } = req.query;

      const query = {};

      if (status === 'upcoming') {
         query.eventDate = { $gte: new Date() };
      } else if (status === 'past') {
         query.eventDate = { $lt: new Date() };
      }

      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const reunions = await Reunion.find(query)
         .populate('organizer', 'name email profilePicture')
         .populate('attendees.user', 'name email profilePicture batch department')
         .sort(sort)
         .skip((page - 1) * limit)
         .limit(parseInt(limit));

      const total = await Reunion.countDocuments(query);

      // Get unique batches for filter
      const batches = await Reunion.distinct('targetBatches');

      res.json({
         success: true,
         reunions,
         pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            totalReunions: total
         },
         filters: {
            batches: batches.sort().reverse()
         }
      });
   } catch (error) {
      console.error('Get All Reunions Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch reunions'
      });
   }
};

// Create Reunion (Admin)
export const createReunion = async (req, res) => {
   try {
      const { 
         title, 
         description, 
         eventDate, 
         eventTime, 
         venue, 
         targetBatches, 
         targetDepartments, 
         maxAttendees,
         eventType,
         meetingLink,
         contactEmail,
         contactPhone
      } = req.body;

      if (!title || !description || !eventDate || !eventTime || !venue || !targetBatches?.length) {
         return res.status(400).json({
            success: false,
            message: 'Title, description, event date, time, venue, and target batches are required'
         });
      }

      // For admin-created reunions, use first user or create without organizer
      const firstUser = await User.findOne().select('_id');
      
      const reunion = await Reunion.create({
         title,
         description,
         eventDate: new Date(eventDate),
         eventTime,
         venue,
         targetBatches,
         targetDepartments: targetDepartments || [],
         maxAttendees: maxAttendees || 0,
         eventType: eventType || 'in-person',
         meetingLink: meetingLink || '',
         contactEmail: contactEmail || '',
         contactPhone: contactPhone || '',
         organizer: firstUser._id,
         status: 'upcoming'
      });

      res.status(201).json({
         success: true,
         message: 'Reunion created successfully',
         reunion
      });
   } catch (error) {
      console.error('Create Reunion Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to create reunion'
      });
   }
};

// Delete Reunion (Admin)
export const deleteReunion = async (req, res) => {
   try {
      const { reunionId } = req.params;

      const reunion = await Reunion.findByIdAndDelete(reunionId);

      if (!reunion) {
         return res.status(404).json({
            success: false,
            message: 'Reunion not found'
         });
      }

      res.json({
         success: true,
         message: 'Reunion deleted successfully'
      });
   } catch (error) {
      console.error('Delete Reunion Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete reunion'
      });
   }
};

// ==================== RBAC Controller Functions ====================

// Get all role permissions (optionally filter by role)
export const getRolePermissions = async (req, res) => {
   try {
      const { role } = req.query;
      const query = {};

      if (role) {
         if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({
               success: false,
               message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
            });
         }
         query.role = role;
      }

      const permissions = await RolePermission.find(query).sort({ role: 1, module: 1 });

      // Group permissions by role for easier frontend consumption
      const grouped = {};
      for (const perm of permissions) {
         if (!grouped[perm.role]) {
            grouped[perm.role] = {};
         }
         grouped[perm.role][perm.module] = perm.enabled;
      }

      res.json({
         success: true,
         permissions,
         grouped,
         roles: VALID_ROLES,
         modules: VALID_MODULES
      });
   } catch (error) {
      console.error('Get Role Permissions Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch role permissions'
      });
   }
};

// Update a specific role-module permission
export const updateRolePermission = async (req, res) => {
   try {
      const { role, module, enabled } = req.body;

      // Validate inputs
      if (!role || !module || typeof enabled !== 'boolean') {
         return res.status(400).json({
            success: false,
            message: 'role, module, and enabled (boolean) are required'
         });
      }

      if (!VALID_ROLES.includes(role)) {
         return res.status(400).json({
            success: false,
            message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
         });
      }

      if (!VALID_MODULES.includes(module)) {
         return res.status(400).json({
            success: false,
            message: `Invalid module. Must be one of: ${VALID_MODULES.join(', ')}`
         });
      }

      const permission = await RolePermission.findOneAndUpdate(
         { role, module },
         { enabled },
         { new: true, upsert: true }
      );

      res.json({
         success: true,
         message: `Permission updated: ${role} → ${module} = ${enabled ? 'ON' : 'OFF'}`,
         permission
      });
   } catch (error) {
      console.error('Update Role Permission Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update permission'
      });
   }
};
