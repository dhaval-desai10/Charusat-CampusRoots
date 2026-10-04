import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import Navbar from "../components/Navbar";
import {
  Heart,
  IndianRupee,
  Gift,
  Users,
  Trophy,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  History,
  Receipt,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Target,
  Crown,
  Medal,
  CreditCard,
  Shield,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const DonationForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [purpose, setPurpose] = useState("general");
  const [message, setMessage] = useState("");
  const [isAnonymous,] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const predefinedAmounts = [500, 1000, 2500, 5000, 10000, 25000];

  const purposes = [
    {
      value: "general",
      label: "General Fund",
      icon: Heart,
      color: "from-red-500 to-rose-600",
      bg: "bg-red-500/10",
    },
    {
      value: "scholarship",
      label: "Scholarships",
      icon: Trophy,
      color: "from-yellow-500 to-amber-600",
      bg: "bg-yellow-500/10",
    },
    {
      value: "infrastructure",
      label: "Infrastructure",
      icon: Building2,
      color: "from-blue-500 to-indigo-600",
      bg: "bg-blue-500/10",
    },
    {
      value: "events",
      label: "Events & Reunions",
      icon: Calendar,
      color: "from-purple-500 to-violet-600",
      bg: "bg-purple-500/10",
    },
    {
      value: "other",
      label: "Other Causes",
      icon: Sparkles,
      color: "from-green-500 to-emerald-600",
      bg: "bg-green-500/10",
    },
  ];

  const selectedAmount = customAmount || amount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    if (!selectedAmount || parseInt(selectedAmount) < 100) {
      setError("Minimum Contributions amount is ₹100");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post(
        `${API_BASE}/donation/create-payment-intent`,
        { amount: parseInt(selectedAmount), purpose, message, isAnonymous },
        { withCredentials: true },
      );

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: isAnonymous ? "Anonymous Donor" : user?.name,
              email: user?.email,
            },
          },
        });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        await axios.post(
          `${API_BASE}/donation/confirm`,
          { donationId: data.donationId, paymentIntentId: paymentIntent.id },
          { withCredentials: true },
        );
        onSuccess(parseInt(selectedAmount));
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Payment failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#374151",
        fontFamily: "system-ui, sans-serif",
        "::placeholder": { color: "#9ca3af" },
      },
      invalid: { color: "#ef4444" },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Amount Selection */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-blue-500" />
          Select Amount
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {predefinedAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => {
                setAmount(amt.toString());
                setCustomAmount("");
              }}
              className={`relative py-4 px-4 rounded-2xl border-2 transition-all duration-300 font-semibold group overflow-hidden ${
                amount === amt.toString() && !customAmount
                  ? "border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "border-[var(--border)] hover:border-blue-300 text-[var(--text-primary)] bg-[var(--card-bg)]"
              }`}
            >
              <span className="relative z-10">₹{amt.toLocaleString()}</span>
              {amt === 10000 && (
                <span className="absolute top-1 right-1 px-2 py-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full">
                  POPULAR
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="number"
            placeholder="Or enter custom amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setAmount("");
            }}
            min="100"
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none transition-colors text-lg"
          />
        </div>
      </div>

      {/* Purpose Selection */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Choose a Cause
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {purposes.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPurpose(p.value)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                purpose === p.value
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-[var(--border)] hover:border-blue-300 bg-[var(--card-bg)]"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl bg-gradient-to-br ${p.color} text-white`}
              >
                <p.icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-[var(--text-primary)]">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Leave a Message (Optional)
        </h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share why you're donating or leave an encouraging message..."
          maxLength={500}
          rows={3}
          className="w-full px-4 py-4 rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-blue-500 focus:outline-none resize-none transition-colors"
        />
      </div>

      {/* Card Element */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          Payment Details
        </h3>
        <div className="p-5 rounded-2xl border-2 border-[var(--border)] bg-white dark:bg-gray-900">
          <CardElement options={cardElementOptions} />
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm text-[var(--text-secondary)]">
          <Shield className="w-4 h-4" />
          Secured by Stripe. Your payment info is encrypted.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !stripe || !selectedAmount}
        className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Heart className="w-6 h-6" />
            Contribute{" "}
            {selectedAmount
              ? `₹${parseInt(selectedAmount).toLocaleString()}`
              : "Now"}
          </>
        )}
      </button>
    </form>
  );
};

const Donation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("donate");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [myDonations, setMyDonations] = useState({
    donations: [],
    totalDonated: 0,
  });
  const [publicDonors, setPublicDonors] = useState({
    topDonors: [],
    stats: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "alumni") {
      navigate("/feed");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [myRes, publicRes] = await Promise.all([
        axios.get(`${API_BASE}/donation/my-donations`, {
          withCredentials: true,
        }),
        axios.get(`${API_BASE}/donation/public-donors`, {
          withCredentials: true,
        }),
      ]);
      setMyDonations(myRes.data);
      setPublicDonors(publicRes.data);
    } catch (err) {
      console.error("Error fetching Contributions data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSuccess = (amount) => {
    setSuccessAmount(amount);
    setShowSuccess(true);
    fetchData();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (user?.role !== "alumni") return null;

  const tabs = [
    { id: "donate", label: "Make a Contributions", icon: Heart },
    { id: "donors", label: "Top Contributions", icon: Crown },
    { id: "history", label: "My History", icon: History },
  ];

  const getRankBadge = (index) => {
    if (index === 0)
      return { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/20" };
    if (index === 1)
      return { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/20" };
    if (index === 2)
      return { icon: Medal, color: "text-orange-500", bg: "bg-orange-500/20" };
    return {
      icon: Star,
      color: "text-[var(--text-secondary)]",
      bg: "bg-[var(--background)]",
    };
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 p-8 md:p-12">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
                  <Heart className="w-4 h-4 animate-pulse" />
                  Give Back to Your Community
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Support Your
                  <br />
                  Alma Mater
                </h1>
                <p className="text-white/80 text-lg max-w-md">
                  Every contribution makes a difference. Help us build a
                  brighter future for the next generation.
                </p>
              </div>
              <div className="flex-shrink-0 hidden lg:block">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 animate-pulse">
                    <Gift className="w-20 h-20 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-xl transition-all duration-300 group">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white w-fit mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                ₹{(publicDonors.stats?.totalAmount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Total Raised
              </p>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-xl transition-all duration-300 group">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-fit mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {publicDonors.stats?.uniqueDonors || 0}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Generous Contributions
              </p>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-xl transition-all duration-300 group">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white w-fit mb-3 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {publicDonors.stats?.donationCount || 0}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Total Contributions
              </p>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-xl transition-all duration-300 group">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white w-fit mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">5</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Causes Supported
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30"
                    : "bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-2 border-[var(--border)] hover:border-blue-300"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm">
            {/* Donate Tab */}
            {activeTab === "donate" && (
              <>
                {showSuccess ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-8 animate-bounce">
                      <CheckCircle className="w-14 h-14 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                      Thank You! 🎉
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] mb-8">
                      Your Contributions of{" "}
                      <span className="font-bold text-blue-500">
                        ₹{successAmount.toLocaleString()}
                      </span>{" "}
                      has been processed successfully.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <button
                        onClick={() => setShowSuccess(false)}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
                      >
                        Donate Again
                      </button>
                      <button
                        onClick={() => setActiveTab("history")}
                        className="px-8 py-3 rounded-xl border-2 border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--background)] transition-colors"
                      >
                        View My Contributions
                      </button>
                    </div>
                  </div>
                ) : (
                  <Elements stripe={stripePromise}>
                    <DonationForm onSuccess={handleDonationSuccess} />
                  </Elements>
                )}
              </>
            )}

            {/* Donors Tab */}
            {activeTab === "donors" && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    Hall of Fame
                  </h2>
                </div>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  </div>
                ) : publicDonors.topDonors?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-[var(--background)] mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-10 h-10 text-[var(--text-secondary)]" />
                    </div>
                    <p className="text-[var(--text-secondary)] text-lg">
                      Be the first to donate!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {publicDonors.topDonors.map((donor, index) => {
                      const badge = getRankBadge(index);
                      return (
                        <div
                          key={donor._id}
                          className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                            index < 3
                              ? "border-yellow-200 dark:border-yellow-900/50 bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/10"
                              : "border-[var(--border)]"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${badge.bg}`}
                          >
                            <badge.icon className={`w-6 h-6 ${badge.color}`} />
                          </div>
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--background)] ring-2 ring-[var(--border)]">
                            {donor.user?.profilePicture ? (
                              <img
                                src={donor.user.profilePicture}
                                alt={donor.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-bold">
                                {donor.user?.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] truncate text-lg">
                              {donor.user?.name}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">
                              Batch of {donor.user?.graduationYear} •{" "}
                              {donor.purpose}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-500">
                              ₹{donor.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {formatDate(donor.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-6 h-6 text-blue-500" />
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      My Contributions
                    </h2>
                  </div>
                  {myDonations.totalDonated > 0 && (
                    <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-200 dark:border-blue-900">
                      <p className="text-sm text-[var(--text-secondary)]">
                        Total Donated
                      </p>
                      <p className="text-xl font-bold text-blue-500">
                        ₹{myDonations.totalDonated?.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  </div>
                ) : myDonations.donations?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-[var(--background)] mx-auto mb-4 flex items-center justify-center">
                      <History className="w-10 h-10 text-[var(--text-secondary)]" />
                    </div>
                    <p className="text-[var(--text-secondary)] text-lg mb-4">
                      You haven't made any Contributions yet
                    </p>
                    <button
                      onClick={() => setActiveTab("donate")}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold"
                    >
                      Make Your First Contributions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myDonations.donations.map((donation) => (
                      <div
                        key={donation._id}
                        className="p-5 rounded-2xl border-2 border-[var(--border)] hover:border-blue-200 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                donation.paymentStatus === "succeeded"
                                  ? "bg-green-500/10 text-green-600"
                                  : donation.paymentStatus === "processing"
                                    ? "bg-yellow-500/10 text-yellow-600"
                                    : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {donation.paymentStatus === "succeeded"
                                ? "✓ Completed"
                                : donation.paymentStatus}
                            </span>
                            {donation.isAnonymous && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--background)] text-[var(--text-secondary)]">
                                <EyeOff className="w-3 h-3 inline mr-1" />
                                Anonymous
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-[var(--text-secondary)]">
                            {formatDate(donation.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                              ₹{donation.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)] capitalize flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {donation.purpose}
                            </p>
                          </div>
                          {donation.receiptUrl && (
                            <a
                              href={donation.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--background)] text-[var(--primary-blue)] hover:bg-blue-500/10 hover:text-blue-500 transition-colors font-medium"
                            >
                              <Receipt className="w-4 h-4" />
                              Receipt
                            </a>
                          )}
                        </div>
                        {donation.message && (
                          <p className="mt-3 text-sm text-[var(--text-secondary)] border-t border-[var(--border)] pt-3 italic">
                            "{donation.message}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donation;
