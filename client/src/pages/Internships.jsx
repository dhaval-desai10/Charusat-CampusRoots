import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
   Plus,
   Briefcase,
   MapPin,
   Clock,
   DollarSign,
   Calendar,
   Users,
   ExternalLink,
   Edit,
   Trash2,
   X,
   Check,
   Loader2,
   AlertCircle,
   Filter,
   Search,
   Building2,
   Send,
   FileText,
   CheckCircle,
   XCircle,
   Eye,
   ChevronDown,
   ChevronUp,
   Globe,
   Mail,
   User,
   BookOpen
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const API_URL = 'http://localhost:5000/api';

const Internships = () => {
   const { user } = useAuth();
   const isStudent = user?.role === 'student';
   const isAlumni = user?.role === 'alumni';
   const isFaculty = user?.role === 'faculty';

   // Tab state
   const [activeTab, setActiveTab] = useState('browse');

   // Internships state
   const [internships, setInternships] = useState([]);
   const [myPostings, setMyPostings] = useState([]);
   const [myApplications, setMyApplications] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedInternship, setSelectedInternship] = useState(null);
   const [showApplications, setShowApplications] = useState(null);
   const [applications, setApplications] = useState([]);
   const [loadingApplications, setLoadingApplications] = useState(false);

   // Create/Edit modal state
   const [showModal, setShowModal] = useState(false);
   const [editingInternship, setEditingInternship] = useState(null);
   const [formData, setFormData] = useState({
      title: '',
      company: '',
      location: '',
      locationType: 'onsite',
      description: '',
      requirements: '',
      skills: '',
      duration: '',
      stipend: { amount: 0, currency: 'INR', isPaid: true },
      applicationDeadline: '',
      startDate: '',
      openings: 1,
      contactEmail: '',
      externalLink: ''
   });
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState('');

   // Apply modal state
   const [showApplyModal, setShowApplyModal] = useState(false);
   const [applyingTo, setApplyingTo] = useState(null);
   const [applicationData, setApplicationData] = useState({
      coverLetter: '',
      resume: '',
      portfolio: '',
      expectedStipend: '',
      availableFrom: ''
   });

   // Filter state
   const [searchQuery, setSearchQuery] = useState('');
   const [filterLocationType, setFilterLocationType] = useState('');

   // Fetch all internships
   const fetchInternships = useCallback(async () => {
      try {
         setLoading(true);
         const params = new URLSearchParams();
         if (searchQuery) params.append('search', searchQuery);
         if (filterLocationType) params.append('locationType', filterLocationType);

         const response = await axios.get(`${API_URL}/internships?${params}`, {
            withCredentials: true
         });

         if (response.data.success) {
            setInternships(response.data.internships);
         }
      } catch (error) {
         console.error('Error fetching internships:', error);
      } finally {
         setLoading(false);
      }
   }, [searchQuery, filterLocationType]);

   // Fetch alumni's own postings
   const fetchMyPostings = useCallback(async () => {
      if (!isAlumni) return;
      try {
         const response = await axios.get(`${API_URL}/internships/alumni/my-postings`, {
            withCredentials: true
         });
         if (response.data.success) {
            setMyPostings(response.data.internships);
         }
      } catch (error) {
         console.error('Error fetching my postings:', error);
      }
   }, [isAlumni]);

   // Fetch student's applications
   const fetchMyApplications = useCallback(async () => {
      if (!isStudent) return;
      try {
         const response = await axios.get(`${API_URL}/internships/student/my-applications`, {
            withCredentials: true
         });
         if (response.data.success) {
            setMyApplications(response.data.applications);
         }
      } catch (error) {
         console.error('Error fetching my applications:', error);
      }
   }, [isStudent]);

   // Fetch applications for an internship (alumni)
   const fetchApplicationsForInternship = async (internshipId) => {
      try {
         setLoadingApplications(true);
         const response = await axios.get(`${API_URL}/internships/${internshipId}/applications`, {
            withCredentials: true
         });
         if (response.data.success) {
            setApplications(response.data.applications);
         }
      } catch (error) {
         console.error('Error fetching applications:', error);
      } finally {
         setLoadingApplications(false);
      }
   };

   useEffect(() => {
      fetchInternships();
      if (isAlumni) fetchMyPostings();
      if (isStudent) fetchMyApplications();
   }, [fetchInternships, fetchMyPostings, fetchMyApplications, isAlumni, isStudent]);

   // Handle form input change
   const handleInputChange = (e) => {
      const { name, value } = e.target;
      if (name.startsWith('stipend.')) {
         const stipendField = name.split('.')[1];
         setFormData(prev => ({
            ...prev,
            stipend: { ...prev.stipend, [stipendField]: stipendField === 'isPaid' ? value === 'true' : value }
         }));
      } else {
         setFormData(prev => ({ ...prev, [name]: value }));
      }
   };

   // Open create modal
   const openCreateModal = () => {
      setEditingInternship(null);
      setFormData({
         title: '',
         company: user?.currentCompany || '',
         location: '',
         locationType: 'onsite',
         description: '',
         requirements: '',
         skills: '',
         duration: '',
         stipend: { amount: 0, currency: 'INR', isPaid: true },
         applicationDeadline: '',
         startDate: '',
         openings: 1,
         contactEmail: user?.email || '',
         externalLink: ''
      });
      setError('');
      setShowModal(true);
   };

   // Open edit modal
   const openEditModal = (internship) => {
      setEditingInternship(internship);
      setFormData({
         title: internship.title,
         company: internship.company,
         location: internship.location,
         locationType: internship.locationType || 'onsite',
         description: internship.description,
         requirements: internship.requirements || '',
         skills: internship.skills?.join(', ') || '',
         duration: internship.duration || '',
         stipend: internship.stipend || { amount: 0, currency: 'INR', isPaid: true },
         applicationDeadline: internship.applicationDeadline ? new Date(internship.applicationDeadline).toISOString().split('T')[0] : '',
         startDate: internship.startDate ? new Date(internship.startDate).toISOString().split('T')[0] : '',
         openings: internship.openings || 1,
         contactEmail: internship.contactEmail || '',
         externalLink: internship.externalLink || ''
      });
      setError('');
      setShowModal(true);
   };

   // Submit internship form
   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      try {
         setSubmitting(true);
         const submitData = {
            ...formData,
            skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
            stipend: {
               ...formData.stipend,
               amount: Number(formData.stipend.amount)
            },
            openings: Number(formData.openings)
         };

         if (editingInternship) {
            await axios.put(`${API_URL}/internships/${editingInternship._id}`, submitData, {
               withCredentials: true
            });
         } else {
            await axios.post(`${API_URL}/internships`, submitData, {
               withCredentials: true
            });
         }

         setShowModal(false);
         fetchMyPostings();
         fetchInternships();
      } catch (error) {
         setError(error.response?.data?.message || 'Failed to save internship');
      } finally {
         setSubmitting(false);
      }
   };

   // Delete internship
   const handleDelete = async (internshipId) => {
      if (!confirm('Are you sure you want to delete this internship posting?')) return;

      try {
         await axios.delete(`${API_URL}/internships/${internshipId}`, {
            withCredentials: true
         });
         fetchMyPostings();
         fetchInternships();
      } catch (error) {
         console.error('Error deleting internship:', error);
         alert(error.response?.data?.message || 'Failed to delete internship');
      }
   };

   // Open apply modal
   const openApplyModal = (internship) => {
      setApplyingTo(internship);
      setApplicationData({
         coverLetter: '',
         resume: '',
         portfolio: '',
         expectedStipend: '',
         availableFrom: ''
      });
      setShowApplyModal(true);
   };

   // Submit application
   const handleApply = async (e) => {
      e.preventDefault();
      try {
         setSubmitting(true);
         await axios.post(`${API_URL}/internships/${applyingTo._id}/apply`, applicationData, {
            withCredentials: true
         });
         setShowApplyModal(false);
         fetchInternships();
         fetchMyApplications();
         alert('Application submitted successfully!');
      } catch (error) {
         alert(error.response?.data?.message || 'Failed to submit application');
      } finally {
         setSubmitting(false);
      }
   };

   // Withdraw application
   const handleWithdraw = async (applicationId) => {
      if (!confirm('Are you sure you want to withdraw this application?')) return;

      try {
         await axios.delete(`${API_URL}/internships/applications/${applicationId}/withdraw`, {
            withCredentials: true
         });
         fetchMyApplications();
         fetchInternships();
      } catch (error) {
         alert(error.response?.data?.message || 'Failed to withdraw application');
      }
   };

   // Update application status (alumni)
   const handleUpdateApplicationStatus = async (applicationId, status) => {
      try {
         await axios.put(`${API_URL}/internships/applications/${applicationId}/status`, 
            { status },
            { withCredentials: true }
         );
         fetchApplicationsForInternship(showApplications);
      } catch (error) {
         alert(error.response?.data?.message || 'Failed to update status');
      }
   };

   // View applications for an internship
   const handleViewApplications = (internshipId) => {
      if (showApplications === internshipId) {
         setShowApplications(null);
         setApplications([]);
      } else {
         setShowApplications(internshipId);
         fetchApplicationsForInternship(internshipId);
      }
   };

   // Format date
   const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric'
      });
   };

   // Get status badge color
   const getStatusBadge = (status) => {
      const badges = {
         pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
         reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
         shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
         accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
         rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
         withdrawn: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
         active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
         closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
         expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
         draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      };
      return badges[status] || badges.pending;
   };

   // Render internship card
   const renderInternshipCard = (internship, showActions = true) => (
      <div key={internship._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
         <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{internship.title}</h3>
               <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">{internship.company}</span>
               </div>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(internship.status)}`}>
               {internship.status}
            </span>
         </div>

         <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
               <MapPin className="w-4 h-4" />
               <span>{internship.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
               <Globe className="w-4 h-4" />
               <span className="capitalize">{internship.locationType}</span>
            </div>
            {internship.stipend?.isPaid && (
               <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{internship.stipend.currency} {internship.stipend.amount}/month</span>
               </div>
            )}
            {internship.duration && (
               <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{internship.duration}</span>
               </div>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
               <Calendar className="w-4 h-4" />
               <span>Deadline: {formatDate(internship.applicationDeadline)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
               <Users className="w-4 h-4" />
               <span>{internship.applicationsCount || 0} applications</span>
            </div>
         </div>

         {internship.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
               {internship.skills.slice(0, 5).map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-md">
                     {skill}
                  </span>
               ))}
               {internship.skills.length > 5 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                     +{internship.skills.length - 5} more
                  </span>
               )}
            </div>
         )}

         <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
            {internship.description}
         </p>

         {/* Posted by info */}
         {internship.postedBy && (
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
               <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  {internship.postedBy.profilePicture ? (
                     <img src={internship.postedBy.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                     <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
               </div>
               <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Posted by </span>
                  <span className="text-gray-900 dark:text-white font-medium">{internship.postedBy.name}</span>
               </div>
            </div>
         )}

         {showActions && (
            <div className="flex gap-2">
               {isStudent && internship.status === 'active' && (
                  internship.hasApplied ? (
                     <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Applied
                     </span>
                  ) : (
                     <button
                        onClick={() => openApplyModal(internship)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                     >
                        <Send className="w-4 h-4" />
                        Apply Now
                     </button>
                  )
               )}
               {internship.externalLink && (
                  <a
                     href={internship.externalLink}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                     <ExternalLink className="w-4 h-4" />
                     View Details
                  </a>
               )}
            </div>
         )}
      </div>
   );

   // Render my posting card (alumni view)
   const renderMyPostingCard = (internship) => (
      <div key={internship._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
         <div className="p-5">
            <div className="flex justify-between items-start mb-3">
               <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{internship.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{internship.company}</p>
               </div>
               <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(internship.status)}`}>
                  {internship.status}
               </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
               <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {internship.location}
               </span>
               <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {internship.applicationsCount || 0} applications
               </span>
               <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Deadline: {formatDate(internship.applicationDeadline)}
               </span>
            </div>

            <div className="flex gap-2">
               <button
                  onClick={() => handleViewApplications(internship._id)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
               >
                  <Eye className="w-4 h-4" />
                  {showApplications === internship._id ? 'Hide' : 'View'} Applications
                  {showApplications === internship._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </button>
               <button
                  onClick={() => openEditModal(internship)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
               >
                  <Edit className="w-4 h-4" />
                  Edit
               </button>
               <button
                  onClick={() => handleDelete(internship._id)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
               >
                  <Trash2 className="w-4 h-4" />
                  Delete
               </button>
            </div>
         </div>

         {/* Applications list */}
         {showApplications === internship._id && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
               <h4 className="font-medium text-gray-900 dark:text-white mb-3">Applications</h4>
               {loadingApplications ? (
                  <div className="flex justify-center py-4">
                     <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
               ) : applications.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No applications yet</p>
               ) : (
                  <div className="space-y-3">
                     {applications.map(app => (
                        <div key={app._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                           <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                    {app.applicant?.profilePicture ? (
                                       <img src={app.applicant.profilePicture} alt="" className="w-10 h-10 object-cover" />
                                    ) : (
                                       <User className="w-5 h-5 text-gray-500" />
                                    )}
                                 </div>
                                 <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{app.applicant?.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{app.applicant?.email}</p>
                                 </div>
                              </div>
                              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(app.status)}`}>
                                 {app.status}
                              </span>
                           </div>

                           {app.coverLetter && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                 <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{app.coverLetter}</p>
                              </div>
                           )}

                           <div className="flex flex-wrap gap-2 mt-3">
                              {app.resume && (
                                 <a href={app.resume} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                    <FileText className="w-4 h-4" />
                                    Resume
                                 </a>
                              )}
                              {app.portfolio && (
                                 <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                    <Globe className="w-4 h-4" />
                                    Portfolio
                                 </a>
                              )}
                           </div>

                           {app.status === 'pending' || app.status === 'reviewing' ? (
                              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                 <button
                                    onClick={() => handleUpdateApplicationStatus(app._id, 'shortlisted')}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm hover:bg-purple-100"
                                 >
                                    <BookOpen className="w-4 h-4" />
                                    Shortlist
                                 </button>
                                 <button
                                    onClick={() => handleUpdateApplicationStatus(app._id, 'accepted')}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm hover:bg-green-100"
                                 >
                                    <Check className="w-4 h-4" />
                                    Accept
                                 </button>
                                 <button
                                    onClick={() => handleUpdateApplicationStatus(app._id, 'rejected')}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-100"
                                 >
                                    <X className="w-4 h-4" />
                                    Reject
                                 </button>
                              </div>
                           ) : null}
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}
      </div>
   );

   // Render application card (student view)
   const renderApplicationCard = (application) => (
      <div key={application._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
         <div className="flex justify-between items-start mb-3">
            <div>
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{application.internship?.title}</h3>
               <p className="text-gray-600 dark:text-gray-400">{application.internship?.company}</p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(application.status)}`}>
               {application.status}
            </span>
         </div>

         <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span className="flex items-center gap-1">
               <MapPin className="w-4 h-4" />
               {application.internship?.location}
            </span>
            <span className="flex items-center gap-1">
               <Calendar className="w-4 h-4" />
               Applied: {formatDate(application.createdAt)}
            </span>
         </div>

         {application.alumniNotes && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
               <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Recruiter Notes:</strong> {application.alumniNotes}
               </p>
            </div>
         )}

         {(application.status === 'pending' || application.status === 'reviewing') && (
            <button
               onClick={() => handleWithdraw(application._id)}
               className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
            >
               <XCircle className="w-4 h-4" />
               Withdraw Application
            </button>
         )}
      </div>
   );

   return (
      <>
         <Navbar />
         <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-6 pb-10 mt-16">
            <div className="max-w-6xl mx-auto px-4">
               {/* Header */}
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div>
                     <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-7 h-7 text-blue-600" />
                        Internship Opportunities
                     </h1>
                     <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isStudent && 'Find and apply for exciting internship opportunities'}
                        {isAlumni && 'Post internships and find talented students'}
                        {isFaculty && 'Browse available internship opportunities for students'}
                     </p>
                  </div>

                  {isAlumni && (
                     <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                     >
                        <Plus className="w-5 h-5" />
                        Post Internship
                     </button>
                  )}
               </div>

               {/* Tabs */}
               <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                     <button
                        onClick={() => setActiveTab('browse')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                           activeTab === 'browse'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                     >
                        Browse Internships
                     </button>
                     {isStudent && (
                        <button
                           onClick={() => setActiveTab('applications')}
                           className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                              activeTab === 'applications'
                                 ? 'text-blue-600 border-b-2 border-blue-600'
                                 : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                           }`}
                        >
                           My Applications ({myApplications.length})
                        </button>
                     )}
                     {isAlumni && (
                        <button
                           onClick={() => setActiveTab('postings')}
                           className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                              activeTab === 'postings'
                                 ? 'text-blue-600 border-b-2 border-blue-600'
                                 : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                           }`}
                        >
                           My Postings ({myPostings.length})
                        </button>
                     )}
                  </div>
               </div>

               {/* Search & Filters (only for browse tab) */}
               {activeTab === 'browse' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                     <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                           <input
                              type="text"
                              placeholder="Search internships..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500"
                           />
                        </div>
                        <div className="flex items-center gap-2">
                           <Filter className="w-4 h-4 text-gray-500" />
                           <select
                              value={filterLocationType}
                              onChange={(e) => setFilterLocationType(e.target.value)}
                              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                           >
                              <option value="">All Types</option>
                              <option value="remote">Remote</option>
                              <option value="onsite">On-site</option>
                              <option value="hybrid">Hybrid</option>
                           </select>
                        </div>
                     </div>
                  </div>
               )}

               {/* Content */}
               {activeTab === 'browse' && (
                  loading ? (
                     <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                     </div>
                  ) : internships.length === 0 ? (
                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No internships found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                           {searchQuery || filterLocationType 
                              ? 'Try adjusting your search filters'
                              : 'Check back later for new opportunities'
                           }
                        </p>
                     </div>
                  ) : (
                     <div className="grid gap-4 md:grid-cols-2">
                        {internships.map(internship => renderInternshipCard(internship))}
                     </div>
                  )
               )}

               {activeTab === 'applications' && isStudent && (
                  myApplications.length === 0 ? (
                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No applications yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Start applying for internships to see them here</p>
                     </div>
                  ) : (
                     <div className="grid gap-4 md:grid-cols-2">
                        {myApplications.map(application => renderApplicationCard(application))}
                     </div>
                  )
               )}

               {activeTab === 'postings' && isAlumni && (
                  myPostings.length === 0 ? (
                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                        <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No postings yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Create your first internship posting to find talented students</p>
                        <button
                           onClick={openCreateModal}
                           className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                           <Plus className="w-4 h-4" />
                           Post Internship
                        </button>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {myPostings.map(internship => renderMyPostingCard(internship))}
                     </div>
                  )
               )}
            </div>
         </div>

         {/* Create/Edit Modal */}
         {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
               <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                     <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {editingInternship ? 'Edit Internship' : 'Post New Internship'}
                     </h2>
                     <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                           {error}
                        </div>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
                           <input
                              type="text"
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              required
                              placeholder="e.g. Software Engineer Intern"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company *</label>
                           <input
                              type="text"
                              name="company"
                              value={formData.company}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
                           <input
                              type="text"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              required
                              placeholder="e.g. Bangalore, India"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work Type</label>
                           <select
                              name="locationType"
                              value={formData.locationType}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           >
                              <option value="onsite">On-site</option>
                              <option value="remote">Remote</option>
                              <option value="hybrid">Hybrid</option>
                           </select>
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                           <input
                              type="text"
                              name="duration"
                              value={formData.duration}
                              onChange={handleInputChange}
                              placeholder="e.g. 3 months"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid Internship?</label>
                           <select
                              name="stipend.isPaid"
                              value={formData.stipend.isPaid}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           >
                              <option value="true">Yes</option>
                              <option value="false">No (Unpaid)</option>
                           </select>
                        </div>

                        {formData.stipend.isPaid && (
                           <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stipend (per month)</label>
                              <input
                                 type="number"
                                 name="stipend.amount"
                                 value={formData.stipend.amount}
                                 onChange={handleInputChange}
                                 placeholder="e.g. 25000"
                                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                           </div>
                        )}

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application Deadline</label>
                           <input
                              type="date"
                              name="applicationDeadline"
                              value={formData.applicationDeadline}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                           <input
                              type="date"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Openings</label>
                           <input
                              type="number"
                              name="openings"
                              value={formData.openings}
                              onChange={handleInputChange}
                              min="1"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div className="col-span-2">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                           <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleInputChange}
                              required
                              rows={4}
                              placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div className="col-span-2">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements</label>
                           <textarea
                              name="requirements"
                              value={formData.requirements}
                              onChange={handleInputChange}
                              rows={3}
                              placeholder="List the requirements and qualifications needed..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div className="col-span-2">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
                           <input
                              type="text"
                              name="skills"
                              value={formData.skills}
                              onChange={handleInputChange}
                              placeholder="e.g. React, Node.js, MongoDB"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                           <input
                              type="email"
                              name="contactEmail"
                              value={formData.contactEmail}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">External Link</label>
                           <input
                              type="url"
                              name="externalLink"
                              value={formData.externalLink}
                              onChange={handleInputChange}
                              placeholder="https://..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                        </div>
                     </div>

                     <div className="flex gap-3 pt-4">
                        <button
                           type="button"
                           onClick={() => setShowModal(false)}
                           className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                           Cancel
                        </button>
                        <button
                           type="submit"
                           disabled={submitting}
                           className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                           {editingInternship ? 'Update' : 'Post'} Internship
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Apply Modal */}
         {showApplyModal && applyingTo && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
               <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                     <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Apply for Internship</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{applyingTo.title} at {applyingTo.company}</p>
                     </div>
                     <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                     </button>
                  </div>

                  <form onSubmit={handleApply} className="p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Letter *</label>
                        <textarea
                           value={applicationData.coverLetter}
                           onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                           required
                           rows={5}
                           placeholder="Tell us why you're interested in this internship and what makes you a great fit..."
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resume Link</label>
                        <input
                           type="url"
                           value={applicationData.resume}
                           onChange={(e) => setApplicationData(prev => ({ ...prev, resume: e.target.value }))}
                           placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portfolio Link</label>
                        <input
                           type="url"
                           value={applicationData.portfolio}
                           onChange={(e) => setApplicationData(prev => ({ ...prev, portfolio: e.target.value }))}
                           placeholder="Link to your portfolio or GitHub"
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Stipend</label>
                        <input
                           type="text"
                           value={applicationData.expectedStipend}
                           onChange={(e) => setApplicationData(prev => ({ ...prev, expectedStipend: e.target.value }))}
                           placeholder="e.g. 20000-25000 INR/month"
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available From</label>
                        <input
                           type="date"
                           value={applicationData.availableFrom}
                           onChange={(e) => setApplicationData(prev => ({ ...prev, availableFrom: e.target.value }))}
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                     </div>

                     <div className="flex gap-3 pt-4">
                        <button
                           type="button"
                           onClick={() => setShowApplyModal(false)}
                           className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                           Cancel
                        </button>
                        <button
                           type="submit"
                           disabled={submitting}
                           className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                           Submit Application
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </>
   );
};

export default Internships;
