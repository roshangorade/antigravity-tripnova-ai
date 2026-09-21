import React, { useState, useEffect } from 'react';
import { IndianRupee, Check, AlertCircle, Sparkles } from 'lucide-react';

export const QUICK_BUDGET_SHORTCUTS = [
  { value: 1000, label: '₹1,000' },
  { value: 2500, label: '₹2,500' },
  { value: 5000, label: '₹5,000' },
  { value: 10000, label: '₹10,000' },
  { value: 25000, label: '₹25,000' },
  { value: 50000, label: '₹50,000' },
];

export interface BudgetInputSelectorProps {
  value: number;
  onChange: (budget: number) => void;
  isDarkMode?: boolean;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  idPrefix?: string;
  error?: string | null;
  onValidationChange?: (isValid: boolean) => void;
}

export const BudgetInputSelector: React.FC<BudgetInputSelectorProps> = ({
  value,
  onChange,
  isDarkMode = false,
  compact = false,
  title = 'Your Trip Budget',
  subtitle = 'How much do you want to spend on this trip?',
  idPrefix = 'trip',
  error,
  onValidationChange
}) => {
  // Local string representation for smooth text input editing
  const [inputValue, setInputValue] = useState<string>(value > 0 ? String(value) : '');
  const [touched, setTouched] = useState(false);

  // Sync internal text when external numeric value changes (e.g. initial load or quick reset)
  useEffect(() => {
    if (value > 0 && String(value) !== inputValue && !touched) {
      setInputValue(String(value));
    }
  }, [value, touched, inputValue]);

  const numericVal = Number(inputValue);
  const isValid = !isNaN(numericVal) && numericVal > 0 && Number.isFinite(numericVal);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);

  const handleShortcutClick = (shortcutVal: number) => {
    setTouched(true);
    setInputValue(String(shortcutVal));
    onChange(shortcutVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched(true);
    const raw = e.target.value.replace(/[^0-9]/g, ''); // Only allow whole numeric digits
    setInputValue(raw);
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (!inputValue || Number(inputValue) <= 0) {
      // Revert or alert
    }
  };

  // Determine which shortcut (if any) is currently active
  const activeShortcut = QUICK_BUDGET_SHORTCUTS.find(s => s.value === value);

  return (
    <div className={`w-full ${compact ? 'space-y-2' : 'space-y-3'}`}>
      {/* Header & Subtitle */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <label
              htmlFor={`${idPrefix}-budget-input`}
              className="block text-xs sm:text-sm font-bold tracking-tight text-slate-900 dark:text-white"
            >
              {title}
            </label>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {isValid && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold self-start sm:self-auto border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              <span>Budget: ₹{value.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Select Buttons */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-sky-500" />
          <span>Quick Select:</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_BUDGET_SHORTCUTS.map(s => {
            const isSelected = value === s.value;
            return (
              <button
                key={s.value}
                id={`${idPrefix}-budget-btn-${s.value}`}
                type="button"
                onClick={() => handleShortcutClick(s.value)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer text-center flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30 ring-2 ring-sky-500/30 scale-[1.02]'
                    : isDarkMode
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-750 hover:border-slate-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Numeric Entry */}
      <div>
        <label
          htmlFor={`${idPrefix}-budget-input`}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Or enter your own budget:
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400 font-bold text-sm">
            <IndianRupee className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <input
            id={`${idPrefix}-budget-input`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="e.g. 4000, 7500, 15000"
            className={`w-full pl-9 pr-24 py-2.5 text-sm font-semibold rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              !isValid && touched
                ? 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 focus:ring-rose-500'
                : isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-medium text-slate-400">
            INR (Total)
          </div>
        </div>

        {/* Validation or Error message */}
        {(!isValid && touched) && (
          <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Please enter a valid positive budget amount (e.g. ₹4,000).</span>
          </p>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {isValid && (
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {activeShortcut ? (
              <span>Quick shortcut active: <strong className="text-sky-600 dark:text-sky-400">{activeShortcut.label}</strong></span>
            ) : (
              <span>Custom amount set: <strong className="text-emerald-600 dark:text-emerald-400">₹{numericVal.toLocaleString('en-IN')}</strong></span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};
