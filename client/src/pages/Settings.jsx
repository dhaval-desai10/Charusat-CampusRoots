import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { 
   Shield, 
   Users, 
   Eye, 
   EyeOff, 
   Mail, 
   Phone, 
   Briefcase, 
   Code2, 
   Link2, 
   MessageSquare, 
   UserCheck, 
   BookOpen,
   Check,
   Loader2,
   Globe,
   Lock,
   UserX
} from 'lucide-react';

const API_URL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

const Settings = () => {
   const { user, refreshUser } = useAuth();
   const navigate = useNavigate();
   
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [message, setMessage] = useState({ type: '', text: '' });
   
   // Settings state
   const [privacy, setPrivacy] = useState({
      profileVisibility: 'alumni-only',
      showEmail: false,
      showMobile: false,
      showCurrentCompany: true,
      showSkills: true,
      showSocialLinks: true,
      allowMessaging: 'alumni-only',
      showInAlumniDirectory: true,
      allowConnectionRequests: true
   });

   useEffect(() => {
      fetchSettings();
   }, []);

   const fetchSettings = async () => {
      try {
         setLoading(true);
         const response = await axios.get(`${API_URL}/api/settings`);
         
         if (response.data.success) {
            setPrivacy(response.data.settings.privacy || privacy);
         }
      } catch (error) {
         console.error('Failed to fetch settings:', error);
         setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
         setLoading(false);
      }
   };

   const handlePrivacyChange = async (key, value) => {
      try {
         setSaving(true);
         const updatedPrivacy = { ...privacy, [key]: value };
         
         const response = await axios.put(`${API_URL}/api/settings/privacy`, { 
            privacy: { [key]: value } 
         });
         
         if (response.data.success) {
            setPrivacy(updatedPrivacy);
            setMessage({ type: 'success', text: 'Privacy settings updated!' });
         }
      } catch (error) {
         setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings' });
      } finally {
         setSaving(false);
         setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
   };

   const visibilityOptions = [
      { value: 'public', label: 'Public', description: 'Anyone can view', icon: Globe },
      { value: 'alumni-only', label: 'Alumni Only', description: 'Only verified alumni', icon: Users },
      { value: 'connections-only', label: 'Connections', description: 'Only your connections', icon: UserCheck },
      { value: 'private', label: 'Private', description: 'Only you', icon: Lock }
   ];

   const messagingOptions = [
      { value: 'everyone', label: 'Everyone', description: 'Anyone can message you' },
      { value: 'alumni-only', label: 'Alumni Only', description: 'Only verified alumni' },
      { value: 'connections-only', label: 'Connections', description: 'Only your connections' },
      { value: 'none', label: 'No One', description: 'Disable messaging' }
   ];

   if (loading) {
      return (
         <div className="min-h-screen bg-[var(--background)]">
            <Navbar />
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
               <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--primary-blue)]/5 dark:to-[var(--accent-orange)]/5">
         <Navbar />
         
         <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-8">
               <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Privacy Settings</h1>
               <p className="text-[var(--text-secondary)] mt-1">Manage your privacy preferences</p>
            </div>

            {/* Message Toast */}
            {message.text && (
               <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                  message.type === 'success' 
                     ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                     : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
               }`}>
                  {message.type === 'success' ? <Check className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                  {message.text}
               </div>
            )}

            {/* Privacy Settings */}
            <div className="space-y-6">
               {/* Profile Visibility */}
                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center">
                           <Eye className="w-5 h-5 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                        </div>
                        <div>
                           <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile Visibility</h2>
                           <p className="text-sm text-[var(--text-secondary)]">Control who can see your profile</p>
                        </div>
                     </div>
                     
                     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {visibilityOptions.map((option) => (
                           <button
                              key={option.value}
                              onClick={() => handlePrivacyChange('profileVisibility', option.value)}
                              disabled={saving}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                 privacy.profileVisibility === option.value
                                    ? 'border-[var(--primary-blue)] dark:border-[var(--accent-orange)] bg-[var(--primary-blue)]/5 dark:bg-[var(--accent-orange)]/5'
                                    : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                              }`}
                           >
                              <option.icon className={`w-5 h-5 mb-2 ${
                                 privacy.profileVisibility === option.value
                                    ? 'text-[var(--primary-blue)] dark:text-[var(--accent-orange)]'
                                    : 'text-[var(--text-secondary)]'
                              }`} />
                              <h3 className="font-medium text-[var(--text-primary)] text-sm">{option.label}</h3>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">{option.description}</p>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Information Visibility Toggles */}
                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                           <EyeOff className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                           <h2 className="text-lg font-semibold text-[var(--text-primary)]">Information Visibility</h2>
                           <p className="text-sm text-[var(--text-secondary)]">Choose what information others can see</p>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        {[
                           { key: 'showEmail', label: 'Show Email Address', description: 'Display your email to other users', icon: Mail },
                           { key: 'showMobile', label: 'Show Mobile Number', description: 'Display your phone number to other users', icon: Phone },
                           { key: 'showCurrentCompany', label: 'Show Current Company', description: 'Display your workplace information', icon: Briefcase },
                           { key: 'showSkills', label: 'Show Skills', description: 'Display your skills and expertise', icon: Code2 },
                           { key: 'showSocialLinks', label: 'Show Social Links', description: 'Display LinkedIn, GitHub, portfolio links', icon: Link2 }
                        ].map((item) => (
                           <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg bg-[var(--card-bg)] flex items-center justify-center">
                                    <item.icon className="w-5 h-5 text-[var(--text-secondary)]" />
                                 </div>
                                 <div>
                                    <h3 className="font-medium text-[var(--text-primary)] text-sm">{item.label}</h3>
                                    <p className="text-xs text-[var(--text-muted)]">{item.description}</p>
                                 </div>
                              </div>
                              <button
                                 onClick={() => handlePrivacyChange(item.key, !privacy[item.key])}
                                 disabled={saving}
                                 className={`relative w-12 h-7 rounded-full transition-colors ${
                                    privacy[item.key]
                                       ? 'bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)]'
                                       : 'bg-[var(--border)]'
                                 }`}
                              >
                                 <span 
                                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                       privacy[item.key] ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                 />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Messaging Preferences */}
                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                           <MessageSquare className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                           <h2 className="text-lg font-semibold text-[var(--text-primary)]">Messaging Preferences</h2>
                           <p className="text-sm text-[var(--text-secondary)]">Control who can send you messages</p>
                        </div>
                     </div>
                     
                     <div className="grid gap-3 sm:grid-cols-2">
                        {messagingOptions.map((option) => (
                           <button
                              key={option.value}
                              onClick={() => handlePrivacyChange('allowMessaging', option.value)}
                              disabled={saving}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                 privacy.allowMessaging === option.value
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                                    : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                              }`}
                           >
                              <h3 className={`font-medium text-sm ${
                                 privacy.allowMessaging === option.value
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-[var(--text-primary)]'
                              }`}>{option.label}</h3>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">{option.description}</p>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Directory & Connection Settings */}
                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                           <Users className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                           <h2 className="text-lg font-semibold text-[var(--text-primary)]">Directory & Connections</h2>
                           <p className="text-sm text-[var(--text-secondary)]">Manage your presence in the alumni network</p>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[var(--card-bg)] flex items-center justify-center">
                                 <BookOpen className="w-5 h-5 text-[var(--text-secondary)]" />
                              </div>
                              <div>
                                 <h3 className="font-medium text-[var(--text-primary)] text-sm">Show in Alumni Directory</h3>
                                 <p className="text-xs text-[var(--text-muted)]">Allow others to find you in the alumni directory</p>
                              </div>
                           </div>
                           <button
                              onClick={() => handlePrivacyChange('showInAlumniDirectory', !privacy.showInAlumniDirectory)}
                              disabled={saving}
                              className={`relative w-12 h-7 rounded-full transition-colors ${
                                 privacy.showInAlumniDirectory
                                    ? 'bg-green-500'
                                    : 'bg-[var(--border)]'
                              }`}
                           >
                              <span 
                                 className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                    privacy.showInAlumniDirectory ? 'translate-x-5' : 'translate-x-0'
                                 }`}
                              />
                           </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[var(--card-bg)] flex items-center justify-center">
                                 <UserCheck className="w-5 h-5 text-[var(--text-secondary)]" />
                              </div>
                              <div>
                                 <h3 className="font-medium text-[var(--text-primary)] text-sm">Allow Connection Requests</h3>
                                 <p className="text-xs text-[var(--text-muted)]">Let other users send you connection requests</p>
                              </div>
                           </div>
                           <button
                              onClick={() => handlePrivacyChange('allowConnectionRequests', !privacy.allowConnectionRequests)}
                              disabled={saving}
                              className={`relative w-12 h-7 rounded-full transition-colors ${
                                 privacy.allowConnectionRequests
                                    ? 'bg-green-500'
                                    : 'bg-[var(--border)]'
                              }`}
                           >
                              <span 
                                 className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                    privacy.allowConnectionRequests ? 'translate-x-5' : 'translate-x-0'
                                 }`}
                              />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
         </main>
      </div>
   );
};

export default Settings;
