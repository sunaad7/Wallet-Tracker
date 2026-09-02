import axios from 'axios';
import { getCategory } from './mock.js';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wallet_tracker_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthRequest = error.config?.url?.includes('/auth/');
    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem('wallet_tracker_token');
      localStorage.removeItem('wallet_tracker_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const apiError = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || fallback;

const keyFor = (value) => String(value || 'other').trim().toLowerCase().replace(/\s+/g, '-');
const apiCategory = (key) => getCategory(key).label;
const initials = (name) => String(name || 'User').split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

const transactionFromApi = (transaction) => ({
  id: transaction._id || transaction.id,
  type: transaction.type,
  amount: Number(transaction.amount) || 0,
  category: keyFor(transaction.category),
  description: transaction.description || transaction.category || 'Transaction',
  merchant: transaction.description || transaction.category || 'Transaction',
  account: transaction.paymentMethod || 'Other',
  date: transaction.date,
});

const budgetFromApi = (budget) => ({
  id: budget._id || budget.id,
  category: keyFor(budget.category),
  limit: Number(budget.amount) || 0,
  spent: Number(budget.spent) || 0,
});

const goalFromApi = (goal) => ({
  id: goal._id || goal.id,
  name: goal.name,
  target: Number(goal.targetAmount) || 0,
  saved: Number(goal.currentAmount) || 0,
  deadline: goal.deadline,
  color: goal.color === '#10b981' ? 'emerald' : 'brand',
  icon: 'target',
});

const recurringFromApi = (item) => ({
  id: item._id || item.id,
  name: item.name,
  merchant: item.description || getCategory(item.category).label,
  amount: Number(item.amount) || 0,
  category: keyFor(item.category),
  type: item.type,
  frequency: `${item.frequency || 'monthly'}`.replace(/^./, (letter) => letter.toUpperCase()),
  nextDue: item.nextDueDate,
  active: item.active !== false,
});

const categoryFromApi = (category) => ({
  id: category._id || category.id,
  key: keyFor(category.name),
  label: category.name,
  total: 0,
  transactionCount: 0,
});

async function request(call) {
  try {
    const response = await call();
    return response.data;
  } catch (error) {
    throw new Error(apiError(error));
  }
}

function storeSession(data) {
  localStorage.setItem('wallet_tracker_token', data.token);
  localStorage.setItem('wallet_tracker_user', JSON.stringify(data.user));
  return data.user;
}

export const apiClient = {
  auth: {
    login: (credentials) => request(() => api.post('/auth/login', credentials)).then(storeSession),
    register: (details) => request(() => api.post('/auth/register', details)).then(storeSession),
    social: (provider, token) => request(() => api.post('/auth/social', { provider, token })).then(storeSession),
    oauthConfig: () => request(() => api.get('/auth/config')),
    forgotPassword: (email) => request(() => api.post('/auth/forgot-password', { email })),
    resetPassword: (email, code, password) => request(() => api.post('/auth/reset-password', { email, code, password })).then(storeSession),
    logout: () => {
      localStorage.removeItem('wallet_tracker_token');
      localStorage.removeItem('wallet_tracker_user');
      window.location.assign('/login');
    },
  },
  transactions: {
    list: () => request(() => api.get('/transactions')).then(({ transactions }) => transactions.map(transactionFromApi)),
    create: (payload) => request(() => api.post('/transactions', {
      amount: payload.amount,
      type: payload.type,
      category: apiCategory(payload.category),
      description: payload.description,
      paymentMethod: payload.account?.toLowerCase().includes('credit') ? 'credit card' : payload.account?.toLowerCase().includes('debit') ? 'debit card' : 'other',
      date: payload.date,
    })).then(({ transaction }) => transactionFromApi(transaction)),
    update: (id, payload) => request(() => api.put(`/transactions/${id}`, {
      amount: payload.amount,
      type: payload.type,
      category: apiCategory(payload.category),
      description: payload.description,
      paymentMethod: payload.account?.toLowerCase().includes('credit') ? 'credit card' : payload.account?.toLowerCase().includes('debit') ? 'debit card' : 'other',
      date: payload.date,
    })).then(({ transaction }) => transactionFromApi(transaction)),
    remove: (id) => request(() => api.delete(`/transactions/${id}`)),
  },
  budgets: {
    list: () => request(() => api.get('/budgets')).then(({ budgets }) => budgets.map(budgetFromApi)),
    create: (payload) => request(() => api.post('/budgets', { category: apiCategory(payload.category), amount: payload.limit })).then(({ budget }) => budgetFromApi(budget)),
    remove: (id) => request(() => api.delete(`/budgets/${id}`)),
  },
  goals: {
    list: () => request(() => api.get('/goals')).then(({ goals }) => goals.map(goalFromApi)),
    create: (payload) => request(() => api.post('/goals', {
      name: payload.name, targetAmount: payload.target, currentAmount: payload.saved || 0, deadline: payload.deadline,
    })).then(({ goal }) => goalFromApi(goal)),
    contribute: (id, amount) => request(() => api.post(`/goals/${id}/funds`, { amount })).then(({ goal }) => goalFromApi(goal)),
    remove: (id) => request(() => api.delete(`/goals/${id}`)),
  },
  categories: {
    list: async () => {
      const [{ categories }, { transactions }] = await Promise.all([
        request(() => api.get('/categories')),
        request(() => api.get('/transactions')),
      ]);
      return categories.map((category) => {
        const matching = transactions.filter((transaction) => transaction.category.toLowerCase() === category.name.toLowerCase());
        return {
          id: category._id || category.id,
          key: keyFor(category.name),
          label: category.name,
          total: matching.reduce((sum, transaction) => sum + (transaction.type === 'expense' ? Number(transaction.amount) : 0), 0),
          transactionCount: matching.length,
        };
      });
    },
    create: (payload) => request(() => api.post('/categories', {
      name: payload.name,
      type: payload.type || 'expense',
      color: payload.color || '#3b82f6',
      icon: 'tag',
    })).then(({ category }) => categoryFromApi(category)),
    update: (id, payload) => request(() => api.put(`/categories/${id}`, { name: payload.name })).then(({ category }) => categoryFromApi(category)),
    remove: (id) => request(() => api.delete(`/categories/${id}`)),
  },
  recurring: {
    list: () => request(() => api.get('/recurring')).then(({ recurring }) => recurring.map(recurringFromApi)),
    create: (payload) => request(() => api.post('/recurring', {
      name: payload.name,
      amount: payload.amount,
      category: apiCategory(payload.category),
      type: payload.type,
      frequency: payload.frequency,
      dayOfMonth: 1,
      nextDueDate: payload.nextDueDate,
    })).then(({ recurring }) => recurringFromApi(recurring)),
    toggle: (id, active) => request(() => api.put(`/recurring/${id}`, { active })),
    remove: (id) => request(() => api.delete(`/recurring/${id}`)),
  },
  dashboard: {
    get: () => request(() => api.get('/dashboard')).then((data) => {
      const summary = data.summary || {};
      const categorySplit = (data.categoryBreakdown || []).map((item) => ({
        key: keyFor(item.category), label: getCategory(item.category).label, value: Number(item.amount) || 0, hex: getCategory(item.category).hex,
      }));
      return {
        stats: {
          balance: Number(summary.balance) || 0,
          income: Number(summary.monthIncome) || 0,
          expense: Number(summary.monthExpenses) || 0,
          savingsRate: (Number(summary.savingsRate) || 0) / 100,
          deltas: {
            balance: 0,
            income: 0,
            expense: Number(summary.monthOverMonthChange) || 0,
            savingsRate: 0,
          },
        },
        cashflow: (data.monthlySpending || []).map((item) => ({ label: item.month, month: item.month, income: Number(item.income) || 0, expense: Number(item.expenses) || 0 })),
        categorySplit,
        recent: (data.recentTransactions || []).map(transactionFromApi),
        budgetSummary: (data.budgetProgress || []).map((item) => ({ ...budgetFromApi(item), pct: Number(item.percentage) || 0 })),
        goalsPreview: (data.goals || []).slice(0, 3).map((item) => ({ ...goalFromApi(item), pct: Number(item.progress) || 0 })),
      };
    }),
  },
  analytics: {
    get: (range) => {
      const params = {};
      if (range) {
        const to = new Date();
        const from = new Date();
        const months = parseInt(range.replace('m', ''), 10) || 6;
        from.setMonth(to.getMonth() - months);
        params.from = from.toISOString();
        params.to = to.toISOString();
      }
      return request(() => api.get('/analytics', { params })).then((data) => ({
        cashflow: (data.monthly || []).map((item) => ({ label: item.month, month: item.month, income: Number(item.income) || 0, expense: Number(item.expenses) || 0 })),
        categoryBars: (data.categoryBreakdown || []).map((item) => ({ name: getCategory(item.category).label, value: Number(item.amount) || 0, hex: getCategory(item.category).hex })),
        topMerchants: (data.categoryBreakdown || []).slice(0, 5).map((item) => ({ name: getCategory(item.category).label, spend: Number(item.amount) || 0, count: 1 })),
      }));
    },
  },
  insights: {
    list: () => request(() => api.get('/insights')).then((data) => (data.insights || []).map((item, index) => ({
      id: `${item.title}-${index}`,
      type: item.severity === 'success' ? 'savings' : item.severity === 'warning' || item.severity === 'danger' ? 'warning' : item.type === 'goal' ? 'opportunity' : 'tip',
      title: item.title,
      body: item.message,
      metric: item.severity,
      action: 'Review details',
    }))),
    regenerate: () => apiClient.insights.list(),
  },
  settings: {
    get: () => request(() => api.get('/auth/profile')).then(({ user }) => ({
      ...user,
      initials: initials(user.name),
      dateFormat: 'MMM d, yyyy',
      weeklyDigest: true,
      budgetAlerts: true,
      insightAlerts: true,
      securityAlerts: true,
    })),
    update: (user) => request(() => api.put('/auth/profile', { name: user.name, currency: user.currency })).then(({ user: updated }) => {
      localStorage.setItem('wallet_tracker_user', JSON.stringify(updated));
      return updated;
    }),
  },
};

export default api;
