import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import {
  Search,
  Filter,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  X,
  ChevronDown,
  Building2,
  GraduationCap,
  Briefcase,
  BookOpen,
  Crown,
  Loader2,
  Check,
  MessageSquare,
  Link2,
  RefreshCw,
} from "lucide-react";

const API_URL = "http://localhost:5000";
axios.defaults.withCredentials = true;

// Role badge component with different styles
const RoleBadge = ({ role }) => {
  const roleConfig = {
    student: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-400",
      icon: GraduationCap,
      label: "Student",
    },
    alumni: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      icon: Users,
      label: "Alumni",
    },
    faculty: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-700 dark:text-purple-400",
      icon: BookOpen,
      label: "Faculty",
    },
    admin: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-700 dark:text-orange-400",
      icon: Crown,
      label: "Admin",
    },
  };

  const config = roleConfig[role] || roleConfig.alumni;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// User card component
const UserCard = ({
  user,
  onConnect,
  onCancelRequest,
  onAccept,
  onReject,
  loading,
  onViewProfile,
}) => {
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (action, ...args) => {
    setActionLoading(true);
    await action(...args);
    setActionLoading(false);
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
      {/* Header with avatar and role */}
      <div className="flex items-start gap-3">
        <div
          className="relative cursor-pointer"
          onClick={() => onViewProfile && onViewProfile(user._id)}
        >
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-[var(--border)] group-hover:border-[var(--primary-blue)] dark:group-hover:border-[var(--accent-orange)] transition-colors hover:opacity-80 flex-shrink-0">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-blue)]/70 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/70 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {/* Online indicator placeholder */}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-semibold text-[var(--text-primary)] truncate cursor-pointer hover:text-[var(--accent)] transition-colors"
              onClick={() => onViewProfile && onViewProfile(user._id)}
            >
              {user.name}
            </h3>
            <RoleBadge role={user.role} />
          </div>

          {user.currentRole && user.currentCompany && (
            <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {user.currentRole} at {user.currentCompany}
              </span>
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            {user.department && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {user.department.split(" ")[0]}
              </span>
            )}
            {user.batch && (
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                Batch {user.batch}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content area that grows */}
      <div className="flex-1">
        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-[var(--text-secondary)] mt-3 line-clamp-2">
            {user.bio}
          </p>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {user.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs rounded-full bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--border)]"
              >
                {skill}
              </span>
            ))}
            {user.skills.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--background)] text-[var(--text-muted)]">
                +{user.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Mutual Connections */}
        {user.mutualConnectionCount > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex -space-x-2">
              {user.mutualConnections?.slice(0, 3).map((mutual, idx) => (
                <div
                  key={idx}
                  className="w-5 h-5 rounded-full border-2 border-[var(--card-bg)] overflow-hidden"
                >
                  {mutual.profilePicture ? (
                    <img
                      src={mutual.profilePicture}
                      alt={mutual.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] flex items-center justify-center text-white text-[10px]">
                      {mutual.name?.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-[var(--text-secondary)]">
              <span className="font-medium">{user.mutualConnectionCount}</span>{" "}
              mutual
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons - Always at bottom */}
      <div className="mt-4 pt-3 border-t border-[var(--border)]">
        {user.connectionStatus === "none" && (
          <button
            onClick={() => handleAction(onConnect, user._id)}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] hover:opacity-90 rounded-xl transition-all disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Connect
          </button>
        )}

        {user.connectionStatus === "pending_sent" && (
          <button
            onClick={() => handleAction(onCancelRequest, user._id)}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--border)] rounded-xl transition-all disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            Request Sent
          </button>
        )}

        {user.connectionStatus === "pending_received" && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(onAccept, user._id)}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Accept
            </button>
            <button
              onClick={() => handleAction(onReject, user._id)}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
          </div>
        )}

        {user.connectionStatus === "connected" && (
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <UserCheck className="w-4 h-4" />
            Connected
          </div>
        )}
      </div>
    </div>
  );
};

const Network = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discover");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [stats, setStats] = useState({
    connections: 0,
    pendingReceived: 0,
    pendingSent: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const departments = [
    "all",
    "Computer Science & Engineering",
    "Information Technology",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Electronics & Communication",
    "Chemical Engineering",
    "MBA",
  ];

  const batches = [
    "all",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    "2025",
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "discover") {
      fetchUsers();
    } else if (activeTab === "connections") {
      fetchConnections();
    } else if (activeTab === "pending") {
      fetchPendingRequests();
    } else if (activeTab === "sent") {
      fetchSentRequests();
    }
  }, [activeTab, roleFilter, departmentFilter, batchFilter, page]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (activeTab === "discover") {
        setPage(1);
        fetchUsers();
      }
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [search]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/connections/stats`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...(search && { search }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(departmentFilter !== "all" && { department: departmentFilter }),
        ...(batchFilter !== "all" && { batch: batchFilter }),
      });

      const response = await axios.get(
        `${API_URL}/api/connections/discover?${params}`,
      );
      if (response.data.success) {
        if (page === 1) {
          setUsers(response.data.users);
        } else {
          setUsers((prev) => [...prev, ...response.data.users]);
        }
        setHasMore(response.data.pagination.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/connections/my-connections`,
      );
      if (response.data.success) {
        setConnections(response.data.connections);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/connections/requests/pending`,
      );
      if (response.data.success) {
        setPendingRequests(response.data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/connections/requests/sent`,
      );
      if (response.data.success) {
        setSentRequests(response.data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch sent requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      const response = await axios.post(`${API_URL}/api/connections/request`, {
        recipientId: userId,
      });
      if (response.data.success) {
        // Update user's connection status in the list
        setUsers(
          users.map((u) =>
            u._id === userId ? { ...u, connectionStatus: "pending_sent" } : u,
          ),
        );
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to send connection request:", error);
      alert(error.response?.data?.message || "Failed to send request");
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      // Find the connection ID for this user
      const sentReq = sentRequests.find((r) => r.user._id === userId);
      if (sentReq) {
        await axios.delete(
          `${API_URL}/api/connections/request/${sentReq.connectionId}/cancel`,
        );
      }

      // Update user's connection status
      setUsers(
        users.map((u) =>
          u._id === userId ? { ...u, connectionStatus: "none" } : u,
        ),
      );
      setSentRequests(sentRequests.filter((r) => r.user._id !== userId));
      fetchStats();
    } catch (error) {
      console.error("Failed to cancel request:", error);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      const request = pendingRequests.find((r) => r.user._id === userId);
      if (request) {
        await axios.put(
          `${API_URL}/api/connections/request/${request.connectionId}/accept`,
        );
        setPendingRequests(
          pendingRequests.filter((r) => r.user._id !== userId),
        );
        setUsers(
          users.map((u) =>
            u._id === userId ? { ...u, connectionStatus: "connected" } : u,
          ),
        );
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to accept request:", error);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      const request = pendingRequests.find((r) => r.user._id === userId);
      if (request) {
        await axios.put(
          `${API_URL}/api/connections/request/${request.connectionId}/reject`,
        );
        setPendingRequests(
          pendingRequests.filter((r) => r.user._id !== userId),
        );
        setUsers(
          users.map((u) =>
            u._id === userId ? { ...u, connectionStatus: "none" } : u,
          ),
        );
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    try {
      await axios.delete(`${API_URL}/api/connections/${connectionId}`);
      setConnections(
        connections.filter((c) => c.connectionId !== connectionId),
      );
      fetchStats();
    } catch (error) {
      console.error("Failed to remove connection:", error);
    }
  };

  const handleMessage = (userId) => {
    navigate("/chat", { state: { openChatWith: userId } });
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setDepartmentFilter("all");
    setBatchFilter("all");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--primary-blue)]/5 dark:to-[var(--accent-orange)]/5">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Network
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Connect with alumni, students, and faculty
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--primary-blue)] dark:text-[var(--accent-orange)]">
              {stats.connections}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Connections
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.pendingReceived}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Pending</p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.pendingSent}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Sent</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "discover", label: "Discover", icon: Search },
            {
              id: "connections",
              label: "My Network",
              icon: UserCheck,
              count: stats.connections,
            },
            {
              id: "pending",
              label: "Requests",
              icon: Clock,
              count: stats.pendingReceived,
            },
            {
              id: "sent",
              label: "Sent",
              icon: UserPlus,
              count: stats.pendingSent,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--card-bg)] hover:text-[var(--text-primary)] border border-[var(--border)]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-[var(--primary-blue)]/10 dark:bg-[var(--accent-orange)]/10 text-[var(--primary-blue)] dark:text-[var(--accent-orange)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search and Filters - Only show for Discover tab */}
        {activeTab === "discover" && (
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, company, or role..."
                  className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] dark:focus:ring-[var(--accent-orange)]"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  showFilters
                    ? "bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] text-white border-transparent"
                    : "bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    Filter Results
                  </h3>
                  <button
                    onClick={resetFilters}
                    className="text-sm text-[var(--primary-blue)] dark:text-[var(--accent-orange)] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Role Filter */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Role
                    </label>
                    <select
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] dark:focus:ring-[var(--accent-orange)]"
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Students</option>
                      <option value="alumni">Alumni</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Department
                    </label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => {
                        setDepartmentFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] dark:focus:ring-[var(--accent-orange)]"
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept === "all" ? "All Departments" : dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch Filter */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Batch
                    </label>
                    <select
                      value={batchFilter}
                      onChange={(e) => {
                        setBatchFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] dark:focus:ring-[var(--accent-orange)]"
                    >
                      {batches.map((batch) => (
                        <option key={batch} value={batch}>
                          {batch === "all" ? "All Batches" : `Batch ${batch}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading && page === 1 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-blue)] dark:text-[var(--accent-orange)]" />
          </div>
        ) : (
          <>
            {/* Discover Tab */}
            {activeTab === "discover" && (
              <>
                {users.length === 0 ? (
                  <div className="text-center py-20">
                    <Users className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                      No users found
                    </h3>
                    <p className="text-[var(--text-secondary)] mt-1">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {users.map((u) => (
                        <UserCard
                          key={u._id}
                          user={u}
                          onConnect={handleConnect}
                          onCancelRequest={handleCancelRequest}
                          onAccept={handleAcceptRequest}
                          onReject={handleRejectRequest}
                          onViewProfile={(userId) =>
                            navigate(`/profile/${userId}`)
                          }
                        />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="text-center mt-8">
                        <button
                          onClick={() => setPage((p) => p + 1)}
                          disabled={loading}
                          className="px-6 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                          ) : (
                            "Load More"
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* My Connections Tab */}
            {activeTab === "connections" && (
              <>
                {connections.length === 0 ? (
                  <div className="text-center py-20">
                    <UserCheck className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                      No connections yet
                    </h3>
                    <p className="text-[var(--text-secondary)] mt-1">
                      Start connecting with others
                    </p>
                    <button
                      onClick={() => setActiveTab("discover")}
                      className="mt-4 px-6 py-2.5 bg-[var(--primary-blue)] dark:bg-[var(--accent-orange)] text-white rounded-xl hover:opacity-90 transition-colors"
                    >
                      Discover People
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {connections.map((conn) => (
                      <div
                        key={conn.connectionId}
                        className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 flex flex-col h-full"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[var(--border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                            onClick={() =>
                              navigate(`/profile/${conn.user._id}`)
                            }
                          >
                            {conn.user.profilePicture ? (
                              <img
                                src={conn.user.profilePicture}
                                alt={conn.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-blue)]/70 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/70 flex items-center justify-center">
                                <span className="text-white font-bold">
                                  {conn.user.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-[var(--text-primary)] truncate cursor-pointer hover:text-[var(--accent)] transition-colors text-sm"
                              onClick={() =>
                                navigate(`/profile/${conn.user._id}`)
                              }
                            >
                              {conn.user.name}
                            </h3>
                            <RoleBadge role={conn.user.role} />
                            {conn.user.currentRole &&
                              conn.user.currentCompany && (
                                <p className="text-xs text-[var(--text-secondary)] truncate mt-1">
                                  {conn.user.currentRole} at{" "}
                                  {conn.user.currentCompany}
                                </p>
                              )}
                          </div>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                          Connected{" "}
                          {new Date(conn.connectedAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-auto pt-3 border-t border-[var(--border)]">
                          <button
                            onClick={() => handleMessage(conn.user._id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--background)] rounded-lg transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Message
                          </button>
                          <button
                            onClick={() =>
                              handleRemoveConnection(conn.connectionId)
                            }
                            className="flex items-center justify-center px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Pending Requests Tab */}
            {activeTab === "pending" && (
              <>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-20">
                    <Clock className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                      No pending requests
                    </h3>
                    <p className="text-[var(--text-secondary)] mt-1">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.connectionId}
                        className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 flex flex-col h-full"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[var(--border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                            onClick={() => navigate(`/profile/${req.user._id}`)}
                          >
                            {req.user.profilePicture ? (
                              <img
                                src={req.user.profilePicture}
                                alt={req.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-blue)]/70 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/70 flex items-center justify-center">
                                <span className="text-white font-bold">
                                  {req.user.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent)] transition-colors text-sm truncate"
                              onClick={() =>
                                navigate(`/profile/${req.user._id}`)
                              }
                            >
                              {req.user.name}
                            </h3>
                            <RoleBadge role={req.user.role} />
                          </div>
                        </div>
                        <div className="flex-1 mt-3">
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                            {req.user.currentRole
                              ? `${req.user.currentRole} at ${req.user.currentCompany}`
                              : req.user.department}
                          </p>
                          {req.message && (
                            <p className="text-xs text-[var(--text-muted)] mt-2 italic line-clamp-2">
                              "{req.message}"
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-auto pt-3 border-t border-[var(--border)]">
                          <button
                            onClick={() => handleAcceptRequest(req.user._id)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.user._id)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Sent Requests Tab */}
            {activeTab === "sent" && (
              <>
                {sentRequests.length === 0 ? (
                  <div className="text-center py-20">
                    <UserPlus className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                      No sent requests
                    </h3>
                    <p className="text-[var(--text-secondary)] mt-1">
                      Send connection requests to expand your network
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sentRequests.map((req) => (
                      <div
                        key={req.connectionId}
                        className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 flex flex-col h-full"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[var(--border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                            onClick={() => navigate(`/profile/${req.user._id}`)}
                          >
                            {req.user.profilePicture ? (
                              <img
                                src={req.user.profilePicture}
                                alt={req.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-blue)]/70 dark:from-[var(--accent-orange)] dark:to-[var(--accent-orange)]/70 flex items-center justify-center">
                                <span className="text-white font-bold">
                                  {req.user.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent)] transition-colors text-sm truncate"
                              onClick={() =>
                                navigate(`/profile/${req.user._id}`)
                              }
                            >
                              {req.user.name}
                            </h3>
                            <RoleBadge role={req.user.role} />
                          </div>
                        </div>
                        <div className="flex-1 mt-3">
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                            {req.user.currentRole
                              ? `${req.user.currentRole} at ${req.user.currentCompany}`
                              : req.user.department}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-2">
                            Sent {new Date(req.sentAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-auto pt-3 border-t border-[var(--border)]">
                          <button
                            onClick={async () => {
                              await axios.delete(
                                `${API_URL}/api/connections/request/${req.connectionId}/cancel`,
                              );
                              setSentRequests(
                                sentRequests.filter(
                                  (r) => r.connectionId !== req.connectionId,
                                ),
                              );
                              fetchStats();
                            }}
                            className="w-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-red-600 bg-[var(--background)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                            Cancel Request
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Network;
