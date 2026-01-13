
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, AppView, AiParsedResult, Language } from './types';
import { INITIAL_TRANSACTIONS, TRANSLATIONS } from './constants';
import { TransactionTable } from './components/TransactionTable';
import { AddTransactionForm } from './components/AddTransactionForm';
import { SmartEntry } from './components/SmartEntry';
import { FinancialCharts } from './components/Charts';
import { LayoutDashboard, Table2, TrendingUp, TrendingDown, Wallet, Languages, CalendarRange, Filter, Printer, Download, Upload, ArrowUpDown, FileSpreadsheet, Search } from 'lucide-react';

const App: React.FC = () => {
  // Initialize transactions from Local Storage to fix data persistence issue
  // UPDATED KEY to 'finreport_transactions_v20' to clear old data for the user and load NEW DATA
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const savedData = localStorage.getItem('finreport_transactions_v20');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (e) {
      console.error("Failed to load transactions from local storage", e);
    }
    return INITIAL_TRANSACTIONS;
  });

  // Save to Local Storage whenever transactions change
  useEffect(() => {
    localStorage.setItem('finreport_transactions_v20', JSON.stringify(transactions));
  }, [transactions]);

  const [view, setView] = useState<AppView>(AppView.TABLE);
  const [aiDraft, setAiDraft] = useState<AiParsedResult | null>(null);
  const [lang, setLang] = useState<Language>('zh');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to 'desc' (Newest first)
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date filter state - Defaults to Current Month
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    // Get first day of current month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    // Get last day of current month
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const fmt = (d: Date) => {
       const y = d.getFullYear();
       const m = String(d.getMonth() + 1).padStart(2, '0');
       const day = String(d.getDate()).padStart(2, '0');
       return `${y}-${m}-${day}`;
    };

    return {
      start: fmt(start),
      end: fmt(end)
    };
  });

  const t = TRANSLATIONS[lang];

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    // Generate a safer random ID that works in all contexts (including non-secure HTTP)
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    const transaction: Transaction = {
      ...newTx,
      id: newId,
    };
    // Add to list
    setTransactions(prev => [...prev, transaction]);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm(lang === 'zh' ? '確定要刪除此記錄嗎？' : 'Are you sure you want to delete this record?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `finreport_data_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    // BOM for UTF-8 in Excel
    const BOM = "\uFEFF";
    const headers = [t.date, t.category, t.description, t.income, t.expense, t.netIncome];
    
    // Sort transactions by date (desc) for export or match current filter?
    // Let's use filtered transactions to respect user's view
    const csvRows = filteredTransactions.map(tx => {
      // Escape quotes in description and category
      const safeDesc = `"${tx.description.replace(/"/g, '""')}"`;
      const safeCat = `"${tx.category.replace(/"/g, '""')}"`;
      const net = tx.income - tx.expense;
      return [
        tx.date,
        safeCat,
        safeDesc,
        tx.income.toFixed(2),
        tx.expense.toFixed(2),
        net.toFixed(2)
      ].join(",");
    });

    const csvContent = BOM + headers.join(",") + "\n" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `finreport_export_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (window.confirm(t.restoreConfirm)) {
             setTransactions(parsed);
             // CRITICAL FIX: Clear the date range filter immediately after import.
             // This ensures imported data from other months is visible immediately.
             setDateRange({ start: '', end: '' });
             alert(t.importSuccess);
          }
        } else {
           // Allow empty array imports if someone wants to clear data, or handle error
           if(Array.isArray(parsed) && parsed.length === 0) {
              if (window.confirm(t.restoreConfirm)) {
                setTransactions([]);
                setDateRange({ start: '', end: '' });
                alert(t.importSuccess);
             }
           } else {
             alert(t.importError);
           }
        }
      } catch (err) {
        console.error(err);
        alert(t.importError);
      }
    };
    reader.readAsText(file);
    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  // Filter and Sort transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      const tDate = new Date(t.date);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;

      if (start && tDate < start) return false;
      if (end && tDate > end) return false;
      
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(term);
        const matchesCat = t.category.toLowerCase().includes(term);
        if (!matchesDesc && !matchesCat) return false;
      }
      
      return true;
    });

    // Apply Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [transactions, dateRange, sortOrder, searchTerm]);

  // Summary Cards logic (based on filtered data)
  const summary = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => ({
      income: acc.income + t.income,
      expense: acc.expense + t.expense,
      net: acc.income + t.income - (acc.expense + t.expense)
    }), { income: 0, expense: 0, net: 0 });
  }, [filteredTransactions]);

  // Get current date/time for footer
  const printDate = new Date().toLocaleString(lang === 'zh' ? 'zh-HK' : 'en-HK');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20 print:pb-0 print:bg-white relative">
      
      {/* Print Only Header */}
      <div className="print-only mb-4 text-center border-b pb-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.printHeader}</h1>
        {dateRange.start && dateRange.end && (
          <p className="text-gray-600 text-sm">
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
            {/* Data Management Controls */}
            <div className="flex items-center mr-2 border-r border-gray-200 pr-2 gap-1">
               <button
                onClick={handleExportCSV}
                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                title={t.exportExcel}
              >
                <FileSpreadsheet className="w-5 h-5" />
              </button>
              <button
                onClick={handleExportData}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                title={t.backup}
              >
                <Download className="w-5 h-5" />
              </button>
              <label className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer" title={t.restore}>
                <Upload className="w-5 h-5" />
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>

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
        
        {/* Top Summary Metrics - Always visible to show current status */}
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

        {/* Smart Entry - Hide in print */}
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

        {/* Date Filter Bar - Moved below input forms as requested, above report */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex flex-wrap items-center gap-4 no-print">
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
          
          {/* Search Bar */}
          <div className="flex items-center gap-2 ml-auto lg:ml-4 w-full lg:w-auto relative">
             <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder={t.search}
               className="w-full lg:w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
             />
          </div>

          {(dateRange.start || dateRange.end || searchTerm) && (
             <button 
               onClick={() => {
                 setDateRange({ start: '', end: '' });
                 setSearchTerm('');
               }}
               className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-2 whitespace-nowrap"
             >
               {t.clearFilter}
             </button>
          )}
        </div>

        {/* Main Content Area - Render BOTH but toggle visibility */}
        {/* Table View */}
        <div className={view === AppView.TABLE ? 'block' : 'hidden print:block'}>
           <div className="flex justify-between items-center mb-4 no-print">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">{t.monthlyLedger}</h2>
                <button
                  onClick={toggleSortOrder}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors border border-gray-200"
                  title={t.sortDate}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  {sortOrder === 'asc' ? t.sortAsc : t.sortDesc}
                </button>
              </div>
              {dateRange.start && dateRange.end && (
                 <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1">
                   <CalendarRange className="w-3 h-3" />
                   {dateRange.start} - {dateRange.end}
                 </span>
              )}
            </div>
            <TransactionTable 
              transactions={filteredTransactions} 
              onDelete={handleDeleteTransaction}
              t={t} 
            />
        </div>

        {/* Analysis/Charts View */}
        {/* Force page break before charts in print mode */}
        <div className={`print:break-before-page ${view === AppView.DASHBOARD ? 'block' : 'hidden print:block'}`}>
           <h2 className="hidden print:block text-xl font-bold mb-4 mt-8">{t.analysis}</h2>
           <FinancialCharts transactions={filteredTransactions} t={t} />
        </div>

      </main>

      {/* Print Footer */}
      <footer className="hidden print:block fixed bottom-2 right-4 text-right text-gray-400 text-[10px]">
        <p>{printDate}</p>
        <p>Website Author: Z.</p>
      </footer>
    </div>
  );
};

export default App;
