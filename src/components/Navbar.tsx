import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  MapPin, 
  Hotel, 
  Utensils, 
  Moon, 
  Sun, 
  Heart, 
  User, 
  ShieldCheck, 
  CloudSun, 
  Bus,
  Plane,
  ChevronDown,
  Ticket,
  Wallet,
  LogOut,
  Briefcase
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string, section?: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  currency: string;
  setCurrency: (c: string) => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup', prompt?: string) => void;
  currentUser?: { name: string; email: string; avatar: string; role: string } | null;
  onOpenExpenses?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  currency,
  setCurrency,
  wishlistCount,
  onOpenWishlist,
  onOpenAuth,
  currentUser,
  onOpenExpenses
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Navigation items: User Panel for logged in users, Admin Panel strictly for ADMIN role
  const navItems = [
    { id: 'home', label: 'Explore', icon: Compass },
    { id: 'ai-planner', label: 'AI Planner', icon: Sparkles, badge: 'AI' },
    { id: 'categories', label: 'Destinations', icon: MapPin },
    { id: 'hotels', label: 'Stays', icon: Hotel },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'transport', label: 'Commute', icon: Bus },
    { id: 'weather', label: 'Weather', icon: CloudSun },
    ...(currentUser ? [{ id: 'dashboard', label: 'User Panel', icon: User }] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: ShieldCheck, badge: 'ADMIN' }] : [])
  ];

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

  const handleTabSelect = (tabId: string, section?: string) => {
    setActiveTab(tabId, section);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-200 shadow-xs ${
      isDarkMode 
        ? 'bg-[#0B1120]/95 border-slate-800 text-slate-100' 
        : 'bg-white/95 border-slate-200/80 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            onClick={() => handleTabSelect('home')}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-sky-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-sky-400 dark:text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  TripNova
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-mono">
                  AI
                </span>
              </div>
              <p className="text-[9px] font-bold tracking-wide uppercase text-slate-600 dark:text-slate-300 hidden sm:block">
                Smart Travel Planner
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links - Flexible container with smooth shrink/scroll */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar shrink min-w-0 py-1 px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleTabSelect(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? 'bg-slate-800 text-white font-bold'
                        : 'bg-slate-100 text-slate-900 font-bold'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-500' : 'text-slate-600 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls - shrink-0 & ml-auto so it NEVER overflows out of screen */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Currency Selector */}
            <select
              id="currency-selector"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-hidden ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-600' 
                  : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
              }`}
            >
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Dark Mode Toggle */}
            <button
              id="dark-mode-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle theme"
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Wishlist Button */}
            <button
              id="wishlist-button"
              onClick={onOpenWishlist}
              className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-rose-400 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-rose-600 hover:bg-slate-50'
              }`}
              title="Saved Wishlist"
            >
              <Heart className="w-4 h-4 fill-rose-500/20" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* AI Generator CTA */}
            <button
              id="header-ai-plan-cta"
              onClick={() => handleTabSelect('ai-planner')}
              className="hidden xl:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-600 dark:hover:bg-sky-500 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400 dark:text-sky-200" />
              <span>Plan with AI</span>
            </button>

            {/* AUTHENTICATION CONTROLS */}
            {currentUser ? (
              /* LOGGED-IN: Avatar Button with Interactive Dropdown Menu */
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  id="user-profile-menu-button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center gap-2 p-1 pl-2.5 pr-2 rounded-full border transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700' 
                      : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                  title="Profile & Member Menu"
                >
                  <span className="text-xs font-bold max-w-[90px] truncate hidden sm:inline-block">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500 shadow-xs"
                  />
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu - constrained to screen width */}
                {profileDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold font-serif-editorial truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black border border-emerald-500/20 uppercase tracking-wider">
                        {currentUser.role}
                      </span>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1 text-xs font-semibold">
                      <button
                        onClick={() => handleTabSelect('dashboard', 'trips')}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-blue-500" />
                        <span>My Trips</span>
                      </button>

                      <button
                        onClick={() => handleTabSelect('dashboard', 'bookings')}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-emerald-500" />
                        <span>My Bookings</span>
                      </button>

                      <button
                        onClick={() => handleTabSelect('dashboard', 'tickets')}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-purple-500" />
                        <span>E-Tickets</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenWishlist();
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Favorites ({wishlistCount})</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (onOpenExpenses) onOpenExpenses();
                          else handleTabSelect('ai-planner');
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Wallet className="w-4 h-4 text-amber-500" />
                        <span>Expenses</span>
                      </button>

                      <button
                        onClick={() => handleTabSelect('dashboard', 'profile')}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-sky-500" />
                        <span>User Panel & Profile</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleTabSelect('admin')}
                          className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-amber-600 dark:text-amber-400 font-bold"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <span>Admin Panel</span>
                          <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded-full uppercase">Admin</span>
                        </button>
                      )}
                    </div>

                    {/* Logout Footer */}
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAuth('signin');
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Account Settings & Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* LOGGED-OUT: Clear Distinct "Log in" and "Sign up" Buttons */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="navbar-login-button"
                  onClick={() => onOpenAuth('signin')}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Log in
                </button>

                <button
                  id="navbar-signup-button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-600 dark:hover:bg-sky-500 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Scroll Category Bar */}
        <div className="xl:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-200 dark:border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 border cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-sky-600 dark:border-sky-600 shadow-xs'
                    : isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Expanded Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-slate-900 text-white dark:bg-sky-600'
                        : isDarkMode ? 'text-slate-200 bg-slate-800/60 hover:bg-slate-800' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Auth CTAs if logged out */}
            {!currentUser && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signin');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-center transition-colors"
                >
                  Log in
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signup');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-sky-600 text-xs font-semibold text-center shadow-xs"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
