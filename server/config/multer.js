import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const postsDir = path.join(uploadsDir, 'posts');

if (!fs.existsSync(uploadsDir)) {
   fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(postsDir)) {
   fs.mkdirSync(postsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, postsDir);
   },
   filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `post-${uniqueSuffix}${ext}`);
   }
});

// File filter
const fileFilter = (req, file, cb) => {
   // Allowed file types
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

// Create multer instance
const upload = multer({
   storage: storage,
   fileFilter: fileFilter,
   limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size
      files: 10 // Maximum 10 files per upload
   }
});

// Helper function to determine media type from mimetype
export const getMediaType = (mimetype) => {
   if (mimetype.startsWith('image/')) return 'image';
   if (mimetype.startsWith('video/')) return 'video';
   if (mimetype === 'application/pdf') return 'pdf';
   return 'document';
};

// Helper function to delete a file
export const deleteFile = (filename) => {
   const filePath = path.join(postsDir, filename);
   if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
   }
};

export default upload;
