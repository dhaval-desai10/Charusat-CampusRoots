import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
   recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
   },
   sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   type: {
      type: String,
      enum: [
         'message',           // New chat message
         'connection_request', // Someone sent connection request
         'connection_accepted', // Connection request accepted
         'group_invitation',   // Group chat invitation
         'group_joined',       // Someone joined your group
         'profile_view',       // Someone viewed your profile
         'like',               // Someone liked your post
         'comment',            // Someone commented on your post
         'mention',            // Someone mentioned you in a post
         'collaboration',      // Someone added you as collaborator
         'reunion',            // Reunion invite
         'reunion_rsvp',       // Someone RSVPed to your reunion
         'system'              // System notification
      ],
      required: true
   },
   title: {
      type: String,
      required: true
   },
   content: {
      type: String
   },
   // Reference to related entity
   reference: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceModel'
   },
   referenceModel: {
      type: String,
      enum: ['Conversation', 'Connection', 'User', 'Group', 'Post', 'Reunion']
   },
   // For connection requests - store mutual connections count
   mutualConnectionCount: {
      type: Number,
      default: 0
   },
   // For group invitations - store group name
   groupName: {
      type: String
   },
   isRead: {
      type: Boolean,
      default: false
   },
   readAt: Date
}, { timestamps: true });

// Index for fetching user's notifications
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

// Static method to get unread notification count
notificationSchema.statics.getUnreadCount = async function(userId) {
   return await this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
   await this.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
   );
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
   const notification = await this.create(data);
   return notification.populate('sender', 'name profilePicture');
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
