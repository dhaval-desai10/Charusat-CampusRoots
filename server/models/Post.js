import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   content: {
      type: String,
      required: true,
      maxlength: 1000
   },
   likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }],
   replies: [{
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true
      },
      content: {
         type: String,
         required: true,
         maxlength: 500
      },
      createdAt: {
         type: Date,
         default: Date.now
      }
   }],
   createdAt: {
      type: Date,
      default: Date.now
   }
});

const mediaSchema = new mongoose.Schema({
   type: {
      type: String,
      enum: ['image', 'video', 'pdf', 'document'],
      required: true
   },
   url: {
      type: String,
      required: true
   },
   publicId: {
      type: String // Cloudinary public_id for deletion
   },
   filename: {
      type: String // For local storage
   },
   originalName: {
      type: String
   },
   size: {
      type: Number
   },
   mimeType: {
      type: String
   }
});

const postSchema = new mongoose.Schema({
   author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   content: {
      type: String,
      maxlength: 5000,
      default: ''
   },
   media: [mediaSchema],
   // Collaboration/Mentions
   mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }],
   isCollaboration: {
      type: Boolean,
      default: false
   },
   collaborators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }],
   // Engagement
   likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }],
   comments: [commentSchema],
   // Visibility
   visibility: {
      type: String,
      enum: ['public', 'connections', 'private'],
      default: 'public'
   },
   // Stats
   viewCount: {
      type: Number,
      default: 0
   },
   shareCount: {
      type: Number,
      default: 0
   },
   // Metadata
   tags: [{
      type: String
   }],
   isEdited: {
      type: Boolean,
      default: false
   },
   editedAt: {
      type: Date
   }
}, {
   timestamps: true
});

// Index for efficient querying
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'likes': 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
   return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
   return this.comments.length;
});

// Method to check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
   return this.likes.some(like => like.toString() === userId.toString());
};

// Static method to get feed posts with random ordering
postSchema.statics.getFeedPosts = async function(userId, page = 1, limit = 10) {
   const skip = (page - 1) * limit;
   
   // Get posts with random factor for shuffling
   const posts = await this.aggregate([
      {
         $match: {
            visibility: { $in: ['public', 'connections'] }
         }
      },
      {
         $addFields: {
            randomSort: { $rand: {} }
         }
      },
      {
         $sort: { randomSort: 1 }
      },
      {
         $skip: skip
      },
      {
         $limit: limit
      }
   ]);

   // Populate the posts
   return await this.populate(posts, [
      { path: 'author', select: 'name profilePicture role currentRole currentCompany batch department' },
      { path: 'mentions', select: 'name profilePicture' },
      { path: 'collaborators', select: 'name profilePicture' },
      { path: 'comments.user', select: 'name profilePicture' },
      { path: 'comments.replies.user', select: 'name profilePicture' }
   ]);
};

const Post = mongoose.model('Post', postSchema);

export default Post;
