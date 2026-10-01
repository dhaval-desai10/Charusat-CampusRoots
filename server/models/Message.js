import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
   conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
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
      enum: ['text', 'image', 'file'],
      default: 'text'
   },
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

// Index for fetching messages in a conversation
messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
