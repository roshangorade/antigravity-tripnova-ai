import React, { useState } from 'react';
import { Utensils, Search, MapPin, Sparkles, Star, Loader2 } from 'lucide-react';

export const AIFoodDiscovery: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/food/ai-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Failed to get food recommendation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
          <Utensils className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif-editorial">AI Food Guide</h2>
          <p className="text-slate-600 text-sm font-medium">Tell us what you're craving</p>
        </div>
      </div>

      <form onSubmit={handleRecommend} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Spicy vegetarian under ₹500 near me"
            className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 placeholder:text-slate-500 font-medium"
          />
          <button 
            type="submit" 
            disabled={loading || !prompt.trim()}
            className="absolute right-2 top-2 bottom-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white p-2 rounded-xl transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-slate-900">{result.restaurantName}</h3>
            <span className="flex items-center bg-white px-2 py-1 rounded text-sm font-bold text-slate-700 shadow-sm">
              {result.rating} <Star className="w-4 h-4 ml-1 text-yellow-500 fill-current" />
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 bg-white rounded text-xs font-medium text-slate-600 border border-slate-200">
              {result.cuisine}
            </span>
            <span className="px-2 py-1 bg-white rounded text-xs font-medium text-slate-600 border border-slate-200">
              {result.estimatedPrice}
            </span>
            <span className="px-2 py-1 bg-white rounded text-xs font-medium text-slate-600 border border-slate-200 flex items-center">
              <MapPin className="w-3 h-3 mr-1" /> {result.distance}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl text-sm text-slate-700 italic border border-slate-100 mb-3">
            "{result.whyWeRecommend}"
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-700 font-semibold px-2 py-1 bg-white rounded-md border border-slate-300">
              {result.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
