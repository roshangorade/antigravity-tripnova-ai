import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Compass,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Phone,
  Globe,
  Edit3,
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields for Sign In
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Form Fields for Sign Up
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('+91 ');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [city, setCity] = useState('Chhatrapati Sambhajinagar');
  const [signUpRole, setSignUpRole] = useState<'USER' | 'ADMIN'>('USER');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Admin Authorization Key State
  const [adminKey, setAdminKey] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [adminKeyVerified, setAdminKeyVerified] = useState<boolean | null>(null);
  const [isVerifyingAdminKey, setIsVerifyingAdminKey] = useState(false);

  const [resetEmail, setResetEmail] = useState('');

  if (!isOpen) return null;

  const handleVerifyAdminKey = async () => {
    if (!adminKey.trim()) {
      setErrorMessage('Please enter the Admin Authorization Password Key.');
      return false;
    }

    setIsVerifyingAdminKey(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-admin-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: adminKey.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdminKeyVerified(true);
        setSuccessMessage('Admin Key verified successfully on server!');
        setTimeout(() => setSuccessMessage(null), 2500);
        return true;
      } else {
        setAdminKeyVerified(false);
        setErrorMessage(data.message || 'Invalid Admin Authorization Key. Access denied.');
        return false;
      }
    } catch (err) {
      setAdminKeyVerified(false);
      setErrorMessage('Unable to connect to server for key verification.');
      return false;
    } finally {
      setIsVerifyingAdminKey(false);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signInEmail || !signInPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const emailUser = signInEmail.split('@')[0] || 'roshan_g';
      const user: UserProfile = {
        id: 'USR' + Math.floor(100 + Math.random() * 900),
        firstName: 'Roshan',
        lastName: 'Gorade',
        name: 'Roshan Gorade',
        username: emailUser,
        email: signInEmail,
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
        role: signInEmail.includes('admin') ? 'ADMIN' : 'USER',
        visitedDestinationsCount: 14,
        totalKmTraveled: 18450,
        badges: ['Himalayan Explorer', 'Beach Nomad', 'Foodie Pioneer']
      };
      onLoginSuccess(user);
      setSuccessMessage('Welcome back! Successfully logged in.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    }, 700);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signUpFirstName || !signUpEmail || !signUpPassword) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must accept the terms of service to create an account.');
      return;
    }

    if (signUpRole === 'ADMIN' && !adminKey.trim()) {
      setErrorMessage('Admin Authorization Password Key is required for administrator registration.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: signUpFirstName,
          lastName: signUpLastName,
          username: signUpUsername,
          email: signUpEmail,
          phone: signUpPhone,
          role: signUpRole,
          adminKey: signUpRole === 'ADMIN' ? adminKey.trim() : undefined,
          city
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Registration failed. Server verification rejected account creation.');
        setIsLoading(false);
        return;
      }

      const serverUser = data.user;
      const newUser: UserProfile = {
        id: serverUser.id || ('USR' + Math.floor(100 + Math.random() * 900)),
        firstName: signUpFirstName,
        lastName: signUpLastName || 'Gorade',
        name: serverUser.name || `${signUpFirstName} ${signUpLastName}`.trim() || signUpFirstName,
        username: signUpUsername || signUpFirstName.toLowerCase() + '_g',
        email: signUpEmail,
        phone: signUpPhone || '+91 9876543210',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        gender: 'Male',
        dateOfBirth: '2005-08-15',
        country: 'India',
        state: 'Maharashtra',
        city: city || 'Chhatrapati Sambhajinagar',
        preferredLanguage: 'English',
        currency: 'INR',
        timeZone: 'Asia/Kolkata',
        bio: signUpRole === 'ADMIN' ? 'Administrator profile verified with server key.' : 'Passionate traveler exploring India and the world.',
        memberSince: new Date().toISOString().split('T')[0],
        verified: true,
        role: signUpRole,
        visitedDestinationsCount: signUpRole === 'ADMIN' ? 24 : 1,
        totalKmTraveled: signUpRole === 'ADMIN' ? 24000 : 500,
        badges: signUpRole === 'ADMIN' ? ['System Admin', 'Verified Executive'] : ['New Explorer']
      };

      onLoginSuccess(newUser);
      setSuccessMessage(signUpRole === 'ADMIN' ? 'Administrator account verified & created successfully!' : 'Account created successfully! Welcome to RoamMind.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMessage('Server network error during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(`Password reset link sent to ${resetEmail}`);
      setTimeout(() => {
        setMode('signin');
        setSuccessMessage(null);
      }, 2000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        id="auth-modal-container"
        className={`relative w-full max-w-md rounded-2xl p-6 sm:p-8 border shadow-xl transition-all my-8 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          id="auth-modal-close-button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-sky-500 flex items-center justify-center text-white dark:text-navy-950 shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              TripNova<span className="text-sky-500">.ai</span>
            </h2>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Traveler Portal
            </p>
          </div>
        </div>

        {/* If Already Logged In */}
        {currentUser ? (
          <div className="space-y-6 text-center py-2">
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/80 flex items-center gap-4 text-left">
              <img
                src={currentUser.profileImage || currentUser.avatar}
                alt={currentUser.firstName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-sky-500 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base font-display truncate text-slate-900 dark:text-white">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                  @{currentUser.username} • {currentUser.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold border border-sky-500/20">
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold font-mono">
                    {currentUser.city}, {currentUser.country}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2 text-left border border-sky-200/60 dark:border-sky-800/60">
              <ShieldCheck className="w-4 h-4 shrink-0 text-sky-500" />
              <span>Full account access enabled. Modify profile info anytime from your dashboard.</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-navy-950 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Continue Exploring
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setSuccessMessage('Logged out successfully');
                  setTimeout(() => setSuccessMessage(null), 1500);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Auth Mode Toggle Tabs */}
            {mode !== 'forgot' && (
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 mb-6">
                <button
                  id="tab-signin-toggle"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-slate-900 text-navy-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold'
                  }`}
                >
                  Sign In
                </button>
                <button
                  id="tab-signup-toggle"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-navy-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <input
                      id="signin-email-input"
                      type="email"
                      required
                      placeholder="roshan@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <input
                      id="signin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded-md text-navy-900 dark:text-sky-500 focus:ring-sky-500 w-3.5 h-3.5"
                    />
                    <span>Keep me logged in</span>
                  </label>
                </div>

                <button
                  id="signin-submit-button"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-navy-950 font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white dark:border-navy-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to TripNova</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      First Name
                    </label>
                    <input
                      id="signup-firstname-input"
                      type="text"
                      required
                      placeholder="Roshan"
                      value={signUpFirstName}
                      onChange={(e) => setSignUpFirstName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Last Name
                    </label>
                    <input
                      id="signup-lastname-input"
                      type="text"
                      placeholder="Gorade"
                      value={signUpLastName}
                      onChange={(e) => setSignUpLastName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="roshan_g"
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    id="signup-email-input"
                    type="email"
                    required
                    placeholder="roshan@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <input
                      id="signup-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Confirm
                    </label>
                    <input
                      id="signup-confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chhatrapati Sambhajinagar"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Account Role Selection & Administrative Registration Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Account Type & Access Role
                    </label>
                    <button
                      type="button"
                      id="admin-role-toggle-button"
                      onClick={() => {
                        if (signUpRole === 'ADMIN') {
                          setSignUpRole('USER');
                          setAdminKey('');
                          setAdminKeyVerified(null);
                        } else {
                          setSignUpRole('ADMIN');
                          setAdminKeyVerified(null);
                        }
                      }}
                      className={`text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer px-2 py-0.5 rounded-md border ${
                        signUpRole === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 ring-1 ring-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:text-slate-950 font-semibold'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>{signUpRole === 'ADMIN' ? 'Admin Mode Active' : 'Enable Admin Registration'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="signup-role-user-button"
                      onClick={() => {
                        setSignUpRole('USER');
                        setAdminKey('');
                        setAdminKeyVerified(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        signUpRole === 'USER'
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-800 dark:text-sky-300 font-bold ring-2 ring-sky-500/20'
                          : 'bg-slate-50/70 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <User className="w-4 h-4 text-sky-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold leading-tight">Traveler</p>
                        <p className="text-[10px] opacity-75 font-normal">Standard Client</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="signup-role-admin-button"
                      onClick={() => {
                        setSignUpRole('ADMIN');
                        setAdminKeyVerified(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        signUpRole === 'ADMIN'
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 font-bold ring-2 ring-amber-500/20'
                          : 'bg-slate-50/70 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold leading-tight flex items-center gap-1">
                          <span>Admin</span>
                          <span className="text-[8px] bg-amber-500 text-white px-1 rounded uppercase font-mono">KEY REQ</span>
                        </p>
                        <p className="text-[10px] opacity-75 font-normal">Full Ops Console</p>
                      </div>
                    </button>
                  </div>

                  {/* Server-Side Admin Authorization Key Input Field */}
                  {signUpRole === 'ADMIN' && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Admin Authorization Password Key</span>
                        </label>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                          Server Enforced
                        </span>
                      </div>

                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                          <input
                            id="signup-admin-key-input"
                            type={showAdminKey ? 'text' : 'password'}
                            required={signUpRole === 'ADMIN'}
                            placeholder="Enter Admin Secret Key"
                            value={adminKey}
                            onChange={(e) => {
                              setAdminKey(e.target.value);
                              setAdminKeyVerified(null);
                            }}
                            className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminKey(!showAdminKey)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                            title={showAdminKey ? "Hide key" : "Show key"}
                          >
                            {showAdminKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleVerifyAdminKey}
                          disabled={isVerifyingAdminKey || !adminKey.trim()}
                          className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shrink-0 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          {isVerifyingAdminKey ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Verify</span>
                        </button>
                      </div>

                      {adminKeyVerified === true && (
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Server authorization key verified!</span>
                        </div>
                      )}

                      {adminKeyVerified === false && (
                        <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>Invalid key. Admin escalation denied by server.</span>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                        * Administrative account creation requires server-side secret key authorization (`ADMIN_SECRET_KEY`) to prevent unauthorized role escalation.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-tight select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded-md text-navy-900 dark:text-sky-500 focus:ring-sky-500 w-3.5 h-3.5 shrink-0"
                    />
                    <span>
                      I agree to the <a href="#terms" className="text-sky-600 dark:text-sky-400 font-bold underline">Terms of Service</a> and <a href="#privacy" className="text-sky-600 dark:text-sky-400 font-bold underline">Privacy Policy</a>.
                    </span>
                  </label>
                </div>

                <button
                  id="signup-submit-button"
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 text-white ${
                    signUpRole === 'ADMIN' 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-navy-950'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {signUpRole === 'ADMIN' ? (
                        <ShieldCheck className="w-4 h-4 text-white" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-sky-300 dark:text-navy-900" />
                      )}
                      <span>Create {signUpRole === 'ADMIN' ? 'Administrator' : 'Client'} Account</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-left mb-2">
                  <h3 className="font-bold text-sm font-display text-slate-900 dark:text-white">Reset Password</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Enter your email address and we'll send instructions to reset your password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="roshan@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-navy-950 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
