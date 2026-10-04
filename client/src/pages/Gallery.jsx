import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "@/components/Navbar";
import {
  Image,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Images,
  FolderOpen,
  GraduationCap,
  PartyPopper,
  MoreHorizontal,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

// Category configuration
const CATEGORIES = [
  { id: "all", label: "All", icon: FolderOpen },
  { id: "convocation", label: "Convocation", icon: GraduationCap },
  { id: "spoural", label: "Spoural", icon: PartyPopper },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

const getCategoryColor = (category) => {
  switch (category) {
    case "convocation":
      return "bg-blue-500";
    case "spoural":
      return "bg-purple-500";
    case "other":
      return "bg-slate-500";
    default:
      return "bg-slate-500";
  }
};

const Gallery = () => {
  const { user } = useAuth();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/gallery`, {
        withCredentials: true,
      });
      setGalleries(response.data);
    } catch (error) {
      console.error("Failed to fetch galleries:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const openLightbox = (gallery, index = 0) => {
    setSelectedGallery(gallery);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedGallery(null);
    setLightboxIndex(0);
  };

  const navigateLightbox = (direction) => {
    if (!selectedGallery) return;
    const total = selectedGallery.photos.length;
    if (direction === "next") {
      setLightboxIndex((prev) => (prev + 1) % total);
    } else {
      setLightboxIndex((prev) => (prev - 1 + total) % total);
    }
  };

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") navigateLightbox("next");
      if (e.key === "ArrowLeft") navigateLightbox("prev");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, selectedGallery]);

  // Get filtered galleries
  const filteredGalleries = galleries.filter(
    (g) => activeCategory === "all" || g.category === activeCategory,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="flex gap-6">
          {/* Left Sidebar - Desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                Categories
              </h3>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const count =
                    cat.id === "all"
                      ? galleries.length
                      : galleries.filter((g) => g.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        activeCategory === cat.id
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{cat.label}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          activeCategory === cat.id
                            ? "bg-white/20 text-white"
                            : "bg-slate-600 text-slate-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile Category Tabs */}
          <div className="lg:hidden fixed top-16 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-4 py-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count =
                  cat.id === "all"
                    ? galleries.length
                    : galleries.filter((g) => g.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                      activeCategory === cat.id
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        activeCategory === cat.id
                          ? "bg-white/20 text-white"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side - Gallery Cards */}
          <div className="flex-1 lg:mt-0 mt-16">
            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : galleries.length === 0 ? (
              <div className="text-center py-16">
                <Image className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Galleries Yet
                </h3>
                <p className="text-slate-400">
                  Check back later for new photo galleries!
                </p>
              </div>
            ) : filteredGalleries.length === 0 ? (
              <div className="text-center py-16">
                <Image className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Galleries in this Category
                </h3>
                <p className="text-slate-400">
                  Try selecting a different category
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredGalleries.map((gallery) => (
                  <div
                    key={gallery._id}
                    className="group bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col h-full"
                  >
                    {/* Cover Image */}
                    <div
                      className="h-48 relative overflow-hidden cursor-pointer shrink-0"
                      onClick={() => openLightbox(gallery, 0)}
                    >
                      {gallery.coverImage || gallery.photos?.[0]?.url ? (
                        <img
                          src={gallery.coverImage || gallery.photos[0].url}
                          alt={gallery.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <Image className="w-12 h-12 text-slate-500" />
                        </div>
                      )}

                      {/* Overlay with photo count */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(gallery.category)}`}
                        >
                          {gallery.category?.charAt(0).toUpperCase() +
                            gallery.category?.slice(1) || "Other"}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                        <Images className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {gallery.photos?.length || 0} photos
                        </span>
                      </div>
                    </div>

                    {/* Gallery Info */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {gallery.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
                        {gallery.description || "No description"}
                      </p>
                      <div className="flex items-center text-xs text-slate-500 mb-4">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        {formatDate(gallery.createdAt)}
                      </div>

                      {/* Photo preview thumbnails - pushed to bottom */}
                      <div className="mt-auto">
                        {gallery.photos?.length > 1 ? (
                          <div className="flex gap-1">
                            {gallery.photos.slice(0, 4).map((photo, idx) => (
                              <div
                                key={idx}
                                className="relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openLightbox(gallery, idx)}
                              >
                                <img
                                  src={photo.url}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 3 && gallery.photos.length > 4 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                      +{gallery.photos.length - 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => openLightbox(gallery, 0)}
                            className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Images className="w-4 h-4" />
                            View Gallery
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && selectedGallery && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-50 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Gallery info */}
          <div className="absolute top-4 left-4 z-50">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white text-xl font-semibold">
                {selectedGallery.title}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getCategoryColor(selectedGallery.category)}`}
              >
                {selectedGallery.category?.charAt(0).toUpperCase() +
                  selectedGallery.category?.slice(1) || "Other"}
              </span>
            </div>
            <p className="text-white/60 text-sm">
              {lightboxIndex + 1} / {selectedGallery.photos.length}
            </p>
          </div>

          {/* Navigation buttons */}
          {selectedGallery.photos.length > 1 && (
            <>
              <button
                onClick={() => navigateLightbox("prev")}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => navigateLightbox("next")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Main image */}
          <div className="w-full h-full flex items-center justify-center p-16">
            <img
              src={selectedGallery.photos[lightboxIndex]?.url}
              alt={
                selectedGallery.photos[lightboxIndex]?.caption ||
                `Photo ${lightboxIndex + 1}`
              }
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Caption */}
          {selectedGallery.photos[lightboxIndex]?.caption && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-lg">
              <p className="text-white text-sm">
                {selectedGallery.photos[lightboxIndex].caption}
              </p>
            </div>
          )}

          {/* Thumbnail strip */}
          {selectedGallery.photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/40 rounded-xl backdrop-blur-sm max-w-[80%] overflow-x-auto">
              {selectedGallery.photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === lightboxIndex
                      ? "border-amber-500 scale-110"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Gallery;
