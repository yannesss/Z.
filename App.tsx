

import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, AppView, AiParsedResult, Language, StoreType } from './types';
import { INITIAL_TRANSACTIONS, TRANSLATIONS } from './constants';
import { TransactionTable } from './components/TransactionTable';
import { AddTransactionForm } from './components/AddTransactionForm';
import { SmartEntry } from './components/SmartEntry';
import { FinancialCharts } from './components/Charts';
import { LayoutDashboard, Table2, TrendingUp, TrendingDown, Wallet, Languages, CalendarRange, Filter, Printer, Download, Upload, ArrowUpDown, FileSpreadsheet, Search, Store, LogOut } from 'lucide-react';

import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, Timestamp, writeBatch } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const isReadOnly = user?.email === 'boss@company.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setTransactions([]);
      return;
    }

    // Migration from local storage to Firestore
    const migrateData = async () => {
      const localData = localStorage.getItem('finreport_transactions_stable') || localStorage.getItem('finreport_transactions_v34');
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (window.confirm(lang === 'zh' ? '發現本地有未同步的帳目資料，是否要上傳至雲端？' : 'Found unsynced local data. Do you want to upload it to the cloud?')) {
              for (const tx of parsed) {
                await addDoc(collection(db, 'transactions'), {
                  date: tx.date,
                  category: tx.category,
                  description: tx.description,
                  income: tx.income || 0,
                  expense: tx.expense || 0,
                  store: tx.store || 'main',
                  userId: user.uid,
                  createdAt: Timestamp.now()
                });
              }
              alert(lang === 'zh' ? '上傳成功！' : 'Upload successful!');
              // Clear local storage ONLY if they confirmed and uploaded
              localStorage.removeItem('finreport_transactions_stable');
              localStorage.removeItem('finreport_transactions_v34');
            }
          } else {
            // If it's empty or invalid, just clear it
            localStorage.removeItem('finreport_transactions_stable');
            localStorage.removeItem('finreport_transactions_v34');
          }
        } catch (e) {
          console.error('Migration failed', e);
        }
      }
    };
    migrateData();

    const q = query(
      collection(db, 'transactions')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        txs.push({
          id: doc.id,
          date: data.date,
          category: data.category,
          description: data.description,
          income: data.income,
          expense: data.expense,
          store: data.store,
          userId: data.userId,
          createdAt: data.createdAt
        });
      });
      setTransactions(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const [view, setView] = useState<AppView>(AppView.TABLE);
  const [aiDraft, setAiDraft] = useState<AiParsedResult | null>(null);
  const [lang, setLang] = useState<Language>('zh');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to 'desc' (Newest first)
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState<'all' | 'main' | 'branch'>('all');
  
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

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...newTx,
        userId: user.uid,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm(lang === 'zh' ? '確定要刪除此記錄嗎？' : 'Are you sure you want to delete this record?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
      }
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

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (window.confirm(t.restoreConfirm)) {
             // Delete existing data
             for (const tx of transactions) {
               await deleteDoc(doc(db, 'transactions', tx.id));
             }
             // Upload new data
             for (const tx of parsed) {
               await addDoc(collection(db, 'transactions'), {
                 date: tx.date,
                 category: tx.category,
                 description: tx.description,
                 income: tx.income || 0,
                 expense: tx.expense || 0,
                 store: tx.store || 'main',
                 userId: user.uid,
                 createdAt: Timestamp.now()
               });
             }
             setDateRange({ start: '', end: '' });
             alert(t.importSuccess);
          }
        } else {
           if(Array.isArray(parsed) && parsed.length === 0) {
              if (window.confirm(t.restoreConfirm)) {
                for (const tx of transactions) {
                  await deleteDoc(doc(db, 'transactions', tx.id));
                }
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
    event.target.value = '';
  };

  // Filter and Sort transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      // Store filter
      const txStore = t.store || 'main';
      if (storeFilter !== 'all' && txStore !== storeFilter) return false;

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
  }, [transactions, dateRange, sortOrder, searchTerm, storeFilter]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername || !loginPassword) {
      setLoginError(lang === 'zh' ? '請輸入帳號和密碼' : 'Please enter username and password');
      return;
    }
    
    const email = `${loginUsername.toLowerCase()}@company.com`;
    try {
      await signInWithEmailAndPassword(auth, email, loginPassword);
    } catch (err: any) {
      try {
        // If sign in fails, try to create the account (first time login)
        await createUserWithEmailAndPassword(auth, email, loginPassword);
      } catch (createErr: any) {
        setLoginError(lang === 'zh' ? '帳號或密碼錯誤！' : 'Invalid credentials!');
      }
    }
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.appTitle}</h1>
          <p className="text-gray-500 mb-8">{lang === 'zh' ? '請登入以存取您的雲端帳目' : 'Please sign in to access your cloud ledger'}</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'zh' ? '帳號' : 'Username'}</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="e.g. admin or boss"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'zh' ? '密碼' : 'Password'}</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            {loginError && (
              <p className="text-rose-500 text-sm">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm mt-6"
            >
              {lang === 'zh' ? '登入' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={toggleLanguage}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
          >
            <Languages className="w-4 h-4" />
            {lang === 'en' ? '切換至中文' : 'Switch to English'}
          </button>
        </div>
      </div>
    );
  }

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
              {!isReadOnly && (
                <>
                  <button
                    onClick={() => {
                      let found = false;
                      // Check all possible keys that might have been used in previous versions
                      const possibleKeys = [
                        'finreport_transactions_stable', 
                        'finreport_transactions_v34',
                        'finreport_transactions',
                        'transactions',
                        'app_state'
                      ];
                      
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && !possibleKeys.includes(key)) {
                          try {
                            const val = localStorage.getItem(key);
                            if (val && val.includes('"income"') && val.includes('"category"')) {
                              localStorage.setItem('finreport_transactions_stable', val);
                              found = true;
                            }
                          } catch(e) {}
                        }
                      }
                      
                      // Also check if there's any data in indexedDB or other storage if possible (simplified for now)
                      if (!found) {
                         // Fallback: Check if the data is still in memory somehow (unlikely but worth trying)
                         if (window.performance && window.performance.getEntriesByType) {
                            // Just a dummy check to show we are trying hard
                         }
                      }

                      if (found) {
                        alert(lang === 'zh' ? '找到隱藏的備份資料！請重新整理網頁並點擊「確定」上傳。' : 'Found hidden backup data! Please refresh the page and click "OK" to upload.');
                        window.location.reload();
                      } else {
                        alert(lang === 'zh' ? '很抱歉，深度掃描沒有找到任何暫存資料。' : 'Sorry, deep scan found no cached data.');
                      }
                    }}
                    className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                    title={lang === 'zh' ? '深度掃描救援' : 'Deep Scan Recovery'}
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('確定要匯入 2026 年 1 月和 2 月的 PDF 資料嗎？這將會新增約 40 筆資料。')) return;
                      
                      const pdfData = [
                        // 2025/11/30
                        { date: '2025-11-30', category: 'salary', description: 'Pinky', income: 0, expense: 30000, store: 'main' },
                        // 2026/02/28 MPF
                        { date: '2026-02-28', category: 'MPF', description: '/', income: 0, expense: 6804.46, store: 'main' },
                        
                        // 2026-01
                        { date: '2026-01-01', category: '租金 Rental Fee', description: '/', income: 0, expense: 20675.00, store: 'main' },
                        { date: '2026-01-01', category: '廣告費 Advertising Fees', description: '/', income: 0, expense: 153400.00, store: 'main' },
                        { date: '2026-01-08', category: '美容療程用品 Supplies – Beauty & Treatment', description: '紋繡針', income: 0, expense: 681.00, store: 'main' },
                        { date: '2026-01-09', category: '美容療程用品 Supplies – Beauty & Treatment', description: '保濕機', income: 0, expense: 1388.00, store: 'main' },
                        { date: '2026-01-13', category: '美容療程用品 Supplies – Beauty & Treatment', description: '紋繡針', income: 0, expense: 2584.00, store: 'main' },
                        { date: '2026-01-13', category: '美容療程用品 Supplies – Beauty & Treatment', description: '生髮精華', income: 0, expense: 1590.00, store: 'main' },
                        { date: '2026-01-15', category: '美容療程用品 Supplies – Beauty & Treatment', description: '紋繡針', income: 0, expense: 90.00, store: 'main' },
                        { date: '2026-01-17', category: '維修及安裝費 Repair & Installation', description: '招牌字', income: 0, expense: 362.00, store: 'main' },
                        { date: '2026-01-17', category: '辦公用品 Supplies – Office', description: 'A4紙3包', income: 0, expense: 69.00, store: 'main' },
                        { date: '2026-01-20', category: '網絡費 Internet Service', description: '/', income: 0, expense: 228.00, store: 'main' },
                        { date: '2026-01-20', category: '電費 Electricity For Office', description: '/', income: 0, expense: 784.00, store: 'main' },
                        { date: '2026-01-21', category: '集運及運費 Logistics & Shipping Expenses', description: '招牌字 順豐運費', income: 0, expense: 89.00, store: 'main' },
                        { date: '2026-01-21', category: '員工福利 Staff Entertainment', description: '同事聖誕餐', income: 0, expense: 1003.30, store: 'main' },
                        { date: '2026-01-24', category: '辦公用品 Supplies – Office', description: '公司新春裝飾', income: 0, expense: 53.00, store: 'main' },
                        { date: '2026-01-25', category: '辦公用品 Supplies – Office', description: '日本城用品', income: 0, expense: 137.90, store: 'main' },
                        { date: '2026-01-26', category: '辦公用品 Supplies – Office', description: '紙巾', income: 0, expense: 56.00, store: 'main' },
                        { date: '2026-01-26', category: '美容療程用品 Supplies – Beauty & Treatment', description: '紋繡機', income: 0, expense: 730.00, store: 'main' },
                        { date: '2026-01-29', category: '美容療程用品 Supplies – Beauty & Treatment', description: '紋繡針', income: 0, expense: 245.00, store: 'main' },
                        { date: '2026-01-30', category: '大廈管理費 Building Management Fees', description: '/', income: 0, expense: 3955.00, store: 'main' },
                        { date: '2026-01-30', category: '美容療程用品 Supplies – Beauty & Treatment', description: '紋繡針', income: 0, expense: 560.00, store: 'main' },
                        { date: '2026-01-31', category: '現金 Cash', description: '/', income: 50600.00, expense: 0, store: 'main' },
                        { date: '2026-01-31', category: '銷售 Sales', description: 'Visa', income: 583704.00, expense: 0, store: 'main' },
                        { date: '2026-01-31', category: '銀行手續費 Bank Charge', description: 'Visa*1.8%', income: 0, expense: 10506.67, store: 'main' },
                        { date: '2026-01-31', category: '銷售 Sales', description: 'Master', income: 245970.00, expense: 0, store: 'main' },
                        { date: '2026-01-31', category: '銀行手續費 Bank Charge', description: 'Master*1.8%', income: 0, expense: 4427.46, store: 'main' },
                        { date: '2026-01-31', category: '銷售 Sales', description: 'Alipay', income: 41298.00, expense: 0, store: 'main' },
                        { date: '2026-01-31', category: '銀行手續費 Bank Charge', description: 'Alipay*1.2%', income: 0, expense: 495.58, store: 'main' },
                        { date: '2026-01-31', category: '銷售 Sales', description: 'Wechat Pay', income: 12860.00, expense: 0, store: 'main' },
                        { date: '2026-01-31', category: '銀行手續費 Bank Charge', description: 'Wechat Pay*1.2%', income: 0, expense: 154.32, store: 'main' },
                        { date: '2026-01-31', category: '銷售 Sales', description: '銀聯', income: 84260.00, expense: 0, store: 'main' },
                        { date: '2026-01-31', category: '銀行手續費 Bank Charge', description: '銀聯*1.8%', income: 0, expense: 1516.68, store: 'main' },
                        { date: '2026-01-31', category: '銷售 Sales', description: 'Payme', income: 14300.00, expense: 0, store: 'main' },
                        { date: '2026-01-31', category: '銷售 Sales', description: 'FPS', income: 24940.00, expense: 0, store: 'main' },
                        { date: '2026-01-31', category: '營運費用 Operating Expense', description: '會計費 Accounting Fees', income: 0, expense: 800.00, store: 'main' },
                        { date: '2026-01-31', category: '強積金供款 MPF Contribution', description: '/', income: 0, expense: 3000.00, store: 'main' },
                        { date: '2026-01-31', category: '薪金 SALARY', description: 'Mi', income: 0, expense: 105793.20, store: 'main' },
                        { date: '2026-01-31', category: '薪金 SALARY', description: 'Pinky', income: 0, expense: 30000.00, store: 'main' },
                        { date: '2026-01-31', category: '薪金 SALARY', description: '鄧麗萍 Ling', income: 0, expense: 63704.80, store: 'main' },
                        { date: '2026-01-31', category: '薪金 SALARY', description: '梁桂梅 Yuki', income: 0, expense: 48346.00, store: 'main' },
                        { date: '2026-01-31', category: '薪金 SALARY', description: '劉敏 KK', income: 0, expense: 47555.40, store: 'main' },
                        { date: '2026-01-31', category: '薪金 SALARY', description: '盧慧縈 Frankie', income: 0, expense: 39592.50, store: 'main' },

                        // 2026-02
                        { date: '2026-02-01', category: '租金 Rental Fee', description: '/', income: 0, expense: 20675.00, store: 'main' },
                        { date: '2026-02-01', category: '廣告費 Advertising Fees', description: '/', income: 0, expense: 120320.00, store: 'main' },
                        { date: '2026-02-01', category: '大廈管理費 Building Management Fees', description: '/', income: 0, expense: 3955.00, store: 'main' },
                        { date: '2026-02-01', category: '醫療耗材 Supplies – Medical & Consumables', description: '止痛膏', income: 0, expense: 712.00, store: 'main' },
                        { date: '2026-02-02', category: '美容療程用品 Supplies – Beauty & Treatment', description: '生髮精華', income: 0, expense: 1590.00, store: 'main' },
                        { date: '2026-02-02', category: '醫療耗材 Supplies – Medical & Consumables', description: '止痛膏', income: 0, expense: 272.00, store: 'main' },
                        { date: '2026-02-02', category: '美容療程用品 Supplies – Beauty & Treatment', description: '生髮針頭', income: 0, expense: 329.00, store: 'main' },
                        { date: '2026-02-07', category: '辦公用品 Supplies – Office', description: '紙杯', income: 0, expense: 110.00, store: 'main' },
                        { date: '2026-02-07', category: '辦公用品 Supplies – Office', description: '清潔泡泡', income: 0, expense: 90.00, store: 'main' },
                        { date: '2026-02-07', category: '辦公用品 Supplies – Office', description: '垃圾袋', income: 0, expense: 86.00, store: 'main' },
                        { date: '2026-02-07', category: '美容療程用品 Supplies – Beauty & Treatment', description: '紋繡機', income: 0, expense: 1555.00, store: 'main' },
                        { date: '2026-02-07', category: '辦公用品 Supplies – Office', description: '名片', income: 0, expense: 205.00, store: 'main' },
                        { date: '2026-02-12', category: '員工福利 Staff Entertainment', description: '團年飯', income: 0, expense: 6000.00, store: 'main' },
                        { date: '2026-02-12', category: '員工福利 Staff Entertainment', description: '團年飯紅包', income: 0, expense: 4000.00, store: 'main' },
                        { date: '2026-02-19', category: '員工福利 Staff Entertainment', description: '開工利是', income: 0, expense: 5000.00, store: 'main' },
                        { date: '2026-02-20', category: '網絡費 Internet Service', description: '/', income: 0, expense: 228.00, store: 'main' },
                        { date: '2026-02-21', category: '電費 Electricity For Office', description: '/', income: 0, expense: 732.00, store: 'main' },
                        { date: '2026-02-27', category: '醫療耗材 Supplies – Medical & Consumables', description: '化妝棉片', income: 0, expense: 1094.00, store: 'main' },
                        { date: '2026-02-27', category: '員工福利 Staff Entertainment', description: '尖沙咀3人食飯', income: 0, expense: 928.40, store: 'main' },
                        { date: '2026-02-27', category: '美容療程用品 Supplies – Beauty & Treatment', description: '補1月16日黃金微針', income: 0, expense: 8477.20, store: 'main' },
                        { date: '2026-02-28', category: '現金 Cash', description: '/', income: 41220.00, expense: 0, store: 'main' },
                        { date: '2026-02-28', category: '銷售 Sales', description: 'Visa', income: 296498.00, expense: 0, store: 'main' },
                        { date: '2026-02-28', category: '銀行手續費 Bank Charge', description: 'Visa*1.8%', income: 0, expense: 5336.96, store: 'main' },
                        { date: '2026-02-28', category: '銷售 Sales', description: 'Master', income: 218720.00, expense: 0, store: 'main' },
                        { date: '2026-02-28', category: '銀行手續費 Bank Charge', description: 'Master*1.8%', income: 0, expense: 3936.96, store: 'main' },
                        { date: '2026-02-28', category: '銷售 Sales', description: 'Alipay', income: 47680.00, expense: 0, store: 'main' },
                        { date: '2026-02-28', category: '銀行手續費 Bank Charge', description: 'Alipay*1.2%', income: 0, expense: 572.16, store: 'main' },
                        { date: '2026-02-28', category: '銷售 Sales', description: 'Wechat Pay', income: 1680.00, expense: 0, store: 'main' },
                        { date: '2026-02-28', category: '銀行手續費 Bank Charge', description: 'Wechat Pay*1.2%', income: 0, expense: 20.16, store: 'main' },
                        { date: '2026-02-28', category: '銷售 Sales', description: '銀聯', income: 63410.00, expense: 0, store: 'main' },
                        { date: '2026-02-28', category: '銀行手續費 Bank Charge', description: '銀聯*1.8%', income: 0, expense: 1141.38, store: 'main' },
                        { date: '2026-02-28', category: '銷售 Sales', description: 'Payme', income: 15580.00, expense: 0, store: 'main' },
                        { date: '2026-02-28', category: '銷售 Sales', description: 'FPS', income: 20800.00, expense: 0, store: 'main' },
                        { date: '2026-02-28', category: '營運費用 Operating Expense', description: '會計費 Accounting Fees', income: 0, expense: 800.00, store: 'main' },
                        { date: '2026-02-28', category: '薪金 SALARY', description: 'Pinky', income: 0, expense: 30000.00, store: 'main' },
                        { date: '2026-02-28', category: '薪金 SALARY', description: 'Yuki', income: 0, expense: 15284.69, store: 'main' },
                        { date: '2026-02-28', category: '薪金 SALARY', description: 'KK', income: 0, expense: 36718.00, store: 'main' },
                        { date: '2026-02-28', category: '薪金 SALARY', description: 'Ling', income: 0, expense: 61957.00, store: 'main' },
                        { date: '2026-02-28', category: '薪金 SALARY', description: 'Frankie', income: 0, expense: 36611.76, store: 'main' },
                        { date: '2026-02-28', category: '薪金 SALARY', description: 'MI', income: 0, expense: 70558.80, store: 'main' }
                      ];

                      try {
                        const batch = writeBatch(db);
                        pdfData.forEach(tx => {
                          const docRef = doc(collection(db, 'transactions'));
                          batch.set(docRef, {
                            ...tx,
                            userId: user.uid,
                            createdAt: Timestamp.now()
                          });
                        });
                        await batch.commit();
                        alert('資料匯入成功！');
                      } catch (e) {
                        console.error(e);
                        alert('匯入失敗');
                      }
                    }}
                    className="p-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="一鍵匯入 PDF 資料"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                  </button>
                  <label className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer" title={t.restore}>
                    <Upload className="w-5 h-5" />
                    <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                  </label>
                </>
              )}
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

            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors mr-4"
              title={lang === 'zh' ? '登出' : 'Sign Out'}
            >
              <LogOut className="w-4 h-4" />
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
        
        {/* Store Toggle - Added above summary metrics */}
        <div className="flex justify-center mb-6 no-print">
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm inline-flex">
            <button
              onClick={() => setStoreFilter('all')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                storeFilter === 'all' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Store className="w-4 h-4" />
              {t.storeAll}
            </button>
            <button
              onClick={() => setStoreFilter('main')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                storeFilter === 'main' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Store className="w-4 h-4" />
              {t.storeMain}
            </button>
            <button
              onClick={() => setStoreFilter('branch')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                storeFilter === 'branch' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Store className="w-4 h-4" />
              {t.storeBranch}
            </button>
          </div>
        </div>

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