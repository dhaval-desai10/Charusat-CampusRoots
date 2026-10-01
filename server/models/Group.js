import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
   },
   role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
   },
   joinedAt: {
      type: Date
   },
   invitedAt: {
      type: Date,
      default: Date.now
   }
}, { _id: false });

const groupSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50
   },
   bio: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
   },
   profilePicture: {
      type: String,
      default: ''
   },
   // Group creator/admin
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   // Members with their invitation status
   members: [memberSchema],
   // Last message reference for sorting
   lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupMessage'
   },
   lastMessageAt: {
      type: Date,
      default: Date.now
   },
   // Unread count per member
   unreadCount: [{
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      },
      count: {
         type: Number,
         default: 0
      }
   }],
   isActive: {
      type: Boolean,
      default: true
   }
}, { timestamps: true });

// Indexes
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ lastMessageAt: -1 });

// Virtual to get accepted members count
groupSchema.virtual('acceptedMembersCount').get(function() {
   return this.members.filter(m => m.status === 'accepted').length;
});

// Static method to check if user is a member of the group
groupSchema.statics.isMember = async function(groupId, userId) {
   const group = await this.findOne({
      _id: groupId,
      'members.user': userId,
      'members.status': 'accepted'
   });
   return !!group;
};

// Static method to check if user is admin of the group
groupSchema.statics.isAdmin = async function(groupId, userId) {
   const group = await this.findOne({
      _id: groupId,
      $or: [
         { createdBy: userId },
         { 'members': { $elemMatch: { user: userId, role: 'admin', status: 'accepted' } } }
      ]
   });
   return !!group;
};

// Static method to get pending invitations for a user
groupSchema.statics.getPendingInvitations = async function(userId) {
   return await this.find({
      'members': { $elemMatch: { user: userId, status: 'pending' } },
      isActive: true
   })
   .populate('createdBy', 'name profilePicture')
   .select('name bio profilePicture createdBy createdAt');
};

// Static method to increment unread count for all members except sender
groupSchema.statics.incrementUnreadCount = async function(groupId, senderId) {
   const group = await this.findById(groupId);
   if (!group) return;

   const acceptedMembers = group.members.filter(m => 
      m.status === 'accepted' && m.user.toString() !== senderId.toString()
   );

   for (const member of acceptedMembers) {
      await this.findOneAndUpdate(
         { _id: groupId, 'unreadCount.user': member.user },
         { $inc: { 'unreadCount.$.count': 1 } }
      );
   }
};

// Static method to reset unread count for a user
groupSchema.statics.resetUnreadCount = async function(groupId, userId) {
   await this.findOneAndUpdate(
      { _id: groupId, 'unreadCount.user': userId },
      { $set: { 'unreadCount.$.count': 0 } }
   );
};

// Static method to get total unread count for groups
groupSchema.statics.getTotalUnreadCount = async function(userId) {
   const result = await this.aggregate([
      { $match: { 'members': { $elemMatch: { user: new mongoose.Types.ObjectId(userId), status: 'accepted' } } } },
      { $unwind: '$unreadCount' },
      { $match: { 'unreadCount.user': new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$unreadCount.count' } } }
   ]);
   return result.length > 0 ? result[0].total : 0;
};

const Group = mongoose.model('Group', groupSchema);

export default Group;
