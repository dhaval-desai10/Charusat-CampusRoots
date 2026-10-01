import passport from 'passport';
import User from '../models/User.js';
import RolePermission from '../models/RolePermission.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { ROLES, ALL_MODULES } from '../constants/rbac.js';

// Email validation helper
const isValidCharusatEmail = (email) => {
   return email.endsWith('@charusat.edu.in') || email.endsWith('@charusat.ac.in');
};

// Extract batch year from email
export const getBatchFromEmail = (email) => {
   const lowerEmail = email.toLowerCase();
   
   // Faculty: no batch
   if (lowerEmail.endsWith('@charusat.ac.in')) {
      return null;
   }
   
   // Student/Alumni: @charusat.edu.in
   if (lowerEmail.endsWith('@charusat.edu.in')) {
      const localPart = lowerEmail.split('@')[0]; // e.g., "23dit010" or "d24dit010"
      
      let enrollmentYear;
      
      // Check if email starts with 'd' (e.g., d19dit010)
      // For d19dit010, the batch is 19-1 = 18, so enrollment year is 2018
      if (localPart.charAt(0) === 'd' && /^\d{2}/.test(localPart.substring(1))) {
         const yearDigits = parseInt(localPart.substring(1, 3), 10);
         enrollmentYear = 2000 + yearDigits - 1; // e.g., d19 -> 2018
      }
      // Check if email starts with digits (e.g., 19dit010)
      // For 19dit010, enrollment year is 2019
      else if (/^\d{2}/.test(localPart)) {
         const yearDigits = parseInt(localPart.substring(0, 2), 10);
         enrollmentYear = 2000 + yearDigits; // e.g., 19 -> 2019
      }
      else {
         return null;
      }
      
      // Return batch as "YYYY-YYYY" (4-year program)
      const graduationYear = enrollmentYear + 4;
      return `${enrollmentYear}-${graduationYear}`;
   }
   
   return null;
};

// Determine user role from email
export const getRoleFromEmail = (email) => {
   const lowerEmail = email.toLowerCase();
   
   // Faculty: @charusat.ac.in
   if (lowerEmail.endsWith('@charusat.ac.in')) {
      return ROLES.FACULTY;
   }
   
   // Student/Alumni: @charusat.edu.in
   if (lowerEmail.endsWith('@charusat.edu.in')) {
      const localPart = lowerEmail.split('@')[0]; // e.g., "23dit010" or "d24dit010"
      const currentYear = new Date().getFullYear() % 100; // Get last 2 digits (e.g., 26 for 2026)
      
      let enrollmentYear;
      let yearsDiff;
      
      // Check if email starts with 'd' (e.g., d24dit010)
      if (localPart.charAt(0) === 'd' && /^\d{2}/.test(localPart.substring(1))) {
         // Extract year from position 1-2 (after 'd')
         enrollmentYear = parseInt(localPart.substring(1, 3), 10);
         yearsDiff = currentYear - enrollmentYear - 1;
      }
      // Check if email starts with digits (e.g., 23dit010)
      else if (/^\d{2}/.test(localPart)) {
         // Extract year from position 0-1
         enrollmentYear = parseInt(localPart.substring(0, 2), 10);
         yearsDiff = currentYear - enrollmentYear;
      }
      // Fallback for other formats
      else {
         return ROLES.ALUMNI; // Default to alumni if format is unrecognized
      }
      
      // If years < 4, student; otherwise alumni
      return yearsDiff < 4 ? ROLES.STUDENT : ROLES.ALUMNI;
   }
   
   // Default fallback
   return ROLES.ALUMNI;
};

// Register with email/password
export const register = async (req, res) => {
   try {
      const { name, email, password } = req.body;
      
      // Validate required fields
      if (!name || !email || !password) {
         return res.status(400).json({
            success: false,
            message: 'Name, email, and password are required'
         });
      }

      // Validate email domain
      if (!isValidCharusatEmail(email)) {
         return res.status(400).json({
            success: false,
            message: 'Only @charusat.edu.in and @charusat.ac.in emails are allowed'
         });
      }

      // Validate password length
      if (password.length < 6) {
         return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters'
         });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
         return res.status(400).json({
            success: false,
            message: 'An account with this email already exists'
         });
      }

      // Create user with profile photo if provided
      const userData = {
         name: name.trim(),
         email: email.toLowerCase().trim(),
         password,
         authProvider: 'local',
         role: getRoleFromEmail(email),
         batch: getBatchFromEmail(email)
      };

      // Handle profile photo from Cloudinary upload
      if (req.file) {
         userData.profilePicture = req.file.path; // Cloudinary URL
         userData.profilePicturePublicId = req.file.filename; // Cloudinary public_id
      }

      const user = await User.create(userData);

      // Log the user in automatically
      req.login(user, (err) => {
         if (err) {
            return res.status(500).json({
               success: false,
               message: 'Registration successful but login failed'
            });
         }

         // Remove password from response
         const userResponse = user.toObject();
         delete userResponse.password;

         res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: userResponse
         });
      });

   } catch (error) {
      console.error('Registration error:', error);
      
      // Clean up uploaded file if registration fails
      if (req.file?.filename) {
         try {
            await deleteFromCloudinary(req.file.filename, 'image');
         } catch (cleanupError) {
            console.error('Failed to cleanup uploaded file:', cleanupError);
         }
      }

      res.status(500).json({
         success: false,
         message: error.message || 'Registration failed'
      });
   }
};

// Login with email/password
export const login = async (req, res) => {
   try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
         return res.status(400).json({
            success: false,
            message: 'Email and password are required'
         });
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
         return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
         });
      }

      // Check if user registered with Google
      if (user.authProvider === 'google' && !user.password) {
         return res.status(400).json({
            success: false,
            message: 'This account uses Google sign-in. Please login with Google.'
         });
      }

      // Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
         return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
         });
      }

      // Log the user in
      req.login(user, (err) => {
         if (err) {
            return res.status(500).json({
               success: false,
               message: 'Login failed'
            });
         }

         // Remove password from response
         const userResponse = user.toObject();
         delete userResponse.password;

         res.json({
            success: true,
            message: 'Login successful',
            user: userResponse
         });
      });

   } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
         success: false,
         message: 'Login failed'
      });
   }
};

// Test endpoint
export const testAuth = (req, res) => {
   res.json({ 
      success: true, 
      message: 'Auth routes are working!',
      googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
   });
};

// Initiate Google OAuth
export const googleAuth = (req, res, next) => {
   console.log('🔐 Initiating Google OAuth...');
   passport.authenticate('google', { 
      scope: ['profile', 'email'] 
   })(req, res, next);
};

// Google OAuth callback middleware
export const googleAuthCallback = passport.authenticate('google', { 
   failureRedirect: `${process.env.CLIENT_URL}/login?error=unauthorized`,
   failureMessage: true
});

// Google OAuth callback handler
export const googleAuthCallbackHandler = (req, res) => {
   console.log('✅ Google OAuth successful for:', req.user.email);
   // Check if profile is complete
   const redirectUrl = req.user.isProfileComplete 
      ? `${process.env.CLIENT_URL}/dashboard`
      : `${process.env.CLIENT_URL}/complete-profile`;
   res.redirect(redirectUrl);
};

// Get current user
export const getCurrentUser = (req, res) => {
   res.json({
      success: true,
      user: req.user
   });
};

// Get current user's module permissions based on their role
export const getUserPermissions = async (req, res) => {
   try {
      const userRole = req.user.role;

      // Admin gets all permissions
      if (userRole === ROLES.ADMIN) {
         const permissions = {};
         ALL_MODULES.forEach(mod => { permissions[mod] = true; });
         return res.json({ success: true, permissions });
      }

      const rolePermissions = await RolePermission.find({ role: userRole });

      const permissions = {};
      for (const perm of rolePermissions) {
         permissions[perm.module] = perm.enabled;
      }

      res.json({ success: true, permissions });
   } catch (error) {
      console.error('Get User Permissions Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch permissions'
      });
   }
};

// Update user profile
export const updateProfile = async (req, res) => {
   try {
      const { 
         name, 
         department, 
         currentCompany, 
         currentRole,
         currentEducation,
         skills, 
         linkedIn, 
         github, 
         portfolioUrl, 
         bio, 
         mobileNumber 
      } = req.body;

      // Note: batch is auto-calculated from email and cannot be edited by user
      const user = await User.findByIdAndUpdate(
         req.user._id,
         {
            name,
            department,
            currentCompany,
            currentRole,
            currentEducation,
            skills,
            linkedIn,
            github,
            portfolioUrl,
            bio,
            mobileNumber,
            isProfileComplete: true
         },
         { new: true, runValidators: true }
      );

      res.json({
         success: true,
         message: 'Profile updated successfully',
         user
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to update profile',
         error: error.message
      });
   }
};

// Logout
export const logout = (req, res) => {
   req.logout((err) => {
      if (err) {
         return res.status(500).json({ 
            success: false, 
            message: 'Logout failed' 
         });
      }
      res.json({ 
         success: true, 
         message: 'Logged out successfully' 
      });
   });
};
