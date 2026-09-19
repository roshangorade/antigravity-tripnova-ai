import React, { useState } from 'react';
import { Compass, Send, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  isDarkMode: boolean;
  onNavigate: (tab: string) => void;
  onOpenAboutUs?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ isDarkMode, onNavigate, onOpenAboutUs }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className={`border-t transition-colors ${
      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-300'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-sky-400" />
              <span className="text-xl font-bold font-display text-white">TripNova<span className="text-sky-400">.ai</span></span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Full-stack AI-powered Smart Travel Planner for India and top global destinations. Craft bespoke day-wise itineraries, verified stays, and expense trails in seconds.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase text-white tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              {onOpenAboutUs && (
                <li>
                  <button onClick={onOpenAboutUs} className="text-amber-400 font-semibold hover:underline transition-colors flex items-center gap-1 cursor-pointer">
                    ★ About Us
                  </button>
                </li>
              )}
              <li><button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer">Popular Destinations</button></li>
              <li><button onClick={() => onNavigate('ai-planner')} className="hover:text-white transition-colors cursor-pointer">AI Trip Planner</button></li>
              <li><button onClick={() => onNavigate('categories')} className="hover:text-white transition-colors cursor-pointer">Travel Categories</button></li>
              <li><button onClick={() => onNavigate('hotels')} className="hover:text-white transition-colors cursor-pointer">Verified Stays</button></li>
              <li>
                <a 
                  href="/careers" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    onNavigate('careers'); 
                  }} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Travel Guides */}
          <div>
            <h4 className="text-xs font-bold uppercase text-white tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('food')} className="hover:text-white transition-colors cursor-pointer">Food & Dining Guide</button></li>
              <li><button onClick={() => onNavigate('transport')} className="hover:text-white transition-colors cursor-pointer">Commute Matrix</button></li>
              <li><button onClick={() => onNavigate('weather')} className="hover:text-white transition-colors cursor-pointer">Live Weather Radar</button></li>
              <li><button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors cursor-pointer">Admin Console</button></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-bold uppercase text-white tracking-wider mb-3">Join Wanderlust Newsletter</h4>
            <p className="text-xs text-slate-300 mb-3">Get secret heritage deals and AI travel updates weekly.</p>
            {subscribed ? (
              <div className="text-xs text-emerald-400 font-bold">✓ Thank you for subscribing!</div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-300 text-xs focus:outline-none flex-1"
                  required
                />
                <button type="submit" className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-4">
          <div>© {new Date().getFullYear()} TripNova AI. All rights reserved.</div>
          <div className="flex items-center gap-1 text-slate-300">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>for global travelers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
