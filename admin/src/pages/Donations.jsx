import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
   Heart, 
   IndianRupee, 
   Users, 
   TrendingUp, 
   Download, 
   Eye, 
   Loader2, 
   CheckCircle,
   Calendar,
   Trophy,
   Building2,
   Sparkles,
   FileText
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/donation';

// Create axios instance
const donationApi = axios.create({
   baseURL: API_BASE_URL
});

// Add token to requests
donationApi.interceptors.request.use((config) => {
   const token = localStorage.getItem('adminToken');
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

export default function Donations() {
   const [donations, setDonations] = useState([]);
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({
      totalAmount: 0,
      uniqueDonors: 0,
      byPurpose: [],
      monthly: []
   });
   const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
   const [activeTab, setActiveTab] = useState('all');
   const [selectedDonation, setSelectedDonation] = useState(null);
   const [showDetails, setShowDetails] = useState(false);
   const [noteText, setNoteText] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const [exporting, setExporting] = useState(false);

   useEffect(() => {
      fetchDonations();
   }, [activeTab, pagination.current]);

   const fetchDonations = async () => {
      setLoading(true);
      try {
         const params = new URLSearchParams();
         params.append('page', pagination.current);
         params.append('limit', '20');
         
         if (activeTab !== 'all') {
            params.append('status', activeTab);
         }

         const response = await donationApi.get(`/admin/all?${params.toString()}`);
         setDonations(response.data.donations);
         setPagination(response.data.pagination);
         setStats(response.data.stats);
      } catch (error) {
         console.error('Error fetching donations:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleViewDetails = async (donation) => {
      try {
         const response = await donationApi.get(`/admin/${donation._id}`);
         setSelectedDonation(response.data);
         setNoteText(response.data.adminNotes || '');
         setShowDetails(true);
      } catch (error) {
         console.error('Error fetching donation details:', error);
      }
   };

   const handleAddNote = async () => {
      if (!noteText.trim() || !selectedDonation) return;
      
      setSubmitting(true);
      try {
         await donationApi.patch(`/admin/${selectedDonation._id}/note`, { note: noteText });
         setSelectedDonation(prev => ({ ...prev, adminNotes: noteText }));
         fetchDonations();
      } catch (error) {
         console.error('Error adding note:', error);
      } finally {
         setSubmitting(false);
      }
   };

   const handleAcknowledge = async (donationId) => {
      try {
         await donationApi.patch(`/admin/${donationId}/acknowledge`);
         fetchDonations();
         if (selectedDonation?._id === donationId) {
            setSelectedDonation(prev => ({ ...prev, acknowledgedAt: new Date() }));
         }
      } catch (error) {
         console.error('Error acknowledging donation:', error);
      }
   };

   const handleExport = async () => {
      setExporting(true);
      try {
         const response = await donationApi.get('/admin/export/csv', {
            responseType: 'blob'
         });
         const url = window.URL.createObjectURL(new Blob([response.data]));
         const link = document.createElement('a');
         link.href = url;
         link.setAttribute('download', `donations_${new Date().toISOString().split('T')[0]}.csv`);
         document.body.appendChild(link);
         link.click();
         link.remove();
      } catch (error) {
         console.error('Error exporting donations:', error);
      } finally {
         setExporting(false);
      }
   };

   const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('en-IN', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   };

   const getPurposeIcon = (purpose) => {
      switch (purpose) {
         case 'scholarship': return Trophy;
         case 'infrastructure': return Building2;
         case 'events': return Calendar;
         case 'other': return Sparkles;
         default: return Heart;
      }
   };

   const getPurposeColor = (purpose) => {
      switch (purpose) {
         case 'scholarship': return 'text-yellow-500 bg-yellow-500/10';
         case 'infrastructure': return 'text-blue-500 bg-blue-500/10';
         case 'events': return 'text-purple-500 bg-purple-500/10';
         case 'other': return 'text-green-500 bg-green-500/10';
         default: return 'text-red-500 bg-red-500/10';
      }
   };

   const tabs = [
      { id: 'all', label: 'All Contributions' },
      { id: 'succeeded', label: 'Successful' },
      { id: 'pending', label: 'Pending' },
      { id: 'failed', label: 'Failed' }
   ];

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Heart className="w-7 h-7 text-red-500" />
                  Contributions
               </h1>
               <p className="text-slate-400 mt-1">
                  Manage and track alumni Contributions
               </p>
            </div>
            <Button
               onClick={handleExport}
               disabled={exporting}
               className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
            >
               {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                  <Download className="w-4 h-4" />
               )}
               Export CSV
            </Button>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/20">
                     <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                     <p className="text-sm text-slate-400">Total Raised</p>
                     <p className="text-2xl font-bold text-white">
                        ₹{(stats.totalAmount || 0).toLocaleString()}
                     </p>
                  </div>
               </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                     <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                     <p className="text-sm text-slate-400">Unique Donors</p>
                     <p className="text-2xl font-bold text-white">
                        {stats.uniqueDonors || 0}
                     </p>
                  </div>
               </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                     <Heart className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                     <p className="text-sm text-slate-400">Total Contributions</p>
                     <p className="text-2xl font-bold text-white">
                        {pagination.count || 0}
                     </p>
                  </div>
               </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/20">
                     <IndianRupee className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                     <p className="text-sm text-slate-400">Avg. Contributions</p>
                     <p className="text-2xl font-bold text-white">
                        ₹{pagination.count ? Math.round(stats.totalAmount / pagination.count).toLocaleString() : 0}
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* Purpose Breakdown */}
         {stats.byPurpose?.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
               <h3 className="text-lg font-semibold text-white mb-4">Contributions by Purpose</h3>
               <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {stats.byPurpose.map((item) => {
                     const Icon = getPurposeIcon(item._id);
                     return (
                        <div key={item._id} className="text-center p-4 rounded-xl bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition-colors">
                           <div className={`inline-flex p-2.5 rounded-xl mb-3 ${getPurposeColor(item._id)}`}>
                              <Icon className="w-5 h-5" />
                           </div>
                           <p className="text-sm text-slate-400 capitalize mb-1">{item._id}</p>
                           <p className="font-bold text-white text-lg">₹{item.total.toLocaleString()}</p>
                           <p className="text-xs text-slate-500">{item.count} Contributions</p>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}

         {/* Tabs */}
         <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => {
                     setActiveTab(tab.id);
                     setPagination(prev => ({ ...prev, current: 1 }));
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                     activeTab === tab.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600'
                  }`}
               >
                  {tab.label}
               </button>
            ))}
         </div>

         {/* Donations List */}
         <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            {loading ? (
               <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
               </div>
            ) : donations.length === 0 ? (
               <div className="text-center py-16">
                  <Heart className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">No Contributions found</p>
               </div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead className="bg-slate-700/50 border-b border-slate-600">
                        <tr>
                           <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Donor
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Amount
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Purpose
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Status
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Date
                           </th>
                           <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Actions
                           </th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-700">
                        {donations.map((donation) => {
                           const Icon = getPurposeIcon(donation.purpose);
                           return (
                              <tr key={donation._id} className="hover:bg-slate-700/50 transition-colors">
                                 <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700">
                                          {donation.isAnonymous ? (
                                             <div className="w-full h-full flex items-center justify-center">
                                                <Users className="w-5 h-5 text-slate-400" />
                                             </div>
                                          ) : donation.user?.profilePicture ? (
                                             <img
                                                src={donation.user.profilePicture}
                                                alt={donation.user.name}
                                                className="w-full h-full object-cover"
                                             />
                                          ) : (
                                             <div className="w-full h-full flex items-center justify-center bg-amber-500 text-white font-medium">
                                                {donation.user?.name?.charAt(0)}
                                             </div>
                                          )}
                                       </div>
                                       <div>
                                          <p className="font-medium text-white">
                                             {donation.isAnonymous ? 'Anonymous' : donation.user?.name}
                                          </p>
                                          {!donation.isAnonymous && (
                                             <p className="text-sm text-slate-400">
                                                {donation.user?.email}
                                             </p>
                                          )}
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-4 py-4">
                                    <span className="font-semibold text-white">
                                       ₹{donation.amount.toLocaleString()}
                                    </span>
                                 </td>
                                 <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                       <div className={`p-1.5 rounded ${getPurposeColor(donation.purpose)}`}>
                                          <Icon className="w-4 h-4" />
                                       </div>
                                       <span className="capitalize text-slate-300">
                                          {donation.purpose}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-4 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                       donation.paymentStatus === 'succeeded' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                       donation.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                       donation.paymentStatus === 'processing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                       'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                       {donation.paymentStatus}
                                    </span>
                                    {donation.acknowledgedAt && (
                                       <span className="ml-2 text-green-400" title="Acknowledged">
                                          <CheckCircle className="w-4 h-4 inline" />
                                       </span>
                                    )}
                                 </td>
                                 <td className="px-4 py-4 text-sm text-slate-400">
                                    {formatDate(donation.createdAt)}
                                 </td>
                                 <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                       <button
                                          onClick={() => handleViewDetails(donation)}
                                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                       >
                                          <Eye className="w-4 h-4" />
                                       </button>
                                       {!donation.acknowledgedAt && donation.paymentStatus === 'succeeded' && (
                                          <button
                                             onClick={() => handleAcknowledge(donation._id)}
                                             title="Acknowledge"
                                             className="p-2 rounded-lg text-slate-400 hover:text-green-400 hover:bg-slate-700 transition-colors"
                                          >
                                             <CheckCircle className="w-4 h-4" />
                                          </button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            )}

            {/* Pagination */}
            {pagination.total > 1 && (
               <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                     Page {pagination.current} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                     <button
                        disabled={pagination.current === 1}
                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                        Previous
                     </button>
                     <button
                        disabled={pagination.current === pagination.total}
                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                        Next
                     </button>
                  </div>
               </div>
            )}
         </div>

         {/* Donation Details Dialog */}
         <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="max-w-lg bg-slate-800 border-slate-700">
               <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-white">
                     <Heart className="w-5 h-5 text-red-500" />
                     Contributions Details
                  </DialogTitle>
               </DialogHeader>
               {selectedDonation && (
                  <div className="space-y-4">
                     {/* Donor Info */}
                     <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/50 border border-slate-600">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700">
                           {selectedDonation.isAnonymous ? (
                              <div className="w-full h-full flex items-center justify-center">
                                 <Users className="w-6 h-6 text-slate-400" />
                              </div>
                           ) : selectedDonation.user?.profilePicture ? (
                              <img
                                 src={selectedDonation.user.profilePicture}
                                 alt={selectedDonation.user.name}
                                 className="w-full h-full object-cover"
                              />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center bg-amber-500 text-white font-medium text-lg">
                                 {selectedDonation.user?.name?.charAt(0)}
                              </div>
                           )}
                        </div>
                        <div>
                           <p className="font-medium text-white">
                              {selectedDonation.isAnonymous ? 'Anonymous Donor' : selectedDonation.user?.name}
                           </p>
                           {!selectedDonation.isAnonymous && (
                              <>
                                 <p className="text-sm text-slate-400">
                                    {selectedDonation.user?.email}
                                 </p>
                                 <p className="text-xs text-slate-500">
                                    {selectedDonation.user?.graduationYear} • {selectedDonation.user?.branch}
                                 </p>
                              </>
                           )}
                        </div>
                     </div>

                     {/* Donation Info */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-slate-700/30">
                           <p className="text-sm text-slate-400">Amount</p>
                           <p className="text-xl font-bold text-white">
                              ₹{selectedDonation.amount.toLocaleString()}
                           </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-700/30">
                           <p className="text-sm text-slate-400">Purpose</p>
                           <p className="font-medium text-white capitalize">
                              {selectedDonation.purpose}
                           </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-700/30">
                           <p className="text-sm text-slate-400">Status</p>
                           <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              selectedDonation.paymentStatus === 'succeeded' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              selectedDonation.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                           }`}>
                              {selectedDonation.paymentStatus}
                           </span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-700/30">
                           <p className="text-sm text-slate-400">Date</p>
                           <p className="font-medium text-white">
                              {formatDate(selectedDonation.createdAt)}
                           </p>
                        </div>
                     </div>

                     {/* Message */}
                     {selectedDonation.message && (
                        <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600">
                           <p className="text-sm text-slate-400 mb-1">Donor's Message</p>
                           <p className="text-slate-300 italic">"{selectedDonation.message}"</p>
                        </div>
                     )}

                     {/* Receipt Link */}
                     {selectedDonation.receiptUrl && (
                        <a
                           href={selectedDonation.receiptUrl}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                           <FileText className="w-4 h-4" />
                           View Receipt
                        </a>
                     )}

                     {/* Acknowledged Status */}
                     {selectedDonation.acknowledgedAt ? (
                        <div className="flex items-center gap-2 text-green-400">
                           <CheckCircle className="w-4 h-4" />
                           <span className="text-sm">Acknowledged on {formatDate(selectedDonation.acknowledgedAt)}</span>
                        </div>
                     ) : selectedDonation.paymentStatus === 'succeeded' && (
                        <button
                           onClick={() => handleAcknowledge(selectedDonation._id)}
                           className="w-full py-2.5 rounded-lg font-medium bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                        >
                           <CheckCircle className="w-4 h-4" />
                           Mark as Acknowledged
                        </button>
                     )}

                     {/* Admin Notes */}
                     <div>
                        <p className="text-sm font-medium text-slate-300 mb-2">
                           Admin Notes
                        </p>
                        <textarea
                           value={noteText}
                           onChange={(e) => setNoteText(e.target.value)}
                           placeholder="Add internal notes about this donation..."
                           rows={3}
                           className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                        />
                        <button
                           onClick={handleAddNote}
                           disabled={submitting || !noteText.trim()}
                           className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                           {submitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                           ) : (
                              <FileText className="w-4 h-4" />
                           )}
                           Save Note
                        </button>
                     </div>
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
}
