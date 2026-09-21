import React, { useState } from 'react';
import { UserProfile, TravelItinerary } from '../types';
import {
  User,
  Calendar,
  MapPin,
  Award,
  Heart,
  Compass,
  ShieldCheck,
  Edit3,
  Camera,
  Mail,
  Phone,
  Globe,
  Clock,
  CheckCircle2,
  DollarSign,
  X,
  Save,
  LogOut,
  Sparkles,
  KeyRound,
  FileText,
  Ticket,
  Printer,
  Building2,
  Eye,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface UserDashboardProps {
  isDarkMode: boolean;
  savedItineraries: TravelItinerary[];
  onOpenItinerary: (itinerary: TravelItinerary) => void;
  currentUser: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  onOpenAuthModal: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  isDarkMode,
  savedItineraries,
  onOpenItinerary,
  currentUser,
  onUpdateProfile,
  onLogout,
  onOpenAuthModal
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Bookings state
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState<any | null>(null);

  // Editable Form State initialized from currentUser
  const [formData, setFormData] = useState<UserProfile>(
    currentUser || {
      id: 'USR001',
      firstName: 'Roshan',
      lastName: 'Gorade',
      name: 'Roshan Gorade',
      username: 'roshan_g',
      email: 'roshan@example.com',
      phone: '+91 9876543210',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      gender: 'Male',
      dateOfBirth: '2005-08-15',
      country: 'India',
      state: 'Maharashtra',
      city: 'Chhatrapati Sambhajinagar',
      preferredLanguage: 'English',
      currency: 'INR',
      timeZone: 'Asia/Kolkata',
      bio: 'Passionate traveler exploring India and the world.',
      memberSince: '2026-01-10',
      verified: true,
      role: 'USER',
      visitedDestinationsCount: 14,
      totalKmTraveled: 18450,
      badges: ['Himalayan Explorer', 'Beach Nomad', 'Foodie Pioneer', 'Cultural Historian']
    }
  );

  // Sync if currentUser prop updates
  React.useEffect(() => {
    if (currentUser) {
      setFormData(currentUser);
    }
  }, [currentUser]);

  // Load user bookings from backend API
  React.useEffect(() => {
    const fetchUserBookings = async () => {
      setIsLoadingBookings(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('tripnova_token') : null;
        const res = await fetch('/api/bookings', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.bookings)) {
          setUserBookings(data.bookings);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    fetchUserBookings();
  }, [currentUser]);

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80'
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const computedName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim() || formData.username;
    const updated: UserProfile = {
      ...formData,
      name: computedName,
      avatar: formData.profileImage
    };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tripnova_token') : null;
      if (token) {
        const res = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updated)
        });
        const data = await res.json();
        if (data.success && data.user) {
          onUpdateProfile(data.user);
        } else {
          onUpdateProfile(updated);
        }
      } else {
        onUpdateProfile(updated);
      }
    } catch (err) {
      console.error('Failed to persist profile to backend:', err);
      onUpdateProfile(updated);
    }

    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({
            ...prev,
            profileImage: reader.result as string,
            avatar: reader.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!currentUser) {
    return (
      <section className={`py-16 transition-colors ${isDarkMode ? 'bg-[#0B1120] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign In Required</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Log in to view and edit your profile details, manage itineraries, and track travel badges.
            </p>
          </div>
          <button
            onClick={onOpenAuthModal}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </section>
    );
  }

  const profile = formData;

  return (
    <section className={`py-12 transition-colors ${isDarkMode ? 'bg-[#0B1120] text-white' : 'bg-slate-50/50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Save Success Banner */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">Profile details successfully updated!</span>
            </div>
            <button onClick={() => setSaveSuccess(false)} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main User Banner Header */}
        <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
          isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
            <div className="relative group">
              <img
                src={profile.profileImage || profile.avatar}
                alt={profile.firstName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-xs"
              />
              {profile.verified && (
                <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-slate-900" title="Verified Account">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h2>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">@{profile.username}</span>
                <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold border border-sky-500/20">
                  {profile.role}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                {profile.bio || 'Passionate traveler exploring India and the world.'}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {profile.city}, {profile.state}, {profile.country}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  Member since {profile.memberSince}
                </span>
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  ID: <code className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{profile.id}</code>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
            <button
              id="edit-profile-trigger-btn"
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Close Editor' : 'Edit Profile'}</span>
            </button>

            <button
              id="dashboard-logout-btn"
              onClick={onLogout}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* PROFILE EDITOR FORM (COLLAPSIBLE / MODAL VIEW) */}
        {isEditing && (
          <div className={`p-6 sm:p-8 rounded-2xl border shadow-lg transition-all animate-fade-in ${
            isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Profile Information Editor
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Update your personal credentials, avatar, location, preferences, and bio.
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Image & Avatar Picker */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                  Profile Photo & Avatar
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative shrink-0">
                    <img
                      src={formData.profileImage || formData.avatar}
                      alt="Preview"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover ring-2 ring-slate-300 dark:ring-slate-700"
                    />
                  </div>

                  <div className="space-y-3 flex-1 w-full">
                    <div>
                      <label className="block text-xs text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Option A: Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://domain.com/images/profile.jpg"
                        value={formData.profileImage}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          profileImage: e.target.value,
                          avatar: e.target.value
                        }))}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500 placeholder:text-slate-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors">
                        <Camera className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>Upload Photo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">or pick preset avatar:</span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {avatarPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            profileImage: preset,
                            avatar: preset
                          }))}
                          className={`w-9 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            formData.profileImage === preset ? 'border-sky-500 scale-105 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Grid: Core Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Language
                  </label>
                  <input
                    type="text"
                    value={formData.preferredLanguage}
                    onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Currency & TimeZone
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <input
                      type="text"
                      value={formData.timeZone}
                      onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                      className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Traveler Bio / Headline
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about your favorite travel vibes, bucket list goals, or motto..."
                  className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none"
                />
              </div>

              {/* Submit / Cancel Footer Buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4 text-sky-300" />
                  <span>Save Profile Updates</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Detailed Schema Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Personal & Contact */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'}`}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Contact & Identity</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">User ID</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{profile.id}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Full Name</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.firstName} {profile.lastName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Username</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">@{profile.username}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Email</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.email}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Phone</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Gender / DOB</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.gender} • {profile.dateOfBirth}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Location & Regional Preferences */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'}`}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Location & Preferences</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">City / State</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.city}, {profile.state}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Country</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.country}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Language</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.preferredLanguage}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Currency</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.currency}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Time Zone</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{profile.timeZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Account Status</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  {profile.verified ? 'Verified Client' : 'Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Nomad Telemetry Stats */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'}`}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Travel Telemetry</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-center border border-slate-200/60 dark:border-slate-800">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {profile.visitedDestinationsCount || 14}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">States Visited</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-center border border-slate-200/60 dark:border-slate-800">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {(((profile.totalKmTraveled || 18450)) / 1000).toFixed(1)}k
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">KM Traveled</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Saved Itineraries</span>
                <span className="font-bold text-slate-900 dark:text-white">{savedItineraries.length} Trips</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Member Role</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">{profile.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Saved & Generated Itineraries Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Saved Itineraries</h3>
            <span className="text-xs text-slate-700 dark:text-slate-400 font-semibold">{savedItineraries.length} Saved</span>
          </div>

          {savedItineraries.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center text-xs text-slate-600 dark:text-slate-400 font-medium ${
              isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-300'
            }`}>
              No trip itineraries generated yet. Head to the <strong className="text-sky-600 dark:text-sky-400 font-bold">Plan with AI</strong> tab to create your first customized journey!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItineraries.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => onOpenItinerary(trip)}
                  className={`p-5 rounded-2xl border cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition-all hover:shadow-sm ${
                    isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold">
                      {trip.durationDays} Days Trip
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ₹{trip.totalEstimatedCostINR?.toLocaleString('en-IN') || '12,500'}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 dark:text-white">{trip.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">From {trip.origin} to {trip.destination}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Bookings & Stays Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span>My Bookings & Stays</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                Confirmed reservations, test e-tickets, and live property vouchers
              </p>
            </div>
            <span className="text-xs text-slate-700 dark:text-slate-400 font-semibold">
              {userBookings.length} {userBookings.length === 1 ? 'Stay' : 'Stays'}
            </span>
          </div>

          {isLoadingBookings ? (
            <div className={`p-8 rounded-2xl border text-center text-xs ${
              isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
            }`}>
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-600 dark:text-slate-400">Loading stay reservations...</p>
            </div>
          ) : userBookings.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center text-xs text-slate-600 dark:text-slate-400 font-medium ${
              isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-300'
            }`}>
              No stay reservations recorded yet. Browse the <strong className="text-sky-600 dark:text-sky-400 font-bold">Hotels & Stays</strong> section to reserve your next stay!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBookings.map((bk) => {
                const isConfirmed = bk.status === 'CONFIRMED';
                const isPending = bk.status === 'PENDING';
                return (
                  <div
                    key={bk.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-sm ${
                      isDarkMode ? 'bg-[#131E32] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2.5 py-0.5 rounded-md font-bold font-mono text-[10px] ${
                          isConfirmed 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : isPending
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                        }`}>
                          {bk.status}
                        </span>
                        <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                          {bk.bookingReference}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                        {bk.hotelName}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{bk.destination}</span>
                      </p>

                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                          <span>Window:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{bk.checkInDate} → {bk.checkOutDate}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                          <span>Guests:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{bk.guestsCount || 2} Persons</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                          <span>Amount:</span>
                          <span className="font-bold text-slate-900 dark:text-white">₹{(bk.totalAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {bk.ticketId || ('ET-' + bk.id.substring(0, 6).toUpperCase())}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedVoucherBooking(bk)}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>View E-Ticket</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unlocked Badges */}
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-4">Travel Badges</h3>
          <div className="flex flex-wrap gap-3">
            {(profile.badges || ['Himalayan Explorer', 'Beach Nomad', 'Foodie Pioneer', 'Cultural Historian']).map((badge, i) => (
              <div
                key={i}
                className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  isDarkMode ? 'bg-[#131E32] border-slate-800 text-amber-400' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
                }`}
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* E-Ticket / Voucher Modal */}
      {selectedVoucherBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 transition-all my-8 ${
            isDarkMode ? 'bg-[#131E32] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="font-bold text-base">TripNova Stay Voucher</h3>
              </div>
              <button
                onClick={() => setSelectedVoucherBooking(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 p-5 rounded-2xl border border-dashed border-sky-400/50 bg-sky-50/50 dark:bg-sky-950/30 text-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    Official Reservation Voucher
                  </span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedVoucherBooking.hotelName}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    {selectedVoucherBooking.destination}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs">
                  {selectedVoucherBooking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Booking Reference</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{selectedVoucherBooking.bookingReference}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">E-Ticket ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedVoucherBooking.ticketId || ('ET-' + selectedVoucherBooking.id.substring(0, 6).toUpperCase())}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Check-in Date</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedVoucherBooking.checkInDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Check-out Date</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedVoucherBooking.checkOutDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Guests</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedVoucherBooking.guestsCount || 2} Persons</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Amount</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(selectedVoucherBooking.totalAmount || 0).toLocaleString('en-IN')} (PAID)</span>
                </div>
              </div>

              {selectedVoucherBooking.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Special Requests</span>
                  <p className="italic text-slate-600 dark:text-slate-300">{selectedVoucherBooking.notes}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Academic MVP Demonstration Record</span>
                <span className="font-mono">TripNova.ai • 2026</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Voucher</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedVoucherBooking(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
