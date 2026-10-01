import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Trash2, UserCog, ChevronLeft, ChevronRight, Mail, Phone, Briefcase, GraduationCap, Globe, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function Users() {
   const [users, setUsers] = useState([]);
   const [filters, setFilters] = useState({ batches: [], departments: [] });
   const [loading, setLoading] = useState(true);
   const [pagination, setPagination] = useState({ current: 1, total: 1, totalUsers: 0 });
   const [search, setSearch] = useState('');
   const [batch, setBatch] = useState('');
   const [selectedUser, setSelectedUser] = useState(null);
   const [userDetails, setUserDetails] = useState(null);
   const [showDetails, setShowDetails] = useState(false);
   const [deleting, setDeleting] = useState(null);

   useEffect(() => {
      fetchUsers();
   }, [pagination.current, batch]);

   const fetchUsers = async () => {
      setLoading(true);
      try {
         const params = new URLSearchParams({
            page: pagination.current.toString(),
            limit: '20'
         });
         if (batch && batch !== 'all') params.append('batch', batch);
         if (search) params.append('search', search);

         const response = await api.get(`/users?${params}`);
         if (response.data.success) {
            setUsers(response.data.users);
            setPagination(response.data.pagination);
            setFilters(response.data.filters);
         }
      } catch (error) {
         console.error('Failed to fetch users:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleSearch = (e) => {
      e.preventDefault();
      setPagination(prev => ({ ...prev, current: 1 }));
      fetchUsers();
   };

   const viewUserDetails = async (userId) => {
      try {
         const response = await api.get(`/users/${userId}`);
         if (response.data.success) {
            setUserDetails(response.data);
            setShowDetails(true);
         }
      } catch (error) {
         console.error('Failed to fetch user details:', error);
      }
   };

   const deleteUser = async (userId) => {
      if (!confirm('Are you sure you want to delete this user? This will also delete all their posts.')) return;
      
      setDeleting(userId);
      try {
         const response = await api.delete(`/users/${userId}`);
         if (response.data.success) {
            fetchUsers();
            if (showDetails && userDetails?.user?._id === userId) {
               setShowDetails(false);
               setUserDetails(null);
            }
         }
      } catch (error) {
         console.error('Failed to delete user:', error);
         alert('Failed to delete user');
      } finally {
         setDeleting(null);
      }
   };

   const getRoleBadgeColor = (role) => {
      switch (role) {
         case 'alumni': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
         case 'student': return 'bg-green-500/20 text-green-400 border-green-500/30';
         case 'faculty': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
         case 'admin': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
         default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      }
   };

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-3xl font-bold text-white">Users Management</h1>
            <p className="text-slate-400 mt-1">View and manage all users regardless of privacy settings</p>
         </div>

         {/* Filters */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
               <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-64">
                     <label className="text-sm text-slate-400 mb-1 block">Search</label>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           placeholder="Search by name or email..."
                           className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                        />
                     </div>
                  </div>
                  <div className="w-48">
                     <label className="text-sm text-slate-400 mb-1 block">Batch</label>
                     <Select value={batch} onValueChange={(v) => { setBatch(v); setPagination(prev => ({ ...prev, current: 1 })); }}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                           <SelectValue placeholder="All batches" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                           <SelectItem value="all" className="text-white focus:bg-slate-700">All batches</SelectItem>
                           {filters.batches.map((b) => (
                              <SelectItem key={b} value={b} className="text-white focus:bg-slate-700">{b}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">
                     <Search className="w-4 h-4 mr-2" /> Search
                  </Button>
               </form>
            </CardContent>
         </Card>

         {/* Users Table */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
               <CardTitle className="text-white">
                  Users ({pagination.totalUsers})
               </CardTitle>
            </CardHeader>
            <CardContent>
               {loading ? (
                  <div className="flex items-center justify-center h-64">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  </div>
               ) : (
                  <>
                     <div className="overflow-x-auto">
                        <Table>
                           <TableHeader>
                              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                                 <TableHead className="text-slate-400">User</TableHead>
                                 <TableHead className="text-slate-400">Email</TableHead>
                                 <TableHead className="text-slate-400">Role</TableHead>
                                 <TableHead className="text-slate-400">Batch</TableHead>
                                 <TableHead className="text-slate-400">Department</TableHead>
                                 <TableHead className="text-slate-400">Actions</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {users.map((user) => (
                                 <TableRow key={user._id} className="border-slate-700 hover:bg-slate-700/50">
                                    <TableCell>
                                       <div className="flex items-center gap-3">
                                          <img
                                             src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f59e0b&color=fff`}
                                             alt={user.name}
                                             className="w-10 h-10 rounded-full object-cover"
                                          />
                                          <span className="text-white font-medium">{user.name}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-slate-300">{user.email}</TableCell>
                                    <TableCell>
                                       <Badge className={`${getRoleBadgeColor(user.role)} border`}>
                                          {user.role}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-300">{user.batch || '-'}</TableCell>
                                    <TableCell className="text-slate-300">{user.department || '-'}</TableCell>
                                    <TableCell>
                                       <div className="flex gap-2">
                                          <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => viewUserDetails(user._id)}
                                             className="text-slate-400 hover:text-white hover:bg-slate-700"
                                          >
                                             <Eye className="w-4 h-4" />
                                          </Button>
                                          <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => deleteUser(user._id)}
                                             className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                             disabled={deleting === user._id}
                                          >
                                             {deleting === user._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                             ) : (
                                                <Trash2 className="w-4 h-4" />
                                             )}
                                          </Button>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                              ))}
                              {users.length === 0 && (
                                 <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                       No users found
                                    </TableCell>
                                 </TableRow>
                              )}
                           </TableBody>
                        </Table>
                     </div>

                     {/* Pagination */}
                     <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
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

         {/* User Details Dialog */}
         <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="text-xl">User Details</DialogTitle>
                  <DialogDescription className="text-slate-400">
                     Full user profile (privacy settings bypassed)
                  </DialogDescription>
               </DialogHeader>
               
               {userDetails?.user && (
                  <div className="space-y-6 mt-4">
                     {/* Profile Header */}
                     <div className="flex items-center gap-4">
                        <img
                           src={userDetails.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDetails.user.name)}&background=f59e0b&color=fff&size=128`}
                           alt={userDetails.user.name}
                           className="w-20 h-20 rounded-full object-cover"
                        />
                        <div>
                           <h3 className="text-xl font-bold">{userDetails.user.name}</h3>
                           <Badge className={`${getRoleBadgeColor(userDetails.user.role)} border mt-1`}>
                              {userDetails.user.role}
                           </Badge>
                        </div>
                     </div>

                     {/* Contact Info */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                           <Mail className="w-5 h-5 text-amber-500" />
                           <div>
                              <p className="text-xs text-slate-400">Email</p>
                              <p className="text-sm">{userDetails.user.email}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                           <Phone className="w-5 h-5 text-amber-500" />
                           <div>
                              <p className="text-xs text-slate-400">Mobile</p>
                              <p className="text-sm">{userDetails.user.mobileNumber || 'Not provided'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Academic Info */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                           <GraduationCap className="w-5 h-5 text-amber-500" />
                           <div>
                              <p className="text-xs text-slate-400">Batch</p>
                              <p className="text-sm">{userDetails.user.batch || 'Not specified'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                           <GraduationCap className="w-5 h-5 text-amber-500" />
                           <div>
                              <p className="text-xs text-slate-400">Department</p>
                              <p className="text-sm">{userDetails.user.department || 'Not specified'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Professional Info */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                           <Briefcase className="w-5 h-5 text-amber-500" />
                           <div>
                              <p className="text-xs text-slate-400">Current Company</p>
                              <p className="text-sm">{userDetails.user.currentCompany || 'Not specified'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                           <UserCog className="w-5 h-5 text-amber-500" />
                           <div>
                              <p className="text-xs text-slate-400">Current Role</p>
                              <p className="text-sm">{userDetails.user.currentRole || 'Not specified'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Bio */}
                     {userDetails.user.bio && (
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                           <p className="text-xs text-slate-400 mb-1">Bio</p>
                           <p className="text-sm">{userDetails.user.bio}</p>
                        </div>
                     )}

                     {/* Skills */}
                     {userDetails.user.skills?.length > 0 && (
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                           <p className="text-xs text-slate-400 mb-2">Skills</p>
                           <div className="flex flex-wrap gap-2">
                              {userDetails.user.skills.map((skill, i) => (
                                 <Badge key={i} variant="secondary" className="bg-slate-600 text-slate-200">
                                    {skill}
                                 </Badge>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Social Links */}
                     <div className="flex flex-wrap gap-3">
                        {userDetails.user.linkedIn && (
                           <a href={userDetails.user.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30">
                              <Globe className="w-4 h-4" /> LinkedIn
                           </a>
                        )}
                        {userDetails.user.github && (
                           <a href={userDetails.user.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-600/50 text-slate-300 rounded-lg text-sm hover:bg-slate-600">
                              <Globe className="w-4 h-4" /> GitHub
                           </a>
                        )}
                        {userDetails.user.portfolioUrl && (
                           <a href={userDetails.user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30">
                              <Globe className="w-4 h-4" /> Portfolio
                           </a>
                        )}
                     </div>

                     {/* Privacy Settings */}
                     <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-400 mb-2">Privacy Settings</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                           <p>Profile Visibility: <span className="text-amber-400">{userDetails.user.privacy?.profileVisibility}</span></p>
                           <p>Show Email: <span className="text-amber-400">{userDetails.user.privacy?.showEmail ? 'Yes' : 'No'}</span></p>
                           <p>Show Mobile: <span className="text-amber-400">{userDetails.user.privacy?.showMobile ? 'Yes' : 'No'}</span></p>
                           <p>Allow Messaging: <span className="text-amber-400">{userDetails.user.privacy?.allowMessaging}</span></p>
                        </div>
                     </div>

                     {/* Metadata */}
                     <div className="text-xs text-slate-500 border-t border-slate-700 pt-4">
                        <p>Created: {new Date(userDetails.user.createdAt).toLocaleString()}</p>
                        <p>Last Updated: {new Date(userDetails.user.updatedAt).toLocaleString()}</p>
                        <p>Auth Provider: {userDetails.user.authProvider}</p>
                        <p>Profile Complete: {userDetails.user.isProfileComplete ? 'Yes' : 'No'}</p>
                     </div>
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
}
