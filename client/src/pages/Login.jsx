import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Eye, EyeOff, X, Mail, Lock, User, Camera, ArrowLeft, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const Login = () => {
   const { user, loading, login, loginWithGoogle, setUser } = useAuth();
   const navigate = useNavigate();
   
   // Form state
   const [isSignup, setIsSignup] = useState(false);
   const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
   });
   const [profilePhoto, setProfilePhoto] = useState(null);
   const [photoPreview, setPhotoPreview] = useState(null);
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [error, setError] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const fileInputRef = useRef(null);

   // OTP verification state
   const [showOtpScreen, setShowOtpScreen] = useState(false);
   const [otp, setOtp] = useState(['', '', '', '', '', '']);
   const [otpError, setOtpError] = useState('');
   const [verifying, setVerifying] = useState(false);
   const [resending, setResending] = useState(false);
   const [resendCooldown, setResendCooldown] = useState(0);
   const otpInputRefs = useRef([]);

   useEffect(() => {
      if (user && !loading) {
         navigate(user.isProfileComplete ? '/flashback' : '/complete-profile');
      }
   }, [user, loading, navigate]);

   // Reset form when switching between login/signup
   useEffect(() => {
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setProfilePhoto(null);
      setPhotoPreview(null);
      setError('');
      setShowOtpScreen(false);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
   }, [isSignup]);

   // Resend cooldown timer
   useEffect(() => {
      if (resendCooldown > 0) {
         const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
         return () => clearTimeout(timer);
      }
   }, [resendCooldown]);

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      setError('');
   };

   const handlePhotoChange = (e) => {
      const file = e.target.files[0];
      if (file) {
         if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
         }
         if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
         }
         setProfilePhoto(file);
         setPhotoPreview(URL.createObjectURL(file));
         setError('');
      }
   };

   const removePhoto = () => {
      setProfilePhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
   };

   const validateEmail = (email) => {
      return email.endsWith('@charusat.edu.in') || email.endsWith('@charusat.ac.in');
   };

   // Handle OTP input change
   const handleOtpChange = (index, value) => {
      if (!/^\d*$/.test(value)) return; // Only allow digits
      
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1); // Only keep last digit
      setOtp(newOtp);
      setOtpError('');

      // Auto-focus next input
      if (value && index < 5) {
         otpInputRefs.current[index + 1]?.focus();
      }
   };

   // Handle OTP paste
   const handleOtpPaste = (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').slice(0, 6);
      if (!/^\d+$/.test(pastedData)) return;

      const newOtp = [...otp];
      pastedData.split('').forEach((char, index) => {
         if (index < 6) newOtp[index] = char;
      });
      setOtp(newOtp);
      
      // Focus last filled input or last input
      const lastIndex = Math.min(pastedData.length - 1, 5);
      otpInputRefs.current[lastIndex]?.focus();
   };

   // Handle OTP backspace
   const handleOtpKeyDown = (index, e) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
         otpInputRefs.current[index - 1]?.focus();
      }
   };

   // Send OTP for signup
   const handleSendOtp = async () => {
      setError('');

      // Validate email domain
      if (!validateEmail(formData.email)) {
         setError('Only @charusat.edu.in and @charusat.ac.in emails are allowed');
         return;
      }

      // Signup validation
      if (!formData.name.trim()) {
         setError('Name is required');
         return;
      }
      if (formData.password.length < 6) {
         setError('Password must be at least 6 characters');
         return;
      }
      if (formData.password !== formData.confirmPassword) {
         setError('Passwords do not match');
         return;
      }

      setSubmitting(true);

      try {
         // Send OTP request
         const response = await axios.post(`${API_BASE}/email-otp/send`, {
            email: formData.email.toLowerCase().trim(),
            name: formData.name.trim(),
            password: formData.password
         });

         if (response.data.success) {
            setShowOtpScreen(true);
            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
            // Focus first OTP input
            setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
         }
      } catch (error) {
         setError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
      } finally {
         setSubmitting(false);
      }
   };

   // Verify OTP and complete registration
   const handleVerifyOtp = async () => {
      const otpValue = otp.join('');
      if (otpValue.length !== 6) {
         setOtpError('Please enter the complete 6-digit OTP');
         return;
      }

      setVerifying(true);
      setOtpError('');

      try {
         const response = await axios.post(`${API_BASE}/email-otp/verify`, {
            email: formData.email.toLowerCase().trim(),
            otp: otpValue
         }, { withCredentials: true });

         if (response.data.success) {
            // Update user context
            setUser(response.data.user);
            // Navigate to complete profile
            navigate('/complete-profile');
         }
      } catch (error) {
         setOtpError(error.response?.data?.message || 'Invalid OTP. Please try again.');
      } finally {
         setVerifying(false);
      }
   };

   // Resend OTP
   const handleResendOtp = async () => {
      if (resendCooldown > 0) return;

      setResending(true);
      setOtpError('');

      try {
         const response = await axios.post(`${API_BASE}/email-otp/resend`, {
            email: formData.email.toLowerCase().trim()
         });

         if (response.data.success) {
            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
         }
      } catch (error) {
         setOtpError(error.response?.data?.message || 'Failed to resend OTP');
      } finally {
         setResending(false);
      }
   };

   // Go back from OTP screen
   const handleBackFromOtp = () => {
      setShowOtpScreen(false);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      // Validate email domain
      if (!validateEmail(formData.email)) {
         setError('Only @charusat.edu.in and @charusat.ac.in emails are allowed');
         return;
      }

      if (isSignup) {
         // For signup, send OTP first
         await handleSendOtp();
      } else {
         // Login
         setSubmitting(true);
         const result = await login(formData.email, formData.password);
         setSubmitting(false);

         if (!result.success) {
            setError(result.error);
         }
      }
   };

   if (loading) {
      return (
         <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary-blue)] border-t-transparent"></div>
         </div>
      );
   }

   // OTP Verification Screen
   if (showOtpScreen) {
      return (
         <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
               <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 shadow-sm">
                  {/* Back Button */}
                  <button
                     onClick={handleBackFromOtp}
                     className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
                  >
                     <ArrowLeft className="w-4 h-4" />
                     <span className="text-sm">Back to signup</span>
                  </button>

                  {/* Header */}
                  <div className="text-center mb-8">
                     <div className="w-16 h-16 bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                     </div>
                     <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                        Verify Your Email
                     </h2>
                     <p className="text-sm text-[var(--text-secondary)]">
                        We've sent a 6-digit code to
                     </p>
                     <p className="text-sm font-medium text-[var(--primary-blue)] dark:text-[var(--accent-orange)] mt-1">
                        {formData.email}
                     </p>
                  </div>

                  {/* OTP Error */}
                  {otpError && (
                     <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">{otpError}</p>
                     </div>
                  )}

                  {/* OTP Input */}
                  <div className="flex justify-center gap-2 mb-6">
                     {otp.map((digit, index) => (
                        <input
                           key={index}
                           ref={el => otpInputRefs.current[index] = el}
                           type="text"
                           inputMode="numeric"
                           maxLength={1}
                           value={digit}
                           onChange={(e) => handleOtpChange(index, e.target.value)}
                           onKeyDown={(e) => handleOtpKeyDown(index, e)}
                           onPaste={handleOtpPaste}
                           className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] dark:focus:ring-[var(--accent-orange)] focus:border-transparent transition-all"
                        />
                     ))}
                  </div>

                  {/* Verify Button */}
                  <button
                     onClick={handleVerifyOtp}
                     disabled={verifying || otp.join('').length !== 6}
                     className="w-full py-3 bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                  >
                     {verifying ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           Verifying...
                        </>
                     ) : (
                        'Verify & Create Account'
                     )}
                  </button>

                  {/* Resend OTP */}
                  <div className="mt-6 text-center">
                     <p className="text-sm text-[var(--text-secondary)]">
                        Didn't receive the code?
                     </p>
                     <button
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || resending}
                        className="mt-2 flex items-center justify-center gap-2 mx-auto text-sm font-medium text-[var(--primary-blue)] dark:text-[var(--accent-orange)] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                     >
                        {resending ? (
                           <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Sending...
                           </>
                        ) : resendCooldown > 0 ? (
                           `Resend in ${resendCooldown}s`
                        ) : (
                           <>
                              <RefreshCw className="w-4 h-4" />
                              Resend Code
                           </>
                        )}
                     </button>
                  </div>

                  {/* Info */}
                  <div className="mt-6 p-4 bg-[var(--hover-bg)] rounded-lg">
                     <p className="text-xs text-[var(--text-secondary)] text-center">
                        The code expires in 10 minutes. Check your spam folder if you don't see the email.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[var(--background)] flex">
         {/* Left Side - Branding (Desktop Only) */}
         <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary-blue)] dark:bg-[#1a1f2e] flex-col justify-center px-16">
            <div className="max-w-md">
               <div className="w-12 h-12 bg-white/20 dark:bg-[var(--accent-orange)]/20 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white dark:text-[var(--accent-orange)]">CR</span>
               </div>
               <h1 className="text-4xl font-bold text-white dark:text-[var(--text-primary)] mb-4">
                  CampusRoots
               </h1>
               <p className="text-lg text-white/80 dark:text-[var(--text-secondary)] mb-8">
                  Connect with fellow CHARUSAT alumni and grow your professional network.
               </p>
               
               <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-white/10 dark:bg-[var(--accent-orange)]/10 rounded-lg">
                     <div className="w-2 h-2 rounded-full bg-white dark:bg-[var(--accent-orange)] mt-2 flex-shrink-0"></div>
                     <p className="text-white/90 dark:text-[var(--text-primary)]">Find alumni from your batch and department</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/10 dark:bg-[var(--accent-orange)]/10 rounded-lg">
                     <div className="w-2 h-2 rounded-full bg-white dark:bg-[var(--accent-orange)] mt-2 flex-shrink-0"></div>
                     <p className="text-white/90 dark:text-[var(--text-primary)]">Discover career opportunities and mentorship</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/10 dark:bg-[var(--accent-orange)]/10 rounded-lg">
                     <div className="w-2 h-2 rounded-full bg-white dark:bg-[var(--accent-orange)] mt-2 flex-shrink-0"></div>
                     <p className="text-white/90 dark:text-[var(--text-primary)]">Stay updated with events and reunions</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Side - Login/Signup Form */}
         <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
            <div className="w-full max-w-sm">
               {/* Mobile Logo */}
               <div className="lg:hidden text-center mb-8">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">CampusRoots</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">CHARUSAT Alumni Network</p>
               </div>

               {/* Login/Signup Card */}
               <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 shadow-sm">
                  <div className="text-center mb-6">
                     <div className="lg:hidden w-12 h-12 bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-white">CR</span>
                     </div>
                     <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                        {isSignup ? 'Create Account' : 'Welcome back'}
                     </h2>
                     <p className="text-sm text-[var(--text-secondary)]">
                        {isSignup ? 'Join the alumni network' : 'Sign in to your account'}
                     </p>
                  </div>

                  {/* Access Notice */}
                  <div className="bg-[var(--primary-blue)]/5 dark:bg-[var(--accent-orange)]/10 border border-[var(--primary-blue)]/20 dark:border-[var(--accent-orange)]/20 rounded-lg p-4 mb-6">
                     <p className="text-sm text-[var(--text-primary)] text-center font-medium">
                        Exclusive access for CHARUSAT emails
                     </p>
                     <p className="text-xs text-[var(--primary-blue)] dark:text-[var(--accent-orange)] text-center mt-1 font-medium">
                        @charusat.edu.in • @charusat.ac.in
                     </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                     <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                     </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                     {/* Profile Photo (Signup only) */}
                     {isSignup && (
                        <div className="flex flex-col items-center gap-3">
                           <div className="relative">
                              {photoPreview ? (
                                 <div className="relative">
                                    <img
                                       src={photoPreview}
                                       alt="Profile preview"
                                       className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border)]"
                                    />
                                    <button
                                       type="button"
                                       onClick={removePhoto}
                                       className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                                    >
                                       <X className="w-3 h-3" />
                                    </button>
                                 </div>
                              ) : (
                                 <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-20 h-20 rounded-full bg-[var(--hover-bg)] border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-[var(--text-secondary)] hover:border-[var(--primary-blue)] dark:hover:border-[var(--accent-orange)] hover:text-[var(--primary-blue)] dark:hover:text-[var(--accent-orange)] transition-colors"
                                 >
                                    <Camera className="w-6 h-6" />
                                 </button>
                              )}
                           </div>
                           <p className="text-xs text-[var(--text-secondary)]">
                              {photoPreview ? 'Click X to remove' : 'Add profile photo (optional)'}
                           </p>
                           <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="hidden"
                           />
                        </div>
                     )}

                     {/* Name (Signup only) */}
                     {isSignup && (
                        <div>
                           <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                              Full Name
                           </label>
                           <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                              <input
                                 type="text"
                                 name="name"
                                 value={formData.name}
                                 onChange={handleInputChange}
                                 placeholder="Enter your full name"
                                 className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] dark:focus:ring-[var(--accent-orange)] focus:border-transparent"
                                 required
                              />
                           </div>
                        </div>
                     )}

                     {/* Email */}
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                           Email
                        </label>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                           <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="yourname@charusat.edu.in"
                              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] dark:focus:ring-[var(--accent-orange)] focus:border-transparent"
                              required
                           />
                        </div>
                     </div>

                     {/* Password */}
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                           Password
                        </label>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                           <input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder={isSignup ? 'Min 6 characters' : 'Enter your password'}
                              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] dark:focus:ring-[var(--accent-orange)] focus:border-transparent"
                              required
                           />
                           <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                           >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                           </button>
                        </div>
                     </div>

                     {/* Confirm Password (Signup only) */}
                     {isSignup && (
                        <div>
                           <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                              Confirm Password
                           </label>
                           <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                              <input
                                 type={showConfirmPassword ? 'text' : 'password'}
                                 name="confirmPassword"
                                 value={formData.confirmPassword}
                                 onChange={handleInputChange}
                                 placeholder="Confirm your password"
                                 className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] dark:focus:ring-[var(--accent-orange)] focus:border-transparent"
                                 required
                              />
                              <button
                                 type="button"
                                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              >
                                 {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                           </div>
                        </div>
                     )}

                     {/* Submit Button */}
                     <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                     >
                        {submitting ? (
                           <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {isSignup ? 'Sending OTP...' : 'Signing In...'}
                           </>
                        ) : (
                           isSignup ? 'Continue with Email Verification' : 'Sign In'
                        )}
                     </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-6">
                     <div className="flex-1 h-px bg-[var(--border)]"></div>
                     <span className="text-xs text-[var(--text-secondary)]">or</span>
                     <div className="flex-1 h-px bg-[var(--border)]"></div>
                  </div>

                  {/* Google Login Button */}
                  <button
                     onClick={loginWithGoogle}
                     className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-primary)] font-medium transition-all"
                  >
                     <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                     </svg>
                     Continue with Google
                  </button>

                  {/* Toggle Login/Signup */}
                  <p className="text-sm text-center text-[var(--text-secondary)] mt-6">
                     {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                     <button
                        type="button"
                        onClick={() => setIsSignup(!isSignup)}
                        className="text-[var(--primary-blue)] dark:text-[var(--accent-orange)] hover:underline font-medium"
                     >
                        {isSignup ? 'Sign In' : 'Sign Up'}
                     </button>
                  </p>

                  {/* Terms */}
                  <p className="text-xs text-center text-[var(--text-secondary)] mt-4">
                     By continuing, you agree to our Terms and Privacy Policy
                  </p>
               </div>

               {/* Help Link */}
               <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
                  Need help? <a href="mailto:support@campusroots.com" className="text-[var(--primary-blue)] dark:text-[var(--accent-orange)] hover:underline">Contact support</a>
               </p>
            </div>
         </div>
      </div>
   );
};

export default Login;
