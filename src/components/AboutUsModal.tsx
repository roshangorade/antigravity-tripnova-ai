import React from 'react';
import { X, Compass, Sparkles, Users, GraduationCap, Target, Eye, Heart, MapPin, Award } from 'lucide-react';

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
    { name: 'Roshan Gorade', role: 'Full Stack & AI Development', initial: 'RG' },
    { name: 'Kshitij Jaiswal', role: 'UI/UX & System Architecture', initial: 'KJ' },
    { name: 'Dhruv Jadhav', role: 'Frontend & Data Integration', initial: 'DJ' },
    { name: 'Nachiket Wagh', role: 'Testing & Documentation', initial: 'NW' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        id="about-us-modal-container"
        className={`relative w-full max-w-3xl rounded-2xl p-6 sm:p-8 border shadow-xl transition-all my-8 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          id="about-modal-close"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-xl bg-navy-900 dark:bg-sky-500 flex items-center justify-center text-white dark:text-navy-950 shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-wider mb-1 border border-sky-500/20">
              <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
              <span>Final Year B.Tech Project</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              About TripNova<span className="text-sky-500">.ai</span>
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-h-[75vh] overflow-y-auto pr-1">

          {/* Welcome Intro Section */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-200/80'
          }`}>
            <h3 className="font-bold text-base font-display text-navy-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Welcome to TripNova.ai</span>
            </h3>
            <p className="text-slate-900 dark:text-slate-100 font-semibold leading-relaxed">
              <strong>TripNova.ai</strong> is an intelligent travel planning platform developed as a <strong>Final Year B.Tech Project</strong> with the vision of making travel planning simpler, smarter, and more personalized.
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Planning a trip can often be overwhelming. Travelers spend hours searching across multiple websites to compare destinations, flights, hotels, weather, budgets, and local attractions. This process is time-consuming and can lead to confusion and poor travel decisions.
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Our project aims to solve these real-world challenges by bringing everything together in one AI-powered platform. Using modern web technologies and intelligent recommendations, our application helps users plan their journeys efficiently by providing personalized itineraries, destination insights, travel recommendations, budget planning, and essential travel information in a single place.
            </p>
            <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
            }`}>
              🎯 <strong>Our Mission:</strong> To reduce the stress of trip planning and help travelers make informed decisions with confidence, saving both time and effort while creating memorable travel experiences.
            </div>
          </div>

          {/* Mentor Section */}
          <div className="p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm font-display">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Project Mentor</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white pt-0.5">
              Mr. Mohsin Ansari
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              We express our sincere gratitude to <strong>Mr. Mohsin Ansari</strong> for his continuous guidance, valuable suggestions, encouragement, and support throughout the development of this project. His mentorship has played a significant role in helping us successfully design and implement this application.
            </p>
          </div>

          {/* Project Team Section */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-200/80'
          }`}>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm font-display">
              <Users className="w-5 h-5 text-sky-500" />
              <span>Project Team</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              This project has been developed collaboratively by:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {teamMembers.map((member, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center gap-3 shadow-2xs ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-navy-900 dark:bg-sky-500 text-white dark:text-navy-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {member.initial}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{member.name}</h4>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 pt-2 leading-relaxed">
              Each team member contributed to the planning, design, development, testing, and documentation of the project, making it a collaborative effort to deliver a practical solution for modern travelers.
            </p>
          </div>

          {/* Vision & Goal Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vision */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-2 text-navy-900 dark:text-sky-400 font-bold text-xs font-display">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>Our Vision</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                To build a reliable AI-powered travel companion that simplifies travel planning by combining intelligent recommendations, real-time information, and an intuitive user experience into a single platform.
              </p>
            </div>

            {/* Goal */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-2 text-navy-900 dark:text-sky-400 font-bold text-xs font-display">
                <Target className="w-4 h-4 text-rose-500" />
                <span>Our Goal</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                To solve real-world travel planning problems through technology and artificial intelligence, enabling users to discover destinations, create personalized itineraries, compare travel options, and enjoy a seamless planning experience.
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium gap-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Chhatrapati Sambhajinagar, Maharashtra, India</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Built with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>for Global Travelers</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-navy-950 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Explore TripNova.ai Platform
          </button>

        </div>
      </div>
    </div>
  );
};
