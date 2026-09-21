import React, { useState, useEffect } from 'react';
import { WeatherData, CanonicalDestination } from '../types';
import { DestinationSearchInput } from './DestinationSearchInput';
import { Sun, CloudSun, Wind, Droplets, ShieldAlert, Sparkles, MapPin, RefreshCw, Compass } from 'lucide-react';

interface WeatherWidgetProps {
  isDarkMode: boolean;
  currentDestination?: CanonicalDestination | null;
  onDestinationChange?: (destination: CanonicalDestination) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  isDarkMode,
  currentDestination,
  onDestinationChange
}) => {
  const [city, setCity] = useState(currentDestination?.name || 'Nashik');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({
    lat: currentDestination?.latitude,
    lng: currentDestination?.longitude
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const cities = ['Nashik', 'Chhatrapati Sambhajinagar', 'Pune', 'Mumbai', 'Goa', 'Jaipur', 'Manali', 'Varanasi', 'Dubai', 'Paris'];

  const fetchWeather = async (cityName: string, lat?: number, lng?: number) => {
    const trimmed = (cityName || '').trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          city: trimmed,
          lat: lat,
          lng: lng
        })
      });
      const data = await res.json();
      setWeather(data);
    } catch (e) {
      console.error('Weather fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentDestination && currentDestination.name) {
      setCity(currentDestination.name);
      setCoords({ lat: currentDestination.latitude, lng: currentDestination.longitude });
      fetchWeather(currentDestination.name, currentDestination.latitude, currentDestination.longitude);
    }
  }, [currentDestination]);

  useEffect(() => {
    const initialName = currentDestination?.name || 'Nashik';
    fetchWeather(initialName, currentDestination?.latitude, currentDestination?.longitude);
  }, []);

  const handleDestinationResolved = (canonical: CanonicalDestination) => {
    setCity(canonical.name);
    setCoords({ lat: canonical.latitude, lng: canonical.longitude });
    if (onDestinationChange) {
      onDestinationChange(canonical);
    }
    fetchWeather(canonical.name, canonical.latitude, canonical.longitude);
  };

  return (
    <section className={`py-16 transition-colors ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F8F7F4] text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Live Environmental Radar
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif-editorial tracking-tight mt-1 text-slate-900 dark:text-white">
              Weather & Travel Climate Radar
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl font-medium">
              Real-time atmospheric insights, UV index, Air Quality Index (AQI), and weather-smart packing alerts for any destination globally.
            </p>
          </div>

          {/* Universal Destination Search in Weather Bar */}
          <div className="w-full md:w-80">
            <DestinationSearchInput
              id="weather-search-input"
              value={city}
              onChange={(val, newCoords) => {
                setCity(val);
                if (newCoords) setCoords(newCoords);
              }}
              onSelectCanonical={handleDestinationResolved}
              placeholder="Check any city weather (e.g. Nashik, Dubai)..."
              isDarkMode={isDarkMode}
              showPopularChips={false}
              showInlineChips={false}
            />
          </div>
        </div>

        {/* Quick City Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">Popular:</span>
          {cities.map(c => (
            <button
              key={c}
              onClick={() => {
                setCity(c);
                fetchWeather(c);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                city.toLowerCase() === c.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Main Weather Overview Card */}
        {loading ? (
          <div className="p-12 rounded-3xl border border-slate-300 dark:border-slate-800 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Fetching live satellite weather metrics for {city}...
          </div>
        ) : weather ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Primary Gauge */}
            <div className={`lg:col-span-5 rounded-3xl p-6 border flex flex-col justify-between ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{weather.city}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-700">
                    AQI {weather.aqi} ({weather.aqiText})
                  </span>
                </div>

                <div className="my-6 flex items-center gap-6">
                  <div className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
                    {weather.tempC}°C
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">{weather.condition}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Feels like {weather.tempC + 1}°C</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Humidity</div>
                    <div className="text-xs font-bold">{weather.humidity}%</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-teal-500" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Wind</div>
                    <div className="text-xs font-bold">{weather.windKmh} km/h</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">UV Index</div>
                    <div className="text-xs font-bold">{weather.uvIndex}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7-Day & Packing Advice */}
            <div className={`lg:col-span-7 rounded-3xl p-6 border flex flex-col justify-between ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
            }`}>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <CloudSun className="w-4 h-4 text-emerald-500" />
                  <span>5-Day Forecast & Trip Recommendations</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {weather.forecast.map((f, i) => (
                    <div key={i} className={`p-3 rounded-2xl border text-center ${
                      isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[11px] font-bold text-slate-500">{f.day}</div>
                      <div className="my-1 text-sm font-bold text-slate-900 dark:text-white">{f.tempC}°C</div>
                      <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 truncate">{f.condition}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather-Smart Packing Tip */}
              <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Weather-Smart Packing Guide for {weather.city}</h5>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-0.5 font-medium">
                    {weather.packingTip || `Comfortable cotton wear, sun protection, and hydration essentials are recommended for traveling in ${weather.city}.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};
