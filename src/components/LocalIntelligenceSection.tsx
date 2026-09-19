import React, { useEffect, useState } from 'react';
import { MapPin, Bell, Calendar, Map, Info, AlertTriangle, Coffee, Sparkles } from 'lucide-react';
import { SerpEventsAndPlaces } from './SerpEventsAndPlaces';

interface EventItem {
  id: string;
  title: string;
  location: string;
  description: string;
  type: string;
  date: string;
  source: string;
}

interface AlertItem {
  id: string;
  title: string;
  type: string;
  severity: string;
  message: string;
  status: string;
}

export const LocalIntelligenceSection: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocalData = async () => {
      try {
        const [eventsRes, alertsRes] = await Promise.all([
          fetch('/api/events/trending'),
          fetch('/api/alerts/travel')
        ]);
        
        const eventsData = await eventsRes.json();
        const alertsData = await alertsRes.json();
        
        if (eventsData.success) setEvents(eventsData.data);
        if (alertsData.success) setAlerts(alertsData.data);
      } catch (err) {
        console.error('Failed to fetch local intelligence data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocalData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-serif-editorial">TripNova Local Intelligence</h2>
          <p className="mt-2 text-slate-600">Discover what's happening around you and travel safely.</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          Beta
        </span>
      </div>

      {currentUser && (
        <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start text-indigo-900">
          <Sparkles className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" />
          <p className="text-sm">
            <strong>Personalized Intelligence:</strong> Because you like {currentUser.travelStyle || 'exploring'} and {currentUser.budgetPreference || 'budget'} travel, we've highlighted local street food spots and free cultural events in the discovery panels below.
          </p>
        </div>
      )}

      {/* SerpApi Live Events & Discover More Places Widget */}
      <div className="mb-12">
        <SerpEventsAndPlaces initialLocation="Goa" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-48"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trending Events Column */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-semibold flex items-center text-slate-800">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
              Trending Near You
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                      {event.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-600 font-semibold">{event.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-1">{event.title}</h4>
                  <p className="text-sm text-slate-600 font-medium mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-slate-500" />
                    {event.location}
                  </p>
                  <p className="text-sm text-slate-700 mb-4">{event.description}</p>
                  <div className="flex items-center text-xs text-slate-600 font-medium">
                    <Info className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    {event.source}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Travel Alerts Column */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center text-slate-800">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Travel Safety Alerts
            </h3>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-5 rounded-2xl border ${alert.severity === 'high' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="flex items-start">
                    <AlertTriangle className={`w-5 h-5 mr-3 shrink-0 ${alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
                    <div>
                      <h4 className={`font-semibold mb-1 ${alert.severity === 'high' ? 'text-red-900' : 'text-amber-900'}`}>
                        {alert.title}
                      </h4>
                      <p className={`text-sm mb-3 ${alert.severity === 'high' ? 'text-red-700' : 'text-amber-700'}`}>
                        {alert.message}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${alert.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {alerts.length === 0 && (
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center text-emerald-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 animate-pulse"></div>
                  No active travel alerts in your area.
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};
