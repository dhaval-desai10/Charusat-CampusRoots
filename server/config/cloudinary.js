import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage for posts
const postStorage = new CloudinaryStorage({
   cloudinary: cloudinary,
   params: async (req, file) => {
      let folder = 'campusroots/posts';
      let resource_type = 'auto';
      let format;
      
      // Determine resource type and format based on file type
      if (file.mimetype.startsWith('image/')) {
         folder = 'campusroots/posts/images';
         resource_type = 'image';
      } else if (file.mimetype.startsWith('video/')) {
         folder = 'campusroots/posts/videos';
         resource_type = 'video';
      } else {
         folder = 'campusroots/posts/documents';
         resource_type = 'raw';
      }
      
      return {
         folder,
         resource_type,
         allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov', 'pdf', 'doc', 'docx'],
         transformation: file.mimetype.startsWith('image/') ? [{ quality: 'auto:good' }] : undefined
      };
   }
});

// File filter
const fileFilter = (req, file, cb) => {
   const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
   const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
   const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
   
   const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocTypes];
   
   if (allAllowedTypes.includes(file.mimetype)) {
      cb(null, true);
   } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: images, videos, and PDFs.`), false);
   }
};

// Create multer upload instance for posts
const upload = multer({
   storage: postStorage,
   fileFilter: fileFilter,
   limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size (Cloudinary handles large files better)
      files: 10
   }
});

// Configure Cloudinary Storage for profile photos
const profileStorage = new CloudinaryStorage({
   cloudinary: cloudinary,
   params: {
      folder: 'campusroots/profiles',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
         { width: 500, height: 500, crop: 'fill', gravity: 'face' },
         { quality: 'auto:good' }
      ]
   }
});

// Profile photo file filter
const profilePhotoFilter = (req, file, cb) => {
   const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
   if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
   } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for profile photos'), false);
   }
};

// Create multer upload instance for profile photos
export const uploadProfilePhoto = multer({
   storage: profileStorage,
   fileFilter: profilePhotoFilter,
   limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max for profile photos
      files: 1
   }
});

// Configure Cloudinary Storage for gallery photos
const galleryStorage = new CloudinaryStorage({
   cloudinary: cloudinary,
   params: {
      folder: 'campusroots/gallery',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
         { quality: 'auto:good' }
      ]
   }
});

// Gallery photo file filter
const galleryPhotoFilter = (req, file, cb) => {
   const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
   if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
   } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for gallery photos'), false);
   }
};

// Create multer upload instance for gallery photos
export const uploadGalleryPhotos = multer({
   storage: galleryStorage,
   fileFilter: galleryPhotoFilter,
   limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max per gallery photo
      files: 20 // Max 20 photos per upload
   }
});

// Helper function to determine media type from mimetype
export const getMediaType = (mimetype) => {
   if (mimetype.startsWith('image/')) return 'image';
   if (mimetype.startsWith('video/')) return 'video';
   if (mimetype === 'application/pdf') return 'document';
   return 'document';
};

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
   try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return result;
   } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw error;
   }
};

// Helper function to extract public_id from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
   try {
      // URL format: https://res.cloudinary.com/cloud_name/image|video|raw/upload/v123/folder/filename.ext
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return null;
      
      // Get everything after 'upload/v{version}/'
      const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
      // Remove file extension
      const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
      return publicId;
   } catch (error) {
      console.error('Error extracting public_id:', error);
      return null;
   }
};

// Helper function to get resource type from URL
export const getResourceTypeFromUrl = (url) => {
   if (url.includes('/image/')) return 'image';
   if (url.includes('/video/')) return 'video';
   if (url.includes('/raw/')) return 'raw';
   return 'image';
};

export { cloudinary };
export default upload;
