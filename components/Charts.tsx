
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

  // Group small items into "Others" if there are too many categories for the chart visualization
  let expenseByCategory: { name: string; value: number; displayName: string }[] = [];

  if (rawExpenses.length > 8) {
    const top7 = rawExpenses.slice(0, 7).map(item => ({
      ...item,
      displayName: item.name.split(' ')[0] 
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

  // Calculate detailed breakdown for list (Use all raw expenses)
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
    <div className="flex flex-col gap-8 mb-8">
      {/* Expense Distribution Card - Full Width */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:border-0 print:shadow-none print:break-inside-avoid print:p-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">{t.expenseBreakdown}</h3>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Donut Chart Section */}
          <div className="w-full md:w-5/12 h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false} // Cleaner look without lines
                  outerRadius={110}
                  innerRadius={75} // Donut style
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `HKD ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm text-gray-500 font-medium">{t.total}</span>
              <span className="text-xl font-bold text-gray-800">${totalExpense.toLocaleString()}</span>
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="w-full md:w-7/12 overflow-x-auto">
             <div className="max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
               <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0 z-10">
                      <tr>
                          <th className="px-3 py-2 rounded-l-md">{t.category}</th>
                          <th className="px-3 py-2 text-right">{t.amount}</th>
                          <th className="px-3 py-2 text-right rounded-r-md">{t.percentage}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {detailedBreakdown.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-2.5 flex items-center gap-2.5">
                                  <span 
                                      className="w-3 h-3 rounded-full flex-shrink-0" 
                                      style={{ backgroundColor: COLORS[index % COLORS.length] || '#ccc' }}
                                  ></span>
                                  <span className="font-medium text-gray-700">{item.name}</span>
                              </td>
                              <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums">
                                  ${item.value.toLocaleString()}
                              </td>
                               <td className="px-3 py-2.5 text-right font-medium text-gray-800 tabular-nums">
                                  {item.percent.toFixed(1)}%
                              </td>
                          </tr>
                      ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Timeline - Full Width */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:border-0 print:shadow-none print:break-inside-avoid print:p-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">{t.dailyCashFlow}</h3>
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyFlow}
              margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 12, fill: '#6b7280'}} 
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis 
                tick={{fontSize: 12, fill: '#6b7280'}} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value/1000}k`}
              />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                formatter={(value: number) => `HKD ${value.toLocaleString()}`}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              <Bar dataKey="income" name={t.income} fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} barSize={20} />
              <Bar dataKey="expense" name={t.expense} fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={false} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
