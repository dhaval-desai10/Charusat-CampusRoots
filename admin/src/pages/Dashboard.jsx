import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, TrendingUp, GraduationCap, Briefcase } from 'lucide-react';
import api from '@/lib/api';

export default function Dashboard() {
   const [stats, setStats] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchStats();
   }, []);

   const fetchStats = async () => {
      try {
         const response = await api.get('/dashboard/stats');
         if (response.data.success) {
            setStats(response.data.stats);
         }
      } catch (error) {
         console.error('Failed to fetch stats:', error);
      } finally {
         setLoading(false);
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
         </div>
      );
   }

   const statCards = [
      { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'from-blue-500 to-blue-600' },
      { title: 'Total Posts', value: stats?.totalPosts || 0, icon: FileText, color: 'from-green-500 to-green-600' },
      { title: 'Total Reunions', value: stats?.totalReunions || 0, icon: Calendar, color: 'from-purple-500 to-purple-600' },
      { title: 'Recent Signups (30d)', value: stats?.recentSignups || 0, icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
      { title: 'Upcoming Reunions', value: stats?.upcomingReunions || 0, icon: Calendar, color: 'from-pink-500 to-rose-600' },
   ];

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Welcome to CampusRoots Admin Panel</p>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {statCards.map((stat) => (
               <Card key={stat.title} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm text-slate-400">{stat.title}</p>
                           <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                           <stat.icon className="w-6 h-6 text-white" />
                        </div>
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>

         {/* Users by Role */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
               <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                     <Briefcase className="w-5 h-5 text-amber-500" />
                     Users by Role
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                     Distribution of users by their roles
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <div className="space-y-4">
                     {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                 role === 'alumni' ? 'bg-blue-500' :
                                 role === 'student' ? 'bg-green-500' :
                                 role === 'faculty' ? 'bg-purple-500' :
                                 'bg-amber-500'
                              }`} />
                              <span className="text-slate-300 capitalize">{role}</span>
                           </div>
                           <span className="text-white font-semibold">{count}</span>
                        </div>
                     ))}
                     {(!stats?.usersByRole || Object.keys(stats.usersByRole).length === 0) && (
                        <p className="text-slate-500 text-center py-4">No data available</p>
                     )}
                  </div>
               </CardContent>
            </Card>

            {/* Users by Batch */}
            <Card className="bg-slate-800/50 border-slate-700">
               <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                     <GraduationCap className="w-5 h-5 text-amber-500" />
                     Users by Batch
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                     Top batches by user count
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                     {stats?.usersByBatch?.slice(0, 10).map((batch) => (
                        <div key={batch._id} className="flex items-center justify-between">
                           <span className="text-slate-300">{batch._id || 'Not specified'}</span>
                           <div className="flex items-center gap-3">
                              <div className="w-32 bg-slate-700 rounded-full h-2">
                                 <div
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full"
                                    style={{
                                       width: `${Math.min((batch.count / (stats?.totalUsers || 1)) * 100 * 3, 100)}%`
                                    }}
                                 />
                              </div>
                              <span className="text-white font-semibold w-8 text-right mr-3">{batch.count}</span>
                           </div>
                        </div>
                     ))}
                     {(!stats?.usersByBatch || stats.usersByBatch.length === 0) && (
                        <p className="text-slate-500 text-center py-4">No data available</p>
                     )}
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
