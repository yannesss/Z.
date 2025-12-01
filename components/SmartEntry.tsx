import React, { useState } from 'react';
import { parseTransactionSmart } from '../services/geminiService';
import { AiParsedResult } from '../types';
import { Sparkles, Loader2, ArrowRight, Zap } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface SmartEntryProps {
  onParsed: (data: AiParsedResult) => void;
  t: typeof TRANSLATIONS['en'];
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onParsed, t }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await parseTransactionSmart(input);
      if (result) {
        onParsed(result);
        setInput('');
      } else {
        setError(t.errorSmart);
      }
    } catch (err) {
      setError('Failed to process request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-emerald-800 font-medium">
        <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600" />
        <span>{t.smartEntryTitle}</span>
      </div>
      <p className="text-sm text-emerald-700 mb-3">
        {t.smartEntryHint}
      </p>
      
      <form onSubmit={handleSmartSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.smartEntryPlaceholder}
          className="w-full pl-4 pr-12 py-3 rounded-md border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800 placeholder-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors"
          title={t.smartEntryButton}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};