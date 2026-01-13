

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16'];

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
  
  const totalExpense = rawExpenses.reduce((sum, item) => sum + item.value, 0);

  // Group small items into "Others" if there are too many categories for the chart
  let expenseByCategory: { name: string; value: number; displayName: string }[] = [];

  if (rawExpenses.length > 8) {
    const top7 = rawExpenses.slice(0, 7).map(item => ({
      ...item,
      displayName: item.name.split(' ')[0] // Display only the main part (Chinese usually)
    }));
    
    const othersValue = rawExpenses.slice(7).reduce((sum, item) => sum + item.value, 0);
    
    expenseByCategory = [
      ...top7,
      { name: 'Others', value: othersValue, displayName: t.others }
    ];
  } else {
    expenseByCategory = rawExpenses.map(item => ({
      ...item,
      displayName: item.name.split(' ')[0]
    }));
  }

  // Calculate detailed breakdown for list (Use all raw expenses, do not group)
  const detailedBreakdown = rawExpenses.map(item => ({
      ...item,
      percent: totalExpense > 0 ? (item.value / totalExpense) * 100 : 0
  }));

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:grid print:grid-cols-2 print:gap-4 print:w-full">
      {/* Expense Distribution */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center print:border-0 print:shadow-none print:break-inside-avoid print:p-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 w-full text-left">{t.expenseBreakdown}</h3>
        
        {/* Chart */}
        <div className="w-full h-[300px] print:h-[250px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ displayName, percent }: any) => `${displayName} ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
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

        {/* Detailed List */}
        <div className="w-full overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                    <tr>
                        <th className="px-3 py-2">{t.category}</th>
                        <th className="px-3 py-2 text-right">{t.amount}</th>
                        <th className="px-3 py-2 text-right">{t.percentage}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {detailedBreakdown.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 flex items-center gap-2">
                                <span 
                                    className="w-2.5 h-2.5 rounded-full block" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] || '#ccc' }}
                                ></span>
                                <span className="truncate max-w-[120px]" title={item.name}>{item.name.split(' ')[0]}</span>
                            </td>
                            <td className="px-3 py-2 text-right text-gray-900">
                                ${item.value.toLocaleString()}
                            </td>
                             <td className="px-3 py-2 text-right text-gray-500">
                                {item.percent.toFixed(1)}%
                            </td>
                        </tr>
                    ))}
                    <tr className="border-t-2 border-gray-100 font-semibold bg-gray-50">
                        <td className="px-3 py-2">{t.total}</td>
                        <td className="px-3 py-2 text-right">${totalExpense.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">100.0%</td>
                    </tr>
                </tbody>
             </table>
        </div>

      </div>

      {/* Cash Flow Timeline */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:border-0 print:shadow-none print:break-inside-avoid print:p-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.dailyCashFlow}</h3>
        <div className="w-full h-[300px] print:h-[300px]">
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