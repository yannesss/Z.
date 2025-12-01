import React, { useState } from 'react';
import { parseTransactionWithGemini } from '../services/geminiService';
import { AiParsedResult } from '../types';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
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
      const result = await parseTransactionWithGemini(input);
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
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-indigo-800 font-medium">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <span>{t.smartEntryTitle}</span>
      </div>
      <p className="text-sm text-indigo-600 mb-3">
        {t.smartEntryHint}
      </p>
      
      <form onSubmit={handleSmartSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.smartEntryPlaceholder}
          className="w-full pl-4 pr-12 py-3 rounded-md border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
          title={t.smartEntryButton}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};
