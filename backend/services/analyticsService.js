const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const startOfMonth = (offset = 0) => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - offset);
    return d;
};

const buildDashboard = async (userId) => {
    const monthStart = startOfMonth(0);
    const nextMonth = startOfMonth(-1);

    const [allTx, monthTx, lastMonthTx, sixMonthTx, budgets, goals] = await Promise.all([
        Transaction.find({ user: userId }).select('amount type date category').lean(),
        Transaction.find({ user: userId, date: { $gte: monthStart, $lt: nextMonth } })
            .sort({ date: -1, createdAt: -1 })
            .select('amount type category description date paymentMethod')
            .lean(),
        Transaction.find({ user: userId, date: { $gte: startOfMonth(1), $lt: monthStart } })
            .select('amount type')
            .lean(),
        Transaction.find({ user: userId, date: { $gte: startOfMonth(5) } })
            .select('amount type date')
            .lean(),
        Budget.find({ user: userId, month: monthKey() }).lean(),
        Goal.find({ user: userId }).sort({ createdAt: -1 }).lean()
    ]);

    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthExpenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const monthSavings = monthIncome - monthExpenses;
    const savingsRate = monthIncome > 0 ? Math.round((monthSavings / monthIncome) * 100) : 0;

    const lastMonthIncome = lastMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const lastMonthExpenses = lastMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const categoryBreakdown = [];
    const catMap = new Map();
    monthTx.filter(t => t.type === 'expense').forEach(t => {
        catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
    });
    catMap.forEach((amount, category) => {
        categoryBreakdown.push({
            category,
            amount,
            percentage: monthExpenses > 0 ? Math.round((amount / monthExpenses) * 100) : 0
        });
    });
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    const monthlySpending = [];
    for (let i = 5; i >= 0; i--) {
        const from = startOfMonth(i);
        const to = startOfMonth(i - 1);
        const inRange = sixMonthTx.filter(t => t.date >= from && t.date < to);
        monthlySpending.push({
            month: monthKey(from),
            income: inRange.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
            expenses: inRange.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        });
    }

    const budgetProgress = budgets.map(b => {
        const spent = categoryBreakdown.find(c => c.category.toLowerCase() === b.category.toLowerCase())?.amount || 0;
        return {
            ...b,
            spent,
            remaining: b.amount - spent,
            percentage: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
            status: spent >= b.amount ? 'exceeded' : spent >= (b.amount * b.alertThreshold) / 100 ? 'warning' : 'on-track'
        };
    });

    const totalGoalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalGoalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);

    return {
        summary: {
            balance,
            totalIncome,
            totalExpenses,
            monthIncome,
            monthExpenses,
            monthSavings,
            savingsRate,
            lastMonthIncome,
            lastMonthExpenses,
            monthOverMonthChange: lastMonthExpenses > 0
                ? Math.round(((monthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100)
                : 0
        },
        recentTransactions: monthTx.slice(0, 8),
        categoryBreakdown,
        monthlySpending,
        budgetProgress,
        goals: goals.map(g => ({
            ...g,
            progress: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0
        })),
        goalSummary: {
            total: goals.length,
            completed: goals.filter(g => g.completed).length,
            totalTarget: totalGoalTarget,
            totalCurrent: totalGoalCurrent
        }
    };
};

module.exports = { buildDashboard, monthKey, startOfMonth };
