import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../context/PermissionContext";
import { useTheme } from "../context/ThemeContext";
import { ROLES, MODULES } from "../constants/rbac.js";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  LogOut,
  Moon,
  Sun,
  User,
  Settings,
  ChevronDown,
  Home,
  Users,
  Bell,
  Search,
  Menu,
  X,
  Shield,
  MessageCircle,
  UserPlus,
  UserCheck,
  UsersRound,
  Newspaper,
  PartyPopper,
  Images,
  MessageSquare,
  Heart,
  Briefcase,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [groupInvitationCount, setGroupInvitationCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const moreDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationDropdownOpen(false);
      }
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target)
      ) {
        setIsMoreDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Socket.IO for real-time notifications
  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(SOCKET_URL, { withCredentials: true });

    newSocket.on("connect", () => {
      newSocket.emit("user:join", user._id);
    });

    newSocket.on("notification:new", (notification) => {
      // Don't add message notifications to the bell icon
      if (notification.type !== "message") {
        setNotifications((prev) => [notification, ...prev].slice(0, 10));
        setUnreadNotificationCount((prev) => prev + 1);
      }
    });

    newSocket.on("notification:count", (count) => {
      // This count will be updated separately excluding messages
      setUnreadNotificationCount(count);
    });

    // Listen for message unread count updates
    newSocket.on("message:unread-count", (count) => {
      setUnreadMessageCount(count);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user?._id]);

  // Fetch initial notification and message counts
  useEffect(() => {
    if (!user?._id) return;

    const fetchCounts = async () => {
      try {
        const [notifRes, msgRes, groupRes] = await Promise.all([
          axios.get(`${API_BASE}/notifications?limit=50`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/chat/unread-count`, { withCredentials: true }),
          axios.get(`${API_BASE}/groups/invitations`, {
            withCredentials: true,
          }),
        ]);

        if (notifRes.data.success) {
          // Count only non-message unread notifications
          const unreadNonMessage = notifRes.data.notifications.filter(
            (n) => n.type !== "message" && !n.isRead,
          ).length;
          setUnreadNotificationCount(unreadNonMessage);
        }
        if (msgRes.data.success) {
          setUnreadMessageCount(msgRes.data.unreadCount);
        }
        if (groupRes.data.success) {
          setGroupInvitationCount(groupRes.data.invitations.length);
        }
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      }
    };

    fetchCounts();

    // Fetch notifications (excluding message notifications)
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_BASE}/notifications?limit=20`, {
          withCredentials: true,
        });
        if (res.data.success) {
          // Filter out message notifications - those are shown in chat
          const nonMessageNotifications = res.data.notifications.filter(
            (n) => n.type !== "message",
          );
          setNotifications(nonMessageNotifications.slice(0, 10));
          // Update count to exclude message notifications
          const unreadNonMessage = nonMessageNotifications.filter(
            (n) => !n.isRead,
          ).length;
          setUnreadNotificationCount(unreadNonMessage);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, [user?._id]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleViewProfile = () => {
    setIsProfileDropdownOpen(false);
    navigate(`/profile/${user._id}`);
  };

  const markAllNotificationsRead = async () => {
    try {
      await axios.put(
        `${API_BASE}/notifications/read-all`,
        {},
        { withCredentials: true },
      );
      setUnreadNotificationCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await axios.put(
          `${API_BASE}/notifications/${notification._id}/read`,
          {},
          { withCredentials: true },
        );
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n,
          ),
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    setIsNotificationDropdownOpen(false);

    // Navigate based on notification type
    if (notification.type === "message" && notification.reference?.id) {
      navigate("/chat");
    } else if (
      notification.type === "connection_request" ||
      notification.type === "connection_accepted"
    ) {
      navigate("/network");
    } else if (
      notification.type === "group_invitation" ||
      notification.type === "group_joined"
    ) {
      navigate("/chat");
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "connection_request":
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case "connection_accepted":
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case "group_invitation":
      case "group_joined":
        return <UsersRound className="w-5 h-5 text-purple-500" />;
      case "message":
        return <MessageCircle className="w-5 h-5 text-[var(--accent)]" />;
      default:
        return <Bell className="w-5 h-5 text-[var(--text-secondary)]" />;
    }
  };

  const formatNotificationTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Build nav links dynamically based on RBAC permissions
  const allNavLinks = [
    { name: "Home", path: "/home", icon: Home },
    { name: "Feed", path: "/feed", icon: Newspaper, module: MODULES.FEED },
    { name: "Reunions", path: "/reunions", icon: PartyPopper, module: MODULES.REUNION },
    { name: "Gallery", path: "/gallery", icon: Images, module: MODULES.GALLERY },
    { name: "Network", path: "/network", icon: Users },
    // Feedback only visible to alumni (not RBAC controlled)
    ...(user?.role === ROLES.ALUMNI
      ? [{ name: "Feedback", path: "/feedback", icon: MessageSquare }]
      : []),
    // Contribution controlled by RBAC + alumni-only visibility preserved
    ...(user?.role === ROLES.ALUMNI
      ? [{ name: "Contribute", path: "/donation", icon: Heart, module: MODULES.CONTRIBUTION }]
      : []),
    // Internships controlled by RBAC
    { name: "Internships", path: "/internships", icon: Briefcase, module: MODULES.INTERNSHIP },
    {
      name: "Messages",
      path: "/chat",
      icon: MessageCircle,
      badge: unreadMessageCount,
    },
  ];

  // Filter nav links based on RBAC permissions
  const navLinks = allNavLinks.filter(link => {
    // If link has a module property, check permission
    if (link.module) {
      return hasPermission(link.module);
    }
    // Links without a module property are always visible
    return true;
  });

  const isActivePath = (path) => location.pathname === path;

  // Split nav links into primary (shown directly) and secondary (in More dropdown)
  const primaryNavLinks = navLinks.slice(0, 7); // First 7 items shown directly
  const secondaryNavLinks = navLinks.slice(7); // Rest go in More dropdown

  return (
    <nav className="bg-[var(--card-bg)]/95 backdrop-blur-lg border-b border-[var(--border)] fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/flashback")}
          >
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                Campus
                <span className="text-[var(--primary-blue)] dark:text-[var(--accent-orange)]">
                  Roots
                </span>
              </h1>
              <p className="text-[10px] text-[var(--text-secondary)] -mt-0.5">
                Alumni Network
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 flex-1 mx-4">
            {/* Primary Nav Links */}
            {primaryNavLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => !link.comingSoon && navigate(link.path)}
                disabled={link.comingSoon}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                            ${
                              isActivePath(link.path)
                                ? "bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)]"
                            }
                            ${link.comingSoon ? "opacity-50 cursor-not-allowed" : ""}
                         `}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
                {link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </button>
            ))}

            {/* More Dropdown */}
            {secondaryNavLinks.length > 0 && (
              <div className="relative" ref={moreDropdownRef}>
                <button
                  onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                              ${
                                secondaryNavLinks.some((link) =>
                                  isActivePath(link.path),
                                )
                                  ? "bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]"
                                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)]"
                              }
                           `}
                >
                  More
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isMoreDropdownOpen ? "rotate-180" : ""}`}
                  />
                  {/* Badge if any secondary link has unread */}
                  {secondaryNavLinks.some((link) => link.badge > 0) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {/* More Dropdown Menu */}
                {isMoreDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    {secondaryNavLinks.map((link) => (
                      <button
                        key={link.path}
                        onClick={() => {
                          if (!link.comingSoon) {
                            navigate(link.path);
                            setIsMoreDropdownOpen(false);
                          }
                        }}
                        disabled={link.comingSoon}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                                    ${
                                      isActivePath(link.path)
                                        ? "bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]"
                                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)]"
                                    }
                                    ${link.comingSoon ? "opacity-50 cursor-not-allowed" : ""}
                                 `}
                      >
                        <link.icon className="w-4 h-4" />
                        {link.name}
                        {link.badge > 0 && (
                          <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                            {link.badge > 99 ? "99+" : link.badge}
                          </span>
                        )}
                        {link.comingSoon && (
                          <span className="ml-auto text-[8px] bg-[var(--accent-orange)] text-white px-1.5 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications (Desktop) */}
            <div className="relative hidden md:block" ref={notificationRef}>
              <button
                onClick={() =>
                  setIsNotificationDropdownOpen(!isNotificationDropdownOpen)
                }
                className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] border border-transparent hover:border-[var(--border)] transition-all duration-200 relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {/* Notification badge - only show if unread > 0 */}
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Notifications
                    </h3>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[var(--text-secondary)]">
                        <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors ${
                            !notification.isRead
                              ? "bg-[var(--primary-blue)]/5 dark:bg-[var(--accent-orange)]/5"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              {notification.sender?.profilePicture ? (
                                <img
                                  src={notification.sender.profilePicture}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              )}
                              {/* Type indicator badge */}
                              <div
                                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                                  notification.type === "connection_request"
                                    ? "bg-blue-500"
                                    : notification.type ===
                                        "connection_accepted"
                                      ? "bg-green-500"
                                      : notification.type === "group_invitation"
                                        ? "bg-purple-500"
                                        : notification.type === "group_joined"
                                          ? "bg-indigo-500"
                                          : "bg-gray-500"
                                }`}
                              >
                                {React.cloneElement(
                                  getNotificationIcon(notification.type),
                                  { className: "w-3 h-3 text-white" },
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                                {notification.title}
                              </p>
                              {notification.content && (
                                <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                                  {notification.content}
                                </p>
                              )}
                              {/* Mutual connections badge */}
                              {notification.type === "connection_request" &&
                                notification.mutualConnectionCount > 0 && (
                                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                                    <Users className="w-3 h-3" />
                                    {notification.mutualConnectionCount} mutual
                                    connection
                                    {notification.mutualConnectionCount > 1
                                      ? "s"
                                      : ""}
                                  </span>
                                )}
                              {/* Group name badge */}
                              {(notification.type === "group_invitation" ||
                                notification.type === "group_joined") &&
                                notification.groupName && (
                                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs">
                                    <UsersRound className="w-3 h-3" />
                                    {notification.groupName}
                                  </span>
                                )}
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-[var(--accent)] rounded-full mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* View All Link */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-[var(--border)]">
                      <button
                        onClick={() => {
                          setIsNotificationDropdownOpen(false);
                          // Could navigate to a notifications page if implemented
                        }}
                        className="w-full text-center text-sm text-[var(--accent)] hover:underline"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] border border-transparent hover:border-[var(--border)] transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5 text-[var(--accent-orange)]" />
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-[var(--background)] border border-transparent hover:border-[var(--border)] transition-all duration-200"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-[var(--border)] shadow-sm">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-blue)]/70 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/70 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)] max-w-[100px] truncate">
                  {user?.name?.split(" ")[0]}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-[var(--border)]">
                        {user?.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-blue)]/70 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/70 flex items-center justify-center">
                            <User size={20} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleViewProfile}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-[var(--border)] pt-1 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] py-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => !link.comingSoon && navigate(link.path)}
                  disabled={link.comingSoon}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                              ${
                                isActivePath(link.path)
                                  ? "bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]"
                                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)]"
                              }
                              ${link.comingSoon ? "opacity-50 cursor-not-allowed" : ""}
                           `}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                  {link.badge > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                  {link.comingSoon && (
                    <span className="ml-auto text-[10px] bg-[var(--accent-orange)] text-white px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </button>
              ))}

              {/* Notifications in mobile */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsNotificationDropdownOpen(true);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] transition-all duration-200"
              >
                <Bell className="w-5 h-5" />
                Notifications
                {unreadNotificationCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
