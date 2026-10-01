import Post from '../models/Post.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Notification from '../models/Notification.js';
import { getMediaType, deleteFromCloudinary, getPublicIdFromUrl, getResourceTypeFromUrl } from '../config/cloudinary.js';

// Create a new post
export const createPost = async (req, res) => {
   try {
      const { content, mentions, isCollaboration, collaborators, visibility, tags } = req.body;
      const userId = req.user._id;

      // Check if user has permission to post (only alumni and faculty can post)
      if (req.user.role === 'student') {
         return res.status(403).json({
            success: false,
            message: 'Students are not allowed to create posts. Only alumni and faculty can post.'
         });
      }

      // Process uploaded files from Cloudinary
      const media = [];
      if (req.files && req.files.length > 0) {
         for (const file of req.files) {
            media.push({
               type: getMediaType(file.mimetype),
               url: file.path, // Cloudinary returns full URL in path
               publicId: file.filename, // Cloudinary public_id
               originalName: file.originalname,
               size: file.size,
               mimeType: file.mimetype
            });
         }
      }

      // Parse mentions and collaborators if they're strings
      let parsedMentions = [];
      let parsedCollaborators = [];
      let parsedTags = [];

      if (mentions) {
         parsedMentions = typeof mentions === 'string' ? JSON.parse(mentions) : mentions;
      }
      if (collaborators) {
         parsedCollaborators = typeof collaborators === 'string' ? JSON.parse(collaborators) : collaborators;
      }
      if (tags) {
         parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      }

      const post = await Post.create({
         author: userId,
         content,
         media,
         mentions: parsedMentions,
         isCollaboration: isCollaboration === 'true' || isCollaboration === true,
         collaborators: parsedCollaborators,
         visibility: visibility || 'public',
         tags: parsedTags
      });

      // Populate author info
      await post.populate([
         { path: 'author', select: 'name profilePicture role currentRole currentCompany' },
         { path: 'mentions', select: 'name profilePicture' },
         { path: 'collaborators', select: 'name profilePicture' }
      ]);

      // Create notifications for mentions
      if (parsedMentions.length > 0) {
         for (const mentionedUserId of parsedMentions) {
            if (mentionedUserId.toString() !== userId.toString()) {
               await Notification.create({
                  recipient: mentionedUserId,
                  sender: userId,
                  type: 'mention',
                  title: 'You were mentioned in a post',
                  content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                  reference: post._id,
                  referenceModel: 'Post'
               });
            }
         }
      }

      // Create notifications for collaborators
      if (parsedCollaborators.length > 0) {
         for (const collaboratorId of parsedCollaborators) {
            if (collaboratorId.toString() !== userId.toString()) {
               await Notification.create({
                  recipient: collaboratorId,
                  sender: userId,
                  type: 'collaboration',
                  title: 'You were added as a collaborator',
                  content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                  reference: post._id,
                  referenceModel: 'Post'
               });
            }
         }
      }

      res.status(201).json({
         success: true,
         message: 'Post created successfully',
         post
      });

   } catch (error) {
      console.error('Create post error:', error.message, error.stack);
      res.status(500).json({
         success: false,
         message: 'Failed to create post',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Get feed posts (random order, paginated)
export const getFeedPosts = async (req, res) => {
   try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get user's connections
      const connections = await Connection.find({
         $or: [{ requester: userId }, { recipient: userId }],
         status: 'accepted'
      });

      const connectionIds = connections.map(c => 
         c.requester.toString() === userId.toString() ? c.recipient : c.requester
      );

      // Get posts - public posts from everyone, connections-only from connections
      const posts = await Post.aggregate([
         {
            $match: {
               $or: [
                  { visibility: 'public' },
                  { visibility: 'connections', author: { $in: [...connectionIds, userId] } },
                  { author: userId } // User's own posts
               ]
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

      // Populate posts
      const populatedPosts = await Post.populate(posts, [
         { path: 'author', select: 'name profilePicture role currentRole currentCompany batch department' },
         { path: 'mentions', select: 'name profilePicture' },
         { path: 'collaborators', select: 'name profilePicture' },
         { path: 'comments.user', select: 'name profilePicture' },
         { path: 'comments.replies.user', select: 'name profilePicture' }
      ]);

      // Get total count for pagination
      const totalPosts = await Post.countDocuments({
         $or: [
            { visibility: 'public' },
            { visibility: 'connections', author: { $in: [...connectionIds, userId] } },
            { author: userId }
         ]
      });

      // Add connection status to each post
      const postsWithConnectionStatus = await Promise.all(populatedPosts.map(async (post) => {
         let connectionStatus = 'none';
         if (post.author._id.toString() === userId.toString()) {
            connectionStatus = 'self';
         } else {
            const connection = await Connection.findOne({
               $or: [
                  { requester: userId, recipient: post.author._id },
                  { requester: post.author._id, recipient: userId }
               ]
            });
            if (connection) {
               connectionStatus = connection.status;
            }
         }

         return {
            ...post,
            isLiked: post.likes?.some(like => like.toString() === userId.toString()),
            connectionStatus
         };
      }));

      res.json({
         success: true,
         posts: postsWithConnectionStatus,
         pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
            hasMore: page * limit < totalPosts
         }
      });

   } catch (error) {
      console.error('Get feed posts error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch posts'
      });
   }
};

// Get a single post
export const getPost = async (req, res) => {
   try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId).populate([
         { path: 'author', select: 'name profilePicture role currentRole currentCompany batch department' },
         { path: 'mentions', select: 'name profilePicture' },
         { path: 'collaborators', select: 'name profilePicture' },
         { path: 'comments.user', select: 'name profilePicture' },
         { path: 'comments.replies.user', select: 'name profilePicture' }
      ]);

      if (!post) {
         return res.status(404).json({
            success: false,
            message: 'Post not found'
         });
      }

      // Increment view count
      post.viewCount += 1;
      await post.save();

      // Get connection status
      let connectionStatus = 'none';
      if (post.author._id.toString() === userId.toString()) {
         connectionStatus = 'self';
      } else {
         const connection = await Connection.findOne({
            $or: [
               { requester: userId, recipient: post.author._id },
               { requester: post.author._id, recipient: userId }
            ]
         });
         if (connection) {
            connectionStatus = connection.status;
         }
      }

      res.json({
         success: true,
         post: {
            ...post.toObject(),
            isLiked: post.isLikedBy(userId),
            connectionStatus
         }
      });

   } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch post'
      });
   }
};

// Update a post
export const updatePost = async (req, res) => {
   try {
      const { postId } = req.params;
      const { content, mentions, visibility, tags } = req.body;
      const userId = req.user._id;

      const post = await Post.findById(postId);

      if (!post) {
         return res.status(404).json({
            success: false,
            message: 'Post not found'
         });
      }

      if (post.author.toString() !== userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'You can only edit your own posts'
         });
      }

      // Update fields
      if (content !== undefined) post.content = content;
      if (mentions !== undefined) {
         post.mentions = typeof mentions === 'string' ? JSON.parse(mentions) : mentions;
      }
      if (visibility !== undefined) post.visibility = visibility;
      if (tags !== undefined) {
         post.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      }

      post.isEdited = true;
      post.editedAt = new Date();

      await post.save();
      await post.populate([
         { path: 'author', select: 'name profilePicture role currentRole currentCompany' },
         { path: 'mentions', select: 'name profilePicture' },
         { path: 'collaborators', select: 'name profilePicture' }
      ]);

      res.json({
         success: true,
         message: 'Post updated successfully',
         post
      });

   } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update post'
      });
   }
};

// Delete a post
export const deletePost = async (req, res) => {
   try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);

      if (!post) {
         return res.status(404).json({
            success: false,
            message: 'Post not found'
         });
      }

      if (post.author.toString() !== userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'You can only delete your own posts'
         });
      }

      // Delete associated media files from Cloudinary
      for (const media of post.media) {
         if (media.publicId) {
            const resourceType = media.type === 'video' ? 'video' : (media.type === 'document' ? 'raw' : 'image');
            await deleteFromCloudinary(media.publicId, resourceType).catch(err => console.error('Error deleting media:', err));
         } else if (media.url) {
            // Fallback: extract public_id from URL
            const publicId = getPublicIdFromUrl(media.url);
            const resourceType = getResourceTypeFromUrl(media.url);
            if (publicId) {
               await deleteFromCloudinary(publicId, resourceType).catch(err => console.error('Error deleting media:', err));
            }
         }
      }

      await post.deleteOne();

      res.json({
         success: true,
         message: 'Post deleted successfully'
      });

   } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete post'
      });
   }
};

// Like/Unlike a post
export const toggleLike = async (req, res) => {
   try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);

      if (!post) {
         return res.status(404).json({
            success: false,
            message: 'Post not found'
         });
      }

      const isLiked = post.likes.some(like => like.toString() === userId.toString());

      if (isLiked) {
         // Unlike
         post.likes = post.likes.filter(like => like.toString() !== userId.toString());
      } else {
         // Like
         post.likes.push(userId);

         // Create notification (only for new likes, not for own posts)
         if (post.author.toString() !== userId.toString()) {
            await Notification.create({
               recipient: post.author,
               sender: userId,
               type: 'like',
               title: 'Someone liked your post',
               content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
               reference: post._id,
               referenceModel: 'Post'
            });
         }
      }

      await post.save();

      res.json({
         success: true,
         isLiked: !isLiked,
         likeCount: post.likes.length
      });

   } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to toggle like'
      });
   }
};

// Add a comment
export const addComment = async (req, res) => {
   try {
      const { postId } = req.params;
      const { content } = req.body;
      const userId = req.user._id;

      if (!content || !content.trim()) {
         return res.status(400).json({
            success: false,
            message: 'Comment content is required'
         });
      }

      const post = await Post.findById(postId);

      if (!post) {
         return res.status(404).json({
            success: false,
            message: 'Post not found'
         });
      }

      const comment = {
         user: userId,
         content: content.trim(),
         createdAt: new Date()
      };

      post.comments.push(comment);
      await post.save();

      // Populate the new comment's user
      await post.populate('comments.user', 'name profilePicture');

      const newComment = post.comments[post.comments.length - 1];

      // Create notification (only if not commenting on own post)
      if (post.author.toString() !== userId.toString()) {
         await Notification.create({
            recipient: post.author,
            sender: userId,
            type: 'comment',
            title: 'Someone commented on your post',
            content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            reference: post._id,
            referenceModel: 'Post'
         });
      }

      res.status(201).json({
         success: true,
         message: 'Comment added successfully',
         comment: newComment
      });

   } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to add comment'
      });
   }
};

// Delete a comment
export const deleteComment = async (req, res) => {
   try {
      const { postId, commentId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);

      if (!post) {
         return res.status(404).json({
            success: false,
            message: 'Post not found'
         });
      }

      const comment = post.comments.id(commentId);

      if (!comment) {
         return res.status(404).json({
            success: false,
            message: 'Comment not found'
         });
      }

      // Only comment author or post author can delete
      if (comment.user.toString() !== userId.toString() && post.author.toString() !== userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'You cannot delete this comment'
         });
      }

      post.comments.pull(commentId);
      await post.save();

      res.json({
         success: true,
         message: 'Comment deleted successfully'
      });

   } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete comment'
      });
   }
};

// Get user's posts
export const getUserPosts = async (req, res) => {
   try {
      const { userId } = req.params;
      const viewerId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Check if viewing own posts or someone else's
      const isOwnProfile = userId === viewerId.toString();

      // Check connection status for visibility
      let canViewConnectionsPosts = isOwnProfile;
      if (!isOwnProfile) {
         const connection = await Connection.findOne({
            $or: [
               { requester: viewerId, recipient: userId },
               { requester: userId, recipient: viewerId }
            ],
            status: 'accepted'
         });
         canViewConnectionsPosts = !!connection;
      }

      // Build query
      const query = { author: userId };
      if (!isOwnProfile) {
         if (canViewConnectionsPosts) {
            query.visibility = { $in: ['public', 'connections'] };
         } else {
            query.visibility = 'public';
         }
      }

      const posts = await Post.find(query)
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(limit)
         .populate([
            { path: 'author', select: 'name profilePicture role currentRole currentCompany' },
            { path: 'mentions', select: 'name profilePicture' },
            { path: 'collaborators', select: 'name profilePicture' },
            { path: 'comments.user', select: 'name profilePicture' }
         ]);

      const totalPosts = await Post.countDocuments(query);

      // Add isLiked status
      const postsWithLikeStatus = posts.map(post => ({
         ...post.toObject(),
         isLiked: post.isLikedBy(viewerId)
      }));

      res.json({
         success: true,
         posts: postsWithLikeStatus,
         pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
            hasMore: page * limit < totalPosts
         }
      });

   } catch (error) {
      console.error('Get user posts error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch user posts'
      });
   }
};

// Search users for mentions
export const searchUsersForMention = async (req, res) => {
   try {
      const { query } = req.query;
      const userId = req.user._id;

      if (!query || query.length < 2) {
         return res.json({
            success: true,
            users: []
         });
      }

      // Search users by name
      const users = await User.find({
         _id: { $ne: userId },
         name: { $regex: query, $options: 'i' },
         isProfileComplete: true
      })
         .select('name profilePicture role currentCompany')
         .limit(10);

      res.json({
         success: true,
         users
      });

   } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to search users'
      });
   }
};
