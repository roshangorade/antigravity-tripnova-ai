import React, { useState, useEffect } from 'react';
import { WeatherData } from '../types';
import { Sun, CloudSun, Wind, Droplets, ShieldAlert, Sparkles, MapPin, RefreshCw } from 'lucide-react';

interface WeatherWidgetProps {
  isDarkMode: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ isDarkMode }) => {
  const [city, setCity] = useState('Goa');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const cities = ['Goa', 'Leh Ladakh', 'Jaipur', 'Udaipur', 'Kerala', 'Varanasi', 'Manali', 'Mumbai', 'Delhi', 'Andaman'];

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: cityName })
      });
      const data = await res.json();
      setWeather(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  return (
    <section className={`py-16 transition-colors ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F8F7F4] text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Live Environmental Conditions
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif-editorial tracking-tight mt-1 text-slate-900 dark:text-white">
              Weather & Travel Climate Radar
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl font-medium">
              Real-time atmospheric insights, UV index, Air Quality Index (AQI), and weather-smart packing alerts.
            </p>
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {cities.map(c => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  city === c
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Main Weather Overview Card */}
        {loading ? (
          <div className="p-12 rounded-3xl border border-slate-300 dark:border-slate-800 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Fetching live weather metrics for {city}...
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

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Humidity</span>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5"><Droplets className="w-3.5 h-3.5 text-blue-500" /> {weather.humidity}%</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Wind</span>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5"><Wind className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> {weather.windKmH} km/h</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">UV Index</span>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5"><Sun className="w-3.5 h-3.5 text-amber-500" /> {weather.uvIndex}</div>
                  </div>
                </div>
              </div>

              {/* Rain Alert Banner */}
              <div className="mt-6 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{weather.rainAlert}</span>
              </div>
            </div>

            {/* Right Hourly & 7-Day Outlook */}
            <div className={`lg:col-span-7 rounded-3xl p-6 border flex flex-col justify-between ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
            }`}>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
                  Hourly Forecast
                </h4>
                <div className="grid grid-cols-5 gap-2 text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                  {weather.hourlyForecast.map((h, i) => (
                    <div key={i} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-transparent">
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{h.time}</div>
                      <div className="my-1 text-sm font-bold text-slate-900 dark:text-white">{h.tempC}°C</div>
                      <div className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">{h.rainProb}% Rain</div>
                    </div>
                  ))}
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 my-4">
                  7-Day Outlook
                </h4>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {weather.sevenDayForecast.map((day, i) => (
                    <div key={i} className="p-2 rounded-xl border border-slate-300 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white">{day.day}</div>
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 my-1">{day.highC}°</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{day.lowC}°</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Tips */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Smart Travel Tip
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                  {weather.recommendations[0]}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};
