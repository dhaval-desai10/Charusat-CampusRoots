import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, MapPin, Users, Trash2, Plus, ChevronLeft, ChevronRight, Clock, Loader2, Eye } from 'lucide-react';
import api from '@/lib/api';

export default function Reunions() {
   const [reunions, setReunions] = useState([]);
   const [loading, setLoading] = useState(true);
   const [pagination, setPagination] = useState({ current: 1, total: 1, totalReunions: 0 });
   const [status, setStatus] = useState('');
   const [batches, setBatches] = useState([]);
   const [deleting, setDeleting] = useState(null);
   const [showCreate, setShowCreate] = useState(false);
   const [creating, setCreating] = useState(false);
   const [selectedReunion, setSelectedReunion] = useState(null);
   const [showDetails, setShowDetails] = useState(false);
   const [formData, setFormData] = useState({
      title: '',
      description: '',
      eventDate: '',
      eventTime: '',
      venue: '',
      targetBatches: '',
      targetDepartments: '',
      eventType: 'in-person',
      meetingLink: '',
      maxAttendees: '',
      contactEmail: '',
      contactPhone: ''
   });

   useEffect(() => {
      fetchReunions();
   }, [pagination.current, status]);

   const fetchReunions = async () => {
      setLoading(true);
      try {
         const params = new URLSearchParams({
            page: pagination.current.toString(),
            limit: '20'
         });
         if (status && status !== 'all') params.append('status', status);

         const response = await api.get(`/reunions?${params}`);
         if (response.data.success) {
            setReunions(response.data.reunions);
            setPagination(response.data.pagination);
            setBatches(response.data.filters?.batches || []);
         }
      } catch (error) {
         console.error('Failed to fetch reunions:', error);
      } finally {
         setLoading(false);
      }
   };

   const deleteReunion = async (reunionId) => {
      if (!confirm('Are you sure you want to delete this reunion?')) return;
      
      setDeleting(reunionId);
      try {
         const response = await api.delete(`/reunions/${reunionId}`);
         if (response.data.success) {
            fetchReunions();
            if (showDetails && selectedReunion?._id === reunionId) {
               setShowDetails(false);
               setSelectedReunion(null);
            }
         }
      } catch (error) {
         console.error('Failed to delete reunion:', error);
         alert('Failed to delete reunion');
      } finally {
         setDeleting(null);
      }
   };

   const handleCreateReunion = async (e) => {
      e.preventDefault();
      setCreating(true);
      try {
         const payload = {
            ...formData,
            targetBatches: formData.targetBatches.split(',').map(b => b.trim()).filter(Boolean),
            targetDepartments: formData.targetDepartments ? formData.targetDepartments.split(',').map(d => d.trim()).filter(Boolean) : [],
            maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : 0
         };

         const response = await api.post('/reunions', payload);
         if (response.data.success) {
            setShowCreate(false);
            setFormData({
               title: '',
               description: '',
               eventDate: '',
               eventTime: '',
               venue: '',
               targetBatches: '',
               targetDepartments: '',
               eventType: 'in-person',
               meetingLink: '',
               maxAttendees: '',
               contactEmail: '',
               contactPhone: ''
            });
            fetchReunions();
         }
      } catch (error) {
         console.error('Failed to create reunion:', error);
         alert(error.response?.data?.message || 'Failed to create reunion');
      } finally {
         setCreating(false);
      }
   };

   const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
      });
   };

   const getStatusBadge = (reunion) => {
      const now = new Date();
      const eventDate = new Date(reunion.eventDate);
      
      if (reunion.status === 'cancelled') {
         return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Cancelled</Badge>;
      }
      if (eventDate < now) {
         return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30">Completed</Badge>;
      }
      return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Upcoming</Badge>;
   };

   const getEventTypeBadge = (type) => {
      switch (type) {
         case 'in-person':
            return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">In-Person</Badge>;
         case 'online':
            return <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">Online</Badge>;
         case 'hybrid':
            return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Hybrid</Badge>;
         default:
            return null;
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold text-white">Reunions Management</h1>
               <p className="text-slate-400 mt-1">View and manage all reunion events</p>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
               <DialogTrigger asChild>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                     <Plus className="w-4 h-4 mr-2" /> Create Reunion
                  </Button>
               </DialogTrigger>
               <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                     <DialogTitle className="text-xl">Create New Reunion</DialogTitle>
                     <DialogDescription className="text-slate-400">
                        Schedule a new reunion event
                     </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateReunion} className="space-y-4 mt-4">
                     <div className="space-y-2">
                        <Label className="text-slate-300">Title *</Label>
                        <Input
                           value={formData.title}
                           onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                           placeholder="Reunion title"
                           className="bg-slate-700/50 border-slate-600 text-white"
                           required
                        />
                     </div>

                     <div className="space-y-2">
                        <Label className="text-slate-300">Description *</Label>
                        <Textarea
                           value={formData.description}
                           onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                           placeholder="Event description"
                           className="bg-slate-700/50 border-slate-600 text-white min-h-24"
                           required
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-slate-300">Event Date *</Label>
                           <Input
                              type="date"
                              value={formData.eventDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                              className="bg-slate-700/50 border-slate-600 text-white"
                              required
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-slate-300">Event Time *</Label>
                           <Input
                              type="time"
                              value={formData.eventTime}
                              onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                              className="bg-slate-700/50 border-slate-600 text-white"
                              required
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-slate-300">Venue *</Label>
                        <Input
                           value={formData.venue}
                           onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                           placeholder="Event venue/location"
                           className="bg-slate-700/50 border-slate-600 text-white"
                           required
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-slate-300">Target Batches * (comma separated)</Label>
                           <Input
                              value={formData.targetBatches}
                              onChange={(e) => setFormData(prev => ({ ...prev, targetBatches: e.target.value }))}
                              placeholder="2018-2022, 2019-2023"
                              className="bg-slate-700/50 border-slate-600 text-white"
                              required
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-slate-300">Target Departments (comma separated)</Label>
                           <Input
                              value={formData.targetDepartments}
                              onChange={(e) => setFormData(prev => ({ ...prev, targetDepartments: e.target.value }))}
                              placeholder="CE, IT, EC (leave empty for all)"
                              className="bg-slate-700/50 border-slate-600 text-white"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-slate-300">Event Type</Label>
                           <Select
                              value={formData.eventType}
                              onValueChange={(v) => setFormData(prev => ({ ...prev, eventType: v }))}
                           >
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                 <SelectItem value="in-person" className="text-white focus:bg-slate-700">In-Person</SelectItem>
                                 <SelectItem value="online" className="text-white focus:bg-slate-700">Online</SelectItem>
                                 <SelectItem value="hybrid" className="text-white focus:bg-slate-700">Hybrid</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-slate-300">Max Attendees</Label>
                           <Input
                              type="number"
                              value={formData.maxAttendees}
                              onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: e.target.value }))}
                              placeholder="0 for unlimited"
                              className="bg-slate-700/50 border-slate-600 text-white"
                           />
                        </div>
                     </div>

                     {(formData.eventType === 'online' || formData.eventType === 'hybrid') && (
                        <div className="space-y-2">
                           <Label className="text-slate-300">Meeting Link</Label>
                           <Input
                              value={formData.meetingLink}
                              onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                              placeholder="https://meet.google.com/..."
                              className="bg-slate-700/50 border-slate-600 text-white"
                           />
                        </div>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-slate-300">Contact Email</Label>
                           <Input
                              type="email"
                              value={formData.contactEmail}
                              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                              placeholder="contact@example.com"
                              className="bg-slate-700/50 border-slate-600 text-white"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-slate-300">Contact Phone</Label>
                           <Input
                              value={formData.contactPhone}
                              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                              placeholder="+91 98765 43210"
                              className="bg-slate-700/50 border-slate-600 text-white"
                           />
                        </div>
                     </div>

                     <div className="flex justify-end gap-3 pt-4">
                        <Button
                           type="button"
                           variant="outline"
                           onClick={() => setShowCreate(false)}
                           className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                           Cancel
                        </Button>
                        <Button
                           type="submit"
                           disabled={creating}
                           className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                           {creating ? (
                              <>
                                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                 Creating...
                              </>
                           ) : (
                              'Create Reunion'
                           )}
                        </Button>
                     </div>
                  </form>
               </DialogContent>
            </Dialog>
         </div>

         {/* Filters */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
               <div className="flex gap-4 items-end">
                  <div className="w-48">
                     <label className="text-sm text-slate-400 mb-1 block">Status</label>
                     <Select value={status} onValueChange={(v) => { setStatus(v); setPagination(prev => ({ ...prev, current: 1 })); }}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                           <SelectValue placeholder="All status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                           <SelectItem value="all" className="text-white focus:bg-slate-700">All</SelectItem>
                           <SelectItem value="upcoming" className="text-white focus:bg-slate-700">Upcoming</SelectItem>
                           <SelectItem value="past" className="text-white focus:bg-slate-700">Past</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Reunions Table */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
               <CardTitle className="text-white">
                  Reunions ({pagination.totalReunions})
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
                                 <TableHead className="text-slate-400">Event</TableHead>
                                 <TableHead className="text-slate-400">Date & Time</TableHead>
                                 <TableHead className="text-slate-400">Venue</TableHead>
                                 <TableHead className="text-slate-400">Target Batches</TableHead>
                                 <TableHead className="text-slate-400">Status</TableHead>
                                 <TableHead className="text-slate-400">Attendees</TableHead>
                                 <TableHead className="text-slate-400">Actions</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {reunions.map((reunion) => (
                                 <TableRow key={reunion._id} className="border-slate-700 hover:bg-slate-700/50">
                                    <TableCell>
                                       <div>
                                          <p className="text-white font-medium">{reunion.title}</p>
                                          <div className="mt-1">{getEventTypeBadge(reunion.eventType)}</div>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="text-slate-300">
                                          <div className="flex items-center gap-2">
                                             <Calendar className="w-4 h-4 text-amber-500" />
                                             {formatDate(reunion.eventDate)}
                                          </div>
                                          <div className="flex items-center gap-2 text-sm text-slate-400">
                                             <Clock className="w-3 h-3" />
                                             {reunion.eventTime}
                                          </div>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-2 text-slate-300">
                                          <MapPin className="w-4 h-4 text-amber-500" />
                                          <span className="truncate max-w-32">{reunion.venue}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex flex-wrap gap-1 max-w-40">
                                          {reunion.targetBatches?.slice(0, 2).map((batch, i) => (
                                             <Badge key={i} variant="secondary" className="bg-slate-600 text-slate-200 text-xs">
                                                {batch}
                                             </Badge>
                                          ))}
                                          {reunion.targetBatches?.length > 2 && (
                                             <Badge variant="secondary" className="bg-slate-600 text-slate-200 text-xs">
                                                +{reunion.targetBatches.length - 2}
                                             </Badge>
                                          )}
                                       </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(reunion)}</TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-2 text-slate-300">
                                          <Users className="w-4 h-4 text-amber-500" />
                                          {reunion.attendees?.filter(a => a.status === 'going').length || 0}
                                          {reunion.maxAttendees > 0 && ` / ${reunion.maxAttendees}`}
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex gap-2">
                                          <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => { setSelectedReunion(reunion); setShowDetails(true); }}
                                             className="text-slate-400 hover:text-white hover:bg-slate-700"
                                          >
                                             <Eye className="w-4 h-4" />
                                          </Button>
                                          <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => deleteReunion(reunion._id)}
                                             className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                             disabled={deleting === reunion._id}
                                          >
                                             {deleting === reunion._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                             ) : (
                                                <Trash2 className="w-4 h-4" />
                                             )}
                                          </Button>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                              ))}
                              {reunions.length === 0 && (
                                 <TableRow>
                                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                                       No reunions found
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

         {/* Reunion Details Dialog */}
         <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="text-xl">Reunion Details</DialogTitle>
                  <DialogDescription className="text-slate-400">
                     Full reunion event information
                  </DialogDescription>
               </DialogHeader>
               
               {selectedReunion && (
                  <div className="space-y-4 mt-4">
                     {/* Cover Image */}
                     {selectedReunion.coverImage && (
                        <div className="rounded-lg overflow-hidden">
                           <img
                              src={selectedReunion.coverImage}
                              alt="Cover"
                              className="w-full h-40 object-cover"
                           />
                        </div>
                     )}

                     {/* Title and Status */}
                     <div className="flex items-start justify-between">
                        <div>
                           <h3 className="text-xl font-bold">{selectedReunion.title}</h3>
                           <div className="flex gap-2 mt-2">
                              {getStatusBadge(selectedReunion)}
                              {getEventTypeBadge(selectedReunion.eventType)}
                           </div>
                        </div>
                     </div>

                     {/* Description */}
                     <div className="p-4 bg-slate-700/50 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedReunion.description}</p>
                     </div>

                     {/* Details Grid */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                           <div className="flex items-center gap-2 text-amber-500 mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs">Date</span>
                           </div>
                           <p className="text-sm">{formatDate(selectedReunion.eventDate)}</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                           <div className="flex items-center gap-2 text-amber-500 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs">Time</span>
                           </div>
                           <p className="text-sm">{selectedReunion.eventTime}</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg col-span-2">
                           <div className="flex items-center gap-2 text-amber-500 mb-1">
                              <MapPin className="w-4 h-4" />
                              <span className="text-xs">Venue</span>
                           </div>
                           <p className="text-sm">{selectedReunion.venue}</p>
                        </div>
                     </div>

                     {/* Meeting Link */}
                     {selectedReunion.meetingLink && (
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                           <p className="text-xs text-amber-500 mb-1">Meeting Link</p>
                           <a href={selectedReunion.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                              {selectedReunion.meetingLink}
                           </a>
                        </div>
                     )}

                     {/* Target Batches */}
                     <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-amber-500 mb-2">Target Batches</p>
                        <div className="flex flex-wrap gap-2">
                           {selectedReunion.targetBatches?.map((batch, i) => (
                              <Badge key={i} variant="secondary" className="bg-slate-600 text-slate-200">
                                 {batch}
                              </Badge>
                           ))}
                        </div>
                     </div>

                     {/* Target Departments */}
                     {selectedReunion.targetDepartments?.length > 0 && (
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                           <p className="text-xs text-amber-500 mb-2">Target Departments</p>
                           <div className="flex flex-wrap gap-2">
                              {selectedReunion.targetDepartments.map((dept, i) => (
                                 <Badge key={i} variant="secondary" className="bg-slate-600 text-slate-200">
                                    {dept}
                                 </Badge>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Attendees */}
                     <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-amber-500 mb-2">Attendees Summary</p>
                        <div className="flex gap-4 text-sm">
                           <span>Going: <span className="text-green-400 font-medium">{selectedReunion.attendees?.filter(a => a.status === 'going').length || 0}</span></span>
                           <span>Interested: <span className="text-amber-400 font-medium">{selectedReunion.attendees?.filter(a => a.status === 'interested').length || 0}</span></span>
                           <span>Not Going: <span className="text-red-400 font-medium">{selectedReunion.attendees?.filter(a => a.status === 'not-going').length || 0}</span></span>
                           {selectedReunion.maxAttendees > 0 && <span>Max: {selectedReunion.maxAttendees}</span>}
                        </div>
                     </div>

                     {/* Detailed Attendee Lists */}
                     {selectedReunion.attendees?.length > 0 && (
                        <div className="space-y-4">
                           {/* Going */}
                           {selectedReunion.attendees?.filter(a => a.status === 'going').length > 0 && (
                              <div className="p-3 bg-slate-700/50 rounded-lg">
                                 <p className="text-xs text-green-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    Going ({selectedReunion.attendees.filter(a => a.status === 'going').length})
                                 </p>
                                 <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {selectedReunion.attendees.filter(a => a.status === 'going').map((attendee, idx) => (
                                       <div key={idx} className="flex items-center gap-3 p-2 bg-slate-600/50 rounded-lg">
                                          <img
                                             src={attendee.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.user?.name || 'User')}&background=22c55e&color=fff`}
                                             alt={attendee.user?.name}
                                             className="w-8 h-8 rounded-full object-cover"
                                          />
                                          <div className="flex-1 min-w-0">
                                             <p className="text-sm font-medium text-white truncate">{attendee.user?.name || 'Unknown'}</p>
                                             <p className="text-xs text-slate-400 truncate">{attendee.user?.email}</p>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-xs text-slate-400">{attendee.user?.batch}</p>
                                             <p className="text-xs text-slate-500">{attendee.user?.department}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}

                           {/* Interested */}
                           {selectedReunion.attendees?.filter(a => a.status === 'interested').length > 0 && (
                              <div className="p-3 bg-slate-700/50 rounded-lg">
                                 <p className="text-xs text-amber-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                    Interested ({selectedReunion.attendees.filter(a => a.status === 'interested').length})
                                 </p>
                                 <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {selectedReunion.attendees.filter(a => a.status === 'interested').map((attendee, idx) => (
                                       <div key={idx} className="flex items-center gap-3 p-2 bg-slate-600/50 rounded-lg">
                                          <img
                                             src={attendee.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.user?.name || 'User')}&background=f59e0b&color=fff`}
                                             alt={attendee.user?.name}
                                             className="w-8 h-8 rounded-full object-cover"
                                          />
                                          <div className="flex-1 min-w-0">
                                             <p className="text-sm font-medium text-white truncate">{attendee.user?.name || 'Unknown'}</p>
                                             <p className="text-xs text-slate-400 truncate">{attendee.user?.email}</p>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-xs text-slate-400">{attendee.user?.batch}</p>
                                             <p className="text-xs text-slate-500">{attendee.user?.department}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}

                           {/* Not Going */}
                           {selectedReunion.attendees?.filter(a => a.status === 'not-going').length > 0 && (
                              <div className="p-3 bg-slate-700/50 rounded-lg">
                                 <p className="text-xs text-red-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                    Not Going ({selectedReunion.attendees.filter(a => a.status === 'not-going').length})
                                 </p>
                                 <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {selectedReunion.attendees.filter(a => a.status === 'not-going').map((attendee, idx) => (
                                       <div key={idx} className="flex items-center gap-3 p-2 bg-slate-600/50 rounded-lg">
                                          <img
                                             src={attendee.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.user?.name || 'User')}&background=ef4444&color=fff`}
                                             alt={attendee.user?.name}
                                             className="w-8 h-8 rounded-full object-cover"
                                          />
                                          <div className="flex-1 min-w-0">
                                             <p className="text-sm font-medium text-white truncate">{attendee.user?.name || 'Unknown'}</p>
                                             <p className="text-xs text-slate-400 truncate">{attendee.user?.email}</p>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-xs text-slate-400">{attendee.user?.batch}</p>
                                             <p className="text-xs text-slate-500">{attendee.user?.department}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                     {/* Contact Info */}
                     {(selectedReunion.contactEmail || selectedReunion.contactPhone) && (
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                           <p className="text-xs text-amber-500 mb-2">Contact Info</p>
                           <div className="text-sm space-y-1">
                              {selectedReunion.contactEmail && <p>Email: {selectedReunion.contactEmail}</p>}
                              {selectedReunion.contactPhone && <p>Phone: {selectedReunion.contactPhone}</p>}
                           </div>
                        </div>
                     )}

                     {/* Organizer */}
                     {selectedReunion.organizer && (
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                           <img
                              src={selectedReunion.organizer.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReunion.organizer.name)}&background=f59e0b&color=fff`}
                              alt={selectedReunion.organizer.name}
                              className="w-10 h-10 rounded-full"
                           />
                           <div>
                              <p className="text-xs text-amber-500">Organizer</p>
                              <p className="text-sm font-medium">{selectedReunion.organizer.name}</p>
                           </div>
                        </div>
                     )}

                     {/* Metadata */}
                     <div className="text-xs text-slate-500 pt-4 border-t border-slate-700">
                        <p>Created: {new Date(selectedReunion.createdAt).toLocaleString()}</p>
                     </div>

                     {/* Actions */}
                     <div className="flex gap-2 pt-4">
                        <Button
                           variant="destructive"
                           onClick={() => deleteReunion(selectedReunion._id)}
                           disabled={deleting === selectedReunion._id}
                           className="bg-red-500 hover:bg-red-600 text-white"
                        >
                           {deleting === selectedReunion._id ? (
                              <>
                                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                 Deleting...
                              </>
                           ) : (
                              <>
                                 <Trash2 className="w-4 h-4 mr-2" />
                                 Delete Reunion
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
