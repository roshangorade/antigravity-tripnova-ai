import React, { useState, useEffect } from 'react';
import { TravelItinerary, Activity, ItineraryDay } from '../types';
import { Calendar, Clock, MapPin, DollarSign, Sun, Coffee, Sunrise, Sunset, Moon, Plus, Trash2, Download, Share2, Edit2, CheckCircle2, ShieldAlert, Sparkles, Navigation, Route as RouteIcon, ExternalLink, Loader2 } from 'lucide-react';

interface TripItineraryViewProps {
  itinerary: TravelItinerary;
  isDarkMode: boolean;
  onUpdateItinerary: (updated: TravelItinerary) => void;
}

export const TripItineraryView: React.FC<TripItineraryViewProps> = ({
  itinerary,
  isDarkMode,
  onUpdateItinerary
}) => {
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [newActivityModalOpen, setNewActivityModalOpen] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance?: string; duration?: string; via?: string; mapsUrl?: string; loading: boolean } | null>(null);

  useEffect(() => {
    if (itinerary.origin && itinerary.destination) {
      setRouteInfo({ loading: true });
      fetch(`/api/maps/directions?origin=${encodeURIComponent(itinerary.origin)}&destination=${encodeURIComponent(itinerary.destination)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.routes && data.routes.length > 0) {
            const r = data.routes[0];
            setRouteInfo({
              distance: r.formattedDistance,
              duration: r.formattedDuration,
              via: r.via,
              mapsUrl: data.googleMapsDirectionsUrl,
              loading: false
            });
          } else {
            setRouteInfo(null);
          }
        })
        .catch(() => setRouteInfo(null));
    }
  }, [itinerary.origin, itinerary.destination]);

  // New activity form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTime, setNewTime] = useState('03:00 PM');
  const [newCategory, setNewCategory] = useState<Activity['category']>('afternoon');
  const [newLocation, setNewLocation] = useState('');
  const [newCost, setNewCost] = useState(500);

  const currentDay = itinerary.days[activeDayIdx] || itinerary.days[0];

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newAct: Activity = {
      id: 'act_' + Date.now(),
      title: newTitle,
      description: newDesc || 'Custom added activity.',
      time: newTime,
      category: newCategory,
      locationName: newLocation || itinerary.destination,
      estimatedCostINR: Number(newCost),
      durationHours: 1.5,
      tips: 'Personalized user item'
    };

    const updatedDays = [...itinerary.days];
    updatedDays[activeDayIdx] = {
      ...currentDay,
      activities: [...currentDay.activities, newAct]
    };

    onUpdateItinerary({
      ...itinerary,
      days: updatedDays
    });

    setNewActivityModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleDeleteActivity = (actId: string) => {
    const updatedDays = [...itinerary.days];
    updatedDays[activeDayIdx] = {
      ...currentDay,
      activities: currentDay.activities.filter(a => a.id !== actId)
    };

    onUpdateItinerary({
      ...itinerary,
      days: updatedDays
    });
  };

  const getCategoryBadge = (cat: Activity['category']) => {
    switch (cat) {
      case 'breakfast':
        return { label: 'Breakfast', icon: Coffee, color: 'text-amber-500 bg-amber-500/10' };
      case 'morning':
        return { label: 'Morning Trail', icon: Sunrise, color: 'text-sky-500 bg-sky-500/10' };
      case 'lunch':
        return { label: 'Lunch Spot', icon: Coffee, color: 'text-orange-500 bg-orange-500/10' };
      case 'afternoon':
        return { label: 'Afternoon Adventure', icon: Sun, color: 'text-yellow-500 bg-yellow-500/10' };
      case 'evening':
        return { label: 'Evening Sunset', icon: Sunset, color: 'text-rose-500 bg-rose-500/10' };
      case 'dinner':
        return { label: 'Dinner', icon: Moon, color: 'text-purple-500 bg-purple-500/10' };
      case 'night':
        return { label: 'Night Life', icon: Moon, color: 'text-indigo-500 bg-indigo-500/10' };
      default:
        return { label: 'Activity', icon: MapPin, color: 'text-blue-500 bg-blue-500/10' };
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(itinerary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${itinerary.destination.toLowerCase()}_itinerary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs transition-all ${
      isDarkMode ? 'bg-[#131E32] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
    }`}>
      {/* Itinerary Header Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200/80 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold border border-sky-500/20">
              Verified AI Itinerary
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold capitalize">• {itinerary.travelStyle} trip</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{itinerary.title}</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            From <span className="font-semibold text-slate-900 dark:text-slate-200">{itinerary.origin}</span> to{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-200">{itinerary.destination}</span> • {itinerary.durationDays} Days • {itinerary.travelersCount} Travelers
          </p>

          {/* SerpApi Route Information Banner */}
          {routeInfo && (
            <div className={`mt-3 p-3 rounded-xl border flex items-center gap-3 text-xs ${
              isDarkMode ? 'bg-slate-850/80 border-slate-750' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}>
              <RouteIcon className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              {routeInfo.loading ? (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating route details...</span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-white">Route: <span className="text-sky-600 dark:text-sky-400">{routeInfo.distance}</span></span>
                    <span>• Est. Time: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{routeInfo.duration}</span></span>
                    {routeInfo.via && <span className="text-slate-700 dark:text-slate-300 font-medium">• via {routeInfo.via}</span>}
                  </div>
                  {routeInfo.mapsUrl && (
                    <a
                      href={routeInfo.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 text-xs"
                    >
                      <span>Maps Route</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-right mr-3 hidden sm:block">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Estimated Budget</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              ₹{itinerary.totalEstimatedCostINR.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Itinerary share link copied to clipboard!');
            }}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {itinerary.days.map((day, idx) => (
          <button
            key={day.dayNumber}
            id={`day-tab-${day.dayNumber}`}
            onClick={() => setActiveDayIdx(idx)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-2 border cursor-pointer ${
              activeDayIdx === idx
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-sky-600 dark:border-sky-600 shadow-xs'
                : isDarkMode
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Day {day.dayNumber}</span>
          </button>
        ))}
      </div>

      {/* Day Theme & Summary Banner */}
      {currentDay && (
        <div className={`p-4 sm:p-5 rounded-xl border mb-8 ${
          isDarkMode ? 'bg-[#0E172A] border-slate-800' : 'bg-slate-50 border-slate-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Day {currentDay.dayNumber} Focus
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{currentDay.theme}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed font-medium">
                {currentDay.summary}
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Day Cost Estimate</span>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                ₹{currentDay.dailyBudgetEstimateINR.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activities Day-Wise Timeline */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 sm:before:left-6 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {currentDay?.activities.map((act) => {
          const catMeta = getCategoryBadge(act.category);
          const CatIcon = catMeta.icon;

          return (
            <div
              key={act.id}
              className="relative pl-10 sm:pl-14 group transition-all"
            >
              {/* Category Icon Circle on Timeline */}
              <div className={`absolute left-1.5 sm:left-3.5 top-1.5 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs ${catMeta.color}`}>
                <CatIcon className="w-3.5 h-3.5" />
              </div>

              {/* Activity Card */}
              <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
                isDarkMode 
                  ? 'bg-slate-850/90 border-slate-750 hover:border-slate-700' 
                  : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {act.time}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${catMeta.color}`}>
                        {catMeta.label}
                      </span>
                      {act.travelTimeFromPrev && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                          • {act.travelTimeFromPrev}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {act.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed font-medium">
                      {act.description}
                    </p>
                  </div>

                  {/* Activity Cost & Delete */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      ₹{act.estimatedCostINR.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="p-1 rounded text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors mt-2 cursor-pointer"
                      title="Remove activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer details: Location & Local Tips */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    <span className="font-semibold">{act.locationName}</span>
                  </div>

                  {act.tips && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>{act.tips}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Activity Button */}
      <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={() => setNewActivityModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors flex items-center gap-2 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-transparent cursor-pointer"
        >
          <Plus className="w-4 h-4 text-sky-500" />
          <span>Add Custom Activity to Day {currentDay?.dayNumber}</span>
        </button>
      </div>

      {/* Local Safety & Packing Hints Banner */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-2xl border ${
          isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-emerald-50/70 border-emerald-300'
        }`}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Suggested Packing Checklist
          </h4>
          <ul className="text-xs text-slate-700 dark:text-slate-200 space-y-1 font-medium">
            {itinerary.packingChecklist.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-amber-50/70 border-amber-300'
        }`}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Emergency Contacts
          </h4>
          <div className="text-xs text-slate-700 dark:text-slate-200 space-y-1 font-medium">
            <div className="flex justify-between"><span>National Police:</span> <span className="font-bold text-slate-900 dark:text-white">{itinerary.emergencyContacts.police}</span></div>
            <div className="flex justify-between"><span>Tourist Helpline:</span> <span className="font-bold text-slate-900 dark:text-white">{itinerary.emergencyContacts.touristHelpline}</span></div>
            <div className="flex justify-between"><span>Medical Emergency:</span> <span className="font-bold text-slate-900 dark:text-white">{itinerary.emergencyContacts.medical}</span></div>
          </div>
        </div>
      </div>

      {/* Modal for adding custom activity */}
      {newActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${
            isDarkMode ? 'bg-[#131E32] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <h3 className="text-base font-bold mb-4">Add Custom Activity to Day {currentDay?.dayNumber}</h3>
            <form onSubmit={handleAddActivity} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Scuba Dive / Sunset Cocktails"
                  className={`w-full px-3 py-2 rounded-lg border font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500'}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g. 04:30 PM"
                    className={`w-full px-3 py-2 rounded-lg border font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500'}`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Activity['category'])}
                    className={`w-full px-3 py-2 rounded-lg border font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="morning">Morning</option>
                    <option value="lunch">Lunch</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="dinner">Dinner</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Location Name</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Spot or Restaurant Name"
                  className={`w-full px-3 py-2 rounded-lg border font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500'}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Estimated Cost (INR)</label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg border font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setNewActivityModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold transition-colors cursor-pointer"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
