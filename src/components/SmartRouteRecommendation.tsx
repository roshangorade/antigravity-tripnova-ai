import React, { useState } from 'react';
import { Route, Clock, ShieldCheck, CloudSun, Navigation2, Loader2, MapPin } from 'lucide-react';

export const SmartRouteRecommendation: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/routes/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Failed to get route:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-300">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
          <Route className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif-editorial">Smart Routing</h2>
          <p className="text-slate-600 text-sm font-medium">Find the best route considering traffic & safety</p>
        </div>
      </div>

      <form onSubmit={handleRecommend} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Origin (e.g. Pune)"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-500 font-medium"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 text-emerald-600 w-5 h-5" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination (e.g. Mumbai)"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={loading || !origin.trim() || !destination.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white p-3 rounded-xl transition-colors font-semibold flex justify-center items-center cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find Smart Route'}
        </button>
      </form>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-start">
            <Navigation2 className="w-5 h-5 text-emerald-700 mr-3 shrink-0 mt-0.5" />
            <p className="text-emerald-900 text-sm font-semibold leading-relaxed">
              {result.reason}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.routes.map((route: any) => (
              <div 
                key={route.id} 
                className={`p-5 rounded-2xl border transition-all ${
                  route.isRecommended 
                    ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900">{route.id}</h3>
                  {route.isRecommended && (
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                  <div className="flex items-center text-slate-700 font-medium">
                    <Route className="w-4 h-4 mr-2 text-slate-500" />
                    {route.distance}
                  </div>
                  <div className="flex items-center text-slate-700 font-medium">
                    <Clock className="w-4 h-4 mr-2 text-slate-500" />
                    {route.time}
                  </div>
                  <div className="flex items-center text-slate-700 font-medium">
                    <ShieldCheck className="w-4 h-4 mr-2 text-slate-500" />
                    {route.safety}
                  </div>
                  <div className="flex items-center text-slate-700 font-medium">
                    <CloudSun className="w-4 h-4 mr-2 text-slate-500" />
                    {route.weather}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-right text-xs text-slate-600 font-semibold">
            Service Abstraction Mode (Demo Data)
          </div>
        </div>
      )}
    </div>
  );
};
