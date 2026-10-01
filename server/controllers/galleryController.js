import Gallery from '../models/Gallery.js';
import { cloudinary, getPublicIdFromUrl } from '../config/cloudinary.js';

// Get all galleries (for client - only active)
export const getAllGalleries = async (req, res) => {
   try {
      const galleries = await Gallery.find({ isActive: true })
         .sort({ createdAt: -1 })
         .populate('createdBy', 'name profilePicture');

      res.json(galleries);
   } catch (error) {
      console.error('Error fetching galleries:', error);
      res.status(500).json({ message: 'Error fetching galleries' });
   }
};

// Get single gallery by ID
export const getGalleryById = async (req, res) => {
   try {
      const gallery = await Gallery.findById(req.params.id)
         .populate('createdBy', 'name profilePicture');

      if (!gallery) {
         return res.status(404).json({ message: 'Gallery not found' });
      }

      res.json(gallery);
   } catch (error) {
      console.error('Error fetching gallery:', error);
      res.status(500).json({ message: 'Error fetching gallery' });
   }
};

// Admin: Get all galleries (including inactive)
export const adminGetAllGalleries = async (req, res) => {
   try {
      const galleries = await Gallery.find()
         .sort({ createdAt: -1 })
         .populate('createdBy', 'name profilePicture email');

      res.json(galleries);
   } catch (error) {
      console.error('Error fetching galleries:', error);
      res.status(500).json({ message: 'Error fetching galleries' });
   }
};

// Admin: Create new gallery
export const createGallery = async (req, res) => {
   try {
      const { title, description, category } = req.body;

      if (!title) {
         return res.status(400).json({ message: 'Title is required' });
      }

      if (!req.files || req.files.length === 0) {
         return res.status(400).json({ message: 'At least one photo is required' });
      }

      // Process uploaded files
      const photos = req.files.map((file, index) => ({
         url: file.path,
         publicId: file.filename,
         caption: req.body[`caption_${index}`] || ''
      }));

      const gallery = new Gallery({
         title,
         description,
         category: category || 'other',
         photos,
         coverImage: photos[0]?.url || '',
         createdBy: req.admin?.id || null
      });

      await gallery.save();

      res.status(201).json({ message: 'Gallery created successfully', gallery });
   } catch (error) {
      console.error('Error creating gallery:', error);
      res.status(500).json({ message: 'Error creating gallery' });
   }
};

// Admin: Update gallery
export const updateGallery = async (req, res) => {
   try {
      const { title, description, category, isActive, existingPhotos } = req.body;

      const gallery = await Gallery.findById(req.params.id);

      if (!gallery) {
         return res.status(404).json({ message: 'Gallery not found' });
      }

      // Update basic fields
      if (title) gallery.title = title;
      if (description !== undefined) gallery.description = description;
      if (category) gallery.category = category;
      if (isActive !== undefined) gallery.isActive = isActive === 'true' || isActive === true;

      // Handle existing photos (keep selected ones)
      let updatedPhotos = [];
      if (existingPhotos) {
         const keepPhotos = JSON.parse(existingPhotos);
         updatedPhotos = gallery.photos.filter(photo => keepPhotos.includes(photo.url));

         // Delete removed photos from Cloudinary
         const removedPhotos = gallery.photos.filter(photo => !keepPhotos.includes(photo.url));
         for (const photo of removedPhotos) {
            if (photo.publicId) {
               try {
                  await cloudinary.uploader.destroy(photo.publicId);
               } catch (err) {
                  console.error('Error deleting photo from Cloudinary:', err);
               }
            }
         }
      } else {
         updatedPhotos = gallery.photos;
      }

      // Add new uploaded photos
      if (req.files && req.files.length > 0) {
         const newPhotos = req.files.map((file, index) => ({
            url: file.path,
            publicId: file.filename,
            caption: req.body[`caption_${index}`] || ''
         }));
         updatedPhotos = [...updatedPhotos, ...newPhotos];
      }

      gallery.photos = updatedPhotos;

      // Update cover image if needed
      if (updatedPhotos.length > 0 && !updatedPhotos.find(p => p.url === gallery.coverImage)) {
         gallery.coverImage = updatedPhotos[0].url;
      }

      await gallery.save();

      res.json({ message: 'Gallery updated successfully', gallery });
   } catch (error) {
      console.error('Error updating gallery:', error);
      res.status(500).json({ message: 'Error updating gallery' });
   }
};

// Admin: Delete gallery
export const deleteGallery = async (req, res) => {
   try {
      const gallery = await Gallery.findById(req.params.id);

      if (!gallery) {
         return res.status(404).json({ message: 'Gallery not found' });
      }

      // Delete all photos from Cloudinary
      for (const photo of gallery.photos) {
         if (photo.publicId) {
            try {
               await cloudinary.uploader.destroy(photo.publicId);
            } catch (err) {
               console.error('Error deleting photo from Cloudinary:', err);
            }
         }
      }

      await Gallery.findByIdAndDelete(req.params.id);

      res.json({ message: 'Gallery deleted successfully' });
   } catch (error) {
      console.error('Error deleting gallery:', error);
      res.status(500).json({ message: 'Error deleting gallery' });
   }
};

// Admin: Toggle gallery active status
export const toggleGalleryStatus = async (req, res) => {
   try {
      const gallery = await Gallery.findById(req.params.id);

      if (!gallery) {
         return res.status(404).json({ message: 'Gallery not found' });
      }

      gallery.isActive = !gallery.isActive;
      await gallery.save();

      res.json({ message: `Gallery ${gallery.isActive ? 'activated' : 'deactivated'} successfully`, gallery });
   } catch (error) {
      console.error('Error toggling gallery status:', error);
      res.status(500).json({ message: 'Error toggling gallery status' });
   }
};

// Admin: Add photos to existing gallery
export const addPhotosToGallery = async (req, res) => {
   try {
      const gallery = await Gallery.findById(req.params.id);

      if (!gallery) {
         return res.status(404).json({ message: 'Gallery not found' });
      }

      if (!req.files || req.files.length === 0) {
         return res.status(400).json({ message: 'No photos provided' });
      }

      const newPhotos = req.files.map((file, index) => ({
         url: file.path,
         publicId: file.filename,
         caption: req.body[`caption_${index}`] || ''
      }));

      gallery.photos.push(...newPhotos);
      await gallery.save();

      res.json({ message: 'Photos added successfully', gallery });
   } catch (error) {
      console.error('Error adding photos to gallery:', error);
      res.status(500).json({ message: 'Error adding photos to gallery' });
   }
};
