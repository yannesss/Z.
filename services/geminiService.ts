import { AiParsedResult } from "../types";

// Local "AI" Logic - Rule based parser
// This replaces the Google Gemini API to ensure it works in Hong Kong without VPN
// and runs instantly on the client side.

export const parseTransactionSmart = async (text: string): Promise<AiParsedResult | null> => {
  // Simulate a tiny delay for UX (feels like "processing")
  await new Promise(resolve => setTimeout(resolve, 400));

  const lowerText = text.toLowerCase();
  let type: 'income' | 'expense' = 'expense';
  let amount = 0;
  let category = '';
  let date = new Date().toISOString().split('T')[0];

  // 1. Detect Amount
  // Matches: 500, $500, 500.00, 500元, 500hkd, 500蚊
  // Remove commas first to parse numbers like 1,000
  const cleanText = text.replace(/,/g, '');
  const amountMatch = cleanText.match(/(\$|HKD|HK\$)?\s?(\d+(?:\.\d+)?)\s?(元|HKD|dollars|蚊)?/i);
  
  if (amountMatch) {
    amount = parseFloat(amountMatch[2]);
  } else {
    // If no amount found, we cannot parse
    return null;
  }

  // 2. Detect Type (Income vs Expense)
  // Default is expense. Check for income keywords.
  const incomeKeywords = ['income', 'deposit', 'receive', 'saved', 'sales', 'revenue', '收入', '存入', '收到', '銷售', '訂金', '入數'];
  if (incomeKeywords.some(k => lowerText.includes(k))) {
    type = 'income';
  }

  // 3. Detect Date
  if (lowerText.includes('yesterday') || lowerText.includes('昨天') || lowerText.includes('琴日')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
  } else if (lowerText.includes('today') || lowerText.includes('今天') || lowerText.includes('今日')) {
     date = new Date().toISOString().split('T')[0];
  } else {
      // Simple date regex YYYY-MM-DD or YYYY/MM/DD
      const dateMatch = text.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
      if (dateMatch) {
        date = dateMatch[0].replace(/\//g, '-');
      }
  }

  // 4. Detect Category based on Keywords
  const categoryMap: Record<string, string[]> = {
    '租金 Rental Fee': ['rent', 'rental', 'lease', '租金', '租', 'office'],
    '廣告費 Advertising Fees': ['ad', 'advertising', 'promo', 'promotion', 'marketing', 'fb', 'instagram', '廣告', '推廣', '宣傳'],
    '電費 Electricity For Office': ['electric', 'power', 'utility', '電費', '電', '港燈', '中電'],
    '公司用品 Supplies Expenses': ['supplies', 'paper', 'stationery', 'pen', 'ink', '用品', '文具', '雜物', '針', 'needle', 'tissue'],
    '管理費 Management Fees': ['management', 'admin', '管理費'],
    '網絡費 Internet Service': ['internet', 'wifi', 'broadband', 'network', 'sim', 'data', '網絡', '上網', '寬頻', '網費'],
    '現金 Cash': ['cash', 'withdraw', 'atm', '現金', '提款'],
    '銀行手續費 Bank Charge': ['bank', 'charge', 'fee', 'handling', '手續費', '銀行'],
    '薪金 SALARY': ['salary', 'wage', 'payroll', 'bonus', 'mpf', '薪金', '人工', '糧', '佣金'],
    '銷售 Sales': ['sales', 'sell', 'sold', 'revenue', 'client', 'customer', '銷售', '生意', '客'],
  };

  for (const [catName, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => lowerText.includes(k))) {
      category = catName;
      break;
    }
  }

  // Default category if not found
  if (!category) {
    category = '其他 Others';
  }

  // 5. Description
  // Use the full text as description
  const description = text;

  return {
    date,
    category,
    description,
    amount,
    type
  };
};