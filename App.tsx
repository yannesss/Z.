import React, { useState, useMemo } from 'react';
import { Transaction, AppView, AiParsedResult, Language } from './types';
import { INITIAL_TRANSACTIONS, TRANSLATIONS } from './constants';
import { TransactionTable } from './components/TransactionTable';
import { AddTransactionForm } from './components/AddTransactionForm';
import { SmartEntry } from './components/SmartEntry';
import { FinancialCharts } from './components/Charts';
import { LayoutDashboard, Table2, TrendingUp, TrendingDown, Wallet, Languages, CalendarRange, Filter, Printer } from 'lucide-react';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [view, setView] = useState<AppView>(AppView.TABLE);
  const [aiDraft, setAiDraft] = useState<AiParsedResult | null>(null);
  const [lang, setLang] = useState<Language>('zh');
  
  // Date filter state
  const [dateRange, setDateRange] = useState({
    start: '2025-09-01',
    end: '2025-10-31'
  });

  const t = TRANSLATIONS[lang];

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: crypto.randomUUID(),
    };
    // Sort by date descending when adding
    setTransactions(prev => [...prev, transaction].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm(lang === 'zh' ? '確定要刪除此記錄嗎？' : 'Are you sure you want to delete this record?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;

      if (start && tDate < start) return false;
      if (end && tDate > end) return false;
      return true;
    });
  }, [transactions, dateRange]);

  // Summary Cards logic (based on filtered data)
  const summary = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => ({
      income: acc.income + t.income,
      expense: acc.expense + t.expense,
      net: acc.income + t.income - (acc.expense + t.expense)
    }), { income: 0, expense: 0, net: 0 });
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20 print:pb-0 print:bg-white">
      
      {/* Print Only Header */}
      <div className="print-only mb-8 text-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.printHeader}</h1>
        {dateRange.start && dateRange.end && (
          <p className="text-gray-600">
             {t.period}: {dateRange.start} - {dateRange.end}
          </p>
        )}
      </div>

      {/* Screen Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              F
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {t.appTitle}<span className="text-indigo-600">Pro</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors mr-2 border border-emerald-200"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{t.exportPDF}</span>
            </button>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors mr-2"
            >
              <Languages className="w-4 h-4" />
              {lang === 'en' ? '中文' : 'English'}
            </button>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setView(AppView.TABLE)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === AppView.TABLE ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Table2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t.report}</span>
              </button>
              <button
                onClick={() => setView(AppView.DASHBOARD)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === AppView.DASHBOARD ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">{t.analysis}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Date Filter Bar - Hide in print */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap items-center gap-4 no-print">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>{t.filter}:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">{t.startDate}</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="text-gray-400">-</div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">{t.endDate}</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
             <button 
               onClick={() => setDateRange({ start: '', end: '' })}
               className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-2"
             >
               {t.clearFilter}
             </button>
          )}
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-4 print:mb-4">
          <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between print:border-gray-200">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t.totalIncome}</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                HKD {summary.income.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center print:hidden">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between print:border-gray-200">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t.totalExpense}</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                HKD {summary.expense.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center print:hidden">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className={`bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between print:border-gray-200 ${summary.net >= 0 ? 'border-indigo-100' : 'border-orange-100'}`}>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t.netIncome}</p>
              <p className={`text-2xl font-bold mt-1 ${summary.net >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                HKD {summary.net.toLocaleString()}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center print:hidden ${summary.net >= 0 ? 'bg-indigo-50' : 'bg-orange-50'}`}>
              <Wallet className={`w-5 h-5 ${summary.net >= 0 ? 'text-indigo-600' : 'text-orange-600'}`} />
            </div>
          </div>
        </div>

        {/* Gemini Smart Entry - Hide in print */}
        <div className="no-print">
          <SmartEntry onParsed={setAiDraft} t={t} />
        </div>

        {/* Manual Entry Form - Hide in print */}
        <div className="no-print">
          <AddTransactionForm 
            onAdd={handleAddTransaction} 
            aiDraft={aiDraft} 
            onClearDraft={() => setAiDraft(null)}
            t={t}
          />
        </div>

        {/* Main Content Area */}
        {view === AppView.TABLE ? (
          <>
            <div className="flex justify-between items-center mb-4 no-print">
              <h2 className="text-lg font-semibold text-gray-800">{t.monthlyLedger}</h2>
              {dateRange.start && dateRange.end && (
                 <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1">
                   <CalendarRange className="w-3 h-3" />
                   {dateRange.start} - {dateRange.end}
                 </span>
              )}
            </div>
            <TransactionTable transactions={filteredTransactions} onDelete={handleDeleteTransaction} t={t} />
          </>
        ) : (
          <FinancialCharts transactions={filteredTransactions} t={t} />
        )}
      </main>
    </div>
  );
};

export default App;