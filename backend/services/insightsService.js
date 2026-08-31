const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const startOfMonth = (offset = 0) => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - offset);
    return d;
};

const buildInsights = async (userId) => {
    const monthStart = startOfMonth(0);
    const nextMonth = startOfMonth(-1);
    const prevStart = startOfMonth(1);

    const [monthTx, prevTx, allTx, budgets, goals] = await Promise.all([
        Transaction.find({ user: userId, date: { $gte: monthStart, $lt: nextMonth } }).lean(),
        Transaction.find({ user: userId, date: { $gte: prevStart, $lt: monthStart } }).lean(),
        Transaction.find({ user: userId }).lean(),
        Budget.find({ user: userId }).lean(),
        Goal.find({ user: userId }).lean()
    ]);

    const insights = [];
    const totalMonthExp = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalMonthInc = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

    const catSpend = {};
    monthTx.filter(t => t.type === 'expense').forEach(t => {
        catSpend[t.category] = (catSpend[t.category] || 0) + t.amount;
    });

    const prevCatSpend = {};
    prevTx.filter(t => t.type === 'expense').forEach(t => {
        prevCatSpend[t.category] = (prevCatSpend[t.category] || 0) + t.amount;
    });

    const topCat = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
        insights.push({
            type: 'trend',
            icon: 'fire',
            severity: 'info',
            title: 'Top spending category',
            message: `You spent ${formatMoney(topCat[1])} on "${topCat[0]}" this month — ${Math.round((topCat[1] / totalMonthExp) * 100)}% of your total expenses.`
        });
    }

    for (const [cat, cur] of Object.entries(catSpend)) {
        const prev = prevCatSpend[cat] || 0;
        if (prev > 0 && cur > prev * 1.3) {
            insights.push({
                type: 'alert',
                icon: 'trending-up',
                severity: 'warning',
                title: `${cat} spending is up ${Math.round(((cur - prev) / prev) * 100)}%`,
                message: `You spent ${formatMoney(cur)} on ${cat} this month vs ${formatMoney(prev)} last month. Consider reviewing this category.`
            });
        }
    }

    for (const cat of Object.keys(prevCatSpend)) {
        if (!catSpend[cat] && prevCatSpend[cat] > 0) {
            insights.push({
                type: 'good',
                icon: 'check-circle',
                severity: 'success',
                title: `No ${cat} spending this month`,
                message: `Great job — you had no spending in "${cat}" compared to ${formatMoney(prevCatSpend[cat])} last month.`
            });
        }
    }

    const avgDaily = totalMonthExp / new Date().getDate();
    const lastWeek = monthTx.filter(t => t.type === 'expense' && t.date >= new Date(Date.now() - 7 * 86400000))
        .reduce((s, t) => s + t.amount, 0);
    const lastWeekDaily = lastWeek / 7;
    if (lastWeekDaily > avgDaily * 1.2 && avgDaily > 0) {
        insights.push({
            type: 'alert',
            icon: 'alert-triangle',
            severity: 'danger',
            title: 'Spending is above your daily average',
            message: `Last 7 days averaged ${formatMoney(lastWeekDaily)}/day vs your ${formatMoney(avgDaily)}/day monthly average. Watch your pace to stay on budget.`
        });
    }

    const savings = totalMonthInc - totalMonthExp;
    const savingsRate = totalMonthInc > 0 ? (savings / totalMonthInc) * 100 : 0;
    if (savingsRate < 20 && totalMonthInc > 0) {
        insights.push({
            type: 'advice',
            icon: 'piggy-bank',
            severity: 'info',
            title: 'Boost your savings rate',
            message: `Your savings rate is ${savingsRate.toFixed(0)}%. Aim for at least 20% — try automating a transfer right after income arrives.`
        });
    } else if (savingsRate >= 20 && totalMonthInc > 0) {
        insights.push({
            type: 'good',
            icon: 'piggy-bank',
            severity: 'success',
            title: 'Healthy savings rate',
            message: `You're saving ${savingsRate.toFixed(0)}% of your income this month. Keep it up!`
        });
    }

    if (goals.length) {
        const upcoming = goals.filter(g => !g.completed).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
        if (upcoming && upcoming.deadline) {
            const daysLeft = Math.max(1, Math.ceil((new Date(upcoming.deadline) - new Date()) / 86400000));
            const gap = upcoming.targetAmount - upcoming.currentAmount;
            insights.push({
                type: 'goal',
                icon: 'target',
                severity: gap > 0 && gap / daysLeft > (upcoming.monthlyContribution || 1) ? 'warning' : 'info',
                title: `Goal "${upcoming.name}" deadline in ${daysLeft} days`,
                message: gap > 0
                    ? `You need ${formatMoney(gap)} more (≈ ${formatMoney(gap / daysLeft)}/day) to hit your target.`
                    : 'You have reached your target — mark it complete!'
            });
        }
    }

    const subscriptionTx = allTx.filter(t => t.type === 'expense' && /(netflix|spotify|subscription|prime|hulu|disney|youtube|microsoft|adobe|icloud|patreon)/i.test(t.description || t.category));
    if (subscriptionTx.length >= 2) {
        const monthlySubCost = [...new Map(subscriptionTx.map(t => [t.category, t])).values()]
            .reduce((s, t) => s + t.amount, 0);
        insights.push({
            type: 'advice',
            icon: 'repeat',
            severity: 'info',
            title: 'Review your subscriptions',
            message: `You have ${subscriptionTx.length} subscription-like expenses totalling ~${formatMoney(monthlySubCost)}. Cancelling unused ones could save you ${formatMoney(monthlySubCost * 12)}/year.`
        });
    }

    const recurringCost = [...new Map(allTx.filter(t => /(rent|mortgage|internet|phone|insurance|gym|salary|freelance)/i.test(t.description || t.category)).map(t => [t.category + t.amount, t])).values()]
        .reduce((s, t) => s + t.amount, 0);

    if (recurringCost > 0) {
        insights.push({
            type: 'info',
            icon: 'repeat',
            severity: 'info',
            title: 'Fixed & recurring commitments',
            message: `Around ${formatMoney(recurringCost)}/month goes to fixed recurring bills. Keep an emergency fund covering 3-6 months of these.`
        });
    }

    insights.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

    return {
        generatedAt: new Date().toISOString(),
        period: monthKey(),
        summary: {
            totalIncome: totalMonthInc,
            totalExpenses: totalMonthExp,
            savings: savings,
            savingsRate: totalMonthInc > 0 ? Math.round(savingsRate) : 0
        },
        insights: insights.slice(0, 8),
        budgets
    };
};

const severityRank = (s) => ({ danger: 0, warning: 1, info: 2, success: 3 }[s] ?? 2);

const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatMoney = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toFixed(0)}`;
};

module.exports = { buildInsights };
