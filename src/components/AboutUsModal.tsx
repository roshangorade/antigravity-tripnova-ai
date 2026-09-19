import React from 'react';
import { 
  X, 
  Compass, 
  Sparkles, 
  Users, 
  GraduationCap, 
  Target, 
  Eye, 
  Heart, 
  MapPin, 
  Award, 
  Code2, 
  Layers, 
  Cpu, 
  FileCheck2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const teamMembers = [
    { 
      name: 'Roshan Gorade', 
      role: 'Full Stack & AI Development', 
      badge: 'Project Lead',
      initial: 'RG',
      gradient: 'from-blue-600 to-cyan-500',
      icon: Cpu,
      accent: 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10'
    },
    { 
      name: 'Kshitij Jaiswal', 
      role: 'UI/UX & System Architecture', 
      badge: 'Architecture',
      initial: 'KJ',
      gradient: 'from-purple-600 to-indigo-500',
      icon: Layers,
      accent: 'text-purple-500 border-purple-500/30 bg-purple-500/10'
    },
    { 
      name: 'Dhruv Jadhav', 
      role: 'Frontend & Data Integration', 
      badge: 'Integration',
      initial: 'DJ',
      gradient: 'from-emerald-600 to-teal-500',
      icon: Code2,
      accent: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
    },
    { 
      name: 'Nachiket Wagh', 
      role: 'Testing & Documentation', 
      badge: 'QA & Docs',
      initial: 'NW',
      gradient: 'from-amber-600 to-orange-500',
      icon: FileCheck2,
      accent: 'text-amber-500 border-amber-500/30 bg-amber-500/10'
    }
  ];

  const highlights = [
    'AI-driven contextual day-by-day travel itineraries',
    'Real-time live hotel & attractions discovery via SerpApi',
    'Integrated weather forecasts & multi-tier budget estimation',
    'Smart route optimization & cultural local guide'
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="about-us-modal-container"
        className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl transition-all my-6 overflow-hidden ${
          isDarkMode 
            ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-sky-950/40' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/15'
        }`}
      >
        {/* Top Decorative Gradient Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-500" />

        {/* Modal Inner Padding Container */}
        <div className="p-6 sm:p-8">
          {/* Close Button */}
          <button
            id="about-modal-close"
            onClick={onClose}
            className={`absolute top-5 right-5 p-2 rounded-full transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
            }`}
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Section */}
          <div className="flex items-start gap-4 mb-6 pr-10">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 shrink-0">
              <Compass className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-1.5 shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Final Year B.Tech Project</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                About TripNova<span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">.ai</span>
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                Intelligent AI-Powered Travel Planning & Destination Ecosystem
              </p>
            </div>
          </div>

          {/* Modal Scrollable Content Body */}
          <div className="space-y-6 max-h-[68vh] overflow-y-auto pr-2 text-sm leading-relaxed scrollbar-thin">

            {/* Welcome Project Overview */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isDarkMode 
                ? 'bg-slate-950/70 border-slate-800/90' 
                : 'bg-slate-50/90 border-slate-200/90'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Welcome to TripNova.ai
                </h3>
              </div>

              <div className="space-y-3 text-slate-700 dark:text-slate-200">
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  <strong className="text-sky-600 dark:text-sky-400 font-bold">TripNova.ai</strong> is an intelligent travel planning platform engineered as our <strong className="text-slate-900 dark:text-white font-bold">Final Year B.Tech Project</strong> with a singular vision: making travel research, itinerary building, and trip logistics frictionless, smart, and hyper-personalized.
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                  Traditional trip planning is overwhelming. Travelers juggle dozens of disparate tabs comparing destinations, flights, stays, weather changes, budget estimates, and local attractions. This fragmented experience leads to decision fatigue, unexpected expenses, and sub-optimal itineraries.
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                  TripNova.ai unifies this entire workflow under one intelligent umbrella. By combining Gemini AI intelligence, Google SerpApi live data, real-time routing, and dynamic budget estimation, travelers get curated day-by-day roadmaps in seconds.
                </p>
              </div>

              {/* Mission Statement Box */}
              <div className="mt-4 p-4 rounded-xl border-l-4 border-l-sky-500 bg-sky-500/10 dark:bg-sky-950/40 border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg">🎯</span>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-sky-800 dark:text-sky-300 mb-1">
                      Our Core Mission
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                      To empower travelers with intelligent, stress-free decision-making tools—saving countless hours of research while delivering safe, memorable, and optimized travel experiences.
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Highlights Grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {highlights.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Mentor Section */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isDarkMode 
                ? 'bg-gradient-to-r from-amber-950/30 to-slate-900/80 border-amber-500/30' 
                : 'bg-gradient-to-r from-amber-50/90 to-orange-50/60 border-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      Project Guide & Mentor
                    </div>
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      Mr. Mohsin Ansari
                    </h4>
                  </div>
                </div>
                <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                  Faculty Guide
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
                We express our deepest gratitude to <strong className="text-slate-900 dark:text-amber-300 font-bold">Mr. Mohsin Ansari</strong> for his continuous mentorship, technical guidance, constructive reviews, and unwavering encouragement. His expert insights have been instrumental in taking this project from conceptual design to a fully realized application.
              </p>
            </div>

            {/* Project Team Section */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isDarkMode 
                ? 'bg-slate-950/70 border-slate-800/90' 
                : 'bg-slate-50/90 border-slate-200/90'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Project Engineering Team
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  4 Core Members
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 font-medium">
                Developed collaboratively by final-year engineering students specializing in modern web frameworks, AI system integration, and UI/UX design:
              </p>

              {/* Team Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {teamMembers.map((member, i) => {
                  const IconComp = member.icon;
                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 ${
                        isDarkMode 
                          ? 'bg-slate-900/90 border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80 shadow-md' 
                          : 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md shadow-xs'
                      }`}
                    >
                      {/* Avatar Initials with Gradient */}
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${member.gradient} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md`}>
                        {member.initial}
                      </div>

                      {/* Member Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {member.name}
                          </h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase shrink-0 ${member.accent}`}>
                            {member.badge}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate flex items-center gap-1">
                          <IconComp className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="truncate">{member.role}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 pt-3 leading-relaxed">
                Every member contributed across the system lifecycle—from architecture and API orchestration to interface polish, documentation, and performance benchmarking.
              </p>
            </div>

            {/* Vision & Goal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vision */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isDarkMode 
                  ? 'bg-slate-950/70 border-slate-800/90' 
                  : 'bg-slate-50/90 border-slate-200/90'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Eye className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                    Our Vision
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                  To pioneer an accessible, next-generation travel intelligence platform where anyone can discover, plan, and embark on journeys with absolute clarity, safety, and confidence.
                </p>
              </div>

              {/* Goal */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isDarkMode 
                  ? 'bg-slate-950/70 border-slate-800/90' 
                  : 'bg-slate-50/90 border-slate-200/90'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                    Our Goal
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                  Solve real-world travel pain points by marrying generative AI with real-time APIs—delivering accurate itineraries, transparent budget estimates, and localized cultural gems.
                </p>
              </div>
            </div>

            {/* Location & Heart Footer Note */}
            <div className={`pt-3 border-t flex flex-wrap items-center justify-between text-xs font-semibold gap-2 ${
              isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-slate-800 dark:text-slate-300">Chhatrapati Sambhajinagar, Maharashtra, India</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Built with</span>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-bounce" />
                <span className="text-slate-800 dark:text-slate-300">for Global Travelers</span>
              </div>
            </div>

            {/* Action Explore Button */}
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore TripNova.ai Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};
