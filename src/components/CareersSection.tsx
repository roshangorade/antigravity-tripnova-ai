import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Code2,
  Cpu,
  Layers,
  Database,
  Palette,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Send,
  Github,
  Linkedin,
  Mail,
  Compass,
  Users,
  Lightbulb,
  GitBranch,
  BookOpen,
  Briefcase,
  Share2
} from 'lucide-react';

interface CareersSectionProps {
  isDarkMode: boolean;
  onNavigate: (tab: string) => void;
  onOpenAboutUs?: () => void;
}

interface OpportunityArea {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  skills: string[];
  gradient: string;
  tagColor: string;
}

export const CareersSection: React.FC<CareersSectionProps> = ({
  isDarkMode,
  onNavigate,
  onOpenAboutUs
}) => {
  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [areaOfInterest, setAreaOfInterest] = useState('Full Stack Development');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [shortIntro, setShortIntro] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const opportunityAreas: OpportunityArea[] = [
    {
      id: 'fullstack',
      title: 'Full Stack Development',
      category: 'Core Engineering',
      icon: Code2,
      description: 'Design and build responsive end-to-end features integrating React frontends with Node.js/Express service layers.',
      skills: ['React', 'TypeScript', 'Node.js', 'Express', 'Tailwind CSS', 'REST APIs'],
      gradient: 'from-blue-600 to-cyan-500',
      tagColor: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20'
    },
    {
      id: 'aiml',
      title: 'AI / Machine Learning',
      category: 'Intelligence & LLMs',
      icon: Cpu,
      description: 'Explore prompt engineering, Gemini AI integration, contextual trip recommendation algorithms, and agentic workflows.',
      skills: ['Google GenAI SDK', 'Prompt Engineering', 'RAG Concepts', 'Data Extraction', 'Python / TS'],
      gradient: 'from-purple-600 to-indigo-500',
      tagColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'frontend',
      title: 'Frontend Development',
      category: 'User Interface',
      icon: Layers,
      description: 'Craft beautiful, high-contrast, accessible UI components, interactive map views, and fluid animations for travelers.',
      skills: ['React 19', 'Tailwind CSS', 'Vite', 'Lucide Icons', 'Responsive Layouts', 'Web Accessibility'],
      gradient: 'from-emerald-600 to-teal-500',
      tagColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'backend',
      title: 'Backend Development',
      category: 'Systems & Architecture',
      icon: Terminal,
      description: 'Architect scalable server endpoints, optimize API middleware, handle caching, and manage authentication boundaries.',
      skills: ['Node.js', 'Express', 'Drizzle ORM / SQL', 'API Architecture', 'Error Handling'],
      gradient: 'from-amber-600 to-orange-500',
      tagColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'uiux',
      title: 'UI/UX Design',
      category: 'Product Design',
      icon: Palette,
      description: 'Create intuitive travel planning user journeys, design wireframes, refine dark/light color harmony, and improve usability.',
      skills: ['Figma / Wireframing', 'Design Systems', 'UX Research', 'Information Hierarchy', 'Visual Polish'],
      gradient: 'from-rose-600 to-pink-500',
      tagColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
    },
    {
      id: 'data-api',
      title: 'Data & API Integration',
      category: 'Data Engineering',
      icon: Database,
      description: 'Integrate external travel data feeds, SerpApi live hotel/flights queries, OpenWeather APIs, and geocoding services.',
      skills: ['SerpApi', 'External REST APIs', 'Data Parsing', 'JSON Schema', 'Geo-JSON / Maps'],
      gradient: 'from-cyan-600 to-blue-500',
      tagColor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    }
  ];

  const whyWorkPoints = [
    {
      title: 'Work with Modern Web Technologies',
      desc: 'Build with the latest React, TypeScript, Tailwind CSS v4, Vite, and modern Node.js ecosystem standards.',
      icon: Code2,
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      title: 'Explore AI-Powered Travel Experiences',
      desc: 'Experiment hands-on with Gemini generative AI models to craft intelligent itineraries and personalized recommendations.',
      icon: Sparkles,
      color: 'text-purple-500 bg-purple-500/10'
    },
    {
      title: 'Work with Real-World APIs',
      desc: 'Connect live APIs for hotel pricing, local intelligence, flight itineraries, weather radars, and interactive mapping.',
      icon: Database,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      title: 'Learn Full-Stack Development',
      desc: 'Gain practical experience across frontend UI components, Express backend endpoints, data layers, and deployment pipelines.',
      icon: Layers,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      title: 'Work with Travel Data & Recommendation Systems',
      desc: 'Tackle real-world challenges in budget estimation, multi-day scheduling, distance routing, and destination curation.',
      icon: Compass,
      color: 'text-rose-500 bg-rose-500/10'
    },
    {
      title: 'Collaborate on a Technology-Focused Project',
      desc: 'Engage with fellow student developers and engineering mentors in a forward-thinking B.Tech technology initiative.',
      icon: Users,
      color: 'text-cyan-500 bg-cyan-500/10'
    }
  ];

  const whatWeLookForPoints = [
    {
      title: 'Problem-Solving Mindset',
      desc: 'Curiosity to break down real travel challenges into clean, structured algorithmic solutions.'
    },
    {
      title: 'Programming Fundamentals',
      desc: 'Sound understanding of JavaScript, TypeScript, Python, or core computer science fundamentals.'
    },
    {
      title: 'Willingness to Learn',
      desc: 'Eagerness to explore new frameworks, experiment with modern developer tools, and iterate quickly.'
    },
    {
      title: 'Git / GitHub Familiarity',
      desc: 'Experience with version control, pull requests, branch workflows, and collaborative codebase hygiene.'
    },
    {
      title: 'Communication & Teamwork',
      desc: 'Open mindset, mutual respect, constructive code reviews, and positive collaboration.'
    },
    {
      title: 'Interest in AI & Travel Tech',
      desc: 'A genuine passion for how artificial intelligence and technology can simplify how people explore the world.'
    }
  ];

  const handleSelectOpportunity = (title: string) => {
    setAreaOfInterest(title);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      alert('Please provide your name and email address.');
      return;
    }

    // Build mailto message so user can dispatch directly to team without faking backend persistence
    const subject = encodeURIComponent(`TripNova.ai Expression of Interest: ${areaOfInterest} - ${fullName.trim()}`);
    const body = encodeURIComponent(
      `Hello TripNova.ai Team,\n\n` +
      `I am interested in contributing to the TripNova.ai project.\n\n` +
      `Candidate Details:\n` +
      `- Full Name: ${fullName.trim()}\n` +
      `- Email: ${email.trim()}\n` +
      `- Phone: ${phone.trim() || 'N/A'}\n` +
      `- Area of Interest: ${areaOfInterest}\n` +
      `- GitHub: ${githubUrl.trim() || 'N/A'}\n` +
      `- LinkedIn: ${linkedinUrl.trim() || 'N/A'}\n\n` +
      `Short Introduction:\n${shortIntro.trim() || 'Excited to contribute and learn!'}\n\n` +
      `Best regards,\n${fullName.trim()}`
    );

    // Open user's default email client
    window.location.href = `mailto:roshangorade7@gmail.com?subject=${subject}&body=${body}`;

    setSubmittedStatus('ready');
  };

  return (
    <div className={`min-h-screen py-10 transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8F7F4] text-slate-900'
    }`}>
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* ================================================== */}
        {/* HERO SECTION */}
        {/* ================================================== */}
        <section className={`relative rounded-3xl p-8 sm:p-12 md:p-16 border overflow-hidden transition-all shadow-xl ${
          isDarkMode 
            ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 text-white' 
            : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          {/* Subtle Ambient Background Accents */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            {/* Project Initiative Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Technology & Innovation Initiative</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Build the Future of <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Intelligent Travel</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Join us in creating smarter, simpler, and more personalized travel experiences with technology, AI, and modern travel solutions.
            </p>

            {/* Academic / Initiative Note */}
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium ${
              isDarkMode 
                ? 'bg-slate-950/60 border-slate-800 text-slate-300' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              💡 <strong>TripNova.ai</strong> is an intelligent travel engineering project developed collaboratively as a <strong>Final Year B.Tech Project</strong>. We welcome passionate students, open-source contributors, and developers eager to collaborate on next-generation travel technology.
            </div>

            {/* Hero Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (formRef.current) {
                    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-600 dark:hover:bg-sky-500 font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Express Your Interest</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenAboutUs && (
                <button
                  onClick={onOpenAboutUs}
                  className={`px-5 py-3 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'border-slate-700 hover:bg-slate-800 text-slate-200' 
                      : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Learn About Our Team
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* OPPORTUNITIES SECTION (Areas of Interest) */}
        {/* ================================================== */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                <span>Collaboration Areas</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Potential Opportunities & Areas of Interest
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-medium">
                Explore key technical domains where you can contribute, build real features, and level up your skills alongside our core team.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 self-start sm:self-auto">
              6 Focus Areas
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunityAreas.map((opp) => {
              const IconComp = opp.icon;
              return (
                <div
                  key={opp.id}
                  className={`rounded-2xl p-6 border flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    isDarkMode 
                      ? 'bg-slate-900/90 border-slate-800 hover:border-sky-500/50 hover:bg-slate-900' 
                      : 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-slate-200/50'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header with Icon & Category */}
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opp.gradient} text-white flex items-center justify-center shadow-md`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${opp.tagColor}`}>
                        {opp.category}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {opp.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-normal">
                        {opp.description}
                      </p>
                    </div>

                    {/* Skills Pills */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Relevant Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {opp.skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-slate-950 border-slate-800 text-slate-300' 
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Express Interest Button */}
                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleSelectOpportunity(opp.title)}
                      className="w-full py-2.5 px-4 rounded-xl border border-sky-500/30 hover:border-sky-500 bg-sky-500/5 hover:bg-sky-500 text-sky-700 dark:text-sky-300 hover:text-white dark:hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Express Interest in {opp.title.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================== */}
        {/* WHY WORK WITH TRIPNOVA.AI */}
        {/* ================================================== */}
        <section className={`rounded-3xl p-8 sm:p-10 border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/60 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Project Experience</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Why Work With TripNova.ai?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Join a genuine technology project where your contributions ship directly to an active web application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyWorkPoints.map((pt, idx) => {
              const IconComp = pt.icon;
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950/70 border-slate-800/80' 
                      : 'bg-slate-50/80 border-slate-200/80'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 ${pt.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1.5">
                    {pt.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {pt.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================== */}
        {/* WHAT WE LOOK FOR */}
        {/* ================================================== */}
        <section className={`rounded-3xl p-8 sm:p-10 border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/60 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div className="max-w-2xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Qualities That Matter</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              What We Look For
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">
              We value curiosity, consistency, and a collaborative spirit over years of formal experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {whatWeLookForPoints.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950/60 border-slate-800' 
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================== */}
        {/* EXPRESS YOUR INTEREST FORM SECTION */}
        {/* ================================================== */}
        <section ref={formRef} className={`rounded-3xl p-8 sm:p-12 border transition-all shadow-xl ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Send className="w-3.5 h-3.5" />
                <span>Get in Touch</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Express Your Interest
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">
                Fill out your details below. Submitting will prepare a direct email draft to the TripNova.ai engineering team with your profile and areas of interest.
              </p>
            </div>

            {submittedStatus === 'ready' && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  Thank you! An email draft has been generated with your profile details. Feel free to attach your resume or portfolio directly before sending!
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Alex Sharma"
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., alex@example.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Phone & Area of Interest */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    Phone Number <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    Area of Interest <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={areaOfInterest}
                    onChange={(e) => setAreaOfInterest(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {opportunityAreas.map((opp) => (
                      <option key={opp.id} value={opp.title}>
                        {opp.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GitHub & LinkedIn URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub Profile <span className="text-slate-500 font-normal">(Optional)</span></span>
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/your-handle"
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn Profile <span className="text-slate-500 font-normal">(Optional)</span></span>
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/your-handle"
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Short Introduction */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  Short Introduction & Motivation
                </label>
                <textarea
                  rows={4}
                  value={shortIntro}
                  onChange={(e) => setShortIntro(e.target.value)}
                  placeholder="Tell us a little bit about yourself, what you like to build, and why you are interested in TripNova.ai..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* Notice regarding submissions */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                ℹ️ <em>TripNova.ai connects expressions of interest directly via verified team communication. We do not require third-party cookies or unsolicited data storage.</em>
              </p>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Send Expression of Interest</span>
              </button>
            </form>
          </div>
        </section>

        {/* ================================================== */}
        {/* CONTACT CTA SECTION */}
        {/* ================================================== */}
        <section className={`rounded-3xl p-8 sm:p-10 border text-center transition-all ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800' 
            : 'bg-gradient-to-br from-sky-50 via-white to-indigo-50/50 border-slate-200'
        }`}>
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Interested in working with us?
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Connect with the TripNova.ai team and share your interest. Whether you want to contribute code, propose ideas, or collaborate on final-year research, we look forward to hearing from you.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              {onOpenAboutUs && (
                <button
                  onClick={onOpenAboutUs}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-600 dark:hover:bg-sky-500 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Meet the Project Team</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('home')}
                className={`px-5 py-2.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300' 
                    : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Explore Platform
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
