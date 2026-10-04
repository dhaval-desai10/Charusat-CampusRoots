import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  ExternalLink,
  Edit,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  Filter,
  Search,
  PartyPopper,
  Mail,
  Phone,
  CalendarPlus,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const API_URL = "http://localhost:5000/api";

const Reunions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFaculty = user?.role === "faculty";

  // Reunions state
  const [reunions, setReunions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [expandedAttendees, setExpandedAttendees] = useState(null); // For showing attendee details

  // Create/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingReunion, setEditingReunion] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetBatches: [],
    targetDepartments: [],
    eventDate: "",
    eventTime: "",
    venue: "",
    meetingLink: "",
    eventType: "in-person",
    maxAttendees: 0,
    contactEmail: "",
    contactPhone: "",
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Filter state
  const [filterStatus, setFilterStatus] = useState("upcoming");
  const [filterBatch, setFilterBatch] = useState("");

  const departments = [
    "Computer Science & Engineering",
    "Information Technology",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Electronics & Communication",
    "Chemical Engineering",
    "MBA",
    "Other",
  ];

  // Fetch reunions
  const fetchReunions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterBatch) params.append("batch", filterBatch);

      const response = await axios.get(`${API_URL}/reunions?${params}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setReunions(response.data.reunions);
      }
    } catch (error) {
      console.error("Error fetching reunions:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterBatch]);

  // Fetch available batches
  const fetchBatches = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/reunions/batches`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setAvailableBatches(response.data.batches);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  }, []);

  useEffect(() => {
    fetchReunions();
    if (isFaculty) {
      fetchBatches();
    }
  }, [fetchReunions, fetchBatches, isFaculty]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle batch selection
  const toggleBatch = (batch) => {
    setFormData((prev) => ({
      ...prev,
      targetBatches: prev.targetBatches.includes(batch)
        ? prev.targetBatches.filter((b) => b !== batch)
        : [...prev.targetBatches, batch],
    }));
  };

  // Handle department selection
  const toggleDepartment = (dept) => {
    setFormData((prev) => ({
      ...prev,
      targetDepartments: prev.targetDepartments.includes(dept)
        ? prev.targetDepartments.filter((d) => d !== dept)
        : [...prev.targetDepartments, dept],
    }));
  };

  // Handle cover image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingReunion(null);
    setFormData({
      title: "",
      description: "",
      targetBatches: [],
      targetDepartments: [],
      eventDate: "",
      eventTime: "",
      venue: "",
      meetingLink: "",
      eventType: "in-person",
      maxAttendees: 0,
      contactEmail: user?.email || "",
      contactPhone: "",
    });
    setCoverImage(null);
    setCoverPreview("");
    setError("");
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (reunion) => {
    setEditingReunion(reunion);
    setFormData({
      title: reunion.title,
      description: reunion.description,
      targetBatches: reunion.targetBatches || [],
      targetDepartments: reunion.targetDepartments || [],
      eventDate: new Date(reunion.eventDate).toISOString().split("T")[0],
      eventTime: reunion.eventTime,
      venue: reunion.venue,
      meetingLink: reunion.meetingLink || "",
      eventType: reunion.eventType || "in-person",
      maxAttendees: reunion.maxAttendees || 0,
      contactEmail: reunion.contactEmail || "",
      contactPhone: reunion.contactPhone || "",
    });
    setCoverImage(null);
    setCoverPreview(reunion.coverImage || "");
    setError("");
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.targetBatches.length === 0) {
      setError("Please select at least one target batch");
      return;
    }

    try {
      setSubmitting(true);
      const submitData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "targetBatches" || key === "targetDepartments") {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      if (coverImage) {
        submitData.append("coverImage", coverImage);
      }

      if (editingReunion) {
        await axios.put(
          `${API_URL}/reunions/${editingReunion._id}`,
          submitData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } else {
        await axios.post(`${API_URL}/reunions`, submitData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setShowModal(false);
      fetchReunions();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save reunion");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete reunion
  const handleDelete = async (reunionId) => {
    if (!confirm("Are you sure you want to delete this reunion?")) return;

    try {
      await axios.delete(`${API_URL}/reunions/${reunionId}`, {
        withCredentials: true,
      });
      fetchReunions();
    } catch (error) {
      console.error("Error deleting reunion:", error);
    }
  };

  // RSVP to reunion
  const handleRsvp = async (reunionId, status) => {
    try {
      const response = await axios.post(
        `${API_URL}/reunions/${reunionId}/rsvp`,
        { status },
        { withCredentials: true },
      );

      if (response.data.success) {
        setReunions((prev) =>
          prev.map((r) =>
            r._id === reunionId
              ? {
                  ...r,
                  attendees: response.data.attendees,
                  userRsvpStatus: status,
                }
              : r,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
      alert(error.response?.data?.message || "Failed to update RSVP");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get user's RSVP status for a reunion
  const getUserRsvpStatus = (reunion) => {
    const rsvp = reunion.attendees?.find((a) => a.user?._id === user?._id);
    return rsvp?.status || null;
  };

  // Sidebar filter state
  const [sidebarFilter, setSidebarFilter] = useState("all");

  // Filter reunions based on sidebar selection
  const getFilteredReunions = () => {
    if (sidebarFilter === "going") {
      return reunions.filter((r) => getUserRsvpStatus(r) === "going");
    } else if (sidebarFilter === "not-going") {
      return reunions.filter((r) => getUserRsvpStatus(r) === "not-going");
    } else {
      // "All" - exclude reunions where user is going
      return reunions.filter((r) => getUserRsvpStatus(r) !== "going");
    }
  };

  const filteredReunions = getFilteredReunions();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PartyPopper className="w-7 h-7 text-orange-500" />
                Alumni Reunions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isFaculty
                  ? "Organize reunions for alumni batches"
                  : "Discover and attend reunion events"}
              </p>
            </div>

            {isFaculty && (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CalendarPlus className="w-5 h-5" />
                Create Reunion
              </button>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="flex gap-6">
            {/* Left Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm sticky top-24 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    My RSVPs
                  </h3>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => setSidebarFilter("all")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      sidebarFilter === "all"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        sidebarFilter === "all"
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <PartyPopper className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">All Reunions</p>
                      <p className="text-xs text-gray-500">
                        {
                          reunions.filter(
                            (r) => getUserRsvpStatus(r) !== "going",
                          ).length
                        }{" "}
                        events
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSidebarFilter("going")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      sidebarFilter === "going"
                        ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        sidebarFilter === "going"
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">I'm Going</p>
                      <p className="text-xs text-gray-500">
                        {
                          reunions.filter(
                            (r) => getUserRsvpStatus(r) === "going",
                          ).length
                        }{" "}
                        events
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSidebarFilter("not-going")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      sidebarFilter === "not-going"
                        ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        sidebarFilter === "not-going"
                          ? "bg-red-100 dark:bg-red-900"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Not Going</p>
                      <p className="text-xs text-gray-500">
                        {
                          reunions.filter(
                            (r) => getUserRsvpStatus(r) === "not-going",
                          ).length
                        }{" "}
                        events
                      </p>
                    </div>
                  </button>
                </div>

                {/* Additional Filters */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Status Filter
                  </p>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                  >
                    <option value="">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {user?.role !== "alumni" && (
                    <>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 mt-4">
                        Batch Filter
                      </p>
                      <select
                        value={filterBatch}
                        onChange={(e) => setFilterBatch(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                      >
                        <option value="">All Batches</option>
                        {availableBatches.map((batch) => (
                          <option key={batch} value={batch}>
                            {batch}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1">
              {/* Mobile Filter Tabs */}
              <div className="lg:hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2 mb-6 flex gap-2">
                <button
                  onClick={() => setSidebarFilter("all")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    sidebarFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSidebarFilter("going")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    sidebarFilter === "going"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Going
                </button>
                <button
                  onClick={() => setSidebarFilter("not-going")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    sidebarFilter === "not-going"
                      ? "bg-red-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Not Going
                </button>
              </div>

              {/* Reunions Grid */}
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : filteredReunions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {sidebarFilter === "all"
                      ? "No reunions found"
                      : sidebarFilter === "going"
                        ? "You haven't RSVP'd to any reunions yet"
                        : "No declined reunions"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {sidebarFilter === "all"
                      ? isFaculty
                        ? "Create a reunion to bring alumni together!"
                        : "Check back later for upcoming reunions."
                      : "Browse all reunions to find events to attend."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredReunions.map((reunion) => {
                    const userRsvp = getUserRsvpStatus(reunion);
                    const goingCount =
                      reunion.attendees?.filter((a) => a.status === "going")
                        .length || 0;

                    return (
                      <div
                        key={reunion._id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full"
                      >
                        {/* Cover Image */}
                        <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden flex-shrink-0">
                          {reunion.coverImage ? (
                            <img
                              src={reunion.coverImage}
                              alt={reunion.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PartyPopper className="w-16 h-16 text-white/30" />
                            </div>
                          )}
                          {/* Status Badge */}
                          {userRsvp && (
                            <div
                              className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                                userRsvp === "going"
                                  ? "bg-green-500 text-white"
                                  : userRsvp === "not-going"
                                    ? "bg-red-500 text-white"
                                    : "bg-blue-500 text-white"
                              }`}
                            >
                              {userRsvp === "going"
                                ? "Going"
                                : userRsvp === "not-going"
                                  ? "Not Going"
                                  : "Interested"}
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          {/* Title & Actions */}
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {reunion.title}
                            </h3>
                            {reunion.organizer?._id === user?._id && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => openEditModal(reunion)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(reunion._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            by {reunion.organizer?.name}
                          </p>

                          {/* Target Batches */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {reunion.targetBatches?.slice(0, 2).map((batch) => (
                              <span
                                key={batch}
                                className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                              >
                                {batch}
                              </span>
                            ))}
                            {reunion.targetBatches?.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                +{reunion.targetBatches.length - 2}
                              </span>
                            )}
                          </div>

                          {/* Event Details - Compact */}
                          <div className="space-y-1.5 mb-3 flex-1">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {formatDate(reunion.eventDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{reunion.eventTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              {reunion.eventType === "online" ? (
                                <Video className="w-3.5 h-3.5 flex-shrink-0" />
                              ) : (
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              )}
                              <span className="truncate">{reunion.venue}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <Users className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{goingCount} going</span>
                            </div>
                          </div>

                          {/* RSVP Buttons (for alumni) - Fixed at bottom */}
                          {user?.role === "alumni" && (
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
                              <button
                                onClick={() => handleRsvp(reunion._id, "going")}
                                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  userRsvp === "going"
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900"
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                Going
                              </button>
                              <button
                                onClick={() =>
                                  handleRsvp(reunion._id, "not-going")
                                }
                                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  userRsvp === "not-going"
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900"
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                Can't Go
                              </button>
                            </div>
                          )}

                          {/* View Attendees Button (for faculty) */}
                          {isFaculty && reunion.attendees?.length > 0 && (
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
                              <button
                                onClick={() =>
                                  setExpandedAttendees(
                                    expandedAttendees === reunion._id
                                      ? null
                                      : reunion._id,
                                  )
                                }
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                <Users className="w-3.5 h-3.5" />
                                View Attendees ({reunion.attendees.length})
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform ${expandedAttendees === reunion._id ? "rotate-180" : ""}`}
                                />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Expanded Attendee List */}
                        {expandedAttendees === reunion._id && (
                          <div className="px-4 pb-4 space-y-2">
                            {reunion.attendees.filter(
                              (a) => a.status === "going",
                            ).length > 0 && (
                              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                                  Going (
                                  {
                                    reunion.attendees.filter(
                                      (a) => a.status === "going",
                                    ).length
                                  }
                                  )
                                </p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {reunion.attendees
                                    .filter((a) => a.status === "going")
                                    .map((attendee, idx) => (
                                      <p
                                        key={idx}
                                        className="text-xs text-gray-700 dark:text-gray-300"
                                      >
                                        {attendee.user?.name}
                                      </p>
                                    ))}
                                </div>
                              </div>
                            )}
                            {reunion.attendees.filter(
                              (a) => a.status === "not-going",
                            ).length > 0 && (
                              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                                  Not Going (
                                  {
                                    reunion.attendees.filter(
                                      (a) => a.status === "not-going",
                                    ).length
                                  }
                                  )
                                </p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {reunion.attendees
                                    .filter((a) => a.status === "not-going")
                                    .map((attendee, idx) => (
                                      <p
                                        key={idx}
                                        className="text-xs text-gray-700 dark:text-gray-300"
                                      >
                                        {attendee.user?.name}
                                      </p>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingReunion ? "Edit Reunion" : "Create Reunion"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Image
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  {coverPreview ? (
                    <div className="relative">
                      <img
                        src={coverPreview}
                        alt="Cover"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage(null);
                          setCoverPreview("");
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <Plus className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Upload cover image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="e.g., Batch 2018 Annual Reunion"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Describe the event..."
                />
              </div>

              {/* Target Batches */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Batches * (Select the batches to invite)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-40 overflow-y-auto">
                  {availableBatches.map((batch) => (
                    <button
                      key={batch}
                      type="button"
                      onClick={() => toggleBatch(batch)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.targetBatches.includes(batch)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {batch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Departments (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Departments (Optional - leave empty for all)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        formData.targetDepartments.includes(dept)
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Time *
                  </label>
                  <input
                    type="time"
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Type
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="in-person">In-Person</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue / Location *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="e.g., CHARUSAT Campus, Main Auditorium"
                />
              </div>

              {/* Meeting Link (for online/hybrid) */}
              {(formData.eventType === "online" ||
                formData.eventType === "hybrid") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}

              {/* Max Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Attendees (0 for unlimited)
                </label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingReunion ? "Update" : "Create"} Reunion
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Reunions;
