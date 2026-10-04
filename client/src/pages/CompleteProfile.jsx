import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, User, Briefcase, GraduationCap, Link2, Phone, FileText, Plus, Sparkles, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

const CompleteProfile = () => {
   const { user, updateProfile } = useAuth();
   const navigate = useNavigate();
   const isEditing = user?.isProfileComplete;
   
   const [formData, setFormData] = useState({
      name: user?.name || '',
      department: user?.department || '',
      currentCompany: user?.currentCompany || '',
      currentRole: user?.currentRole || '',
      currentEducation: user?.currentEducation || '',
      skills: user?.skills || [],
      linkedIn: user?.linkedIn || '',
      github: user?.github || '',
      portfolioUrl: user?.portfolioUrl || '',
      bio: user?.bio || '',
      mobileNumber: user?.mobileNumber || ''
   });
   
   const [skillInput, setSkillInput] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   // OTP related states
   const [otpSent, setOtpSent] = useState(false);
   const [otp, setOtp] = useState('');
   const [otpVerified, setOtpVerified] = useState(user?.mobileVerified || false);
   const [otpLoading, setOtpLoading] = useState(false);
   const [otpError, setOtpError] = useState('');
   const [otpSuccess, setOtpSuccess] = useState('');
   const [countdown, setCountdown] = useState(0);

   // Countdown timer for OTP resend
   useEffect(() => {
      if (countdown > 0) {
         const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
         return () => clearTimeout(timer);
      }
   }, [countdown]);

   // Check if mobile number changed from verified one
   useEffect(() => {
      if (user?.mobileVerified && formData.mobileNumber !== user?.mobileNumber) {
         setOtpVerified(false);
         setOtpSent(false);
         setOtp('');
      } else if (user?.mobileVerified && formData.mobileNumber === user?.mobileNumber) {
         setOtpVerified(true);
      }
   }, [formData.mobileNumber, user?.mobileNumber, user?.mobileVerified]);

   const departments = [
      'Computer Science & Engineering',
      'Information Technology',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Electronics & Communication',
      'Chemical Engineering',
      'MBA',
      'Other'
   ];

   const handleChange = (e) => {
      setFormData({
         ...formData,
         [e.target.name]: e.target.value
      });
   };

   const addSkill = () => {
      if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
         setFormData({
            ...formData,
            skills: [...formData.skills, skillInput.trim()]
         });
         setSkillInput('');
      }
   };

   const removeSkill = (skillToRemove) => {
      setFormData({
         ...formData,
         skills: formData.skills.filter(skill => skill !== skillToRemove)
      });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      if (!formData.department) {
         setError('Department is required');
         setLoading(false);
         return;
      }

      // Check if mobile number needs verification
      if (formData.mobileNumber && !otpVerified && formData.mobileNumber !== user?.mobileNumber) {
         setError('Please verify your mobile number before saving');
         setLoading(false);
         return;
      }

      const result = await updateProfile(formData);
      setLoading(false);

      if (result.success) {
         navigate('/flashback');
      } else {
         setError(result.error);
      }
   };

   // Send OTP
   const handleSendOtp = async () => {
      if (!formData.mobileNumber) {
         setOtpError('Please enter a mobile number');
         return;
      }

      // Basic validation for Indian mobile numbers
      const cleanedNumber = formData.mobileNumber.replace(/[\s\-]/g, '').replace(/^\+91/, '');
      if (!/^[6-9]\d{9}$/.test(cleanedNumber)) {
         setOtpError('Please enter a valid 10-digit Indian mobile number');
         return;
      }

      setOtpLoading(true);
      setOtpError('');
      setOtpSuccess('');

      try {
         const response = await axios.post(`${API_URL}/api/otp/send`, {
            mobileNumber: formData.mobileNumber
         });

         if (response.data.success) {
            setOtpSent(true);
            setCountdown(60);
            setOtpSuccess('OTP sent successfully! Check your phone.');
         }
      } catch (error) {
         setOtpError(error.response?.data?.message || 'Failed to send OTP');
      } finally {
         setOtpLoading(false);
      }
   };

   // Verify OTP
   const handleVerifyOtp = async () => {
      if (!otp || otp.length !== 6) {
         setOtpError('Please enter a valid 6-digit OTP');
         return;
      }

      setOtpLoading(true);
      setOtpError('');
      setOtpSuccess('');

      try {
         const response = await axios.post(`${API_URL}/api/otp/verify`, {
            mobileNumber: formData.mobileNumber,
            otp
         });

         if (response.data.success) {
            setOtpVerified(true);
            setOtpSuccess('Mobile number verified successfully!');
            setOtpSent(false);
            setOtp('');
         }
      } catch (error) {
         setOtpError(error.response?.data?.message || 'Failed to verify OTP');
      } finally {
         setOtpLoading(false);
      }
   };

   // Resend OTP
   const handleResendOtp = async () => {
      if (countdown > 0) return;

      setOtpLoading(true);
      setOtpError('');
      setOtpSuccess('');

      try {
         const response = await axios.post(`${API_URL}/api/otp/resend`, {
            mobileNumber: formData.mobileNumber
         });

         if (response.data.success) {
            setCountdown(30);
            setOtpSuccess('OTP resent successfully!');
            setOtp('');
         }
      } catch (error) {
         setOtpError(error.response?.data?.message || 'Failed to resend OTP');
      } finally {
         setOtpLoading(false);
      }
   };

   const inputClasses = "w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary-blue)] dark:focus:border-[var(--accent-orange)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 dark:focus:ring-[var(--accent-orange)]/20 rounded-xl text-[var(--text-primary)] transition-all duration-200 focus:outline-none placeholder:text-[var(--text-secondary)]/50";

   return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--primary-blue)]/5 dark:to-[var(--accent-orange)]/5 py-8 px-4">
         <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-10">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 rounded-full mb-4">
                  <Sparkles size={16} className="text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                  <span className="text-sm font-medium text-[var(--primary-blue)] dark:text-[var(--accent-orange)]">
                     {isEditing ? 'Edit Profile' : 'Welcome to CampusRoots'}
                  </span>
               </div>
               <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">
                  {isEditing ? 'Update Your Profile' : 'Complete Your Profile'}
               </h1>
               <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                  {isEditing 
                     ? 'Keep your information up to date to stay connected with your network'
                     : 'Help us personalize your experience by completing your profile'}
               </p>
            </div>

            {error && (
               <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-5 py-4 rounded-xl text-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                     <X size={16} />
                  </div>
                  {error}
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
               {/* Profile Picture & Basic Info Card */}
               <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-[var(--primary-blue)] to-[var(--primary-blue)]/70 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/70"></div>
                  <div className="px-6 pb-6 -mt-12">
                     <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 mb-6">
                        <div className="w-24 h-24 rounded-2xl bg-[var(--card-bg)] border-4 border-[var(--card-bg)] shadow-lg overflow-hidden">
                           {user?.profilePicture ? (
                              <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-blue)]/70 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/70 flex items-center justify-center">
                                 <User size={32} className="text-white" />
                              </div>
                           )}
                        </div>
                        <div className="text-center sm:text-left pb-1">
                           <h2 className="text-xl font-semibold text-[var(--text-primary)]">{formData.name || 'Your Name'}</h2>
                           <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                              Full Name <span className="text-red-500">*</span>
                           </label>
                           <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              className={inputClasses}
                              placeholder="Enter your full name"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                              Mobile Number
                              {otpVerified && (
                                 <span className="ml-2 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <CheckCircle2 size={14} />
                                    Verified
                                 </span>
                              )}
                           </label>
                           <div className="flex gap-2">
                              <div className="relative flex-1">
                                 <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                 <input
                                    type="tel"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    placeholder="9876543210"
                                    disabled={otpVerified && formData.mobileNumber === user?.mobileNumber}
                                    className={`${inputClasses} pl-11 ${otpVerified && formData.mobileNumber === user?.mobileNumber ? 'opacity-60' : ''}`}
                                 />
                              </div>
                              {!otpVerified && formData.mobileNumber && (
                                 <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={otpLoading || otpSent}
                                    className="px-4 py-3 bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] hover:opacity-90 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                                 >
                                    {otpLoading ? (
                                       <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                       <ShieldCheck size={18} />
                                    )}
                                    {otpSent ? 'Sent' : 'Verify'}
                                 </button>
                              )}
                           </div>

                           {/* OTP Input Section */}
                           {otpSent && !otpVerified && (
                              <div className="mt-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                                 <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    Enter 6-digit OTP
                                 </label>
                                 <div className="flex gap-2">
                                    <input
                                       type="text"
                                       value={otp}
                                       onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                       placeholder="Enter OTP"
                                       maxLength={6}
                                       className={`${inputClasses} text-center tracking-[0.5em] font-mono text-lg`}
                                    />
                                    <button
                                       type="button"
                                       onClick={handleVerifyOtp}
                                       disabled={otpLoading || otp.length !== 6}
                                       className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                       {otpLoading ? (
                                          <Loader2 size={18} className="animate-spin" />
                                       ) : (
                                          <CheckCircle2 size={18} />
                                       )}
                                       Verify
                                    </button>
                                 </div>
                                 <div className="flex items-center justify-between mt-3">
                                    <button
                                       type="button"
                                       onClick={handleResendOtp}
                                       disabled={countdown > 0 || otpLoading}
                                       className="text-sm text-[var(--primary-blue)] dark:text-[var(--accent-orange)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                                    >
                                       {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => {
                                          setOtpSent(false);
                                          setOtp('');
                                          setOtpError('');
                                          setOtpSuccess('');
                                       }}
                                       className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    >
                                       Change Number
                                    </button>
                                 </div>
                              </div>
                           )}

                           {/* OTP Messages */}
                           {otpError && (
                              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                 <X size={14} />
                                 {otpError}
                              </p>
                           )}
                           {otpSuccess && (
                              <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                 <CheckCircle2 size={14} />
                                 {otpSuccess}
                              </p>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Academic Information Card */}
               <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <div className="flex items-center gap-3 mb-5">
                     <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center">
                        <GraduationCap size={20} className="text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">Academic Information</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Your college details</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {user?.role !== 'faculty' && (
                        <div>
                           <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                              Batch <span className="text-xs text-[var(--text-secondary)]">(Auto-calculated from email)</span>
                           </label>
                           <input
                              type="text"
                              value={user?.batch || 'Not available'}
                              disabled
                              className={`${inputClasses} bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70`}
                           />
                        </div>
                     )}
                     <div className={user?.role === 'faculty' ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                           Department <span className="text-red-500">*</span>
                        </label>
                        <select
                           name="department"
                           value={formData.department}
                           onChange={handleChange}
                           required
                           className={`${inputClasses} cursor-pointer`}
                        >
                           <option value="">Select Department</option>
                           {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                           ))}
                        </select>
                     </div>
                  </div>
               </div>

               {/* Professional Information Card */}
               <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <div className="flex items-center gap-3 mb-5">
                     <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center">
                        <Briefcase size={20} className="text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">Professional Information</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Your current work details</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                           Current Company
                        </label>
                        <input
                           type="text"
                           name="currentCompany"
                           value={formData.currentCompany}
                           onChange={handleChange}
                           placeholder="e.g., Google"
                           className={inputClasses}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                           Current Role
                        </label>
                        <input
                           type="text"
                           name="currentRole"
                           value={formData.currentRole}
                           onChange={handleChange}
                           placeholder="e.g., Software Engineer"
                           className={inputClasses}
                        />
                     </div>
                  </div>

                  {/* Current Education - visible for students */}
                  <div className="mb-5">
                     <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Current Education
                        <span className="text-xs text-[var(--text-secondary)] ml-2">(for students pursuing higher studies)</span>
                     </label>
                     <input
                        type="text"
                        name="currentEducation"
                        value={formData.currentEducation}
                        onChange={handleChange}
                        placeholder="e.g., M.Tech in Computer Science at IIT Delhi"
                        className={inputClasses}
                     />
                  </div>

                  {/* Skills */}
                  <div>
                     <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Skills
                     </label>
                     <div className="flex gap-2 mb-3">
                        <input
                           type="text"
                           value={skillInput}
                           onChange={(e) => setSkillInput(e.target.value)}
                           onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                           placeholder="Type a skill and press Enter"
                           className={`flex-1 ${inputClasses}`}
                        />
                        <button
                           type="button"
                           onClick={addSkill}
                           className="px-4 py-3 bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] hover:opacity-90 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                        >
                           <Plus size={18} />
                           Add
                        </button>
                     </div>
                     {formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                           {formData.skills.map((skill, index) => (
                              <span
                                 key={index}
                                 className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--primary-blue)]/10 to-[var(--primary-blue)]/5 dark:from-[var(--accent-orange)]/10 dark:to-[var(--accent-orange)]/5 text-[var(--primary-blue)] dark:text-[var(--accent-orange)] rounded-xl text-sm font-medium border border-[var(--primary-blue)]/20 dark:border-[var(--accent-orange)]/20"
                              >
                                 {skill}
                                 <button
                                    type="button"
                                    onClick={() => removeSkill(skill)}
                                    className="hover:bg-[var(--primary-blue)]/20 dark:hover:bg-[var(--accent-orange)]/20 rounded-full p-1 transition-colors"
                                 >
                                    <X size={14} />
                                 </button>
                              </span>
                           ))}
                        </div>
                     )}
                  </div>
               </div>

               {/* Social Links Card */}
               <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <div className="flex items-center gap-3 mb-5">
                     <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center">
                        <Link2 size={20} className="text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">Social Links</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Connect your profiles</p>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                           LinkedIn Profile
                        </label>
                        <input
                           type="url"
                           name="linkedIn"
                           value={formData.linkedIn}
                           onChange={handleChange}
                           placeholder="https://linkedin.com/in/yourprofile"
                           className={inputClasses}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                           GitHub Profile
                        </label>
                        <input
                           type="url"
                           name="github"
                           value={formData.github}
                           onChange={handleChange}
                           placeholder="https://github.com/yourusername"
                           className={inputClasses}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                           Portfolio URL
                        </label>
                        <input
                           type="url"
                           name="portfolioUrl"
                           value={formData.portfolioUrl}
                           onChange={handleChange}
                           placeholder="https://yourportfolio.com"
                           className={inputClasses}
                        />
                     </div>
                  </div>
               </div>

               {/* Bio Card */}
               <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <div className="flex items-center gap-3 mb-5">
                     <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center">
                        <FileText size={20} className="text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">About You</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Tell others about yourself</p>
                     </div>
                  </div>
                  
                  <div>
                     <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Bio
                     </label>
                     <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="4"
                        maxLength="500"
                        placeholder="Share a bit about yourself, your interests, and what you're working on..."
                        className={`${inputClasses} resize-none`}
                     />
                     <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-[var(--text-secondary)]">
                           Make your profile stand out with a great bio
                        </p>
                        <p className={`text-xs font-medium ${formData.bio.length > 450 ? 'text-amber-500' : 'text-[var(--text-secondary)]'}`}>
                           {formData.bio.length}/500
                        </p>
                     </div>
                  </div>
               </div>

               {/* Submit Button */}
               <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {isEditing && (
                     <button
                        type="button"
                        onClick={() => navigate('/flashback')}
                        className="flex-1 sm:flex-none px-8 py-3.5 border border-[var(--border)] text-[var(--text-primary)] font-medium rounded-xl transition-all duration-200 hover:bg-[var(--background)]"
                     >
                        Cancel
                     </button>
                  )}
                  <button
                     type="submit"
                     disabled={loading}
                     className="flex-1 bg-gradient-to-r from-[var(--primary-blue)] to-[var(--primary-blue)]/80 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/80 hover:opacity-90 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary-blue)]/20 dark:shadow-[var(--accent-orange)]/20"
                  >
                     {loading ? (
                        <span className="flex items-center justify-center gap-2">
                           <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                           </svg>
                           Saving...
                        </span>
                     ) : isEditing ? 'Update Profile' : 'Complete Profile'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export default CompleteProfile;
