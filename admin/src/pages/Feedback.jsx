import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, MessageSquare, Lightbulb, Trash2, Eye, Send, Loader2, Mail, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/feedback';

// Create axios instance for feedback
const feedbackApi = axios.create({
   baseURL: API_BASE_URL
});

// Add token to requests
feedbackApi.interceptors.request.use((config) => {
   const token = localStorage.getItem('adminToken');
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

export default function Feedback() {
   const [feedbackList, setFeedbackList] = useState([]);
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({ totalFeedback: 0, totalSuggestions: 0, unreadSuggestions: 0 });
   const [activeTab, setActiveTab] = useState('all');
   const [selectedItem, setSelectedItem] = useState(null);
   const [showDetails, setShowDetails] = useState(false);
   const [showRespond, setShowRespond] = useState(false);
   const [responseText, setResponseText] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const [deleting, setDeleting] = useState(null);

   useEffect(() => {
      fetchFeedback();
   }, [activeTab]);

   const fetchFeedback = async () => {
      setLoading(true);
      try {
         const params = new URLSearchParams();
         if (activeTab === 'feedback') params.append('type', 'feedback');
         if (activeTab === 'suggestions') params.append('type', 'suggestion');
         if (activeTab === 'unread') {
            params.append('type', 'suggestion');
            params.append('isRead', 'false');
         }

         const response = await feedbackApi.get(`/admin/all?${params}`);
         if (response.data.success) {
            setFeedbackList(response.data.feedback);
            setStats(response.data.stats);
         }
      } catch (error) {
         console.error('Failed to fetch feedback:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleMarkAsRead = async (id) => {
      try {
         await feedbackApi.patch(`/admin/${id}/read`);
         fetchFeedback();
      } catch (error) {
         console.error('Failed to mark as read:', error);
      }
   };

   const handleRespond = async () => {
      if (!responseText.trim()) return;
      
      setSubmitting(true);
      try {
         await feedbackApi.post(`/admin/${selectedItem._id}/respond`, {
            response: responseText
         });
         setShowRespond(false);
         setResponseText('');
         setSelectedItem(null);
         fetchFeedback();
      } catch (error) {
         console.error('Failed to send response:', error);
         alert('Failed to send response');
      } finally {
         setSubmitting(false);
      }
   };

   const handleDelete = async (id) => {
      if (!confirm('Are you sure you want to delete this?')) return;
      
      setDeleting(id);
      try {
         await feedbackApi.delete(`/admin/${id}`);
         fetchFeedback();
         if (showDetails && selectedItem?._id === id) {
            setShowDetails(false);
            setSelectedItem(null);
         }
      } catch (error) {
         console.error('Failed to delete:', error);
         alert('Failed to delete');
      } finally {
         setDeleting(null);
      }
   };

   const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   };

   const renderStars = (rating) => {
      return (
         <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
               <Star
                  key={star}
                  className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
               />
            ))}
         </div>
      );
   };

   const tabs = [
      { id: 'all', label: 'All', count: stats.totalFeedback + stats.totalSuggestions },
      { id: 'feedback', label: 'Reviews', count: stats.totalFeedback, icon: Star },
      { id: 'suggestions', label: 'Suggestions', count: stats.totalSuggestions, icon: Lightbulb },
      { id: 'unread', label: 'Unread', count: stats.unreadSuggestions, icon: Mail }
   ];

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-3xl font-bold text-white">Feedback & Suggestions</h1>
            <p className="text-slate-400 mt-1">View alumni reviews and private suggestions</p>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
               <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                     <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                     <p className="text-2xl font-bold text-white">{stats.totalFeedback}</p>
                     <p className="text-sm text-slate-400">Public Reviews</p>
                  </div>
               </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
               <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                     <Lightbulb className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                     <p className="text-2xl font-bold text-white">{stats.totalSuggestions}</p>
                     <p className="text-sm text-slate-400">Suggestions</p>
                  </div>
               </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
               <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                     <Mail className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                     <p className="text-2xl font-bold text-white">{stats.unreadSuggestions}</p>
                     <p className="text-sm text-slate-400">Unread Suggestions</p>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Tabs */}
         <div className="flex gap-2 border-b border-slate-700 pb-2">
            {tabs.map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                     activeTab === tab.id
                        ? 'bg-amber-500 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
               >
                  {tab.icon && <tab.icon className="w-4 h-4" />}
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                     activeTab === tab.id ? 'bg-white/20' : 'bg-slate-600'
                  }`}>
                     {tab.count}
                  </span>
               </button>
            ))}
         </div>

         {/* Feedback List */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
               {loading ? (
                  <div className="flex items-center justify-center h-64">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  </div>
               ) : feedbackList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                     <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                     <p>No feedback or suggestions yet</p>
                  </div>
               ) : (
                  <div className="divide-y divide-slate-700">
                     {feedbackList.map((item) => (
                        <div
                           key={item._id}
                           className={`p-4 hover:bg-slate-700/30 transition-colors ${
                              item.type === 'suggestion' && !item.isRead ? 'bg-amber-500/5' : ''
                           }`}
                        >
                           <div className="flex items-start gap-4">
                              {/* Avatar */}
                              <img
                                 src={item.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name || 'User')}&background=f59e0b&color=fff`}
                                 alt={item.user?.name}
                                 className="w-10 h-10 rounded-full object-cover"
                              />
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white">{item.user?.name || 'Unknown'}</span>
                                    <Badge className={item.type === 'feedback' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}>
                                       {item.type === 'feedback' ? 'Review' : 'Suggestion'}
                                    </Badge>
                                    {item.type === 'suggestion' && !item.isRead && (
                                       <Badge className="bg-red-500/20 text-red-400">New</Badge>
                                    )}
                                    {item.adminResponse && (
                                       <Badge className="bg-green-500/20 text-green-400">Responded</Badge>
                                    )}
                                 </div>
                                 
                                 <p className="text-xs text-slate-500 mb-2">
                                    {item.user?.email} • Batch {item.user?.batch} • {item.user?.department}
                                 </p>

                                 {item.type === 'feedback' && (
                                    <div className="mb-2">{renderStars(item.rating)}</div>
                                 )}

                                 <p className="text-slate-300 text-sm line-clamp-2">{item.message}</p>

                                 <p className="text-xs text-slate-500 mt-2">{formatDate(item.createdAt)}</p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1">
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                       setSelectedItem(item);
                                       setShowDetails(true);
                                       if (item.type === 'suggestion' && !item.isRead) {
                                          handleMarkAsRead(item._id);
                                       }
                                    }}
                                    className="border-slate-600 text-slate-300 hover:bg-slate-600"
                                 >
                                    <Eye className="w-4 h-4" />
                                 </Button>
                                 {item.type === 'suggestion' && (
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => {
                                          setSelectedItem(item);
                                          setResponseText(item.adminResponse || '');
                                          setShowRespond(true);
                                       }}
                                       className="border-slate-600 text-slate-300 hover:bg-slate-600"
                                    >
                                       <Send className="w-4 h-4" />
                                    </Button>
                                 )}
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(item._id)}
                                    disabled={deleting === item._id}
                                    className="border-red-600 text-red-400 hover:bg-red-600/20"
                                 >
                                    {deleting === item._id ? (
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

         {/* View Details Dialog */}
         <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="max-w-lg bg-slate-800 border-slate-700 text-white">
               {selectedItem && (
                  <>
                     <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                           {selectedItem.type === 'feedback' ? (
                              <>
                                 <Star className="w-5 h-5 text-yellow-400" />
                                 Review
                              </>
                           ) : (
                              <>
                                 <Lightbulb className="w-5 h-5 text-purple-400" />
                                 Suggestion
                              </>
                           )}
                        </DialogTitle>
                     </DialogHeader>
                     
                     <div className="space-y-4">
                        {/* User Info */}
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                           <img
                              src={selectedItem.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedItem.user?.name || 'User')}&background=f59e0b&color=fff`}
                              alt={selectedItem.user?.name}
                              className="w-12 h-12 rounded-full object-cover"
                           />
                           <div>
                              <p className="font-medium text-white">{selectedItem.user?.name}</p>
                              <p className="text-sm text-slate-400">{selectedItem.user?.email}</p>
                              <p className="text-xs text-slate-500">Batch {selectedItem.user?.batch} • {selectedItem.user?.department}</p>
                           </div>
                        </div>

                        {/* Rating */}
                        {selectedItem.type === 'feedback' && (
                           <div className="flex items-center gap-2">
                              <span className="text-slate-400">Rating:</span>
                              {renderStars(selectedItem.rating)}
                              <span className="text-white font-medium">{selectedItem.rating}/5</span>
                           </div>
                        )}

                        {/* Message */}
                        <div>
                           <p className="text-sm text-slate-400 mb-1">Message:</p>
                           <p className="text-slate-200 bg-slate-700/50 p-3 rounded-lg">{selectedItem.message}</p>
                        </div>

                        {/* Admin Response */}
                        {selectedItem.adminResponse && (
                           <div>
                              <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                                 <CheckCircle className="w-4 h-4 text-green-400" />
                                 Your Response:
                              </p>
                              <p className="text-slate-200 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                                 {selectedItem.adminResponse}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                 Responded on {formatDate(selectedItem.respondedAt)}
                              </p>
                           </div>
                        )}

                        <p className="text-xs text-slate-500">
                           Submitted on {formatDate(selectedItem.createdAt)}
                        </p>
                     </div>
                  </>
               )}
            </DialogContent>
         </Dialog>

         {/* Respond Dialog */}
         <Dialog open={showRespond} onOpenChange={setShowRespond}>
            <DialogContent className="max-w-lg bg-slate-800 border-slate-700 text-white">
               <DialogHeader>
                  <DialogTitle>Respond to Suggestion</DialogTitle>
                  <DialogDescription className="text-slate-400">
                     Send a response to this alumni's suggestion.
                  </DialogDescription>
               </DialogHeader>
               
               {selectedItem && (
                  <div className="space-y-4">
                     {/* Original Message */}
                     <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-sm text-slate-400 mb-1">Original suggestion from {selectedItem.user?.name}:</p>
                        <p className="text-slate-200">{selectedItem.message}</p>
                     </div>

                     {/* Response Input */}
                     <div>
                        <Textarea
                           value={responseText}
                           onChange={(e) => setResponseText(e.target.value)}
                           placeholder="Type your response..."
                           className="bg-slate-700/50 border-slate-600 text-white min-h-[120px]"
                        />
                     </div>

                     <div className="flex justify-end gap-2">
                        <Button
                           variant="outline"
                           onClick={() => setShowRespond(false)}
                           className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                           Cancel
                        </Button>
                        <Button
                           onClick={handleRespond}
                           disabled={submitting || !responseText.trim()}
                           className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                           {submitting ? (
                              <>
                                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                 Sending...
                              </>
                           ) : (
                              <>
                                 <Send className="w-4 h-4 mr-2" />
                                 Send Response
                              </>
                           )}
                        </Button>
                     </div>
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
}
