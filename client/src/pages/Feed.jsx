import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Image,
  Video,
  FileText,
  X,
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  UserPlus,
  Users,
  Clock,
  Globe,
  Lock,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  AtSign,
  Download,
  ExternalLink,
  Linkedin,
  Github,
  GraduationCap,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Link2,
  Calendar,
  Award,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const API_URL = "http://localhost:5000/api";

// Helper function to get media URL (handles both local and Cloudinary URLs)
const getMediaUrl = (url) => {
  if (!url) return "";
  // If URL is already a full URL (Cloudinary), return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Otherwise, prepend server URL for local files
  return `http://localhost:5000${url}`;
};

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Create post state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postMedia, setPostMedia] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [isCollaboration, setIsCollaboration] = useState(false);
  const [mentions, setMentions] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState("mention"); // 'mention' or 'collaborator'
  const [showSearch, setShowSearch] = useState(false);
  const [creating, setCreating] = useState(false);

  // Comment state
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  // Messaging sidebar state
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  // Post detail modal state
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await axios.get(
        `${API_URL}/posts/feed?page=${pageNum}&limit=10`,
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        if (append) {
          setPosts((prev) => [...prev, ...response.data.posts]);
        } else {
          setPosts(response.data.posts);
        }
        setHasMore(response.data.pagination.hasMore);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch connections for messaging sidebar
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoadingConnections(true);
        const response = await axios.get(
          `${API_URL}/connections/my-connections`,
          {
            withCredentials: true,
          },
        );
        if (response.data.success) {
          setConnections(response.data.connections.slice(0, 8)); // Show max 8 connections
        }
      } catch (error) {
        console.error("Error fetching connections:", error);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, []);

  // Navigate to chat with specific user
  const handleMessageUser = (userId) => {
    navigate(`/chat?user=${userId}`);
  };

  // Load more posts
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.slice(0, 10 - postMedia.length);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview((prev) => [
          ...prev,
          {
            url: e.target.result,
            type: file.type.startsWith("image/")
              ? "image"
              : file.type.startsWith("video/")
                ? "video"
                : "document",
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    setPostMedia((prev) => [...prev, ...validFiles]);
  };

  // Remove media
  const removeMedia = (index) => {
    setPostMedia((prev) => prev.filter((_, i) => i !== index));
    setMediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Search users for mentions/collaborators
  const searchUsers = useCallback(
    async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/posts/search-users?query=${query}`,
          {
            withCredentials: true,
          },
        );

        if (response.data.success) {
          // Filter out already selected users
          const selectedIds = [...mentions, ...collaborators].map((u) => u._id);
          setSearchResults(
            response.data.users.filter((u) => !selectedIds.includes(u._id)),
          );
        }
      } catch (error) {
        console.error("Error searching users:", error);
      }
    },
    [mentions, collaborators],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Add mention or collaborator
  const addUser = (user) => {
    if (searchType === "mention") {
      setMentions((prev) => [...prev, user]);
    } else {
      setCollaborators((prev) => [...prev, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  // Remove mention or collaborator
  const removeUser = (userId, type) => {
    if (type === "mention") {
      setMentions((prev) => prev.filter((u) => u._id !== userId));
    } else {
      setCollaborators((prev) => prev.filter((u) => u._id !== userId));
    }
  };

  // Create post
  const handleCreatePost = async () => {
    if (!postContent.trim() && postMedia.length === 0) return;

    try {
      setCreating(true);

      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("visibility", visibility);
      formData.append("isCollaboration", isCollaboration);
      formData.append("mentions", JSON.stringify(mentions.map((u) => u._id)));
      formData.append(
        "collaborators",
        JSON.stringify(collaborators.map((u) => u._id)),
      );

      postMedia.forEach((file) => {
        formData.append("media", file);
      });

      const response = await axios.post(`${API_URL}/posts`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        // Reset form
        setPostContent("");
        setPostMedia([]);
        setMediaPreview([]);
        setVisibility("public");
        setIsCollaboration(false);
        setMentions([]);
        setCollaborators([]);
        setShowCreateModal(false);

        // Refresh feed
        setPage(1);
        fetchPosts(1, false);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  // Like/Unlike post
  const handleLike = async (postId) => {
    try {
      const response = await axios.post(
        `${API_URL}/posts/${postId}/like`,
        {},
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  isLiked: response.data.isLiked,
                  likes: { length: response.data.likeCount },
                }
              : post,
          ),
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Add comment
  const handleComment = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));

      const response = await axios.post(
        `${API_URL}/posts/${postId}/comments`,
        { content },
        { withCredentials: true },
      );

      if (response.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? { ...post, comments: [...post.comments, response.data.comment] }
              : post,
          ),
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Delete comment
  const handleDeleteComment = async (postId, commentId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/posts/${postId}/comments/${commentId}`,
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  comments: post.comments.filter((c) => c._id !== commentId),
                }
              : post,
          ),
        );
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await axios.delete(`${API_URL}/posts/${postId}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setPosts((prev) => prev.filter((post) => post._id !== postId));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Send connection request
  const handleConnect = async (userId) => {
    try {
      const response = await axios.post(
        `${API_URL}/connections/request/${userId}`,
        {},
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.author._id === userId
              ? { ...post, connectionStatus: "pending" }
              : post,
          ),
        );
      }
    } catch (error) {
      console.error("Error sending connection request:", error);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  // Open post detail modal
  const openPostDetail = (post, mediaIndex = 0) => {
    setSelectedPost(post);
    setSelectedMediaIndex(mediaIndex);
  };

  // Close post detail modal
  const closePostDetail = () => {
    setSelectedPost(null);
    setSelectedMediaIndex(0);
  };

  // Render media - show max 3 images, with +X overlay for additional
  const renderMedia = (media, post) => {
    const displayMedia = media.slice(0, 3);
    const remainingCount = media.length - 3;

    return (
      <div
        className={`grid gap-2 mt-3 ${
          media.length === 1
            ? "grid-cols-1"
            : media.length === 2
              ? "grid-cols-2"
              : "grid-cols-2"
        }`}
      >
        {displayMedia.map((item, index) => (
          <div
            key={index}
            className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer group ${
              media.length === 1
                ? "col-span-full"
                : media.length === 3 && index === 0
                  ? "row-span-2"
                  : ""
            }`}
            onClick={() => openPostDetail(post, index)}
          >
            {item.type === "image" && (
              <>
                <img
                  src={getMediaUrl(item.url)}
                  alt="Post media"
                  className={`w-full object-contain bg-black/5 dark:bg-black/20 transition-transform group-hover:scale-[1.02] ${
                    media.length === 1
                      ? "max-h-[500px]"
                      : media.length === 3 && index === 0
                        ? "h-full min-h-[300px]"
                        : "h-[150px]"
                  }`}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              </>
            )}
            {item.type === "video" && (
              <>
                <video
                  src={getMediaUrl(item.url)}
                  className="w-full h-[200px] object-contain bg-black"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-14 border-l-gray-800 border-b-8 border-b-transparent ml-1" />
                  </div>
                </div>
              </>
            )}
            {item.type === "document" && (
              <div className="flex items-center justify-center h-[150px] text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20">
                <FileText className="w-10 h-10 mr-2" />
                <span className="text-sm font-medium">
                  {item.originalName || "Document"}
                </span>
              </div>
            )}
            {/* Show +X overlay on the last visible image if there are more */}
            {remainingCount > 0 && index === 2 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                <span className="text-white text-3xl font-bold">
                  +{remainingCount}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-6">
            {/* Left Sidebar - User Profile Card */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-visible sticky top-24">
                {/* Profile Banner */}
                <div className="h-16 rounded-t-xl relative overflow-hidden">
                  <img
                    src="/charusat.png"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
                </div>
                
                {/* Profile Picture - Overlapping the banner */}
                <div className="relative flex justify-center -mt-8 z-10">
                  <img
                    src={
                      user?.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=3b82f6&color=fff&size=80`
                    }
                    alt={user?.name}
                    className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => navigate(`/profile/${user?._id}`)}
                  />
                </div>

                {/* Profile Info */}
                <div className="pt-2 px-4 pb-4 text-center">
                  {/* Name */}
                  <h3
                    className="font-bold text-base text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => navigate(`/profile/${user?._id}`)}
                  >
                    {user?.name || "User"}
                  </h3>

                  {/* Role Badge */}
                  {user?.role && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        user.role === "alumni"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : user.role === "student"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : user.role === "faculty"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  )}

                  {/* Current Position - Compact */}
                  {(user?.currentRole || user?.currentCompany) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
                      {user?.currentRole}
                      {user?.currentRole && user?.currentCompany && " at "}
                      {user?.currentCompany}
                    </p>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>

                  {/* Quick Stats Row */}
                  <div className="flex justify-around text-center">
                    {user?.department && (
                      <div className="flex-1">
                        <GraduationCap className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate px-1">
                          {user.department}
                        </p>
                      </div>
                    )}
                    {user?.batch && (
                      <div className="flex-1 border-l border-gray-200 dark:border-gray-700">
                        <Calendar className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {user.batch}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Social Links - Compact */}
                  {(user?.linkedIn || user?.github || user?.portfolioUrl) && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                      <div className="flex justify-center gap-2">
                        {user?.linkedIn && (
                          <a
                            href={user.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#0077B5]/10 hover:bg-[#0077B5]/20 text-[#0077B5] rounded-lg transition-colors"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {user?.github && (
                          <a
                            href={user.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                            title="GitHub"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {user?.portfolioUrl && (
                          <a
                            href={user.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg transition-colors"
                            title="Portfolio"
                          >
                            <Link2 className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </>
                  )}

                  {/* View Profile Button */}
                  <button
                    onClick={() => navigate(`/profile/${user?._id}`)}
                    className="w-full mt-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
            {/* Main Feed Content */}
            <div className="flex-1 max-w-2xl">
              {/* Create Post Card - Only visible to alumni and faculty */}
              {user?.role !== "student" && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        user?.profilePicture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}`
                      }
                      alt={user?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex-1 text-left px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      What's on your mind?
                    </button>
                  </div>
                  <div className="flex items-center justify-around mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Image className="w-5 h-5 text-green-500" />
                      <span>Photo</span>
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Video className="w-5 h-5 text-red-500" />
                      <span>Video</span>
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span>Document</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Posts */}
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    No posts yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Be the first to share something!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                    >
                      {/* Post Header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                post.author?.profilePicture ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || "U")}`
                              }
                              alt={post.author?.name}
                              className="w-12 h-12 rounded-full object-cover cursor-pointer"
                              onClick={() =>
                                navigate(`/profile/${post.author?._id}`)
                              }
                            />
                            <div>
                              <h4
                                className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:underline"
                                onClick={() =>
                                  navigate(`/profile/${post.author?._id}`)
                                }
                              >
                                {post.author?.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {post.author?.currentRole}
                                {post.author?.currentCompany &&
                                  ` at ${post.author.currentCompany}`}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(post.createdAt)}</span>
                                {post.visibility === "public" && (
                                  <Globe className="w-3 h-3" />
                                )}
                                {post.visibility === "connections" && (
                                  <Users className="w-3 h-3" />
                                )}
                                {post.visibility === "private" && (
                                  <Lock className="w-3 h-3" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Connection button */}
                            {post.connectionStatus === "none" && (
                              <button
                                onClick={() => handleConnect(post.author._id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                              >
                                <UserPlus className="w-4 h-4" />
                                Connect
                              </button>
                            )}
                            {post.connectionStatus === "pending" && (
                              <span className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                <Clock className="w-4 h-4" />
                                Pending
                              </span>
                            )}
                            {post.connectionStatus === "accepted" && (
                              <span className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
                                <Check className="w-4 h-4" />
                                Connected
                              </span>
                            )}

                            {/* Post options for own posts */}
                            {post.author?._id === user?._id && (
                              <button
                                onClick={() => handleDeletePost(post._id)}
                                className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collaboration badge */}
                        {post.isCollaboration &&
                          post.collaborators?.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>In collaboration with </span>
                              {post.collaborators.map((collab, idx) => (
                                <span key={collab._id}>
                                  <span
                                    className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                                    onClick={() =>
                                      navigate(`/profile/${collab._id}`)
                                    }
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
                          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {post.content}
                          </p>

                          {/* Mentions */}
                          {post.mentions?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {post.mentions.map((mention) => (
                                <span
                                  key={mention._id}
                                  className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                                  onClick={() =>
                                    navigate(`/profile/${mention._id}`)
                                  }
                                >
                                  @{mention.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Media */}
                        {post.media?.length > 0 &&
                          renderMedia(post.media, post)}
                      </div>

                      {/* Post Stats */}
                      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                        <span>{post.likes?.length || 0} likes</span>
                        <span>{post.comments?.length || 0} comments</span>
                      </div>

                      {/* Post Actions */}
                      <div className="px-4 py-2 flex items-center gap-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleLike(post._id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                            post.isLiked
                              ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Heart
                            className={`w-5 h-5 ${post.isLiked ? "fill-current" : ""}`}
                          />
                          <span>Like</span>
                        </button>
                        <button
                          onClick={() =>
                            setExpandedComments((prev) => ({
                              ...prev,
                              [post._id]: !prev[post._id],
                            }))
                          }
                          className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>Comment</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {expandedComments[post._id] && (
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                          {/* Comment input */}
                          <div className="flex items-center gap-2 mb-3">
                            <img
                              src={
                                user?.profilePicture ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}`
                              }
                              alt={user?.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2">
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
                                className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200"
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleComment(post._id)
                                }
                              />
                              <button
                                onClick={() => handleComment(post._id)}
                                disabled={
                                  !commentInputs[post._id]?.trim() ||
                                  submittingComment[post._id]
                                }
                                className="p-1 text-blue-600 dark:text-blue-400 disabled:opacity-50"
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
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {post.comments?.map((comment) => (
                              <div
                                key={comment._id}
                                className="flex items-start gap-2"
                              >
                                <img
                                  src={
                                    comment.user?.profilePicture ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || "U")}`
                                  }
                                  alt={comment.user?.name}
                                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
                                  onClick={() =>
                                    navigate(`/profile/${comment.user?._id}`)
                                  }
                                />
                                <div className="flex-1">
                                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 py-2">
                                    <span
                                      className="font-medium text-sm text-gray-900 dark:text-white cursor-pointer hover:underline"
                                      onClick={() =>
                                        navigate(
                                          `/profile/${comment.user?._id}`,
                                        )
                                      }
                                    >
                                      {comment.user?.name}
                                    </span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {comment.content}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 px-2 text-xs text-gray-500">
                                    <span>{formatDate(comment.createdAt)}</span>
                                    {(comment.user?._id === user?._id ||
                                      post.author?._id === user?._id) && (
                                      <button
                                        onClick={() =>
                                          handleDeleteComment(
                                            post._id,
                                            comment._id,
                                          )
                                        }
                                        className="text-red-500 hover:underline"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Load more button */}
                  {hasMore && (
                    <div className="text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>{" "}
            {/* End Main Feed Content */}
            {/* Right Sidebar - Messaging Card */}
            <div className="hidden xl:block w-72 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden sticky top-24">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    Messaging
                  </h3>
                  <button
                    onClick={() => navigate("/chat")}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    See All
                  </button>
                </div>

                {/* Connections List */}
                <div className="max-h-96 overflow-y-auto">
                  {loadingConnections ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Users className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No connections yet
                      </p>
                      <button
                        onClick={() => navigate("/network")}
                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Find connections
                      </button>
                    </div>
                  ) : (
                    connections.map((connection) => (
                      <div
                        key={connection._id}
                        onClick={() => handleMessageUser(connection.user._id)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
                      >
                        {/* User Avatar with Online Indicator */}
                        <div className="relative">
                          <img
                            src={
                              connection.user.profilePicture ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.user.name || "U")}&background=3b82f6&color=fff&size=40`
                            }
                            alt={connection.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {connection.user.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {connection.user.currentRole ||
                              connection.user.role ||
                              "Alumni"}
                          </p>
                        </div>

                        {/* Message Icon */}
                        <Send className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {connections.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => navigate("/chat")}
                      className="w-full py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open Messages
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>{" "}
          {/* End Flex Container */}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Post
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Author info */}
              <div className="flex items-center gap-3">
                <img
                  src={
                    user?.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}`
                  }
                  alt={user?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </h4>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-2 py-1 text-gray-600 dark:text-gray-400"
                  >
                    <option value="public">🌍 Public</option>
                    <option value="connections">👥 Connections Only</option>
                    <option value="private">🔒 Only Me</option>
                  </select>
                </div>
              </div>

              {/* Content textarea */}
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 resize-none bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 text-lg"
              />

              {/* Media preview */}
              {mediaPreview.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaPreview.map((media, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
                    >
                      {media.type === "image" && (
                        <img
                          src={media.url}
                          alt=""
                          className="w-full h-24 object-cover"
                        />
                      )}
                      {media.type === "video" && (
                        <video
                          src={media.url}
                          className="w-full h-24 object-cover"
                        />
                      )}
                      {media.type === "document" && (
                        <div className="w-full h-24 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Collaboration toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCollaboration}
                    onChange={(e) => setIsCollaboration(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    This is a collaboration
                  </span>
                </label>
              </div>

              {/* Mentions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AtSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mentions
                  </span>
                  <button
                    onClick={() => {
                      setSearchType("mention");
                      setShowSearch(true);
                    }}
                    className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  >
                    + Add
                  </button>
                </div>
                {mentions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mentions.map((mention) => (
                      <span
                        key={mention._id}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm"
                      >
                        @{mention.name}
                        <button
                          onClick={() => removeUser(mention._id, "mention")}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Collaborators */}
              {isCollaboration && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Collaborators
                    </span>
                    <button
                      onClick={() => {
                        setSearchType("collaborator");
                        setShowSearch(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                  {collaborators.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {collaborators.map((collab) => (
                        <span
                          key={collab._id}
                          className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm"
                        >
                          {collab.name}
                          <button
                            onClick={() =>
                              removeUser(collab._id, "collaborator")
                            }
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* User search dropdown */}
              {showSearch && (
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search for ${searchType === "mention" ? "mentions" : "collaborators"}...`}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none text-gray-800 dark:text-gray-200"
                    autoFocus
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto z-10">
                      {searchResults.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => addUser(user)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                          <img
                            src={
                              user.profilePicture ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
                            }
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.role}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Add images"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Add video"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Add document"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  {postMedia.length}/10 files
                </span>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={
                  creating || (!postContent.trim() && postMedia.length === 0)
                }
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </span>
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/90 flex z-50"
          onClick={closePostDetail}
        >
          <div
            className="flex flex-col lg:flex-row w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Section - Left Side */}
            <div className="relative flex-1 flex items-center justify-center bg-black min-h-[40vh] lg:min-h-full">
              {/* Close button */}
              <button
                onClick={closePostDetail}
                className="absolute top-4 left-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Arrows */}
              {selectedPost.media?.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedMediaIndex((prev) =>
                        prev > 0 ? prev - 1 : selectedPost.media.length - 1,
                      )
                    }
                    className="absolute left-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedMediaIndex((prev) =>
                        prev < selectedPost.media.length - 1 ? prev + 1 : 0,
                      )
                    }
                    className="absolute right-4 lg:right-auto lg:left-auto z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    style={{ right: "1rem" }}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Media Display */}
              <div className="w-full h-full flex items-center justify-center p-4">
                {selectedPost.media &&
                  selectedPost.media[selectedMediaIndex] && (
                    <>
                      {selectedPost.media[selectedMediaIndex].type ===
                        "image" && (
                        <img
                          src={getMediaUrl(
                            selectedPost.media[selectedMediaIndex].url,
                          )}
                          alt="Post media"
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                      {selectedPost.media[selectedMediaIndex].type ===
                        "video" && (
                        <video
                          src={getMediaUrl(
                            selectedPost.media[selectedMediaIndex].url,
                          )}
                          controls
                          autoPlay
                          className="max-w-full max-h-full"
                        />
                      )}
                      {selectedPost.media[selectedMediaIndex].type ===
                        "document" && (
                        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-gray-800 rounded-lg">
                          <FileText className="w-20 h-20 text-blue-400" />
                          <p className="text-white text-lg font-medium text-center">
                            {selectedPost.media[selectedMediaIndex].filename ||
                              selectedPost.media[selectedMediaIndex]
                                .originalName ||
                              "Document"}
                          </p>
                          <div className="flex gap-3">
                            <a
                              href={getMediaUrl(
                                selectedPost.media[selectedMediaIndex].url,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open
                            </a>
                            <a
                              href={getMediaUrl(
                                selectedPost.media[selectedMediaIndex].url,
                              )}
                              download
                              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  )}
              </div>

              {/* Media Indicators */}
              {selectedPost.media?.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {selectedPost.media.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMediaIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === selectedMediaIndex
                          ? "bg-white"
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Post Details Section - Right Side */}
            <div className="w-full lg:w-[420px] bg-white dark:bg-gray-900 flex flex-col max-h-[60vh] lg:max-h-full overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <img
                  src={
                    selectedPost.author?.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPost.author?.name || "U")}`
                  }
                  alt={selectedPost.author?.name}
                  className="w-10 h-10 rounded-full object-cover cursor-pointer"
                  onClick={() => {
                    closePostDetail();
                    navigate(`/profile/${selectedPost.author?._id}`);
                  }}
                />
                <div className="flex-1">
                  <h4
                    className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:underline"
                    onClick={() => {
                      closePostDetail();
                      navigate(`/profile/${selectedPost.author?._id}`);
                    }}
                  >
                    {selectedPost.author?.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(selectedPost.createdAt)}
                  </p>
                </div>
                {selectedPost.author?._id === user?._id && (
                  <button
                    onClick={() => {
                      handleDeletePost(selectedPost._id);
                      closePostDetail();
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Post Text */}
                {selectedPost.content && (
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                )}

                {/* Collaborators */}
                {selectedPost.collaborators?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Collaborators:
                    </span>
                    {selectedPost.collaborators.map((collab) => (
                      <span
                        key={collab._id}
                        onClick={() => {
                          closePostDetail();
                          navigate(`/profile/${collab._id}`);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      >
                        @{collab.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mentions */}
                {selectedPost.mentions?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Mentions:
                    </span>
                    {selectedPost.mentions.map((mention) => (
                      <span
                        key={mention._id}
                        onClick={() => {
                          closePostDetail();
                          navigate(`/profile/${mention._id}`);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      >
                        @{mention.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 py-2 border-y border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      handleLike(selectedPost._id);
                      // Update selectedPost likes too
                      const isLiked = selectedPost.likes?.includes(user?._id);
                      setSelectedPost((prev) => ({
                        ...prev,
                        likes: isLiked
                          ? prev.likes.filter((id) => id !== user?._id)
                          : [...(prev.likes || []), user?._id],
                      }));
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      selectedPost.likes?.includes(user?._id)
                        ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${selectedPost.likes?.includes(user?._id) ? "fill-current" : ""}`}
                    />
                    <span>{selectedPost.likes?.length || 0}</span>
                  </button>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>{selectedPost.comments?.length || 0} comments</span>
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    Comments
                  </h5>
                  {selectedPost.comments?.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    selectedPost.comments?.map((comment) => (
                      <div key={comment._id} className="flex items-start gap-2">
                        <img
                          src={
                            comment.user?.profilePicture ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || "U")}`
                          }
                          alt={comment.user?.name}
                          className="w-8 h-8 rounded-full object-cover cursor-pointer"
                          onClick={() => {
                            closePostDetail();
                            navigate(`/profile/${comment.user?._id}`);
                          }}
                        />
                        <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                            <span
                              className="font-medium text-sm text-gray-900 dark:text-white cursor-pointer hover:underline"
                              onClick={() => {
                                closePostDetail();
                                navigate(`/profile/${comment.user?._id}`);
                              }}
                            >
                              {comment.user?.name}
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {comment.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 px-2 text-xs text-gray-500">
                            <span>{formatDate(comment.createdAt)}</span>
                            {(comment.user?._id === user?._id ||
                              selectedPost.author?._id === user?._id) && (
                              <button
                                onClick={() => {
                                  handleDeleteComment(
                                    selectedPost._id,
                                    comment._id,
                                  );
                                  // Update selectedPost comments too
                                  setSelectedPost((prev) => ({
                                    ...prev,
                                    comments: prev.comments.filter(
                                      (c) => c._id !== comment._id,
                                    ),
                                  }));
                                }}
                                className="text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Comment */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      user?.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}`
                    }
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value.trim()) {
                        handleComment(selectedPost._id, e.target.value.trim());
                        // Add the comment to selectedPost immediately for UI feedback
                        const newComment = {
                          _id: Date.now().toString(),
                          content: e.target.value.trim(),
                          user: user,
                          createdAt: new Date().toISOString(),
                        };
                        setSelectedPost((prev) => ({
                          ...prev,
                          comments: [...(prev.comments || []), newComment],
                        }));
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      if (input.value.trim()) {
                        handleComment(selectedPost._id, input.value.trim());
                        const newComment = {
                          _id: Date.now().toString(),
                          content: input.value.trim(),
                          user: user,
                          createdAt: new Date().toISOString(),
                        };
                        setSelectedPost((prev) => ({
                          ...prev,
                          comments: [...(prev.comments || []), newComment],
                        }));
                        input.value = "";
                      }
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Feed;
