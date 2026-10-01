import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
   const [username, setUsername] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const { login } = useAuth();
   const navigate = useNavigate();

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
         const result = await login(username, password);
         if (result.success) {
            navigate('/');
         } else {
            setError(result.message || 'Invalid credentials');
         }
      } catch (err) {
         setError(err.response?.data?.message || 'Login failed. Please try again.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
         <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg mb-4">
                  <Shield className="w-8 h-8 text-white" />
               </div>
               <h1 className="text-3xl font-bold text-white">CampusRoots</h1>
               <p className="text-slate-400 mt-1">Admin Panel</p>
            </div>

            {/* Login Card */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
               <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl text-center text-white">Admin Login</CardTitle>
                  <CardDescription className="text-center text-slate-400">
                     Enter your credentials to access the admin panel
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                     {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                           {error}
                        </div>
                     )}

                     <div className="space-y-2">
                        <Label htmlFor="username" className="text-slate-300">Username</Label>
                        <Input
                           id="username"
                           type="text"
                           placeholder="Enter username"
                           value={username}
                           onChange={(e) => setUsername(e.target.value)}
                           className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500"
                           required
                        />
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">Password</Label>
                        <div className="relative">
                           <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500 pr-10"
                              required
                           />
                           <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                           >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                     </div>

                     <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold"
                        disabled={loading}
                     >
                        {loading ? (
                           <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Signing in...
                           </>
                        ) : (
                           'Sign In'
                        )}
                     </Button>
                  </form>
               </CardContent>
            </Card>

            <p className="text-center text-sm text-slate-500 mt-6">
               Protected admin access only
            </p>
         </div>
      </div>
   );
}
