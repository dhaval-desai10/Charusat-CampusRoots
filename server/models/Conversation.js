import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
   participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   }],
   lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
   },
   lastMessageAt: {
      type: Date,
      default: Date.now
   },
   // Track unread count per participant
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

// Ensure unique conversation between two participants
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Static method to get or create conversation between two users
conversationSchema.statics.getOrCreateConversation = async function(userId1, userId2) {
   // Sort user IDs to ensure consistent lookup
   const participants = [userId1, userId2].sort();
   
   let conversation = await this.findOne({
      participants: { $all: participants, $size: 2 }
   });

   if (!conversation) {
      conversation = await this.create({
         participants,
         unreadCount: [
            { user: userId1, count: 0 },
            { user: userId2, count: 0 }
         ]
      });
   }

   return conversation;
};

// Static method to increment unread count for a user
conversationSchema.statics.incrementUnreadCount = async function(conversationId, userId) {
   await this.findOneAndUpdate(
      { _id: conversationId, 'unreadCount.user': userId },
      { $inc: { 'unreadCount.$.count': 1 } }
   );
};

// Static method to reset unread count for a user
conversationSchema.statics.resetUnreadCount = async function(conversationId, userId) {
   await this.findOneAndUpdate(
      { _id: conversationId, 'unreadCount.user': userId },
      { $set: { 'unreadCount.$.count': 0 } }
   );
};

// Static method to get total unread count for a user across all conversations
conversationSchema.statics.getTotalUnreadCount = async function(userId) {
   const result = await this.aggregate([
      { $unwind: '$unreadCount' },
      { $match: { 'unreadCount.user': new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$unreadCount.count' } } }
   ]);
   return result.length > 0 ? result[0].total : 0;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
