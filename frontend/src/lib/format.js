import clsx from 'clsx';

export const cn = (...values) => clsx(values);

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
};

export const getCurrency = () => {
  try {
    const user = JSON.parse(localStorage.getItem('wallet_tracker_user'));
    return user?.currency || 'USD';
  } catch {
    return 'USD';
  }
};

export const getCurrencySymbol = (currency) => {
  const curr = currency || getCurrency();
  return CURRENCY_SYMBOLS[curr] || '$';
};

export const formatCurrency = (value, currency) => {
  const curr = currency || getCurrency();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch {
    const sym = getCurrencySymbol(curr);
    return `${sym}${(Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export const formatCurrencyWhole = (value, currency) => {
  const curr = currency || getCurrency();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);
  } catch {
    const sym = getCurrencySymbol(curr);
    return `${sym}${Math.round(Number(value) || 0).toLocaleString('en-US')}`;
  }
};

export const formatCompact = (value, currency) => {
  const curr = currency || getCurrency();
  const sym = getCurrencySymbol(curr);
  const num = Number(value) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${sym}${Math.round(abs / 1_000)}k`;
  return `${sign}${sym}${abs}`;
};

export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value) || 0);
export const formatMonthYear = (value) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(value));
export const formatISODate = (value) => value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'No deadline';
export const formatISODay = (value) => value ? new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value)) : 'No due date';

export function daysUntil(value) {
  if (!value) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86_400_000);
}

export function formatRelativeDay(value) {
  const distance = daysUntil(value);
  if (distance === 0) return 'Today';
  if (distance === -1) return 'Yesterday';
  if (distance === 1) return 'Tomorrow';
  if (distance > -7 && distance < 0) return `${Math.abs(distance)} days ago`;
  return formatISODay(value);
}
