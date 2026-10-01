import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
   Briefcase, 
   Building2, 
   Calendar, 
   Clock, 
   DollarSign, 
   Download, 
   Eye, 
   Loader2, 
   MapPin, 
   Search,
   Trash2,
   Users,
   CheckCircle,
   XCircle,
   AlertCircle,
   Globe,
   User,
   FileText,
   Filter,
   TrendingUp,
   BookOpen
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/internships';

// Create axios instance
const internshipApi = axios.create({
   baseURL: API_BASE_URL
});

// Add token to requests
internshipApi.interceptors.request.use((config) => {
   const token = localStorage.getItem('adminToken');
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

export default function Internships() {
   const [internships, setInternships] = useState([]);
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({
      total: 0,
      active: 0,
      closed: 0,
      totalApplications: 0
   });
   const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
   const [activeTab, setActiveTab] = useState('all');
   const [selectedInternship, setSelectedInternship] = useState(null);
   const [showDetails, setShowDetails] = useState(false);
   const [applications, setApplications] = useState([]);
   const [loadingApplications, setLoadingApplications] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [deleting, setDeleting] = useState(null);

   useEffect(() => {
      fetchInternships();
   }, [activeTab, pagination.current, searchQuery]);

   const fetchInternships = async () => {
      setLoading(true);
      try {
         const params = new URLSearchParams();
         params.append('page', pagination.current);
         params.append('limit', '20');
         
         if (activeTab !== 'all') {
            params.append('status', activeTab);
         }

         if (searchQuery) {
            params.append('search', searchQuery);
         }

         const response = await internshipApi.get(`/admin/all?${params.toString()}`);
         setInternships(response.data.internships || []);
         setPagination(response.data.pagination || { current: 1, total: 1, count: 0 });
         setStats(response.data.stats || {
            total: 0,
            active: 0,
            closed: 0,
            totalApplications: 0
         });
      } catch (error) {
         console.error('Error fetching internships:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleViewDetails = async (internship) => {
      try {
         const response = await internshipApi.get(`/admin/${internship._id}`);
         setSelectedInternship(response.data.internship);
         setApplications(response.data.applications || []);
         setShowDetails(true);
      } catch (error) {
         console.error('Error fetching internship details:', error);
      }
   };

   const handleUpdateStatus = async (internshipId, status) => {
      try {
         await internshipApi.put(`/admin/${internshipId}`, { status });
         fetchInternships();
         if (selectedInternship?._id === internshipId) {
            setSelectedInternship(prev => ({ ...prev, status }));
         }
      } catch (error) {
         console.error('Error updating status:', error);
      }
   };

   const handleDeleteInternship = async (internshipId) => {
      if (!window.confirm('Are you sure you want to delete this internship posting?')) return;
      
      setDeleting(internshipId);
      try {
         await internshipApi.delete(`/admin/${internshipId}`);
         fetchInternships();
         if (selectedInternship?._id === internshipId) {
            setShowDetails(false);
            setSelectedInternship(null);
         }
      } catch (error) {
         console.error('Error deleting internship:', error);
      } finally {
         setDeleting(null);
      }
   };

   const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString('en-IN', {
         year: 'numeric',
         month: 'short',
         day: 'numeric'
      });
   };

   const getStatusBadge = (status) => {
      const badges = {
         active: 'bg-green-500/20 text-green-400 border-green-500/30',
         closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
         expired: 'bg-red-500/20 text-red-400 border-red-500/30',
         draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      };
      return badges[status] || badges.draft;
   };

   const getApplicationStatusBadge = (status) => {
      const badges = {
         pending: 'bg-yellow-500/20 text-yellow-400',
         reviewing: 'bg-blue-500/20 text-blue-400',
         shortlisted: 'bg-purple-500/20 text-purple-400',
         accepted: 'bg-green-500/20 text-green-400',
         rejected: 'bg-red-500/20 text-red-400',
         withdrawn: 'bg-slate-500/20 text-slate-400'
      };
      return badges[status] || badges.pending;
   };

   const tabs = [
      { id: 'all', label: 'All Internships' },
      { id: 'active', label: 'Active' },
      { id: 'closed', label: 'Closed' },
      { id: 'expired', label: 'Expired' }
   ];

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-7 h-7 text-blue-500" />
                  Internships
               </h1>
               <p className="text-slate-400 mt-1">
                  Manage internship postings from alumni
               </p>
            </div>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                     <Briefcase className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                     <p className="text-sm text-slate-400">Total Postings</p>
                     <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
                  </div>
               </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/20">
                     <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                     <p className="text-sm text-slate-400">Active</p>
                     <p className="text-2xl font-bold text-white">{stats.active || 0}</p>
                  </div>
               </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-slate-500/20">
                     <XCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                     <p className="text-sm text-slate-400">Closed</p>
                     <p className="text-2xl font-bold text-white">{stats.closed || 0}</p>
                  </div>
               </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                     <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                     <p className="text-sm text-slate-400">Applications</p>
                     <p className="text-2xl font-bold text-white">{stats.totalApplications || 0}</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Search and Tabs */}
         <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
               {tabs.map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => {
                        setActiveTab(tab.id);
                        setPagination(prev => ({ ...prev, current: 1 }));
                     }}
                     className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                           ? 'bg-amber-500 text-white'
                           : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600'
                     }`}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input
                  type="text"
                  placeholder="Search internships..."
                  value={searchQuery}
                  onChange={(e) => {
                     setSearchQuery(e.target.value);
                     setPagination(prev => ({ ...prev, current: 1 }));
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
               />
            </div>
         </div>

         {/* Internships List */}
         <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            {loading ? (
               <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
               </div>
            ) : internships.length === 0 ? (
               <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                  <p className="text-slate-400">No internships found</p>
               </div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="border-b border-slate-700 bg-slate-900/30">
                           <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Internship
                           </th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Posted By
                           </th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Location
                           </th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Applications
                           </th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Status
                           </th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Deadline
                           </th>
                           <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Actions
                           </th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-700">
                        {internships.map((internship) => (
                           <tr key={internship._id} className="hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4">
                                 <div>
                                    <p className="font-medium text-white">{internship.title}</p>
                                    <p className="text-sm text-slate-400 flex items-center gap-1">
                                       <Building2 className="w-3 h-3" />
                                       {internship.company}
                                    </p>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
                                       {internship.postedBy?.profilePicture ? (
                                          <img src={internship.postedBy.profilePicture} alt="" className="w-8 h-8 object-cover" />
                                       ) : (
                                          <User className="w-4 h-4 text-slate-400" />
                                       )}
                                    </div>
                                    <span className="text-slate-300 text-sm">{internship.postedBy?.name || 'Unknown'}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-1 text-slate-300 text-sm">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {internship.location}
                                    <span className="text-slate-500 capitalize">({internship.locationType})</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-1 text-slate-300 text-sm">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    {internship.applicationsCount || 0}
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(internship.status)}`}>
                                    {internship.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-slate-300 text-sm">
                                 {formatDate(internship.applicationDeadline)}
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center justify-end gap-2">
                                    <button
                                       onClick={() => handleViewDetails(internship)}
                                       className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                                       title="View Details"
                                    >
                                       <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                       onClick={() => handleDeleteInternship(internship._id)}
                                       disabled={deleting === internship._id}
                                       className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                       title="Delete"
                                    >
                                       {deleting === internship._id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                       ) : (
                                          <Trash2 className="w-4 h-4" />
                                       )}
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>

         {/* Pagination */}
         {pagination.total > 1 && (
            <div className="flex items-center justify-center gap-2">
               <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                  disabled={pagination.current === 1}
                  className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  Previous
               </button>
               <span className="text-slate-400">
                  Page {pagination.current} of {pagination.total}
               </span>
               <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                  disabled={pagination.current === pagination.total}
                  className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  Next
               </button>
            </div>
         )}

         {/* Details Dialog */}
         <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                     <Briefcase className="w-5 h-5 text-blue-400" />
                     Internship Details
                  </DialogTitle>
               </DialogHeader>

               {selectedInternship && (
                  <div className="space-y-6">
                     {/* Basic Info */}
                     <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                           <div>
                              <h3 className="text-lg font-semibold text-white">{selectedInternship.title}</h3>
                              <p className="text-slate-400 flex items-center gap-1">
                                 <Building2 className="w-4 h-4" />
                                 {selectedInternship.company}
                              </p>
                           </div>
                           <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(selectedInternship.status)}`}>
                              {selectedInternship.status}
                           </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                           <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-xs text-slate-400 mb-1">Location</p>
                              <p className="text-sm text-white flex items-center gap-1">
                                 <MapPin className="w-3 h-3" />
                                 {selectedInternship.location}
                              </p>
                           </div>
                           <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-xs text-slate-400 mb-1">Work Type</p>
                              <p className="text-sm text-white flex items-center gap-1 capitalize">
                                 <Globe className="w-3 h-3" />
                                 {selectedInternship.locationType}
                              </p>
                           </div>
                           <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-xs text-slate-400 mb-1">Duration</p>
                              <p className="text-sm text-white flex items-center gap-1">
                                 <Clock className="w-3 h-3" />
                                 {selectedInternship.duration || 'N/A'}
                              </p>
                           </div>
                           <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-xs text-slate-400 mb-1">Stipend</p>
                              <p className="text-sm text-white flex items-center gap-1">
                                 <DollarSign className="w-3 h-3" />
                                 {selectedInternship.stipend?.isPaid 
                                    ? `${selectedInternship.stipend.currency} ${selectedInternship.stipend.amount}/mo`
                                    : 'Unpaid'
                                 }
                              </p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-xs text-slate-400 mb-1">Application Deadline</p>
                              <p className="text-sm text-white">{formatDate(selectedInternship.applicationDeadline)}</p>
                           </div>
                           <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-xs text-slate-400 mb-1">Start Date</p>
                              <p className="text-sm text-white">{formatDate(selectedInternship.startDate)}</p>
                           </div>
                        </div>

                        {selectedInternship.skills?.length > 0 && (
                           <div>
                              <p className="text-sm text-slate-400 mb-2">Required Skills</p>
                              <div className="flex flex-wrap gap-2">
                                 {selectedInternship.skills.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">
                                       {skill}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        )}

                        <div>
                           <p className="text-sm text-slate-400 mb-2">Description</p>
                           <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedInternship.description}</p>
                        </div>

                        {selectedInternship.requirements && (
                           <div>
                              <p className="text-sm text-slate-400 mb-2">Requirements</p>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedInternship.requirements}</p>
                           </div>
                        )}

                        {/* Posted By Info */}
                        {selectedInternship.postedBy && (
                           <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
                                 {selectedInternship.postedBy.profilePicture ? (
                                    <img src={selectedInternship.postedBy.profilePicture} alt="" className="w-10 h-10 object-cover" />
                                 ) : (
                                    <User className="w-5 h-5 text-slate-400" />
                                 )}
                              </div>
                              <div>
                                 <p className="text-sm font-medium text-white">{selectedInternship.postedBy.name}</p>
                                 <p className="text-xs text-slate-400">{selectedInternship.postedBy.email}</p>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Status Actions */}
                     <div className="flex gap-2 pt-4 border-t border-slate-700">
                        {selectedInternship.status === 'active' && (
                           <button
                              onClick={() => handleUpdateStatus(selectedInternship._id, 'closed')}
                              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm"
                           >
                              Close Internship
                           </button>
                        )}
                        {selectedInternship.status === 'closed' && (
                           <button
                              onClick={() => handleUpdateStatus(selectedInternship._id, 'active')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm"
                           >
                              Reactivate
                           </button>
                        )}
                        <button
                           onClick={() => handleDeleteInternship(selectedInternship._id)}
                           className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm ml-auto"
                        >
                           Delete Internship
                        </button>
                     </div>

                     {/* Applications */}
                     <div className="pt-4 border-t border-slate-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                           <Users className="w-5 h-5 text-purple-400" />
                           Applications ({applications.length})
                        </h4>

                        {applications.length === 0 ? (
                           <p className="text-slate-400 text-center py-4">No applications yet</p>
                        ) : (
                           <div className="space-y-3 max-h-80 overflow-y-auto">
                              {applications.map((app) => (
                                 <div key={app._id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                    <div className="flex items-start justify-between gap-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
                                             {app.applicant?.profilePicture ? (
                                                <img src={app.applicant.profilePicture} alt="" className="w-10 h-10 object-cover" />
                                             ) : (
                                                <User className="w-5 h-5 text-slate-400" />
                                             )}
                                          </div>
                                          <div>
                                             <p className="font-medium text-white">{app.applicant?.name}</p>
                                             <p className="text-xs text-slate-400">{app.applicant?.email}</p>
                                          </div>
                                       </div>
                                       <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getApplicationStatusBadge(app.status)}`}>
                                          {app.status}
                                       </span>
                                    </div>

                                    {app.coverLetter && (
                                       <p className="text-sm text-slate-400 mt-3 line-clamp-2">{app.coverLetter}</p>
                                    )}

                                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                                       {app.resume && (
                                          <a href={app.resume} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                             <FileText className="w-3 h-3" />
                                             Resume
                                          </a>
                                       )}
                                       {app.portfolio && (
                                          <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                             <Globe className="w-3 h-3" />
                                             Portfolio
                                          </a>
                                       )}
                                       <span className="text-slate-500">
                                          Applied: {formatDate(app.createdAt)}
                                       </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
}
