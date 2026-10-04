import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import axios from "axios";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Github,
  Linkedin,
  Users,
  MessageCircle,
  UserPlus,
  UserCheck,
  Clock,
  Lock,
  ExternalLink,
  X,
  Pencil,
  Heart,
  MessageSquare,
  Image,
  BookOpen,
  Trash2,
  Globe,
  Send,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

// Role badge component
const RoleBadge = ({ role }) => {
  const colors = {
    student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    alumni:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    faculty:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <span
      className={`px-3 py-1 text-sm rounded-full font-medium capitalize ${colors[role] || colors.alumni}`}
    >
      {role}
    </span>
  );
};

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutualConnections, setMutualConnections] = useState([]);
  const [showMutualModal, setShowMutualModal] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});
  const [deletingPost, setDeletingPost] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/profile/${userId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setProfile(res.data.profile);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setError(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const res = await axios.get(`${API_BASE}/posts/user/${userId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const formatPostDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(
        `${API_BASE}/posts/${postId}/like`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? { ...post, isLiked: res.data.isLiked, likes: res.data.likes }
              : post,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleComment = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.post(
        `${API_BASE}/posts/${postId}/comments`,
        { content },
        { withCredentials: true },
      );
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? { ...post, comments: res.data.comments }
              : post,
          ),
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await axios.delete(
        `${API_BASE}/posts/${postId}/comments/${commentId}`,
        { withCredentials: true },
      );
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? { ...post, comments: res.data.comments }
              : post,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    setDeletingPost(postId);
    try {
      const res = await axios.delete(`${API_BASE}/posts/${postId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setPosts((prev) => prev.filter((post) => post._id !== postId));
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert(error.response?.data?.message || "Failed to delete post");
    } finally {
      setDeletingPost(null);
    }
  };

  const fetchMutualConnections = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/profile/${userId}/mutual-connections`,
        { withCredentials: true },
      );
      if (res.data.success) {
        setMutualConnections(res.data.mutualConnections);
        setShowMutualModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch mutual connections:", error);
    }
  };

  const handleConnect = async () => {
    try {
      setConnectionLoading(true);
      const res = await axios.post(
        `${API_BASE}/connections/request/${userId}`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, connectionStatus: "pending" }));
      }
    } catch (error) {
      console.error("Failed to send connection request:", error);
      alert(error.response?.data?.message || "Failed to send request");
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleMessage = () => {
    navigate("/chat", { state: { openChatWith: userId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <div className="bg-[var(--card-bg)] rounded-2xl p-8 text-center border border-[var(--border)]">
            <Lock className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {error || "Profile not found"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              This profile may be private or doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Private profile view
  if (profile.isPrivate) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <div className="bg-[var(--card-bg)] rounded-2xl p-8 border border-[var(--border)]">
            <div className="flex flex-col items-center text-center">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
                  <span className="text-3xl text-[var(--text-secondary)]">
                    {profile.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {profile.name}
              </h1>
              <RoleBadge role={profile.role} />
              <div className="mt-6 p-4 bg-[var(--bg-secondary)] rounded-xl">
                <Lock className="w-8 h-8 mx-auto mb-2 text-[var(--text-secondary)]" />
                <p className="text-[var(--text-secondary)]">
                  This profile is only visible to their connections.
                </p>
              </div>
              {profile.canSendConnectionRequest &&
                !profile.isConnected &&
                profile.connectionStatus !== "pending" && (
                  <button
                    onClick={handleConnect}
                    disabled={connectionLoading}
                    className="mt-6 flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <UserPlus className="w-5 h-5" />
                    Connect to see full profile
                  </button>
                )}
              {profile.connectionStatus === "pending" && (
                <div className="mt-6 flex items-center gap-2 px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-xl">
                  <Clock className="w-5 h-5" />
                  Connection request pending
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Go Back
        </button>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:w-[380px] lg:flex-shrink-0">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* Profile Card */}
              <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
                {/* Cover with Image */}
                <div className="h-36 relative overflow-hidden">
                  <img 
                    src="/charusat.png" 
                    alt="Cover" 
                    className="w-full h-full object-contain bg-gradient-to-br from-black/30 to-black/40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                </div>

                {/* Profile Content */}
                <div className="px-5 pb-5 -mt-14 relative">
                  {/* Avatar */}
                  <div className="relative inline-block">
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt={profile.name}
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-[var(--card-bg)] shadow-lg ring-2 ring-[var(--accent)]/20"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-600 border-4 border-[var(--card-bg)] shadow-lg flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                          {profile.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {profile.isConnected && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[var(--card-bg)] flex items-center justify-center">
                        <UserCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name & Role */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold text-[var(--text-primary)]">
                        {profile.name}
                      </h1>
                      <RoleBadge role={profile.role} />
                    </div>
                    {(profile.currentRole || profile.currentCompany) && (
                      <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        {profile.currentRole}
                        {profile.currentRole && profile.currentCompany && " at "}
                        <span className="font-medium text-[var(--text-primary)]">{profile.currentCompany}</span>
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                    <button
                      onClick={fetchMutualConnections}
                      className="flex flex-col items-center hover:text-[var(--accent)] transition-colors"
                    >
                      <span className="text-lg font-bold text-[var(--text-primary)]">
                        {profile.totalConnections || 0}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">Connections</span>
                    </button>
                    {!profile.isOwnProfile && profile.mutualConnectionsCount > 0 && (
                      <button
                        onClick={fetchMutualConnections}
                        className="flex flex-col items-center hover:text-[var(--accent)] transition-colors"
                      >
                        <span className="text-lg font-bold text-blue-500">
                          {profile.mutualConnectionsCount}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">Mutual</span>
                      </button>
                    )}
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-[var(--text-primary)]">
                        {posts.length}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">Posts</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 space-y-2">
                    {profile.isOwnProfile ? (
                      <button
                        onClick={() => navigate("/complete-profile")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-all font-medium"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        {profile.isConnected ? (
                          <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-medium">
                            <UserCheck className="w-4 h-4" />
                            Connected
                          </div>
                        ) : profile.connectionStatus === "pending" ? (
                          <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl font-medium">
                            <Clock className="w-4 h-4" />
                            Request Pending
                          </div>
                        ) : profile.canSendConnectionRequest ? (
                          <button
                            onClick={handleConnect}
                            disabled={connectionLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 font-medium"
                          >
                            <UserPlus className="w-4 h-4" />
                            Connect
                          </button>
                        ) : null}
                        {profile.canMessage && profile.isConnected && (
                          <button
                            onClick={handleMessage}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] transition-colors font-medium"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Send Message
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Card */}
              {profile.bio && (
                <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[var(--accent)]" />
                    About
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Contact & Education Card */}
              <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--accent)]" />
                  Information
                </h3>
                <div className="space-y-3">
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-sm group">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] truncate transition-colors">
                        {profile.email}
                      </span>
                    </a>
                  )}
                  {profile.mobileNumber && (
                    <a href={`tel:${profile.mobileNumber}`} className="flex items-center gap-3 text-sm group">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">
                        {profile.mobileNumber}
                      </span>
                    </a>
                  )}
                  {profile.department && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-[var(--text-secondary)]">{profile.department}</span>
                    </div>
                  )}
                  {profile.batch && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-[var(--text-secondary)]">Batch of {profile.batch}</span>
                    </div>
                  )}
                  {profile.currentEducation && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="text-[var(--text-secondary)]">{profile.currentEducation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills Card */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[var(--accent)]" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-xs font-medium hover:bg-[var(--accent)]/20 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links Card */}
              {(profile.linkedIn || profile.github || profile.portfolioUrl) && (
                <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[var(--accent)]" />
                    Social Links
                  </h3>
                  <div className="space-y-2">
                    {profile.linkedIn && (
                      <a
                        href={profile.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-secondary)] rounded-xl text-sm text-[var(--text-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all group"
                      >
                        <Linkedin className="w-5 h-5 text-blue-600" />
                        <span className="flex-1">LinkedIn</span>
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {profile.github && (
                      <a
                        href={profile.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-secondary)] rounded-xl text-sm text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                      >
                        <Github className="w-5 h-5" />
                        <span className="flex-1">GitHub</span>
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {profile.portfolioUrl && (
                      <a
                        href={profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-secondary)] rounded-xl text-sm text-[var(--text-primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all group"
                      >
                        <LinkIcon className="w-5 h-5 text-[var(--accent)]" />
                        <span className="flex-1">Portfolio</span>
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Posts */}
          <div className="flex-1 min-w-0">
            {/* Posts Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Image className="w-5 h-5 text-[var(--accent)]" />
                {profile.isOwnProfile ? "My Posts" : `${profile.name?.split(' ')[0]}'s Posts`}
              </h2>
              <span className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>

            {postsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                  <Image className="w-8 h-8 text-[var(--text-secondary)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  {profile.isOwnProfile ? "No posts yet" : "No posts to show"}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  {profile.isOwnProfile
                    ? "Share your thoughts with your network!"
                    : `${profile.name?.split(' ')[0]} hasn't posted anything yet.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                <div
                  key={post._id}
                  className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Post Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={
                              post.author?.profilePicture ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || "U")}&background=random`
                            }
                            alt={post.author?.name}
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-[var(--border)]"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                            {post.author?.name}
                          </h4>
                          {(post.author?.currentRole || post.author?.currentCompany) && (
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                              {post.author?.currentRole}
                              {post.author?.currentRole && post.author?.currentCompany && " • "}
                              {post.author?.currentCompany}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-0.5">
                            <span>{formatPostDate(post.createdAt)}</span>
                            <span>•</span>
                            {post.visibility === "public" && (
                              <Globe className="w-3 h-3" title="Public" />
                            )}
                            {post.visibility === "connections" && (
                              <Users className="w-3 h-3" title="Connections only" />
                            )}
                            {post.visibility === "private" && (
                              <Lock className="w-3 h-3" title="Private" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete button for own posts */}
                      {profile.isOwnProfile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post._id);
                          }}
                          disabled={deletingPost === post._id}
                          className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          title="Delete post"
                        >
                          {deletingPost === post._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Collaboration badge */}
                    {post.isCollaboration && post.collaborators?.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Users className="w-4 h-4" />
                        <span>In collaboration with </span>
                        {post.collaborators.map((collab, idx) => (
                          <span key={collab._id}>
                            <span
                              className="text-[var(--accent)] cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${collab._id}`);
                              }}
                            >
                              {collab.name}
                            </span>
                            {idx < post.collaborators.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Post content */}
                    <div className="mt-3">
                      <p className="text-[var(--text-primary)] whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Mentions */}
                      {post.mentions?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.mentions.map((mention) => (
                            <span
                              key={mention._id}
                              className="text-[var(--accent)] cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${mention._id}`);
                              }}
                            >
                              @{mention.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Media */}
                    {post.media && post.media.length > 0 && (
                      <div
                        className={`mt-3 grid gap-2 ${post.media.length === 1 ? "grid-cols-1" : post.media.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
                      >
                        {post.media.slice(0, 4).map((m, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video rounded-xl overflow-hidden bg-[var(--bg-secondary)]"
                          >
                            {m.type === "image" ? (
                              <img
                                src={m.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : m.type === "video" ? (
                              <video
                                src={m.url}
                                className="w-full h-full object-cover"
                                controls
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-sm text-[var(--text-secondary)]">
                                  {m.originalName || "File"}
                                </span>
                              </div>
                            )}
                            {idx === 3 && post.media.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  +{post.media.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Stats */}
                  <div className="px-4 py-2.5 flex items-center justify-between text-sm border-t border-[var(--border)]">
                    <div className="flex items-center gap-1">
                      {post.likes?.length > 0 && (
                        <>
                          <div className="flex -space-x-1">
                            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center border border-white dark:border-[var(--card-bg)]">
                              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            </div>
                          </div>
                          <span className="text-[var(--text-secondary)] ml-1">
                            {post.likes.length}
                          </span>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post._id]: !prev[post._id],
                        }));
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--accent)] hover:underline text-sm transition-colors"
                    >
                      {post.comments?.length || 0} comments
                    </button>
                  </div>

                  {/* Post Actions */}
                  <div className="px-4 py-2 flex items-center border-t border-[var(--border)]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post._id);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-medium text-sm ${
                        post.isLiked
                          ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      <Heart
                        className={`w-[18px] h-[18px] ${post.isLiked ? "fill-current" : ""}`}
                      />
                      <span>{post.isLiked ? "Liked" : "Like"}</span>
                    </button>
                    <div className="w-px h-6 bg-[var(--border)]" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post._id]: !prev[post._id],
                        }));
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-medium text-sm ${
                        expandedComments[post._id]
                          ? "text-[var(--accent)] bg-[var(--accent)]/10"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      <MessageCircle className="w-[18px] h-[18px]" />
                      <span>Comment</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post._id] && (
                    <div className="px-4 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
                      {/* Comment input */}
                      <div className="flex items-start gap-3 mb-4">
                        <img
                          src={
                            user?.profilePicture ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random`
                          }
                          alt={user?.name}
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-[var(--border)] flex-shrink-0"
                        />
                        <div className="flex-1 flex items-center gap-2 bg-[var(--card-bg)] rounded-xl px-4 py-2.5 border border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
                          <input
                            type="text"
                            value={commentInputs[post._id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post._id]: e.target.value,
                              }))
                            }
                            placeholder="Write a comment..."
                            className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                            onKeyPress={(e) =>
                              e.key === "Enter" && handleComment(post._id)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComment(post._id);
                            }}
                            disabled={
                              !commentInputs[post._id]?.trim() ||
                              submittingComment[post._id]
                            }
                            className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                          >
                            {submittingComment[post._id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Comments list */}
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {post.comments?.map((comment) => (
                          <div
                            key={comment._id}
                            className="flex items-start gap-3 group"
                          >
                            <img
                              src={
                                comment.user?.profilePicture ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || "U")}&background=random`
                              }
                              alt={comment.user?.name}
                              className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-[var(--accent)] transition-all flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${comment.user?._id}`);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="bg-[var(--card-bg)] rounded-xl px-3.5 py-2.5 border border-[var(--border)]">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className="font-medium text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent)] transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profile/${comment.user?._id}`);
                                    }}
                                  >
                                    {comment.user?.name}
                                  </span>
                                  <span className="text-xs text-[var(--text-secondary)]">
                                    {formatPostDate(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mt-1 break-words">
                                  {comment.content}
                                </p>
                              </div>
                              {(comment.user?._id === user?._id ||
                                post.author?._id === user?._id) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteComment(
                                      post._id,
                                      comment._id,
                                    );
                                  }}
                                  className="mt-1 ml-2 text-xs text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {(!post.comments || post.comments.length === 0) && (
                          <div className="text-center py-6">
                            <MessageCircle className="w-8 h-8 mx-auto text-[var(--text-secondary)] opacity-40 mb-2" />
                            <p className="text-sm text-[var(--text-secondary)]">
                              No comments yet. Be the first to comment!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Mutual Connections Modal */}
      {showMutualModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-[var(--border)] shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {profile.isOwnProfile ? "Connections" : "Mutual Connections"}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {mutualConnections.length} {mutualConnections.length === 1 ? 'person' : 'people'}
                </p>
              </div>
              <button
                onClick={() => setShowMutualModal(false)}
                className="p-2 hover:bg-[var(--card-bg)] rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {mutualConnections.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-[var(--text-secondary)] opacity-40 mb-3" />
                  <p className="text-[var(--text-secondary)]">
                    No mutual connections found
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mutualConnections.map((connection) => (
                    <div
                      key={connection._id}
                      onClick={() => {
                        setShowMutualModal(false);
                        navigate(`/profile/${connection._id}`);
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] cursor-pointer transition-all group border border-transparent hover:border-[var(--border)]"
                    >
                      {connection.profilePicture ? (
                        <img
                          src={connection.profilePicture}
                          alt={connection.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-[var(--border)] group-hover:ring-[var(--accent)] transition-all"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center ring-2 ring-[var(--border)] group-hover:ring-[var(--accent)] transition-all">
                          <span className="text-lg text-white font-medium">
                            {connection.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                          {connection.name}
                        </p>
                        {connection.currentRole && (
                          <p className="text-sm text-[var(--text-secondary)] truncate">
                            {connection.currentRole}
                            {connection.currentCompany &&
                              ` at ${connection.currentCompany}`}
                          </p>
                        )}
                      </div>
                      <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)] rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
