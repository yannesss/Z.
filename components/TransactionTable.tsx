import React from 'react';
import { Transaction, SummaryStats } from '../types';
import { Trash2 } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  t: typeof TRANSLATIONS['en'];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onDelete, t }) => {
  const stats: SummaryStats = transactions.reduce(
    (acc, t) => ({
      totalIncome: acc.totalIncome + t.income,
      totalExpense: acc.totalExpense + t.expense,
      netIncome: acc.netIncome + (t.income - t.expense),
    }),
    { totalIncome: 0, totalExpense: 0, netIncome: 0 }
  );

  const formatCurrency = (val: number) => {
    // Handling negative values with parentheses for accounting style
    const absVal = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val < 0) return `(${absVal})`;
    return absVal;
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white print:border-0 print:shadow-none">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">{t.date}</th>
              <th className="px-6 py-3 whitespace-nowrap">{t.category}</th>
              <th className="px-6 py-3 min-w-[200px]">{t.description}</th>
              <th className="px-6 py-3 text-right whitespace-nowrap text-emerald-600">{t.income} (HKD)</th>
              <th className="px-6 py-3 text-right whitespace-nowrap text-rose-600">{t.expense} (HKD)</th>
              <th className="px-6 py-3 text-right whitespace-nowrap text-blue-600">{t.netIncome} (HKD)</th>
              <th className="px-4 py-3 text-center w-10 no-print"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400 italic">
                  {t.noRecords}
                </td>
              </tr>
            ) : (
              transactions.map((tItem) => (
                <tr key={tItem.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900">{tItem.date}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-600">{tItem.category}</td>
                  <td className="px-6 py-3 text-gray-600">{tItem.description}</td>
                  <td className="px-6 py-3 text-right text-gray-900">
                    {tItem.income > 0 ? formatCurrency(tItem.income) : '-'}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-900">
                    {tItem.expense > 0 ? formatCurrency(tItem.expense) : '-'}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">
                    <span className={tItem.income - tItem.expense < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {formatCurrency(tItem.income - tItem.expense)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center no-print">
                    <button
                      onClick={() => onDelete(tItem.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title={t.deleteTitle}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
            {/* Total Row */}
            <tr className="bg-yellow-50 font-bold border-t-2 border-gray-200 print:bg-gray-100">
              <td className="px-6 py-4 text-gray-900">{t.total}:</td>
              <td colSpan={2}></td>
              <td className="px-6 py-4 text-right text-emerald-700">{formatCurrency(stats.totalIncome)}</td>
              <td className="px-6 py-4 text-right text-rose-700">{formatCurrency(stats.totalExpense)}</td>
              <td className="px-6 py-4 text-right bg-yellow-300 text-gray-900 border border-yellow-400 print:bg-transparent print:border-gray-300">
                {formatCurrency(stats.netIncome)}
              </td>
              <td className="no-print"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};