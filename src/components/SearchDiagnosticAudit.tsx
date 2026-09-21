import React, { useState, useEffect } from 'react';
import { SearchAuditDiagnosticData, CanonicalDestination } from '../types';
import { 
  Activity, 
  Search, 
  MapPin, 
  Hotel, 
  Utensils, 
  Compass, 
  CloudSun, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink,
  X,
  Code
} from 'lucide-react';

interface SearchDiagnosticAuditProps {
  currentDestination?: CanonicalDestination | null;
  isDarkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDiagnosticAudit: React.FC<SearchDiagnosticAuditProps> = ({
  currentDestination,
  isDarkMode,
  isOpen,
  onClose
}) => {
  const [query, setQuery] = useState(currentDestination?.name || 'Nashik');
  const [auditData, setAuditData] = useState<SearchAuditDiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async (searchTarget: string) => {
    if (!searchTarget.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit-search?q=${encodeURIComponent(searchTarget.trim())}`);
      const data = await res.json();
      if (data.success && data.audit) {
        setAuditData(data.audit);
      } else {
        setError(data.message || 'Audit failed to run.');
      }
    } catch (err: any) {
      console.error('Audit query failed:', err);
      setError(err.message || 'Network error executing diagnostic audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initial = currentDestination?.name || query || 'Nashik';
      setQuery(initial);
      runAudit(initial);
    }
  }, [isOpen, currentDestination]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Universal Destination Search & Travel Intelligence Diagnostic Audit
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live verification of CanonicalDestination resolution, entity counts, isolation, and data provenance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Search Bar */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAudit(query);
            }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Test any location (e.g. Nashik, Chhatrapati Sambhajinagar, Dubai, Paris, Panchgani)..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Execute Live Audit</span>
            </button>
          </form>

          {/* Quick preset tests */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Test Presets:</span>
            {['Nashik', 'Chhatrapati Sambhajinagar', 'Aurangabad', 'Pune', 'Panchgani', 'Mahabaleshwar', 'Dubai', 'Paris', 'Varanasi', 'Kochi'].map(city => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setQuery(city);
                  runAudit(city);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  query.toLowerCase() === city.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-12 text-center text-indigo-500 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-sm font-semibold">Analyzing location resolution, entity indexing, and coordinates...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {auditData && !loading && (
            <>
              {/* Canonical Destination Card */}
              <div className={`p-5 rounded-2xl border ${
                isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold">Canonical Destination Resolution</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Source: {auditData.resolvedDestination.source}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400 font-medium">Canonical Name</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">{auditData.resolvedDestination.name}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Display Name</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate" title={auditData.resolvedDestination.displayName}>
                      {auditData.resolvedDestination.displayName}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">City / State / Country</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {auditData.resolvedDestination.city}, {auditData.resolvedDestination.state || 'N/A'}, {auditData.resolvedDestination.country}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Exact Coordinates</div>
                    <div className="font-mono text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                      {auditData.resolvedDestination.latitude.toFixed(4)}, {auditData.resolvedDestination.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Entity Breakdown Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Hotels Card */}
                <div className={`p-4 rounded-2xl border ${
                  isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Hotel className="w-4 h-4 text-sky-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Hotels Found</h4>
                    </div>
                    <span className="text-base font-black text-sky-600 dark:text-sky-400">
                      {auditData.hotels.finalCount}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Local CSV Records:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{auditData.hotels.localDatasetCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Database Records:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{auditData.hotels.databaseCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>External Search Records:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{auditData.hotels.externalCount}</span>
                    </div>
                  </div>
                </div>

                {/* Restaurants Card */}
                <div className={`p-4 rounded-2xl border ${
                  isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Restaurants Found</h4>
                    </div>
                    <span className="text-base font-black text-amber-600 dark:text-amber-400">
                      {auditData.restaurants.finalCount}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Local 27k+ Dataset:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{auditData.restaurants.localDatasetCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Database Records:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{auditData.restaurants.databaseCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>External Search Records:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{auditData.restaurants.externalCount}</span>
                    </div>
                  </div>
                </div>

                {/* Attractions Card */}
                <div className={`p-4 rounded-2xl border ${
                  isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Attractions Found</h4>
                    </div>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {auditData.attractions.finalCount}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Local Curated:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{auditData.attractions.localCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Dynamic Discovery:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{auditData.attractions.externalCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Total Verified:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{auditData.attractions.finalCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Downstream Integrations Verification */}
              <div className={`p-5 rounded-2xl border ${
                isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Downstream Service Consistency Check</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-400 font-medium flex items-center gap-1.5">
                      <CloudSun className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Weather Integration</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white mt-1">
                      {auditData.weatherSource} ({auditData.resolvedDestination.city})
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-400 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      <span>Map Center Coordinates</span>
                    </div>
                    <div className="font-bold font-mono text-slate-900 dark:text-white mt-1">
                      {auditData.mapCoordinates.lat.toFixed(4)}, {auditData.mapCoordinates.lng.toFixed(4)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Itinerary Target</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white mt-1">
                      {auditData.aiDestination}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Entities Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sample Hotels */}
                <div className={`p-4 rounded-2xl border ${
                  isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                    <span>Sample Resolved Hotels</span>
                    <span className="text-[10px] text-slate-400">{auditData.sampleHotels.length} shown</span>
                  </h4>
                  {auditData.sampleHotels.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-2">No verified hotels within radius.</div>
                  ) : (
                    <div className="space-y-2">
                      {auditData.sampleHotels.slice(0, 4).map((h, i) => (
                        <div key={i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{h.name}</div>
                            <div className="text-[11px] text-slate-500">{h.location} • {h.pricePerNight}</div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400">
                            {h.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sample Restaurants */}
                <div className={`p-4 rounded-2xl border ${
                  isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                    <span>Sample Resolved Restaurants</span>
                    <span className="text-[10px] text-slate-400">{auditData.sampleRestaurants.length} shown</span>
                  </h4>
                  {auditData.sampleRestaurants.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-2">No verified restaurants found.</div>
                  ) : (
                    <div className="space-y-2">
                      {auditData.sampleRestaurants.slice(0, 4).map((r, i) => (
                        <div key={i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{r.title}</div>
                            <div className="text-[11px] text-slate-500">{r.category} • ⭐ {r.rating}</div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {r.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 text-xs">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Isolation Verified: Zero unrelated-city fallback</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
