import {
  BadgeDollarSign, BriefcaseBusiness, Car, CircleDollarSign, Film, HeartPulse,
  Home, MoreHorizontal, ShoppingBag, ShoppingCart, Tags, Utensils, Wallet, Zap,
} from 'lucide-react';

export const CATEGORY_META = {
  food: { label: 'Groceries', icon: ShoppingCart, tone: 'emerald', hex: '#22c55e' },
  groceries: { label: 'Groceries', icon: ShoppingCart, tone: 'emerald', hex: '#22c55e' },
  dining: { label: 'Dining', icon: Utensils, tone: 'amber', hex: '#f59e0b' },
  transport: { label: 'Transport', icon: Car, tone: 'sky', hex: '#3b82f6' },
  utilities: { label: 'Utilities', icon: Zap, tone: 'sky', hex: '#06b6d4' },
  rent: { label: 'Rent', icon: Home, tone: 'sky', hex: '#0ea5e9' },
  entertainment: { label: 'Entertainment', icon: Film, tone: 'sky', hex: '#3b82f6' },
  shopping: { label: 'Shopping', icon: ShoppingBag, tone: 'amber', hex: '#f97316' },
  health: { label: 'Health', icon: HeartPulse, tone: 'rose', hex: '#ef4444' },
  salary: { label: 'Salary', icon: Wallet, tone: 'income', hex: '#10b981' },
  freelance: { label: 'Freelance', icon: BriefcaseBusiness, tone: 'income', hex: '#0ea5e9' },
  investments: { label: 'Investments', icon: CircleDollarSign, tone: 'income', hex: '#84cc16' },
  income: { label: 'Income', icon: BadgeDollarSign, tone: 'income', hex: '#10b981' },
  other: { label: 'Other', icon: MoreHorizontal, tone: 'neutral', hex: '#64748b' },
};

const keyFor = (value) => String(value || 'other').trim().toLowerCase().replace(/\s+/g, '-');

export function getCategory(value) {
  const key = keyFor(value);
  return CATEGORY_META[key] || { label: String(value || 'Other'), icon: Tags, tone: 'neutral', hex: '#64748b' };
}

export function getMockUser() {
  const saved = JSON.parse(localStorage.getItem('wallet_tracker_user') || 'null');
  const name = saved?.name || 'Alex Morgan';
  return { name, email: saved?.email || 'alex@example.com', initials: name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase(), plan: 'Free', currency: saved?.currency || 'USD' };
}

export const getMockNotifications = () => [
  { id: 'budget', tone: 'amber', title: 'Budget check-in', body: 'Your monthly budgets are up to date.', time: 'Today', read: false },
];

export const getMockTransactions = () => [];
export const getMockBudgets = () => [];
export const getMockGoals = () => [];
export const getMockCategories = () => [];
export const getMockRecurring = () => [];
