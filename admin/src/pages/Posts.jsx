import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Trash2, ChevronLeft, ChevronRight, Heart, MessageCircle, Image, Loader2, Calendar } from 'lucide-react';
import api from '@/lib/api';

export default function Posts() {
   const [posts, setPosts] = useState([]);
   const [loading, setLoading] = useState(true);
   const [pagination, setPagination] = useState({ current: 1, total: 1, totalPosts: 0 });
   const [search, setSearch] = useState('');
   const [selectedPost, setSelectedPost] = useState(null);
   const [showDetails, setShowDetails] = useState(false);
   const [deleting, setDeleting] = useState(null);

   useEffect(() => {
      fetchPosts();
   }, [pagination.current]);

   const fetchPosts = async () => {
      setLoading(true);
      try {
         const params = new URLSearchParams({
            page: pagination.current.toString(),
            limit: '20'
         });
         if (search) params.append('search', search);

         const response = await api.get(`/posts?${params}`);
         if (response.data.success) {
            setPosts(response.data.posts);
            setPagination(response.data.pagination);
         }
      } catch (error) {
         console.error('Failed to fetch posts:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleSearch = (e) => {
      e.preventDefault();
      setPagination(prev => ({ ...prev, current: 1 }));
      fetchPosts();
   };

   const deletePost = async (postId) => {
      if (!confirm('Are you sure you want to delete this post?')) return;
      
      setDeleting(postId);
      try {
         const response = await api.delete(`/posts/${postId}`);
         if (response.data.success) {
            fetchPosts();
            if (showDetails && selectedPost?._id === postId) {
               setShowDetails(false);
               setSelectedPost(null);
            }
         }
      } catch (error) {
         console.error('Failed to delete post:', error);
         alert('Failed to delete post');
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

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-3xl font-bold text-white">Posts Management</h1>
            <p className="text-slate-400 mt-1">View and moderate all user posts</p>
         </div>

         {/* Search */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
               <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="flex-1 relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search posts by content..."
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                     />
                  </div>
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">
                     <Search className="w-4 h-4 mr-2" /> Search
                  </Button>
               </form>
            </CardContent>
         </Card>

         {/* Posts Grid */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
               <CardTitle className="text-white">
                  Posts ({pagination.totalPosts})
               </CardTitle>
            </CardHeader>
            <CardContent>
               {loading ? (
                  <div className="flex items-center justify-center h-64">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  </div>
               ) : (
                  <>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {posts.map((post) => (
                           <div
                              key={post._id}
                              className="bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600 hover:border-slate-500 transition-colors"
                           >
                              {/* Post Images */}
                              {post.media?.length > 0 && (
                                 <div className={`${post.media.length === 1 ? 'aspect-video' : 'grid grid-cols-2 gap-0.5'} bg-slate-800 overflow-hidden`}>
                                    {post.media.slice(0, 4).map((item, idx) => (
                                       <div key={idx} className={`relative ${post.media.length === 1 ? 'w-full h-full' : 'aspect-square'} overflow-hidden`}>
                                          {item.type === 'image' ? (
                                             <img
                                                src={item.url}
                                                alt={`Post media ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                             />
                                          ) : item.type === 'video' ? (
                                             <video
                                                src={item.url}
                                                className="w-full h-full object-cover"
                                             />
                                          ) : (
                                             <div className="w-full h-full flex items-center justify-center bg-slate-700">
                                                <span className="text-xs text-slate-400">{item.type}</span>
                                             </div>
                                          )}
                                          {idx === 3 && post.media.length > 4 && (
                                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <span className="text-white font-semibold">+{post.media.length - 4}</span>
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {/* Post Content */}
                              <div className="p-4">
                                 {/* Author */}
                                 <div className="flex items-center gap-3 mb-3">
                                    <img
                                       src={post.author?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'User')}&background=f59e0b&color=fff`}
                                       alt={post.author?.name}
                                       className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                       <p className="text-sm font-medium text-white truncate">{post.author?.name || 'Unknown'}</p>
                                       <p className="text-xs text-slate-400">{post.author?.batch || 'No batch'}</p>
                                    </div>
                                 </div>

                                 {/* Content Preview */}
                                 <p className="text-slate-300 text-sm line-clamp-3 mb-3">
                                    {post.content}
                                 </p>

                                 {/* Stats */}
                                 <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                                    <span className="flex items-center gap-1">
                                       <Heart className="w-3 h-3" /> {post.likes?.length || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                       <MessageCircle className="w-3 h-3" /> {post.comments?.length || 0}
                                    </span>
                                    {post.media?.length > 0 && (
                                       <span className="flex items-center gap-1">
                                          <Image className="w-3 h-3" /> {post.media.length} Media
                                       </span>
                                    )}
                                 </div>

                                 {/* Date */}
                                 <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(post.createdAt)}
                                 </p>

                                 {/* Actions */}
                                 <div className="flex gap-2">
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => { setSelectedPost(post); setShowDetails(true); }}
                                       className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-600"
                                    >
                                       View Details
                                    </Button>
                                    <Button
                                       variant="destructive"
                                       size="sm"
                                       onClick={() => deletePost(post._id)}
                                       disabled={deleting === post._id}
                                       className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                                    >
                                       {deleting === post._id ? (
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

                     {posts.length === 0 && (
                        <div className="text-center text-slate-500 py-12">
                           No posts found
                        </div>
                     )}

                     {/* Pagination */}
                     <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
                        <p className="text-sm text-slate-400">
                           Page {pagination.current} of {pagination.total}
                        </p>
                        <div className="flex gap-2">
                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                              disabled={pagination.current <= 1}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                           >
                              <ChevronLeft className="w-4 h-4" />
                           </Button>
                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                              disabled={pagination.current >= pagination.total}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                           >
                              <ChevronRight className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                  </>
               )}
            </CardContent>
         </Card>

         {/* Post Details Dialog */}
         <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="text-xl">Post Details</DialogTitle>
                  <DialogDescription className="text-slate-400">
                     Full post information
                  </DialogDescription>
               </DialogHeader>
               
               {selectedPost && (
                  <div className="space-y-4 mt-4">
                     {/* Author */}
                     <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
                        <img
                           src={selectedPost.author?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPost.author?.name || 'User')}&background=f59e0b&color=fff`}
                           alt={selectedPost.author?.name}
                           className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                           <p className="font-medium">{selectedPost.author?.name || 'Unknown'}</p>
                           <p className="text-sm text-slate-400">{selectedPost.author?.email}</p>
                           <p className="text-xs text-slate-500">
                              {selectedPost.author?.batch} • {selectedPost.author?.department}
                           </p>
                        </div>
                     </div>

                     {/* Media Gallery */}
                     {selectedPost.media?.length > 0 && (
                        <div className={`grid ${selectedPost.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 rounded-lg overflow-hidden`}>
                           {selectedPost.media.map((item, idx) => (
                              <div key={idx} className={`${selectedPost.media.length === 1 ? 'aspect-video' : 'aspect-square'} rounded-lg overflow-hidden bg-slate-900`}>
                                 {item.type === 'image' ? (
                                    <img
                                       src={item.url}
                                       alt={`Media ${idx + 1}`}
                                       className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                       onClick={() => window.open(item.url, '_blank')}
                                    />
                                 ) : item.type === 'video' ? (
                                    <video
                                       src={item.url}
                                       controls
                                       className="w-full h-full object-contain"
                                    />
                                 ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                       <span className="text-slate-400 text-sm">{item.type}</span>
                                       <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-amber-400 text-xs hover:underline">
                                          View File
                                       </a>
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                     )}

                     {/* Content */}
                     <div className="p-4 bg-slate-700/50 rounded-lg">
                        <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                     </div>

                     {/* Stats */}
                     <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                           <Heart className="w-5 h-5 text-red-500" />
                           <span>{selectedPost.likes?.length || 0} likes</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <MessageCircle className="w-5 h-5 text-blue-500" />
                           <span>{selectedPost.comments?.length || 0} comments</span>
                        </div>
                        {selectedPost.media?.length > 0 && (
                           <div className="flex items-center gap-2">
                              <Image className="w-5 h-5 text-amber-500" />
                              <span>{selectedPost.media.length} media</span>
                           </div>
                        )}
                     </div>

                     {/* Metadata */}
                     <div className="text-xs text-slate-500 pt-4 border-t border-slate-700">
                        <p>Post ID: {selectedPost._id}</p>
                        <p>Created: {formatDate(selectedPost.createdAt)}</p>
                        {selectedPost.updatedAt !== selectedPost.createdAt && (
                           <p>Updated: {formatDate(selectedPost.updatedAt)}</p>
                        )}
                     </div>

                     {/* Actions */}
                     <div className="flex gap-2 pt-4">
                        <Button
                           variant="destructive"
                           onClick={() => deletePost(selectedPost._id)}
                           disabled={deleting === selectedPost._id}
                           className="bg-red-500 hover:bg-red-600 text-white"
                        >
                           {deleting === selectedPost._id ? (
                              <>
                                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                 Deleting...
                              </>
                           ) : (
                              <>
                                 <Trash2 className="w-4 h-4 mr-2" />
                                 Delete Post
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
