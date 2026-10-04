import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
   Star,
   Send,
   MessageSquare,
   Lightbulb,
   Loader2,
   AlertCircle,
   Trash2,
   ChevronDown,
   User,
   CheckCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const API_URL = 'http://localhost:5000/api';

const Feedback = () => {
   const { user } = useAuth();
   const isAlumni = user?.role === 'alumni';

   // Feedback list state
   const [publicFeedback, setPublicFeedback] = useState([]);
   const [myFeedback, setMyFeedback] = useState([]);
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

   // Form state
   const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'submit' | 'my'
   const [submitType, setSubmitType] = useState('feedback'); // 'feedback' | 'suggestion'
   const [rating, setRating] = useState(0);
   const [hoverRating, setHoverRating] = useState(0);
   const [message, setMessage] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const [submitSuccess, setSubmitSuccess] = useState('');
   const [error, setError] = useState('');
   const [deleting, setDeleting] = useState(null);

   // Fetch public feedback
   const fetchPublicFeedback = useCallback(async () => {
      try {
         const response = await axios.get(`${API_URL}/feedback/public`, {
            withCredentials: true
         });

         if (response.data.success) {
            setPublicFeedback(response.data.feedback);
            setStats(response.data.stats);
         }
      } catch (error) {
         console.error('Error fetching feedback:', error);
      }
   }, []);

   // Fetch my feedback
   const fetchMyFeedback = useCallback(async () => {
      if (!isAlumni) return;
      
      try {
         const response = await axios.get(`${API_URL}/feedback/my`, {
            withCredentials: true
         });

         if (response.data.success) {
            setMyFeedback(response.data.feedback);
         }
      } catch (error) {
         console.error('Error fetching my feedback:', error);
      }
   }, [isAlumni]);

   useEffect(() => {
      const loadData = async () => {
         setLoading(true);
         await fetchPublicFeedback();
         if (isAlumni) {
            await fetchMyFeedback();
         }
         setLoading(false);
      };
      loadData();
   }, [fetchPublicFeedback, fetchMyFeedback, isAlumni]);

   // Submit feedback
   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSubmitSuccess('');

      if (!message.trim()) {
         setError('Please enter your message');
         return;
      }

      if (submitType === 'feedback' && rating === 0) {
         setError('Please select a rating');
         return;
      }

      setSubmitting(true);
      try {
         const response = await axios.post(`${API_URL}/feedback`, {
            type: submitType,
            rating: submitType === 'feedback' ? rating : undefined,
            message: message.trim()
         }, { withCredentials: true });

         if (response.data.success) {
            setSubmitSuccess(response.data.message);
            setMessage('');
            setRating(0);
            fetchPublicFeedback();
            fetchMyFeedback();
            setTimeout(() => setSubmitSuccess(''), 3000);
         }
      } catch (error) {
         setError(error.response?.data?.message || 'Failed to submit. Please try again.');
      } finally {
         setSubmitting(false);
      }
   };

   // Delete my feedback
   const handleDelete = async (id) => {
      if (!confirm('Are you sure you want to delete this?')) return;

      setDeleting(id);
      try {
         await axios.delete(`${API_URL}/feedback/${id}`, { withCredentials: true });
         fetchMyFeedback();
         fetchPublicFeedback();
      } catch (error) {
         console.error('Error deleting feedback:', error);
         alert('Failed to delete');
      } finally {
         setDeleting(null);
      }
   };

   // Format date
   const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric'
      });
   };

   // Render stars
   const renderStars = (value, interactive = false, size = 'sm') => {
      const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-4 h-4';
      return (
         <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
               <button
                  key={star}
                  type={interactive ? 'button' : undefined}
                  disabled={!interactive}
                  onClick={() => interactive && setRating(star)}
                  onMouseEnter={() => interactive && setHoverRating(star)}
                  onMouseLeave={() => interactive && setHoverRating(0)}
                  className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
               >
                  <Star
                     className={`${sizeClass} ${
                        star <= (interactive ? (hoverRating || rating) : value)
                           ? 'fill-yellow-400 text-yellow-400'
                           : 'text-gray-300 dark:text-gray-600'
                     }`}
                  />
               </button>
            ))}
         </div>
      );
   };

   return (
      <>
         <Navbar />
         <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-6 pb-10">
            <div className="max-w-4xl mx-auto px-4">
               {/* Header */}
               <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                     <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                     Alumni Feedback
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                     Share your experience and help us improve CampusRoots
                  </p>
               </div>

               {/* Stats */}
               <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                     <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                           {stats.averageRating || '0.0'}
                        </div>
                        <div className="flex justify-center mt-1">
                           {renderStars(Math.round(parseFloat(stats.averageRating) || 0))}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Average Rating</p>
                     </div>
                     <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden md:block" />
                     <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                           {stats.totalReviews}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Reviews</p>
                     </div>
                  </div>
               </div>

               {/* Tabs */}
               <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <button
                     onClick={() => setActiveTab('reviews')}
                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        activeTab === 'reviews'
                           ? 'bg-blue-600 text-white'
                           : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                     }`}
                  >
                     <Star className="w-4 h-4" />
                     All Reviews
                  </button>
                  {isAlumni && (
                     <>
                        <button
                           onClick={() => setActiveTab('submit')}
                           className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              activeTab === 'submit'
                                 ? 'bg-blue-600 text-white'
                                 : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                           }`}
                        >
                           <Send className="w-4 h-4" />
                           Submit Feedback
                        </button>
                        <button
                           onClick={() => setActiveTab('my')}
                           className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              activeTab === 'my'
                                 ? 'bg-blue-600 text-white'
                                 : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                           }`}
                        >
                           <User className="w-4 h-4" />
                           My Feedback
                        </button>
                     </>
                  )}
               </div>

               {/* Content */}
               {loading ? (
                  <div className="flex justify-center py-10">
                     <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
               ) : (
                  <>
                     {/* All Reviews Tab */}
                     {activeTab === 'reviews' && (
                        <div className="space-y-4">
                           {publicFeedback.length === 0 ? (
                              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                                 <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No reviews yet</h3>
                                 <p className="text-gray-500 dark:text-gray-400">
                                    {isAlumni ? 'Be the first to share your experience!' : 'Check back later for alumni reviews.'}
                                 </p>
                              </div>
                           ) : (
                              publicFeedback.map((item) => (
                                 <div key={item._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
                                    <div className="flex items-start gap-4">
                                       <img
                                          src={item.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name || 'User')}&background=3b82f6&color=fff`}
                                          alt={item.user?.name}
                                          className="w-12 h-12 rounded-full object-cover"
                                       />
                                       <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                             <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">{item.user?.name}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                   Batch {item.user?.batch} • {item.user?.department}
                                                </p>
                                             </div>
                                             <p className="text-sm text-gray-400">{formatDate(item.createdAt)}</p>
                                          </div>
                                          <div className="mt-2">
                                             {renderStars(item.rating)}
                                          </div>
                                          <p className="mt-3 text-gray-700 dark:text-gray-300">{item.message}</p>
                                       </div>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     )}

                     {/* Submit Feedback Tab (Alumni Only) */}
                     {activeTab === 'submit' && isAlumni && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                           {/* Type Selector */}
                           <div className="flex gap-4 mb-6">
                              <button
                                 type="button"
                                 onClick={() => setSubmitType('feedback')}
                                 className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                    submitType === 'feedback'
                                       ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                       : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                 }`}
                              >
                                 <Star className={`w-6 h-6 mx-auto mb-2 ${submitType === 'feedback' ? 'text-blue-600' : 'text-gray-400'}`} />
                                 <h3 className={`font-medium ${submitType === 'feedback' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    Public Review
                                 </h3>
                                 <p className="text-xs text-gray-500 mt-1">Share your experience with everyone</p>
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setSubmitType('suggestion')}
                                 className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                    submitType === 'suggestion'
                                       ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                       : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                 }`}
                              >
                                 <Lightbulb className={`w-6 h-6 mx-auto mb-2 ${submitType === 'suggestion' ? 'text-purple-600' : 'text-gray-400'}`} />
                                 <h3 className={`font-medium ${submitType === 'suggestion' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    Private Suggestion
                                 </h3>
                                 <p className="text-xs text-gray-500 mt-1">Send directly to admin only</p>
                              </button>
                           </div>

                           <form onSubmit={handleSubmit} className="space-y-4">
                              {/* Rating (for feedback only) */}
                              {submitType === 'feedback' && (
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                       Your Rating *
                                    </label>
                                    <div className="flex items-center gap-2">
                                       {renderStars(rating, true, 'lg')}
                                       {rating > 0 && (
                                          <span className="text-lg font-medium text-gray-700 dark:text-gray-300 ml-2">
                                             {rating}/5
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              )}

                              {/* Message */}
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {submitType === 'feedback' ? 'Your Review *' : 'Your Suggestion *'}
                                 </label>
                                 <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={submitType === 'feedback' 
                                       ? 'Share your experience with CampusRoots...'
                                       : 'Share your ideas or suggestions for improvement...'
                                    }
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    maxLength={1000}
                                 />
                                 <p className="text-xs text-gray-500 mt-1 text-right">{message.length}/1000</p>
                              </div>

                              {/* Error/Success Messages */}
                              {error && (
                                 <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                 </div>
                              )}

                              {submitSuccess && (
                                 <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    {submitSuccess}
                                 </div>
                              )}

                              {/* Submit Button */}
                              <button
                                 type="submit"
                                 disabled={submitting}
                                 className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${
                                    submitType === 'feedback'
                                       ? 'bg-blue-600 hover:bg-blue-700'
                                       : 'bg-purple-600 hover:bg-purple-700'
                                 }`}
                              >
                                 {submitting ? (
                                    <>
                                       <Loader2 className="w-5 h-5 animate-spin" />
                                       Submitting...
                                    </>
                                 ) : (
                                    <>
                                       <Send className="w-5 h-5" />
                                       {submitType === 'feedback' ? 'Submit Review' : 'Send Suggestion'}
                                    </>
                                 )}
                              </button>
                           </form>
                        </div>
                     )}

                     {/* My Feedback Tab (Alumni Only) */}
                     {activeTab === 'my' && isAlumni && (
                        <div className="space-y-4">
                           {myFeedback.length === 0 ? (
                              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                                 <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No feedback yet</h3>
                                 <p className="text-gray-500 dark:text-gray-400">
                                    You haven't submitted any feedback or suggestions yet.
                                 </p>
                              </div>
                           ) : (
                              myFeedback.map((item) => (
                                 <div key={item._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
                                    <div className="flex items-start justify-between">
                                       <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.type === 'feedback'
                                                   ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                   : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                             }`}>
                                                {item.type === 'feedback' ? 'Public Review' : 'Private Suggestion'}
                                             </span>
                                             <span className="text-sm text-gray-400">{formatDate(item.createdAt)}</span>
                                          </div>
                                          
                                          {item.type === 'feedback' && (
                                             <div className="mb-2">{renderStars(item.rating)}</div>
                                          )}
                                          
                                          <p className="text-gray-700 dark:text-gray-300">{item.message}</p>

                                          {/* Admin Response */}
                                          {item.adminResponse && (
                                             <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                                                   <CheckCircle className="w-3 h-3" />
                                                   Admin Response
                                                </p>
                                                <p className="text-sm text-green-800 dark:text-green-300">{item.adminResponse}</p>
                                             </div>
                                          )}
                                       </div>
                                       
                                       <button
                                          onClick={() => handleDelete(item._id)}
                                          disabled={deleting === item._id}
                                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                       >
                                          {deleting === item._id ? (
                                             <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                             <Trash2 className="w-4 h-4" />
                                          )}
                                       </button>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     )}
                  </>
               )}

               {/* Info for non-alumni */}
               {!isAlumni && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                     <p className="text-blue-700 dark:text-blue-400 text-sm">
                        Only alumni can submit feedback and suggestions. Browse the reviews to see what our alumni think!
                     </p>
                  </div>
               )}
            </div>
         </div>
      </>
   );
};

export default Feedback;
