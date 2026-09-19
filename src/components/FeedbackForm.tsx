import React, { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle2 } from 'lucide-react';

export const FeedbackForm: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('Website Feedback');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !message.trim()) return;
    
    setStatus('submitting');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, category, message })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          setRating(0);
          setMessage('');
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif-editorial">Help us improve</h2>
          <p className="text-slate-600 font-medium text-sm">TripNova Beta Feedback</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Thank you!</h3>
          <p className="text-slate-600 font-medium">Your feedback helps us build a better travel platform.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">How would you rate your experience?</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">What is this regarding?</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Website Feedback</option>
              <option>Feature Suggestion</option>
              <option>Incorrect Information Report</option>
              <option>Destination Feedback</option>
              <option>Restaurant/Hotel Feedback</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Tell us more</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, suggestions, or report an issue..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={status === 'submitting' || !rating || !message.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-600 text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center cursor-pointer disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Submitting...' : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </button>
          <p className="text-xs text-slate-600 font-medium text-center mt-2">
            Feedback will be saved for future database integration.
          </p>
        </form>
      )}
    </div>
  );
};
