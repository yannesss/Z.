import React, { useState, useEffect } from 'react';
import { CATEGORIES, TRANSLATIONS } from '../constants';
import { Transaction, AiParsedResult } from '../types';
import { PlusCircle } from 'lucide-react';

interface AddTransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  aiDraft: AiParsedResult | null;
  onClearDraft: () => void;
  t: typeof TRANSLATIONS['en'];
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ onAdd, aiDraft, onClearDraft, t }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  // Auto-fill form when AI draft arrives
  useEffect(() => {
    if (aiDraft) {
      if (aiDraft.date) setDate(aiDraft.date);
      if (aiDraft.category) {
        // Try to match partial category names
        const match = CATEGORIES.find(c => c.toLowerCase().includes((aiDraft.category || '').toLowerCase()));
        setCategory(match || CATEGORIES.find(c => c.includes('Others')) || CATEGORIES[0]);
      }
      if (aiDraft.description) setDescription(aiDraft.description);
      if (aiDraft.amount) setAmount(aiDraft.amount.toString());
      if (aiDraft.type) setType(aiDraft.type);
      
      // Cleanup draft after consumption
      onClearDraft();
    }
  }, [aiDraft, onClearDraft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onAdd({
      date,
      category,
      description,
      income: type === 'income' ? numAmount : 0,
      expense: type === 'expense' ? numAmount : 0,
    });

    // Reset fields
    setDescription('');
    setAmount('');
    // Keep date/category as they might be doing batch entry
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-indigo-600" />
        {t.addTransactionTitle}
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t.date}</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
        
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t.type}</label>
          <div className="flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-l-lg border ${
                type === 'income' 
                  ? 'z-10 bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.income}
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-r-lg border-t border-b border-r ${
                type === 'expense' 
                  ? 'z-10 bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.expense}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t.category}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t.description}</label>
          <input
            type="text"
            required
            placeholder="e.g. Office Snacks"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t.amount}</label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono"
          />
        </div>

        <div className="hidden lg:block lg:col-span-6 flex justify-end">
           {/* Invisible placeholder for alignment if needed */}
        </div>
        
        <button
            type="submit"
            className="w-full lg:w-auto lg:absolute lg:right-6 lg:mt-0 mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors"
            style={{ marginTop: '0' }}
        >
            {t.addRecord}
        </button>
      </form>
    </div>
  );
};
