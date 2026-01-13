

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
    '強積金供款 MPF Contribution': ['mpf', 'contribution', 'pension', '強積金', '供款'],
    '員工福利 Staff Entertainment': ['staff', 'entertainment', 'welfare', 'meal', 'gift', '福利', '員工餐', '禮物'],
    '營運費用 Operating Expense': ['operation', 'operating', 'subscription', 'system', 'software', '營運', '系統', '訂閱'],
    '銷售 Sales': ['sales', 'sell', 'sold', 'revenue', 'client', 'customer', '銷售', '生意', '客'],
    // New Categories
    '集運及運費 Logistics & Shipping Expenses': ['shipping', 'logistics', 'delivery', '集運', '運費', '快遞', 'sf', '順豐'],
    '利得稅－交稅 Tax Expense – Profits Tax': ['profits tax', 'tax expense', '利得稅', '交稅'],
    '利得稅－預繳 Tax Prepayment – Profits Tax': ['tax prepayment', 'provisional tax', '預繳稅', '預繳'],
    '差餉及地租 Rates & Government Rent': ['rates', 'government rent', '差餉', '地租'],
    '固定資產－裝修費 Fixed Asset – Renovation': ['renovation', 'decoration', 'fitting', '裝修', '裝飾'],
    '員工保險－勞工保險 Staff Insurance – Employees\' Compensation': ['insurance', 'compensation', 'ec', '勞保', '保險'],
    '維修及安裝費 Repair & Installation': ['repair', 'fix', 'maintain', 'installation', 'install', '維修', '安裝', '修理'],
    '市場推廣－拍攝及模特費 Marketing & Promotion – Shooting & Model': ['shooting', 'model', 'photo', 'video', '拍攝', '模特', '攝影'],
    '美容療程用品 Supplies – Beauty & Treatment': ['beauty', 'treatment', 'facial', 'mask', 'cream', '美容', '療程', '精華', '面膜'],
    '辦公用品 Supplies – Office': ['office supplies', 'paper', 'stationery', '辦公', '文具', '紙'],
    '醫療耗材 Supplies – Medical & Consumables': ['medical', 'consumable', 'glove', 'mask', 'needle', '醫療', '耗材', '手套', '針', '口罩'],
    '制服及鞋類 Supplies – Uniform & Shoes': ['uniform', 'shoes', 'clothes', '制服', '鞋', '工作服'],
    '大廈管理費 Building Management Fees': ['building management', 'mgt fee', '大廈管理', '管理費'],
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