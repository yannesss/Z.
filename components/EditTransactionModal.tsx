import React, { useState, useEffect } from 'react';
import { CATEGORIES, CATEGORY_GROUPS, TRANSLATIONS } from '../constants';
import { Transaction, StoreType } from '../types';
import { X } from 'lucide-react';

interface EditTransactionModalProps {
  transaction: Transaction;
  onUpdate: (id: string, data: Partial<Transaction>) => void;
  onClose: () => void;
  t: typeof TRANSLATIONS['en'];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onUpdate, onClose, t }) => {
  const [date, setDate] = useState(transaction.date);
  const [category, setCategory] = useState(transaction.category);
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState<string>(
    transaction.income > 0 ? transaction.income.toString() : transaction.expense.toString()
  );
  const [type, setType] = useState<'income' | 'expense'>(
    transaction.income > 0 ? 'income' : 'expense'
  );
  const [store, setStore] = useState<StoreType>(transaction.store);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) return;

    onUpdate(transaction.id, {
      date,
      category,
      description,
      income: type === 'income' ? numAmount : 0,
      expense: type === 'expense' ? numAmount : 0,
      store,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t.editTitle}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.store}</label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value as StoreType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="main">{t.storeMain}</option>
                <option value="branch">{t.storeBranch}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.type}</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
                    type === 'expense'
                      ? 'bg-rose-50 border-rose-200 text-rose-700 z-10'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.expense}
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border-y border-r border-l-0 ${
                    type === 'income'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 z-10'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.income}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.amount}</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.category}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => (
                <optgroup key={groupName} label={groupName}>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t.update}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
