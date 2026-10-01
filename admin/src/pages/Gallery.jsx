import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Eye, EyeOff, Image, Loader2, X, Edit, Upload, FolderOpen, GraduationCap, PartyPopper, MoreHorizontal } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/gallery';

// Category configuration
const CATEGORIES = [
   { id: 'all', label: 'All Galleries', icon: FolderOpen },
   { id: 'convocation', label: 'Convocation', icon: GraduationCap },
   { id: 'spoural', label: 'Spoural', icon: PartyPopper },
   { id: 'other', label: 'Other', icon: MoreHorizontal }
];

const getCategoryColor = (category) => {
   switch(category) {
      case 'convocation': return 'bg-blue-500';
      case 'spoural': return 'bg-purple-500';
      case 'other': return 'bg-slate-500';
      default: return 'bg-slate-500';
   }
};

// Create axios instance for gallery
const galleryApi = axios.create({
   baseURL: API_BASE_URL
});

// Add token to requests
galleryApi.interceptors.request.use((config) => {
   const token = localStorage.getItem('adminToken');
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

export default function Gallery() {
   const [galleries, setGalleries] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedGallery, setSelectedGallery] = useState(null);
   const [showDetails, setShowDetails] = useState(false);
   const [showCreate, setShowCreate] = useState(false);
   const [showEdit, setShowEdit] = useState(false);
   const [deleting, setDeleting] = useState(null);
   const [toggling, setToggling] = useState(null);
   const [submitting, setSubmitting] = useState(false);
   const [activeCategory, setActiveCategory] = useState('all');
   
   // Form state
   const [formData, setFormData] = useState({
      title: '',
      description: '',
      category: 'other'
   });
   const [selectedFiles, setSelectedFiles] = useState([]);
   const [previewUrls, setPreviewUrls] = useState([]);
   const [existingPhotos, setExistingPhotos] = useState([]);

   useEffect(() => {
      fetchGalleries();
   }, []);

   const fetchGalleries = async () => {
      setLoading(true);
      try {
         const response = await galleryApi.get('/admin/all');
         setGalleries(response.data);
      } catch (error) {
         console.error('Failed to fetch galleries:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      
      // Generate preview URLs
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
   };

   const removeFile = (index) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
      URL.revokeObjectURL(previewUrls[index]);
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
   };

   const removeExistingPhoto = (url) => {
      setExistingPhotos(prev => prev.filter(p => p !== url));
   };

   const resetForm = () => {
      setFormData({ title: '', description: '', category: 'other' });
      setSelectedFiles([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setExistingPhotos([]);
   };

   const handleCreate = async (e) => {
      e.preventDefault();
      if (!formData.title.trim()) {
         alert('Title is required');
         return;
      }
      if (selectedFiles.length === 0) {
         alert('Please add at least one photo');
         return;
      }

      setSubmitting(true);
      try {
         const formDataToSend = new FormData();
         formDataToSend.append('title', formData.title);
         formDataToSend.append('description', formData.description);
         formDataToSend.append('category', formData.category);
         
         selectedFiles.forEach(file => {
            formDataToSend.append('photos', file);
         });

         await galleryApi.post('/admin/create', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
         });

         setShowCreate(false);
         resetForm();
         fetchGalleries();
      } catch (error) {
         console.error('Failed to create gallery:', error);
         alert('Failed to create gallery');
      } finally {
         setSubmitting(false);
      }
   };

   const handleEdit = async (e) => {
      e.preventDefault();
      if (!formData.title.trim()) {
         alert('Title is required');
         return;
      }

      setSubmitting(true);
      try {
         const formDataToSend = new FormData();
         formDataToSend.append('title', formData.title);
         formDataToSend.append('description', formData.description);
         formDataToSend.append('category', formData.category);
         formDataToSend.append('existingPhotos', JSON.stringify(existingPhotos));
         
         selectedFiles.forEach(file => {
            formDataToSend.append('photos', file);
         });

         await galleryApi.put(`/admin/${selectedGallery._id}`, formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
         });

         setShowEdit(false);
         resetForm();
         setSelectedGallery(null);
         fetchGalleries();
      } catch (error) {
         console.error('Failed to update gallery:', error);
         alert('Failed to update gallery');
      } finally {
         setSubmitting(false);
      }
   };

   const openEditDialog = (gallery) => {
      setSelectedGallery(gallery);
      setFormData({
         title: gallery.title,
         description: gallery.description || '',
         category: gallery.category || 'other'
      });
      setExistingPhotos(gallery.photos.map(p => p.url));
      setShowEdit(true);
   };

   const deleteGallery = async (id) => {
      if (!confirm('Are you sure you want to delete this gallery? All photos will be permanently removed.')) return;
      
      setDeleting(id);
      try {
         await galleryApi.delete(`/admin/${id}`);
         fetchGalleries();
         if (showDetails && selectedGallery?._id === id) {
            setShowDetails(false);
            setSelectedGallery(null);
         }
      } catch (error) {
         console.error('Failed to delete gallery:', error);
         alert('Failed to delete gallery');
      } finally {
         setDeleting(null);
      }
   };

   const toggleStatus = async (id) => {
      setToggling(id);
      try {
         await galleryApi.patch(`/admin/${id}/toggle`);
         fetchGalleries();
      } catch (error) {
         console.error('Failed to toggle gallery status:', error);
         alert('Failed to toggle status');
      } finally {
         setToggling(null);
      }
   };

   const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric'
      });
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-3xl font-bold text-white">Gallery Management</h1>
               <p className="text-slate-400 mt-1">Create and manage photo galleries</p>
            </div>
            <Button 
               onClick={() => setShowCreate(true)}
               className="bg-amber-500 hover:bg-amber-600 text-white"
            >
               <Plus className="w-4 h-4 mr-2" /> New Gallery
            </Button>
         </div>

         {/* Category Tabs */}
         <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
               const Icon = cat.icon;
               const count = cat.id === 'all' 
                  ? galleries.length 
                  : galleries.filter(g => g.category === cat.id).length;
               return (
                  <Button
                     key={cat.id}
                     variant={activeCategory === cat.id ? 'default' : 'outline'}
                     onClick={() => setActiveCategory(cat.id)}
                     className={activeCategory === cat.id 
                        ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                        : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                     }
                  >
                     <Icon className="w-4 h-4 mr-2" />
                     {cat.label}
                     <Badge className="ml-2 bg-slate-600 text-white">{count}</Badge>
                  </Button>
               );
            })}
         </div>

         {/* Galleries Grid */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
               <CardTitle className="text-white">
                  {activeCategory === 'all' ? 'All Galleries' : CATEGORIES.find(c => c.id === activeCategory)?.label} ({
                     activeCategory === 'all' 
                        ? galleries.length 
                        : galleries.filter(g => g.category === activeCategory).length
                  })
               </CardTitle>
            </CardHeader>
            <CardContent>
               {loading ? (
                  <div className="flex items-center justify-center h-64">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  </div>
               ) : galleries.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                     <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                     <p>No galleries yet. Create your first gallery!</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {galleries
                        .filter(g => activeCategory === 'all' || g.category === activeCategory)
                        .map((gallery) => (
                        <div
                           key={gallery._id}
                           className="bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600 hover:border-slate-500 transition-colors"
                        >
                           {/* Cover Image */}
                           <div className="aspect-video bg-slate-800 relative overflow-hidden">
                              {gallery.coverImage ? (
                                 <img
                                    src={gallery.coverImage}
                                    alt={gallery.title}
                                    className="w-full h-full object-cover"
                                 />
                              ) : gallery.photos?.[0]?.url ? (
                                 <img
                                    src={gallery.photos[0].url}
                                    alt={gallery.title}
                                    className="w-full h-full object-cover"
                                 />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center">
                                    <Image className="w-12 h-12 text-slate-600" />
                                 </div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-1">
                                 <Badge className={getCategoryColor(gallery.category)}>
                                    {gallery.category?.charAt(0).toUpperCase() + gallery.category?.slice(1) || 'Other'}
                                 </Badge>
                                 <Badge className={gallery.isActive ? 'bg-green-500/80' : 'bg-red-500/80'}>
                                    {gallery.isActive ? 'Active' : 'Hidden'}
                                 </Badge>
                              </div>
                              <div className="absolute bottom-2 left-2">
                                 <Badge className="bg-black/60">
                                    {gallery.photos?.length || 0} photos
                                 </Badge>
                              </div>
                           </div>

                           {/* Gallery Info */}
                           <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-1 truncate">{gallery.title}</h3>
                              {gallery.description && (
                                 <p className="text-slate-400 text-sm line-clamp-2 mb-3">{gallery.description}</p>
                              )}
                              <p className="text-xs text-slate-500 mb-4">Created {formatDate(gallery.createdAt)}</p>

                              {/* Actions */}
                              <div className="flex gap-2">
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                       setSelectedGallery(gallery);
                                       setShowDetails(true);
                                    }}
                                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-600"
                                 >
                                    <Eye className="w-4 h-4 mr-1" /> View
                                 </Button>
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(gallery)}
                                    className="border-slate-600 text-slate-300 hover:bg-slate-600"
                                 >
                                    <Edit className="w-4 h-4" />
                                 </Button>
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleStatus(gallery._id)}
                                    disabled={toggling === gallery._id}
                                    className="border-slate-600 text-slate-300 hover:bg-slate-600"
                                 >
                                    {toggling === gallery._id ? (
                                       <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : gallery.isActive ? (
                                       <EyeOff className="w-4 h-4" />
                                    ) : (
                                       <Eye className="w-4 h-4" />
                                    )}
                                 </Button>
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteGallery(gallery._id)}
                                    disabled={deleting === gallery._id}
                                    className="border-red-600 text-red-400 hover:bg-red-600/20"
                                 >
                                    {deleting === gallery._id ? (
                                       <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                       <Trash2 className="w-4 h-4" />
                                    )}
                                 </Button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </CardContent>
         </Card>

         {/* Create Gallery Dialog */}
         <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetForm(); }}>
            <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="text-xl">Create New Gallery</DialogTitle>
                  <DialogDescription className="text-slate-400">
                     Add a new photo gallery with title, description, and images.
                  </DialogDescription>
               </DialogHeader>
               
               <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                     <Label htmlFor="title">Title *</Label>
                     <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter gallery title"
                        className="bg-slate-700/50 border-slate-600 text-white mt-1"
                        required
                     />
                  </div>

                  <div>
                     <Label htmlFor="description">Description</Label>
                     <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter gallery description (optional)"
                        className="bg-slate-700/50 border-slate-600 text-white mt-1"
                        rows={3}
                     />
                  </div>

                  <div>
                     <Label htmlFor="category">Category *</Label>
                     <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full mt-1 bg-slate-700/50 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                     >
                        <option value="convocation">Convocation</option>
                        <option value="spoural">Spoural</option>
                        <option value="other">Other</option>
                     </select>
                  </div>

                  <div>
                     <Label>Photos *</Label>
                     <div className="mt-1 border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-slate-400 mb-2">Drag & drop photos or click to browse</p>
                        <Input
                           type="file"
                           accept="image/*"
                           multiple
                           onChange={handleFileChange}
                           className="hidden"
                           id="photos"
                        />
                        <Label htmlFor="photos" className="cursor-pointer">
                           <span className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md">
                              Select Photos
                           </span>
                        </Label>
                     </div>
                     
                     {/* Preview Grid */}
                     {previewUrls.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                           {previewUrls.map((url, index) => (
                              <div key={index} className="relative aspect-square">
                                 <img
                                    src={url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                 />
                                 <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                 >
                                    <X className="w-3 h-3" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                     <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setShowCreate(false); resetForm(); }}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                     >
                        Cancel
                     </Button>
                     <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                     >
                        {submitting ? (
                           <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                           </>
                        ) : (
                           'Create Gallery'
                        )}
                     </Button>
                  </div>
               </form>
            </DialogContent>
         </Dialog>

         {/* Edit Gallery Dialog */}
         <Dialog open={showEdit} onOpenChange={(open) => { setShowEdit(open); if (!open) resetForm(); }}>
            <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="text-xl">Edit Gallery</DialogTitle>
                  <DialogDescription className="text-slate-400">
                     Update gallery details and manage photos.
                  </DialogDescription>
               </DialogHeader>
               
               <form onSubmit={handleEdit} className="space-y-4">
                  <div>
                     <Label htmlFor="edit-title">Title *</Label>
                     <Input
                        id="edit-title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter gallery title"
                        className="bg-slate-700/50 border-slate-600 text-white mt-1"
                        required
                     />
                  </div>

                  <div>
                     <Label htmlFor="edit-description">Description</Label>
                     <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter gallery description (optional)"
                        className="bg-slate-700/50 border-slate-600 text-white mt-1"
                        rows={3}
                     />
                  </div>

                  <div>
                     <Label htmlFor="edit-category">Category *</Label>
                     <select
                        id="edit-category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full mt-1 bg-slate-700/50 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                     >
                        <option value="convocation">Convocation</option>
                        <option value="spoural">Spoural</option>
                        <option value="other">Other</option>
                     </select>
                  </div>

                  {/* Existing Photos */}
                  {existingPhotos.length > 0 && (
                     <div>
                        <Label>Current Photos</Label>
                        <div className="mt-2 grid grid-cols-4 gap-2">
                           {existingPhotos.map((url, index) => (
                              <div key={index} className="relative aspect-square">
                                 <img
                                    src={url}
                                    alt={`Photo ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                 />
                                 <button
                                    type="button"
                                    onClick={() => removeExistingPhoto(url)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                 >
                                    <X className="w-3 h-3" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  <div>
                     <Label>Add More Photos</Label>
                     <div className="mt-1 border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-slate-400 mb-2">Drag & drop photos or click to browse</p>
                        <Input
                           type="file"
                           accept="image/*"
                           multiple
                           onChange={handleFileChange}
                           className="hidden"
                           id="edit-photos"
                        />
                        <Label htmlFor="edit-photos" className="cursor-pointer">
                           <span className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md">
                              Select Photos
                           </span>
                        </Label>
                     </div>
                     
                     {/* New Photos Preview */}
                     {previewUrls.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                           {previewUrls.map((url, index) => (
                              <div key={index} className="relative aspect-square">
                                 <img
                                    src={url}
                                    alt={`New ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg border-2 border-green-500"
                                 />
                                 <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                 >
                                    <X className="w-3 h-3" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                     <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setShowEdit(false); resetForm(); }}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                     >
                        Cancel
                     </Button>
                     <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                     >
                        {submitting ? (
                           <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                           </>
                        ) : (
                           'Save Changes'
                        )}
                     </Button>
                  </div>
               </form>
            </DialogContent>
         </Dialog>

         {/* View Gallery Dialog */}
         <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
               {selectedGallery && (
                  <>
                     <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                           {selectedGallery.title}
                           <Badge className={getCategoryColor(selectedGallery.category)}>
                              {selectedGallery.category?.charAt(0).toUpperCase() + selectedGallery.category?.slice(1) || 'Other'}
                           </Badge>
                           <Badge className={selectedGallery.isActive ? 'bg-green-500' : 'bg-red-500'}>
                              {selectedGallery.isActive ? 'Active' : 'Hidden'}
                           </Badge>
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                           {selectedGallery.description || 'No description'}
                        </DialogDescription>
                     </DialogHeader>
                     
                     <div className="space-y-4">
                        <div className="text-sm text-slate-400">
                           Category: {selectedGallery.category?.charAt(0).toUpperCase() + selectedGallery.category?.slice(1) || 'Other'} • Created: {formatDate(selectedGallery.createdAt)} • {selectedGallery.photos?.length || 0} photos
                        </div>
                        
                        {/* Photo Grid */}
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                           {selectedGallery.photos?.map((photo, index) => (
                              <div key={index} className="relative aspect-square group">
                                 <img
                                    src={photo.url}
                                    alt={photo.caption || `Photo ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                 />
                                 {photo.caption && (
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 rounded-lg">
                                       <p className="text-white text-xs">{photo.caption}</p>
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                     </div>
                  </>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
}
