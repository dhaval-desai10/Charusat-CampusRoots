import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
   group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true
   },
   sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   content: {
      type: String,
      required: true,
      maxlength: 5000
   },
   messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
   },
   // Track who has read the message
   readBy: [{
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      },
      readAt: {
         type: Date,
         default: Date.now
      }
   }],
   isDeleted: {
      type: Boolean,
      default: false
   }
}, { timestamps: true });

// Index for fetching messages in a group
groupMessageSchema.index({ group: 1, createdAt: -1 });

// Static method to create system message (for join/leave events)
groupMessageSchema.statics.createSystemMessage = async function(groupId, content) {
   return await this.create({
      group: groupId,
      sender: null,
      content,
      messageType: 'system'
   });
};

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);

export default GroupMessage;
