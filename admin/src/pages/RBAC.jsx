import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Users, GraduationCap, Briefcase, Save, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { MODULE_LABELS } from '../constants/rbac.js';

const ROLE_CONFIG = {
   student: {
      label: 'Student',
      icon: GraduationCap,
      color: 'from-green-500 to-emerald-600',
      badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30'
   },
   faculty: {
      label: 'Faculty',
      icon: Briefcase,
      color: 'from-purple-500 to-violet-600',
      badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
   },
   alumni: {
      label: 'Alumni',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
   }
};

export default function RBAC() {
   const [selectedRole, setSelectedRole] = useState('student');
   const [permissions, setPermissions] = useState({});
   const [originalPermissions, setOriginalPermissions] = useState({});
   const [modules, setModules] = useState([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

   useEffect(() => {
      fetchPermissions();
   }, []);

   // Auto-clear feedback after 4 seconds
   useEffect(() => {
      if (feedback) {
         const timer = setTimeout(() => setFeedback(null), 4000);
         return () => clearTimeout(timer);
      }
   }, [feedback]);

   const fetchPermissions = async () => {
      setLoading(true);
      try {
         const response = await api.get('/rbac/permissions');
         if (response.data.success) {
            setPermissions(response.data.grouped || {});
            // Deep clone for tracking unsaved changes
            setOriginalPermissions(JSON.parse(JSON.stringify(response.data.grouped || {})));
            setModules(response.data.modules || []);
         }
      } catch (error) {
         console.error('Failed to fetch permissions:', error);
         setFeedback({ type: 'error', message: 'Failed to load permissions' });
      } finally {
         setLoading(false);
      }
   };

   const handleToggle = (module) => {
      setPermissions(prev => ({
         ...prev,
         [selectedRole]: {
            ...prev[selectedRole],
            [module]: !prev[selectedRole]?.[module]
         }
      }));
   };

   const hasUnsavedChanges = () => {
      const current = permissions[selectedRole] || {};
      const original = originalPermissions[selectedRole] || {};
      return modules.some(mod => current[mod] !== original[mod]);
   };

   const savePermissions = async () => {
      setSaving(true);
      setFeedback(null);

      try {
         const rolePerms = permissions[selectedRole] || {};
         const original = originalPermissions[selectedRole] || {};

         // Only send changes
         const changedModules = modules.filter(mod => rolePerms[mod] !== original[mod]);

         for (const mod of changedModules) {
            await api.put('/rbac/permissions', {
               role: selectedRole,
               module: mod,
               enabled: !!rolePerms[mod]
            });
         }

         // Update original to match current
         setOriginalPermissions(prev => ({
            ...prev,
            [selectedRole]: { ...rolePerms }
         }));

         setFeedback({
            type: 'success',
            message: `Permissions updated for ${ROLE_CONFIG[selectedRole]?.label || selectedRole}`
         });
      } catch (error) {
         console.error('Failed to save permissions:', error);
         setFeedback({
            type: 'error',
            message: error.response?.data?.message || 'Failed to save permissions'
         });
      } finally {
         setSaving(false);
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
         </div>
      );
   }

   const rolePerms = permissions[selectedRole] || {};

   return (
      <div className="space-y-6">
         {/* Page Header */}
         <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
               <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
               <h1 className="text-3xl font-bold text-white">RBAC</h1>
               <p className="text-slate-400 mt-0.5">Role-Based Access Control — Manage module permissions for each role</p>
            </div>
         </div>

         {/* Feedback Toast */}
         {feedback && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300 ${
               feedback.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
               {feedback.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
               ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
               )}
               <span className="text-sm font-medium">{feedback.message}</span>
            </div>
         )}

         {/* Role Selector */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
               <CardTitle className="text-white text-lg">Select Role</CardTitle>
               <CardDescription className="text-slate-400">
                  Choose a role to configure its module permissions
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-wrap gap-3">
                  {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
                     const isSelected = selectedRole === roleKey;
                     const RoleIcon = config.icon;
                     return (
                        <button
                           key={roleKey}
                           onClick={() => setSelectedRole(roleKey)}
                           className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                              isSelected
                                 ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/10'
                                 : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                           }`}
                        >
                           <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.color}`}>
                              <RoleIcon className="w-4 h-4 text-white" />
                           </div>
                           {config.label}
                           {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                           )}
                        </button>
                     );
                  })}
               </div>
            </CardContent>
         </Card>

         {/* Permissions Table */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <CardTitle className="text-white text-lg">Feature Permissions</CardTitle>
                     <Badge className={`${ROLE_CONFIG[selectedRole]?.badgeClass || ''} border text-xs`}>
                        {ROLE_CONFIG[selectedRole]?.label || selectedRole}
                     </Badge>
                  </div>
                  {hasUnsavedChanges() && (
                     <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border text-xs animate-pulse">
                        Unsaved Changes
                     </Badge>
                  )}
               </div>
               <CardDescription className="text-slate-400">
                  Toggle access to each module for the {ROLE_CONFIG[selectedRole]?.label || selectedRole} role
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="rounded-lg border border-slate-700 overflow-hidden">
                  <Table>
                     <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-transparent">
                           <TableHead className="text-slate-300 font-semibold">Feature</TableHead>
                           <TableHead className="text-slate-300 font-semibold text-right w-32">Access</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {modules.map((mod) => {
                           const isEnabled = rolePerms[mod] !== false;
                           return (
                              <TableRow
                                 key={mod}
                                 className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                              >
                                 <TableCell className="text-white font-medium">
                                    {MODULE_LABELS[mod] || mod}
                                 </TableCell>
                                 <TableCell className="text-right">
                                    <button
                                       onClick={() => handleToggle(mod)}
                                       className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                                          isEnabled
                                             ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                             : 'bg-slate-600'
                                       }`}
                                    >
                                       <span
                                          className={`inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                             isEnabled ? 'translate-x-8' : 'translate-x-1'
                                          }`}
                                       >
                                          {isEnabled ? (
                                             <CheckCircle className="w-3 h-3 text-green-600" />
                                          ) : (
                                             <XCircle className="w-3 h-3 text-slate-400" />
                                          )}
                                       </span>
                                    </button>
                                    <span className={`ml-3 text-sm font-semibold ${
                                       isEnabled ? 'text-green-400' : 'text-slate-500'
                                    }`}>
                                       {isEnabled ? 'ON' : 'OFF'}
                                    </span>
                                 </TableCell>
                              </TableRow>
                           );
                        })}
                     </TableBody>
                  </Table>
               </div>

               {/* Save Button */}
               <div className="flex justify-end mt-6">
                  <Button
                     onClick={savePermissions}
                     disabled={saving || !hasUnsavedChanges()}
                     className={`px-6 py-2.5 font-semibold transition-all duration-200 ${
                        hasUnsavedChanges()
                           ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25'
                           : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                     }`}
                  >
                     {saving ? (
                        <>
                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                           Saving...
                        </>
                     ) : (
                        <>
                           <Save className="w-4 h-4 mr-2" />
                           Save Changes
                        </>
                     )}
                  </Button>
               </div>
            </CardContent>
         </Card>

         {/* All Roles Overview */}
         <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
               <CardTitle className="text-white text-lg">Permission Overview</CardTitle>
               <CardDescription className="text-slate-400">
                  Quick view of all role permissions
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="rounded-lg border border-slate-700 overflow-hidden">
                  <Table>
                     <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-transparent">
                           <TableHead className="text-slate-300 font-semibold">Feature</TableHead>
                           {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => (
                              <TableHead key={roleKey} className="text-center">
                                 <span className={`${
                                    selectedRole === roleKey ? 'text-amber-400' : 'text-slate-300'
                                 } font-semibold`}>
                                    {config.label}
                                 </span>
                              </TableHead>
                           ))}
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {modules.map((mod) => (
                           <TableRow key={mod} className="border-slate-700 hover:bg-slate-700/30">
                              <TableCell className="text-white font-medium">
                                 {MODULE_LABELS[mod] || mod}
                              </TableCell>
                              {Object.keys(ROLE_CONFIG).map((roleKey) => {
                                 const enabled = permissions[roleKey]?.[mod] !== false;
                                 return (
                                    <TableCell key={roleKey} className="text-center">
                                       {enabled ? (
                                          <span className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
                                             <CheckCircle className="w-4 h-4" />
                                             ON
                                          </span>
                                       ) : (
                                          <span className="inline-flex items-center gap-1 text-slate-500 text-sm font-medium">
                                             <XCircle className="w-4 h-4" />
                                             OFF
                                          </span>
                                       )}
                                    </TableCell>
                                 );
                              })}
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
