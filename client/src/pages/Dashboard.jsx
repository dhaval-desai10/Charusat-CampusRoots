import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  GraduationCap,
  Github,
  Linkedin,
  Globe,
  Phone,
  Mail,
  Edit2,
  User,
  MapPin,
  Sparkles,
  Link2,
  Code2,
  Building2,
} from "lucide-react";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEditProfile = () => {
    navigate("/complete-profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--primary-blue)]/5 dark:to-[var(--accent-orange)]/5">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Hero Card */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          {/* Gradient Banner */}
          <div className="h-32 sm:h-40 relative overflow-hidden">
            <img
              src="/charusat.png"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          </div>

          {/* Profile Header */}
          <div className="px-6 sm:px-8 pb-6 -mt-16 sm:-mt-20 relative">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-[var(--card-bg)] shadow-xl overflow-hidden bg-[var(--card-bg)]">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-blue)]/70 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/70 flex items-center justify-center">
                      <User size={40} className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 pt-4 sm:pt-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                      {user?.name}
                    </h2>
                    {user?.currentRole && user?.currentCompany && (
                      <p className="text-[var(--text-secondary)] mt-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {user.currentRole} at {user.currentCompany}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] mt-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{user?.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleEditProfile}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[var(--primary-blue)] to-[var(--primary-blue)]/80 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/80 hover:opacity-90 rounded-xl transition-all duration-200 shadow-lg shadow-[var(--primary-blue)]/20 dark:shadow-[var(--accent-orange)]/20"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>

                {/* Bio */}
                {user?.bio && (
                  <p className="text-[var(--text-secondary)] mt-4 text-sm leading-relaxed max-w-2xl">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Academic & Professional Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {user?.batch && (
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center mb-3">
                    <GraduationCap className="w-5 h-5 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                  </div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                    Batch
                  </p>
                  <p className="text-lg font-semibold text-[var(--text-primary)] mt-1">
                    {user.batch}
                  </p>
                </div>
              )}

              {user?.department && (
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center mb-3">
                    <MapPin className="w-5 h-5 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                  </div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                    Department
                  </p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mt-1 line-clamp-2">
                    {user.department}
                  </p>
                </div>
              )}

              {user?.currentCompany && (
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center mb-3">
                    <Briefcase className="w-5 h-5 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                  </div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                    Company
                  </p>
                  <p className="text-lg font-semibold text-[var(--text-primary)] mt-1">
                    {user.currentCompany}
                  </p>
                </div>
              )}

              {user?.mobileNumber && (
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center mb-3">
                    <Phone className="w-5 h-5 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                  </div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                    Mobile
                  </p>
                  <p className="text-lg font-semibold text-[var(--text-primary)] mt-1">
                    {user.mobileNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Skills Card */}
            {user?.skills && user.skills.length > 0 && (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Skills & Expertise
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {user.skills.length} skills
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-[var(--primary-blue)]/10 to-[var(--primary-blue)]/5 dark:from-[var(--accent-orange)]/10 dark:to-[var(--accent-orange)]/5 text-[var(--primary-blue)] dark:text-[var(--accent-orange)] rounded-xl text-sm font-medium border border-[var(--primary-blue)]/20 dark:border-[var(--accent-orange)]/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Social Links & Coming Soon */}
          <div className="space-y-6">
            {/* Social Links Card */}
            {(user?.linkedIn || user?.github || user?.portfolioUrl) && (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Connect
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Social profiles
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {user?.linkedIn && (
                    <a
                      href={user.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:text-[var(--primary-blue)] dark:hover:text-[var(--accent-orange)] bg-[var(--background)] hover:bg-[var(--primary-blue)]/5 dark:hover:bg-[var(--accent-orange)]/10 border border-[var(--border)] rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center group-hover:bg-[#0A66C2]/20 transition-colors">
                        <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                      </div>
                      <span className="font-medium">LinkedIn</span>
                    </a>
                  )}
                  {user?.github && (
                    <a
                      href={user.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:text-[var(--primary-blue)] dark:hover:text-[var(--accent-orange)] bg-[var(--background)] hover:bg-[var(--primary-blue)]/5 dark:hover:bg-[var(--accent-orange)]/10 border border-[var(--border)] rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)]/10 flex items-center justify-center group-hover:bg-[var(--text-primary)]/20 transition-colors">
                        <Github className="w-4 h-4 text-[var(--text-primary)]" />
                      </div>
                      <span className="font-medium">GitHub</span>
                    </a>
                  )}
                  {user?.portfolioUrl && (
                    <a
                      href={user.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:text-[var(--primary-blue)] dark:hover:text-[var(--accent-orange)] bg-[var(--background)] hover:bg-[var(--primary-blue)]/5 dark:hover:bg-[var(--accent-orange)]/10 border border-[var(--border)] rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <Globe className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="font-medium">Portfolio</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
