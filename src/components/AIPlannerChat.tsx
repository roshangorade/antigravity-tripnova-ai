import React, { useState, useEffect } from 'react';
import { TravelItinerary, BudgetTier, TravelStyle, CanonicalDestination } from '../types';
import { TripItineraryView } from './TripItineraryView';
import { DestinationSearchInput } from './DestinationSearchInput';
import { Sparkles, Send, Bot, User, History, PlusCircle, Calculator, Package, CloudSun, Globe, DollarSign, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface AIPlannerChatProps {
  isDarkMode: boolean;
  initialQuery?: any;
  savedItineraries: TravelItinerary[];
  onSaveItinerary: (itinerary: TravelItinerary) => void;
  currentDestination?: CanonicalDestination | null;
  onDestinationChange?: (destination: CanonicalDestination) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  itineraryData?: TravelItinerary;
  timestamp: string;
}

export const AIPlannerChat: React.FC<AIPlannerChatProps> = ({
  isDarkMode,
  initialQuery,
  savedItineraries,
  onSaveItinerary,
  currentDestination,
  onDestinationChange
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: 'Namaste & Welcome! I am your AI Travel Concierge powered by Gemini 3.6 Flash. Tell me where you wish to travel or ask me to craft a customized day-wise itinerary, budget breakdown, or food guide for any city!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick planner state
  const [destination, setDestination] = useState(currentDestination?.name || 'Nashik');
  const [canonicalDest, setCanonicalDest] = useState<CanonicalDestination | null>(currentDestination || null);
  const [origin, setOrigin] = useState('Mumbai');
  const [days, setDays] = useState(3);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState<number>(10000);

  // Synchronize when currentDestination prop changes
  useEffect(() => {
    if (currentDestination && currentDestination.name) {
      setDestination(currentDestination.name);
      setCanonicalDest(currentDestination);
    }
  }, [currentDestination]);

  // Sidebar Tool Active Tab
  const [activeTool, setActiveTool] = useState<'history' | 'budget' | 'packing' | 'weather'>('history');

  // Currency Converter Quick State
  const [inrAmount, setInrAmount] = useState(10000);

  const handleDestinationResolved = (canonical: CanonicalDestination) => {
    setDestination(canonical.name);
    setCanonicalDest(canonical);
    if (onDestinationChange) {
      onDestinationChange(canonical);
    }
  };

  const handleGenerateTripFromControls = async () => {
    if (!budget || isNaN(budget) || budget <= 0) {
      alert('Please enter a valid trip budget greater than ₹0.');
      return;
    }
    const destToUse = destination.trim() || 'Nashik';
    setLoading(true);
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: `Generate a ${days}-day trip to ${destToUse} from ${origin} for ${travelers} travelers with an exact budget of ₹${budget.toLocaleString('en-IN')}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination: destToUse,
          city: canonicalDest?.city || destToUse,
          state: canonicalDest?.state || null,
          country: canonicalDest?.country || 'India',
          latitude: canonicalDest?.latitude,
          longitude: canonicalDest?.longitude,
          durationDays: days,
          travelersCount: travelers,
          budget: Number(budget),
          travelStyle: 'couple',
          interests: ['Culture', 'Food', 'Scenery', 'Sightseeing']
        })
      });

      const data = await res.json();
      if (data.success && data.itinerary) {
        onSaveItinerary(data.itinerary);
        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: `Here is your customized ${days}-day itinerary for ${destToUse}! I've verified local attractions, signature dining spots, and calculated budget allocations for you.`,
          itineraryData: data.itinerary,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('AI Planner Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Check if user specified a destination in their text (e.g. "Plan trip to Pune")
      let targetDest = destination;
      const match = userText.match(/(?:to|in|for)\s+([A-Za-z\s]+?)(?:\s+(?:from|with|for|\d+|days|trip)|$)/i);
      if (match && match[1] && match[1].trim().length > 2 && match[1].trim().length < 30) {
        targetDest = match[1].trim();
        setDestination(targetDest);
      }

      // Try resolving target location
      let resolvedCity = targetDest;
      let resolvedLat: number | undefined;
      let resolvedLng: number | undefined;
      try {
        const resResolv = await fetch(`/api/destinations/resolve?q=${encodeURIComponent(targetDest)}`);
        const resolvData = await resResolv.json();
        if (resolvData.success && resolvData.destination) {
          resolvedCity = resolvData.destination.city;
          resolvedLat = resolvData.destination.latitude;
          resolvedLng = resolvData.destination.longitude;
          setCanonicalDest(resolvData.destination);
          if (onDestinationChange) onDestinationChange(resolvData.destination);
        }
      } catch (e) {
        // Continue
      }

      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin || 'Mumbai',
          destination: targetDest,
          city: resolvedCity,
          latitude: resolvedLat,
          longitude: resolvedLng,
          durationDays: days || 3,
          travelersCount: travelers || 2,
          budget: Number(budget) || 10000,
          additionalPrompt: userText
        })
      });

      const data = await res.json();
      if (data.success && data.itinerary) {
        onSaveItinerary(data.itinerary);
        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: `I've analyzed your prompt and tailored a complete itinerary for ${data.itinerary.destination}! Explore the day-by-day roadmap and budget allocation below:`,
          itineraryData: data.itinerary,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[85vh] grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 transition-colors ${
      isDarkMode ? 'bg-[#0B1120] text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Left Sidebar Tools & History */}
      <div className={`lg:col-span-4 rounded-2xl p-5 border flex flex-col justify-between ${
        isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
      }`}>
        <div>
          {/* Sidebar Navigation Buttons */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <h3 className="font-bold text-sm">Travel Intelligence Toolbox</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active Context: {destination}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 mb-5 text-xs font-medium">
            <button
              onClick={() => setActiveTool('history')}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'history' ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-semibold'
              }`}
            >
              Saved
            </button>
            <button
              onClick={() => setActiveTool('budget')}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'budget' ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-semibold'
              }`}
            >
              Budget
            </button>
            <button
              onClick={() => setActiveTool('packing')}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'packing' ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-semibold'
              }`}
            >
              Packing
            </button>
            <button
              onClick={() => setActiveTool('weather')}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'weather' ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-semibold'
              }`}
            >
              Weather
            </button>
          </div>

          {/* Tool Panels */}
          {activeTool === 'history' && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                Saved Itineraries ({savedItineraries.length})
              </div>
              {savedItineraries.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
                  No saved trips yet. Generate one to see it listed here!
                </div>
              ) : (
                savedItineraries.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => {
                      const msg: ChatMessage = {
                        id: 'trip_load_' + Date.now(),
                        sender: 'ai',
                        text: `Loaded saved itinerary for ${trip.destination}:`,
                        itineraryData: trip,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                      setMessages(prev => [...prev, msg]);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer hover:border-sky-500 transition-colors ${
                      isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold">{trip.title}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{trip.durationDays} Days • ₹{trip.totalEstimatedCostINR.toLocaleString('en-IN')}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTool === 'budget' && (
            <div className="space-y-3 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Currency Converter</div>
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold mb-1 block">Amount in INR (₹)</label>
                <input
                  type="number"
                  value={inrAmount}
                  onChange={(e) => setInrAmount(Number(e.target.value))}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 font-medium'}`}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>USD ($):</span> <span className="font-semibold">${(inrAmount * 0.012).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>EUR (€):</span> <span className="font-semibold">€{(inrAmount * 0.011).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>AED (Dirham):</span> <span className="font-semibold">{(inrAmount * 0.044).toFixed(2)} AED</span></div>
              </div>
            </div>
          )}

          {activeTool === 'packing' && (
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Essential Travel Kit for {destination}</div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 space-y-1.5">
                <div>✓ Universal Power Adapter & Cable</div>
                <div>✓ Sunscreen SPF 50 & Sunglasses</div>
                <div>✓ 20,000 mAh Fast Charging Power Bank</div>
                <div>✓ Govt Photo ID & Digital Ticket Copies</div>
                <div>✓ Reusable Thermal Water Flask</div>
              </div>
            </div>
          )}

          {activeTool === 'weather' && (
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Regional Climate Quick Check</div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between"><span>{destination}:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">Live Satellite Data</span></div>
                <div className="flex justify-between"><span>Mumbai:</span> <span className="font-semibold text-sky-600 dark:text-sky-400">30°C Coastal</span></div>
                <div className="flex justify-between"><span>Delhi:</span> <span className="font-semibold text-amber-600 dark:text-amber-400">28°C Pleasant</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Generator Panel on Sidebar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 space-y-2">
          <div className="text-xs font-semibold">Custom Trip Parameters</div>
          <div className="space-y-2">
            <div>
              <DestinationSearchInput
                id="ai-planner-sidebar-destination"
                value={destination}
                onChange={(val) => setDestination(val)}
                onSelectCanonical={handleDestinationResolved}
                placeholder="Search any destination..."
                isDarkMode={isDarkMode}
                showPopularChips={false}
                showInlineChips={false}
                label=""
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Travelers</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <span>Custom Trip Budget</span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">₹{Number(budget).toLocaleString('en-IN')}</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">₹</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                placeholder="Custom amount e.g. 7350"
                className={`w-full pl-6 pr-2.5 py-1.5 text-xs rounded-lg border font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
            {/* Quick Presets & Custom Presets */}
            <div className="flex gap-1 mt-1.5 overflow-x-auto no-scrollbar">
              {[1000, 2500, 5000, 7350, 10000, 25000, 50000].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setBudget(s)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 ${
                    budget === s
                      ? 'bg-sky-600 text-white border-sky-600 font-bold'
                      : isDarkMode
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  ₹{s >= 1000 ? `${(s / 1000).toFixed(s % 1000 === 0 ? 0 : 1)}k` : s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateTripFromControls}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-sky-400 dark:text-sky-200" />}
            <span>Generate Itinerary for {destination}</span>
          </button>
        </div>
      </div>

      {/* Right Chat Stream */}
      <div className={`lg:col-span-8 rounded-2xl p-5 border flex flex-col justify-between ${
        isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
      }`}>
        {/* Chat Stream Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 max-h-[65vh]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[88%] ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white font-medium rounded-tr-none'
                    : isDarkMode
                      ? 'bg-slate-800/90 text-slate-100 border border-slate-700 rounded-tl-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>

                {/* Render Itinerary if attached */}
                {msg.itineraryData && (
                  <div className="mt-4">
                    <TripItineraryView
                      itinerary={msg.itineraryData}
                      isDarkMode={isDarkMode}
                      onUpdateItinerary={(updated) => onSaveItinerary(updated)}
                    />
                  </div>
                )}

                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1 px-1">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-sky-600 dark:text-sky-400 font-semibold animate-pulse">
              <Bot className="w-5 h-5 animate-spin" />
              <span>TripNova AI is generating your day-wise travel itinerary for {destination}...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={`Ask anything e.g. 'Plan a 3-day trip to ${destination}' or 'What are signature street foods in ${destination}?'`}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500 ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
