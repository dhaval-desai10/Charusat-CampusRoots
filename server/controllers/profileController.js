import User from '../models/User.js';
import Connection from '../models/Connection.js';

// Helper to check messaging permission
function checkCanMessage(privacy, isConnected, viewerRole) {
   const messageSetting = privacy?.allowMessaging || 'everyone';
   
   if (messageSetting === 'everyone') return true;
   if (messageSetting === 'alumni-only') return viewerRole !== 'student';
   if (messageSetting === 'connections-only') return isConnected;
   if (messageSetting === 'none') return false;
   
   return true;
}

// Get user profile with privacy settings applied
export const getUserProfile = async (req, res) => {
   try {
      const { userId } = req.params;
      const viewerId = req.user._id;

      // Get the profile user and the viewer
      const [profileUser, viewer] = await Promise.all([
         User.findById(userId),
         User.findById(viewerId).select('role')
      ]);
      
      if (!profileUser) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Check connection status
      const connection = await Connection.findOne({
         $or: [
            { requester: viewerId, recipient: userId },
            { requester: userId, recipient: viewerId }
         ]
      });

      const isConnected = connection?.status === 'accepted';
      const connectionStatus = connection?.status || null;
      const isOwnProfile = viewerId.toString() === userId.toString();

      // Get mutual connections count
      let mutualConnectionsCount = 0;
      if (!isOwnProfile) {
         const viewerConnections = await Connection.find({
            $or: [{ requester: viewerId }, { recipient: viewerId }],
            status: 'accepted'
         });
         
         const viewerConnectionIds = viewerConnections.map(c => 
            c.requester.toString() === viewerId.toString() ? c.recipient.toString() : c.requester.toString()
         );

         const profileUserConnections = await Connection.find({
            $or: [{ requester: userId }, { recipient: userId }],
            status: 'accepted'
         });

         const profileUserConnectionIds = profileUserConnections.map(c => 
            c.requester.toString() === userId.toString() ? c.recipient.toString() : c.requester.toString()
         );

         mutualConnectionsCount = viewerConnectionIds.filter(id => 
            profileUserConnectionIds.includes(id)
         ).length;
      }

      // Get total connections count
      const totalConnections = await Connection.countDocuments({
         $or: [{ requester: userId }, { recipient: userId }],
         status: 'accepted'
      });

      // Build profile based on privacy settings
      const privacy = profileUser.privacy || {};
      const visibility = privacy.profileVisibility || 'alumni-only';

      // Check if viewer can see the profile
      let canView = false;
      if (isOwnProfile) {
         canView = true;
      } else if (visibility === 'public') {
         canView = true;
      } else if (visibility === 'alumni-only') {
         canView = true; // All authenticated users are alumni
      } else if (visibility === 'connections-only') {
         canView = isConnected;
      } else if (visibility === 'private') {
         canView = false;
      }

      if (!canView) {
         return res.json({
            success: true,
            profile: {
               _id: profileUser._id,
               name: profileUser.name,
               profilePicture: profileUser.profilePicture,
               role: profileUser.role,
               isPrivate: true,
               connectionStatus,
               isConnected,
               isOwnProfile
            },
            message: 'This profile is private'
         });
      }

      // Build visible profile data
      const profile = {
         _id: profileUser._id,
         name: profileUser.name,
         profilePicture: profileUser.profilePicture,
         role: profileUser.role,
         batch: profileUser.batch,
         department: profileUser.department,
         bio: profileUser.bio,
         currentEducation: profileUser.currentEducation,
         isOwnProfile,
         isConnected,
         connectionStatus,
         mutualConnectionsCount,
         totalConnections,
         canMessage: checkCanMessage(privacy, isConnected, viewer.role),
         canSendConnectionRequest: privacy.allowConnectionRequests !== false
      };

      // Add fields based on privacy settings
      if (privacy.showEmail || isOwnProfile) {
         profile.email = profileUser.email;
      }

      if (privacy.showMobile || isOwnProfile) {
         profile.mobileNumber = profileUser.mobileNumber;
      }

      if (privacy.showCurrentCompany !== false || isOwnProfile) {
         profile.currentCompany = profileUser.currentCompany;
         profile.currentRole = profileUser.currentRole;
      }

      if (privacy.showSkills !== false || isOwnProfile) {
         profile.skills = profileUser.skills;
      }

      if (privacy.showSocialLinks !== false || isOwnProfile) {
         profile.linkedIn = profileUser.linkedIn;
         profile.github = profileUser.github;
         profile.portfolioUrl = profileUser.portfolioUrl;
      }

      res.json({
         success: true,
         profile
      });

   } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch user profile'
      });
   }
};

// Get mutual connections between two users
export const getMutualConnections = async (req, res) => {
   try {
      const { userId } = req.params;
      const viewerId = req.user._id;

      if (viewerId.toString() === userId.toString()) {
         return res.json({
            success: true,
            mutualConnections: []
         });
      }

      // Get viewer's connections
      const viewerConnections = await Connection.find({
         $or: [{ requester: viewerId }, { recipient: viewerId }],
         status: 'accepted'
      });
      
      const viewerConnectionIds = viewerConnections.map(c => 
         c.requester.toString() === viewerId.toString() ? c.recipient.toString() : c.requester.toString()
      );

      // Get profile user's connections
      const profileUserConnections = await Connection.find({
         $or: [{ requester: userId }, { recipient: userId }],
         status: 'accepted'
      });

      const profileUserConnectionIds = profileUserConnections.map(c => 
         c.requester.toString() === userId.toString() ? c.recipient.toString() : c.requester.toString()
      );

      // Find mutual connection IDs
      const mutualIds = viewerConnectionIds.filter(id => 
         profileUserConnectionIds.includes(id)
      );

      // Get mutual connection details
      const mutualConnections = await User.find({
         _id: { $in: mutualIds }
      }).select('name profilePicture role currentCompany currentRole').limit(10);

      res.json({
         success: true,
         mutualConnections,
         totalMutual: mutualIds.length
      });

   } catch (error) {
      console.error('Get mutual connections error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch mutual connections'
      });
   }
};
