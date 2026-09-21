import React, { useState, useEffect } from 'react';
import { AdminStats } from '../types';
import { 
  ShieldCheck, 
  Users, 
  Sparkles, 
  DollarSign, 
  Activity, 
  Server, 
  ArrowUpRight, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  MessageSquare, 
  Utensils, 
  Star, 
  Bell, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  Hotel, 
  Bus, 
  Lock, 
  Settings, 
  ChevronRight, 
  Check, 
  X, 
  FileText, 
  ExternalLink,
  Info,
  Ticket,
  Loader2,
  RefreshCw,
  UploadCloud
} from 'lucide-react';

interface AdminDashboardProps {
  isDarkMode: boolean;
  currentUser?: { role?: string; name?: string; email?: string } | null;
  onOpenAuthModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isDarkMode, currentUser, onOpenAuthModal }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states for admin sub-modules
  const [usersList, setUsersList] = useState<any[]>([]);
  const [tripsList, setTripsList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [destinationsList, setDestinationsList] = useState<any[]>([]);
  const [hotelsList, setHotelsList] = useState<any[]>([]);
  const [restaurantsList, setRestaurantsList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [dbOverview, setDbOverview] = useState<any>(null);

  // Modal / Drawer state
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [modalType, setModalType] = useState<string | null>(null);
  
  // Forms state for Add actions
  const [newItemForm, setNewItemForm] = useState<any>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('tripnova_token') : '';
  const headers = {
    'Authorization': `Bearer ${token || ''}`,
    'Content-Type': 'application/json'
  };

  const [importingCsv, setImportingCsv] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleSyncCSV = async () => {
    setImportingCsv(true);
    setImportMessage(null);
    try {
      const res = await fetch('/api/admin/import-csv', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success) {
        setImportMessage(data.message);
        fetchTabData('db-overview');
        fetchTabData('hotels');
        fetchTabData('restaurants');
      } else {
        setImportMessage('Error: ' + data.message);
      }
    } catch (err: any) {
      setImportMessage('Failed: ' + err.message);
    } finally {
      setImportingCsv(false);
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTabData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const res = await fetch('/api/admin/users', { headers });
        const data = await res.json();
        if (data.users) setUsersList(data.users);
      } else if (tab === 'trips') {
        const res = await fetch('/api/admin/trips', { headers });
        const data = await res.json();
        if (data.trips) setTripsList(data.trips);
      } else if (tab === 'bookings') {
        const res = await fetch('/api/admin/bookings', { headers });
        const data = await res.json();
        if (data.bookings) setBookingsList(data.bookings);
      } else if (tab === 'destinations') {
        const res = await fetch('/api/admin/destinations', { headers });
        const data = await res.json();
        if (data.destinations) setDestinationsList(data.destinations);
      } else if (tab === 'hotels') {
        const res = await fetch('/api/admin/hotels', { headers });
        const data = await res.json();
        if (data.hotels) setHotelsList(data.hotels);
      } else if (tab === 'restaurants') {
        const res = await fetch('/api/admin/restaurants', { headers });
        const data = await res.json();
        if (data.restaurants) setRestaurantsList(data.restaurants);
      } else if (tab === 'events') {
        const res = await fetch('/api/admin/events', { headers });
        const data = await res.json();
        if (data.events) setEventsList(data.events);
      } else if (tab === 'alerts') {
        const res = await fetch('/api/admin/alerts', { headers });
        const data = await res.json();
        if (data.alerts) setAlertsList(data.alerts);
      } else if (tab === 'feedback') {
        const res = await fetch('/api/admin/feedback', { headers });
        const data = await res.json();
        if (data.feedback) setFeedbackList(data.feedback);
      } else if (tab === 'db-overview') {
        const res = await fetch('/api/admin/db-overview', { headers });
        const data = await res.json();
        setDbOverview(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'trips', label: 'Customer Trips', icon: Bus },
    { id: 'bookings', label: 'Bookings & E-Tickets', icon: Ticket },
    { id: 'destinations', label: 'Destinations', icon: MapPin },
    { id: 'hotels', label: 'Hotels & Stays', icon: Hotel },
    { id: 'restaurants', label: 'Food & Dining', icon: Utensils },
    { id: 'events', label: 'Events & Public Festivals', icon: Calendar },
    { id: 'alerts', label: 'Travel & Weather Alerts', icon: AlertTriangle },
    { id: 'feedback', label: 'Feedback & Bug Reports', icon: MessageSquare },
    { id: 'db-overview', label: 'Database Overview', icon: Database },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  // Helper action: Add Destination
  const handleAddDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/destinations', {
        method: 'POST',
        headers,
        body: JSON.stringify(newItemForm)
      });
      if (res.ok) {
        setModalType(null);
        setNewItemForm({});
        fetchTabData('destinations');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper action: Add Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(newItemForm)
      });
      if (res.ok) {
        setModalType(null);
        setNewItemForm({});
        fetchTabData('events');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper action: Add Alert
  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers,
        body: JSON.stringify(newItemForm)
      });
      if (res.ok) {
        setModalType(null);
        setNewItemForm({});
        fetchTabData('alerts');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!token || !isAdmin) {
    return (
      <section className={`min-h-[75vh] py-16 px-4 flex items-center justify-center transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
      }`}>
        <div className={`p-8 sm:p-10 rounded-3xl border shadow-xl max-w-lg w-full text-center ${
          isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Admin Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium leading-relaxed">
            The TripNova Administration Console requires an active session with administrator privileges. Please sign in with an authorized account to continue.
          </p>
          <div className="p-3.5 mb-6 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">Default Admin Credentials:</p>
            <p className="text-slate-600 dark:text-slate-400 font-mono">Email: <span className="font-semibold text-sky-600 dark:text-sky-400">admin@tripnova.ai</span></p>
            <p className="text-slate-600 dark:text-slate-400 font-mono">Password: <span className="font-semibold text-sky-600 dark:text-sky-400">Admin@TripNova2026!</span></p>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              Sign In to Admin Portal
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={`min-h-screen py-6 transition-colors flex ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'}`}>
      
      {/* Left Sidebar Navigation */}
      <div className={`w-64 border-r ${isDarkMode ? 'border-slate-800/80 bg-slate-900/50' : 'border-slate-200/80 bg-white/80'} backdrop-blur-md pr-4 hidden md:block pl-6 shrink-0`}>
        <div className="mb-6 flex items-center gap-3 pt-2">
          <div className="p-2.5 rounded-xl bg-navy-900 dark:bg-sky-500 text-white dark:text-navy-950 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">TripNova Operations</h2>
            <p className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold uppercase tracking-wider">Administration Console</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-navy-900 dark:bg-sky-500 text-white dark:text-navy-950 shadow-sm font-bold' 
                    : isDarkMode 
                      ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-navy-950' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Security badge footer */}
        <div className={`mt-8 p-3.5 rounded-2xl border text-[11px] ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200/80 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict Role Security</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
            Every administrative request is verified via server JWT and strict permissions check.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800/80 shadow-xs' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              {navItems.find(i => i.id === activeTab)?.label || 'Admin Control Panel'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold tracking-wider uppercase border border-sky-500/20">
              Internal Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search Bar */}
            <div className={`relative flex items-center rounded-xl border ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
            }`}>
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 ml-3" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-xs bg-transparent focus:outline-hidden w-40 sm:w-56 text-slate-900 dark:text-white"
              />
            </div>

            {/* System Status Pill */}
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center gap-1.5 hidden sm:flex">
              <Server className="w-3.5 h-3.5" />
              Operational
            </span>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="p-8 text-center text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Loading company management records...
          </div>
        )}

        {/* SECTION 1: OVERVIEW */}
        {!loading && activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Travelers</span>
                  <Users className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +14.2% this month
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">AI Generations Today</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{stats.activeTripGenerationsToday.toLocaleString()}</div>
                <div className="text-[11px] text-sky-600 dark:text-sky-400 font-bold mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Gemini 3.6 Flash Active
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Monthly ARR / Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">${stats.revenueThisMonthUSD.toLocaleString()}</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Target Exceeded
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">AI Latency</span>
                  <Activity className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{stats.aiModelLatencyMs} ms</div>
                <div className="text-[11px] text-sky-600 dark:text-sky-400 font-bold mt-1">
                  Ultra Low Latency
                </div>
              </div>
            </div>

            {/* Top Search Destination Trends */}
            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-500" />
                <span>Top Searched Destination Trends</span>
              </h3>
              <div className="space-y-3">
                {stats.topSearchedDestinations.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 w-32">{item.name}</span>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-navy-900 dark:bg-sky-500 rounded-full" style={{ width: `${(item.searches / 15000) * 100}%` }} />
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-400 font-bold text-[11px] w-24 text-right">{item.searches.toLocaleString()} queries</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: USER MANAGEMENT */}
        {!loading && activeTab === 'users' && (
          <div className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-500" />
                <span>Registered Users ({usersList.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-700'
                }`}>
                  <tr>
                    <th className="py-3 px-3">User ID</th>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Reg Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {usersList
                    .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 font-medium">{user.id}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{user.name}</td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">{user.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            user.role === 'ADMIN' 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                              : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium text-[11px]">{user.createdAt}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: TRIPS */}
        {!loading && activeTab === 'trips' && (
          <div className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bus className="w-4 h-4 text-sky-500" />
              <span>Customer Trips Directory ({tripsList.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-700'
                }`}>
                  <tr>
                    <th className="py-3 px-3">Trip ID</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Dates</th>
                    <th className="py-3 px-3">Estimated Cost</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {tripsList.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 font-medium">{trip.id}</td>
                      <td className="py-3 px-3 font-semibold text-sky-600 dark:text-sky-400">{trip.destination}</td>
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200">{trip.title}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">{trip.startDate} to {trip.endDate}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">₹{trip.totalCostINR?.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: BOOKINGS & E-TICKETS */}
        {!loading && activeTab === 'bookings' && (
          <div className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-emerald-500" />
              <span>Bookings &amp; E-Tickets ({bookingsList.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-700'
                }`}>
                  <tr>
                    <th className="py-3 px-3">Booking Ref</th>
                    <th className="py-3 px-3">User Email</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Provider / Hotel</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">E-Ticket ID</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {bookingsList.map((bk) => (
                    <tr key={bk.bookingRef} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">{bk.bookingRef}</td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">{bk.userEmail}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{bk.type}</td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">{bk.provider}</td>
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200">{bk.destination}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">{bk.date}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">₹{bk.amountINR?.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-sky-600 dark:text-sky-400">{bk.ticketId}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bk.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          bk.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {bk.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 5: DESTINATIONS MANAGEMENT */}
        {!loading && activeTab === 'destinations' && (
          <div className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-500" />
                <span>Destinations Catalog ({destinationsList.length})</span>
              </h3>
              <button
                onClick={() => setModalType('add-destination')}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-navy-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Destination</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinationsList.map((dest) => (
                <div key={dest.id} className={`p-4 rounded-xl border flex gap-3 ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/70 border-slate-200/80'
                }`}>
                  <img src={dest.heroImage} alt={dest.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{dest.name}</h4>
                      <span className="text-[10px] font-bold text-amber-500">★ {dest.rating}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{dest.state}, {dest.region} Region</p>
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">₹{dest.avgDailyCostINR}/day avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 8: EVENTS & FESTIVALS */}
        {!loading && activeTab === 'events' && (
          <div className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>Company Managed Public Events ({eventsList.length})</span>
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Public festivals, food events &amp; concerts only. Private tracking is strictly prohibited.
                </p>
              </div>

              <button
                onClick={() => setModalType('add-event')}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-navy-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-700'
                }`}>
                  <tr>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Dates</th>
                    <th className="py-3 px-3">Public Source</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {eventsList.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold">{ev.title}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-[10px] font-bold">
                          {ev.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">{ev.location}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">{ev.startDate} - {ev.endDate}</td>
                      <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium">{ev.source}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                          {ev.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 9: TRAVEL & WEATHER ALERTS */}
        {!loading && activeTab === 'alerts' && (
          <div className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Travel &amp; Weather Alerts Management ({alertsList.length})</span>
              </h3>
              <button
                onClick={() => setModalType('add-alert')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Alert</span>
              </button>
            </div>

            <div className="space-y-3">
              {alertsList.map((al) => (
                <div key={al.id} className={`p-4 rounded-xl border flex justify-between items-start ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/70 border-slate-200/80'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        al.severity === 'Critical' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {al.severity}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{al.title}</h4>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">{al.summary}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1">Location: {al.location} • Date: {al.date}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    {al.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 10: FEEDBACK */}
        {!loading && activeTab === 'feedback' && (
          <div className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-500" />
              <span>Customer Feedback &amp; Bug Reports ({feedbackList.length})</span>
            </h3>

            <div className="space-y-3">
              {feedbackList.map((fb) => (
                <div key={fb.id} className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/70 border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{fb.userEmail || 'Anonymous'}</span>
                    <span className="text-amber-500 font-bold text-xs">★ {fb.rating}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{fb.message}</p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    <span>Category: {fb.category || 'General'}</span>
                    <span>Status: {fb.status || 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 11: DATABASE OVERVIEW */}
        {!loading && activeTab === 'db-overview' && dbOverview && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'
            } shadow-xs`}>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  <span>Structured Database Overview</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                  Engine: <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{dbOverview.engine}</span>
                </p>
                {importMessage && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                    {importMessage}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSyncCSV}
                  disabled={importingCsv}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {importingCsv ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing CSVs...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Import / Sync CSVs</span>
                    </>
                  )}
                </button>

                <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Connection Pool Healthy
                </span>
              </div>
            </div>

            {/* Counts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(dbOverview.counts || {}).map(([key, val]) => (
                <div key={key} className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'
                } shadow-xs`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{key.replace('Count', '')}</p>
                  <p className="text-2xl font-black tracking-tight mt-1 text-sky-600 dark:text-sky-400">{(val as number).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Security Notice */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <p className="text-xs leading-relaxed">
                <strong>Security Policy Guarantee:</strong> Raw SQL execution consoles, password hashes, JWT secrets, and database credentials are strictly shielded from client-side exposure.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 12: SETTINGS */}
        {!loading && activeTab === 'settings' && (
          <div className={`p-6 rounded-2xl border space-y-6 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'} shadow-xs`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-500" />
              <span>Platform Configurations</span>
            </h3>

            <div className="space-y-4 max-w-md text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Maintenance Mode</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Temporarily display maintenance screen to travelers</p>
                </div>
                <input type="checkbox" className="w-4 h-4 accent-navy-900 dark:accent-sky-500 cursor-pointer" />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-white">AI Planner Response Speed</p>
                <select className={`w-full p-2.5 rounded-lg border text-xs ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <option>Ultra Fast (Gemini 3.6 Flash)</option>
                  <option>Balanced (Gemini 3.1 Pro)</option>
                </select>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: Add Destination */}
      {modalType === 'add-destination' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/80 dark:border-slate-800/80">
              <h3 className="font-bold text-sm">Add New Destination</h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDestination} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Destination Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Udaipur"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">State</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajasthan"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                    onChange={e => setNewItemForm({ ...newItemForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Region</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                    onChange={e => setNewItemForm({ ...newItemForm, region: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Hero Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                  onChange={e => setNewItemForm({ ...newItemForm, heroImage: e.target.value })}
                />
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-navy-950 font-bold cursor-pointer transition-colors shadow-xs">
                Save Destination
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Event */}
      {modalType === 'add-event' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/80 dark:border-slate-800/80">
              <h3 className="font-bold text-sm">Add Public Event</h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Cultural Mahotsav"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                  onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Food Festival"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                    onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                    onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-navy-950 font-bold cursor-pointer transition-colors shadow-xs">
                Save Public Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Alert */}
      {modalType === 'add-alert' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/80 dark:border-slate-800/80">
              <h3 className="font-bold text-sm">Create Travel Alert</h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAlert} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expressway Traffic Delay"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                  onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Severity</label>
                  <select
                    className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 ${
                      isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
                    }`}
                    onChange={e => setNewItemForm({ ...newItemForm, severity: e.target.value })}
                  >
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lonavala"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                    onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Summary Message</label>
                <textarea
                  required
                  placeholder="Details about traffic or weather condition..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                  onChange={e => setNewItemForm({ ...newItemForm, summary: e.target.value })}
                />
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition-colors shadow-xs">
                Publish Alert
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
