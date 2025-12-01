export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  income: number;
  expense: number;
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
}

export enum AppView {
  TABLE = 'TABLE',
  DASHBOARD = 'DASHBOARD'
}

export interface AiParsedResult {
  date?: string;
  category?: string;
  description?: string;
  amount?: number;
  type?: 'income' | 'expense';
}

export type Language = 'en' | 'zh';
