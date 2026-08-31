const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { buildDashboard } = require('../services/analyticsService');
const { get, set, delPattern } = require('../services/cacheService');

const getDashboard = async (req, res) => {
    const cacheKey = `dashboard:${req.user.id}:current`;
    const cached = await get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const dashboard = await buildDashboard(req.user.id);
    await set(cacheKey, dashboard, 120);
    res.json(dashboard);
};

const getAnalytics = async (req, res) => {
    const { from, to } = req.query;
    const filter = { user: req.user.id };

    if (from) filter.date = { ...(filter.date || {}), $gte: new Date(from) };
    if (to) filter.date = { ...(filter.date || {}), $lte: new Date(to) };

    const transactions = await Transaction.find(filter).select('amount type category date').lean();

    const aggregate = (list) => list.reduce((acc, t) => {
        acc.total += t.amount;
        acc.count += 1;
        return acc;
    }, { total: 0, count: 0 });

    const monthlyMap = new Map();
    const categoryMap = new Map();
    transactions.forEach(t => {
        const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap.has(key)) monthlyMap.set(key, { month: key, income: 0, expenses: 0 });
        const entry = monthlyMap.get(key);
        if (t.type === 'income') entry.income += t.amount;
        else entry.expenses += t.amount;

        if (t.type === 'expense') {
            if (!categoryMap.has(t.category)) categoryMap.set(t.category, 0);
            categoryMap.set(t.category, categoryMap.get(t.category) + t.amount);
        }
    });

    const monthly = [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month));
    const categoryBreakdown = [...categoryMap.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    res.json({
        period: { from: from || null, to: to || null },
        totals: {
            income: aggregate(transactions.filter(t => t.type === 'income')),
            expenses: aggregate(transactions.filter(t => t.type === 'expense'))
        },
        monthly,
        categoryBreakdown,
        topCategories: categoryBreakdown.slice(0, 5)
    });
};

const invalidateTransactionCache = async (req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode < 400) {
            delPattern(`dashboard:${req.user.id}:*`);
        }
    });
    next();
};

const getFilteredTransactions = async (req, res) => {
    const {
        search, type, category, paymentMethod, from, to,
        sortBy = 'date', order = 'desc', page = 1, limit = 20, month
    } = req.query;

    const filter = { user: req.user.id };

    if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
            { description: regex },
            { category: regex },
            { paymentMethod: regex }
        ];
    }
    if (type) filter.type = type;
    if (category) filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (from || to || month) {
        const dateFilter = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) dateFilter.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
        if (month) {
            const [y, m] = month.split('-');
            dateFilter.$gte = new Date(Date.UTC(y, m - 1, 1));
            dateFilter.$lte = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
        }
        filter.date = dateFilter;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortFieldMap = { amount: 'amount', date: 'date', category: 'category', createdAt: 'createdAt' };
    const sort = { [sortFieldMap[sortBy] || 'date']: sortOrder };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [transactions, total] = await Promise.all([
        Transaction.find(filter).sort(sort).skip(skip).limit(parseInt(limit, 10)),
        Transaction.countDocuments(filter)
    ]);

    res.json({
        transactions,
        pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            pages: Math.ceil(total / parseInt(limit, 10))
        }
    });
};

module.exports = { getDashboard, getAnalytics, getFilteredTransactions, invalidateTransactionCache };
