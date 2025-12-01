import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Transaction } from '../types';
import { TRANSLATIONS } from '../constants';

interface ChartsProps {
  transactions: Transaction[];
  t: typeof TRANSLATIONS['en'];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export const FinancialCharts: React.FC<ChartsProps> = ({ transactions, t }) => {
  // Aggregate data by category for expenses
  const expenseByCategory = transactions
    .filter(t => t.expense > 0)
    .reduce((acc, t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.expense;
      } else {
        acc.push({ name: t.category.split(' ')[0], value: t.expense, fullName: t.category });
      }
      return acc;
    }, [] as { name: string; value: number; fullName: string }[])
    .sort((a, b) => b.value - a.value);

  // Aggregate data by date (Daily Flow)
  // Simplified: grouping by date string
  const dailyFlow = transactions.reduce((acc, t) => {
    const existing = acc.find(item => item.date === t.date);
    if (existing) {
      existing.income += t.income;
      existing.expense += t.expense;
    } else {
      acc.push({ date: t.date, income: t.income, expense: t.expense });
    }
    return acc;
  }, [] as { date: string; income: number; expense: number }[])
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Expense Distribution */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 w-full text-left">{t.expenseBreakdown}</h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `HKD ${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash Flow Timeline */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.dailyCashFlow}</h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyFlow}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip formatter={(value: number) => `HKD ${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" name={t.income} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name={t.expense} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
