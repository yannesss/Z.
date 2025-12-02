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
  const rawExpenses = transactions
    .filter(t => t.expense > 0)
    .reduce((acc, t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.expense;
      } else {
        acc.push({ name: t.category, value: t.expense });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  // Group small items into "Others" if there are too many categories
  let expenseByCategory: { name: string; value: number; displayName: string }[] = [];

  if (rawExpenses.length > 6) {
    const top5 = rawExpenses.slice(0, 5).map(item => ({
      ...item,
      displayName: item.name.split(' ')[0] // Display only the main part (Chinese usually)
    }));
    
    const othersValue = rawExpenses.slice(5).reduce((sum, item) => sum + item.value, 0);
    
    expenseByCategory = [
      ...top5,
      { name: 'Others', value: othersValue, displayName: t.others }
    ];
  } else {
    expenseByCategory = rawExpenses.map(item => ({
      ...item,
      displayName: item.name.split(' ')[0]
    }));
  }

  // Aggregate data by date (Daily Flow)
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

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        {t.noRecords}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:block print:w-full">
      {/* Expense Distribution */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center print:mb-6 print:border-0 print:shadow-none print:break-inside-avoid">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 w-full text-left">{t.expenseBreakdown}</h3>
        <div className="w-full h-[300px] print:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ displayName, percent }: any) => `${displayName} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={false} // Disable animation for better printing
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
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:border-0 print:shadow-none print:break-inside-avoid">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.dailyCashFlow}</h3>
        <div className="w-full h-[300px] print:h-[400px]">
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
              <Bar dataKey="income" name={t.income} fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="expense" name={t.expense} fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};