import User from '../models/User.js';

// Get user settings
export const getSettings = async (req, res) => {
   try {
      const user = await User.findById(req.user._id).select('role privacy');
      
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      res.json({
         success: true,
         settings: {
            role: user.role || 'alumni',
            privacy: user.privacy || {
               profileVisibility: 'alumni-only',
               showEmail: false,
               showMobile: false,
               showCurrentCompany: true,
               showSkills: true,
               showSocialLinks: true,
               allowMessaging: 'alumni-only',
               showInAlumniDirectory: true,
               allowConnectionRequests: true
            }
         }
      });
   } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch settings'
      });
   }
};

// Update user role
export const updateRole = async (req, res) => {
   try {
      const { role } = req.body;
      
      const validRoles = ['student', 'alumni', 'faculty'];
      if (!validRoles.includes(role)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid role. Must be one of: student, alumni, faculty'
         });
      }

      const user = await User.findByIdAndUpdate(
         req.user._id,
         { role },
         { new: true }
      ).select('role name email');

      res.json({
         success: true,
         message: 'Role updated successfully',
         user: {
            role: user.role,
            name: user.name,
            email: user.email
         }
      });
   } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update role'
      });
   }
};

// Update privacy settings
export const updatePrivacy = async (req, res) => {
   try {
      const { privacy } = req.body;

      // Validate privacy settings
      const validVisibility = ['public', 'alumni-only', 'connections-only', 'private'];
      const validMessaging = ['everyone', 'alumni-only', 'connections-only', 'none'];

      if (privacy.profileVisibility && !validVisibility.includes(privacy.profileVisibility)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid profile visibility option'
         });
      }

      if (privacy.allowMessaging && !validMessaging.includes(privacy.allowMessaging)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid messaging option'
         });
      }

      // Build update object with only provided fields
      const updateFields = {};
      
      if (privacy.profileVisibility !== undefined) {
         updateFields['privacy.profileVisibility'] = privacy.profileVisibility;
      }
      if (privacy.showEmail !== undefined) {
         updateFields['privacy.showEmail'] = privacy.showEmail;
      }
      if (privacy.showMobile !== undefined) {
         updateFields['privacy.showMobile'] = privacy.showMobile;
      }
      if (privacy.showCurrentCompany !== undefined) {
         updateFields['privacy.showCurrentCompany'] = privacy.showCurrentCompany;
      }
      if (privacy.showSkills !== undefined) {
         updateFields['privacy.showSkills'] = privacy.showSkills;
      }
      if (privacy.showSocialLinks !== undefined) {
         updateFields['privacy.showSocialLinks'] = privacy.showSocialLinks;
      }
      if (privacy.allowMessaging !== undefined) {
         updateFields['privacy.allowMessaging'] = privacy.allowMessaging;
      }
      if (privacy.showInAlumniDirectory !== undefined) {
         updateFields['privacy.showInAlumniDirectory'] = privacy.showInAlumniDirectory;
      }
      if (privacy.allowConnectionRequests !== undefined) {
         updateFields['privacy.allowConnectionRequests'] = privacy.allowConnectionRequests;
      }

      const user = await User.findByIdAndUpdate(
         req.user._id,
         { $set: updateFields },
         { new: true }
      ).select('privacy');

      res.json({
         success: true,
         message: 'Privacy settings updated successfully',
         privacy: user.privacy
      });
   } catch (error) {
      console.error('Update privacy error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update privacy settings'
      });
   }
};

// Get role-based access permissions
export const getRolePermissions = async (req, res) => {
   try {
      const user = await User.findById(req.user._id).select('role');
      
      const permissions = {
         student: {
            canViewAlumniDirectory: true,
            canSendConnectionRequests: true,
            canMessageAlumni: true,
            canPostEvents: false,
            canCreateJobs: false,
            canModerateContent: false,
            canAccessAnalytics: false,
            canManageUsers: false
         },
         alumni: {
            canViewAlumniDirectory: true,
            canSendConnectionRequests: true,
            canMessageAlumni: true,
            canPostEvents: true,
            canCreateJobs: true,
            canModerateContent: false,
            canAccessAnalytics: false,
            canManageUsers: false
         },
         faculty: {
            canViewAlumniDirectory: true,
            canSendConnectionRequests: true,
            canMessageAlumni: true,
            canPostEvents: true,
            canCreateJobs: true,
            canModerateContent: true,
            canAccessAnalytics: true,
            canManageUsers: false
         },
         admin: {
            canViewAlumniDirectory: true,
            canSendConnectionRequests: true,
            canMessageAlumni: true,
            canPostEvents: true,
            canCreateJobs: true,
            canModerateContent: true,
            canAccessAnalytics: true,
            canManageUsers: true
         }
      };

      res.json({
         success: true,
         role: user.role,
         permissions: permissions[user.role] || permissions.alumni
      });
   } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch permissions'
      });
   }
};
