import { Transaction } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: '2025-09-30',
    category: '薪金 SALARY',
    description: 'Pinky',
    income: 0,
    expense: 30000.00
  },
  {
    id: '2',
    date: '2025-09-30',
    category: '薪金 SALARY',
    description: 'Mi',
    income: 0,
    expense: 63120.00
  },
  {
    id: '3',
    date: '2025-09-30',
    category: '薪金 SALARY',
    description: 'KK',
    income: 0,
    expense: 40285.29
  },
  {
    id: '4',
    date: '2025-10-01',
    category: '租金 Rental Fee',
    description: 'October Office Rent',
    income: 0,
    expense: 25000.00
  },
  {
    id: '5',
    date: '2025-10-02',
    category: '銷售 Sales',
    description: 'Client Project A - Deposit',
    income: 45000.00,
    expense: 0
  },
  {
    id: '6',
    date: '2025-10-03',
    category: '公司用品 Supplies',
    description: '紋繡針 Tattoo Needles',
    income: 0,
    expense: 1200.50
  },
  {
    id: '7',
    date: '2025-10-05',
    category: '銀行手續費 Bank Charge',
    description: 'Visa*1.8%',
    income: 0,
    expense: 230.00
  }
];

export const CATEGORIES = [
  '租金 Rental Fee',
  '廣告費 Advertising Fees',
  '電費 Electricity For Office',
  '公司用品 Supplies Expenses',
  '管理費 Management Fees',
  '網絡費 Internet Service',
  '現金 Cash',
  '銀行手續費 Bank Charge',
  '薪金 SALARY',
  '銷售 Sales',
  '其他 Others'
];

export const TRANSLATIONS = {
  en: {
    appTitle: 'FinReport',
    report: 'Report',
    analysis: 'Analysis',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expenses',
    netIncome: 'Net Income',
    smartEntryTitle: 'Smart Assistant',
    smartEntryHint: 'Type naturally, e.g., "Lunch 500" or "Received 5000 deposit". Works offline.',
    smartEntryPlaceholder: 'e.g., Taxi 200...',
    smartEntryButton: 'Analyze',
    addTransactionTitle: 'Add Transaction',
    date: 'Date',
    type: 'Type',
    income: 'Income',
    expense: 'Expense',
    category: 'Category',
    description: 'Description',
    amount: 'Amount (HKD)',
    addRecord: 'Add Record',
    monthlyLedger: 'Monthly Ledger',
    noRecords: 'No records found. Add a transaction to begin.',
    total: 'Total',
    expenseBreakdown: 'Expense Breakdown',
    dailyCashFlow: 'Daily Cash Flow',
    deleteTitle: 'Delete Record',
    errorSmart: 'Could not detect an amount. Please try again.',
    startDate: 'Start Date',
    endDate: 'End Date',
    filter: 'Filter',
    clearFilter: 'Clear',
  },
  zh: {
    appTitle: '財務報表',
    report: '報表',
    analysis: '分析',
    totalIncome: '總收入',
    totalExpense: '總支出',
    netIncome: '淨收入',
    smartEntryTitle: '智能記賬助手',
    smartEntryHint: '支援中英文，例如「午餐 500元」或「收到訂金 5000」。香港本地運算，無需 VPN。',
    smartEntryPlaceholder: '例如：的士 200...',
    smartEntryButton: '智能分析',
    addTransactionTitle: '新增交易',
    date: '日期',
    type: '類型',
    income: '收入',
    expense: '支出',
    category: '項目類別',
    description: '說明',
    amount: '金額 (HKD)',
    addRecord: '新增記錄',
    monthlyLedger: '月度報表',
    noRecords: '暫無記錄。請新增交易。',
    total: '總計',
    expenseBreakdown: '支出分佈',
    dailyCashFlow: '每日現金流',
    deleteTitle: '刪除記錄',
    errorSmart: '無法識別金額，請確保輸入包含數字。',
    startDate: '開始日期',
    endDate: '結束日期',
    filter: '篩選',
    clearFilter: '清除',
  }
};