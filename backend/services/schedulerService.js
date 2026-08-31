const cron = require('node-cron');
const mongoose = require('mongoose');
const RecurringPayment = require('../models/RecurringPayment');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const { monthKey, startOfMonth } = require('./analyticsService');

const computeNextDue = (recurring) => {
    const next = new Date(recurring.nextDueDate);
    switch (recurring.frequency) {
        case 'daily':
            next.setDate(next.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        case 'yearly':
            next.setFullYear(next.getFullYear() + 1);
            break;
    }
    if (recurring.frequency === 'monthly') {
        const targetDay = Math.min(recurring.dayOfMonth || 1, 28);
        next.setDate(targetDay);
    }
    if (recurring.frequency === 'weekly') {
        const current = new Date(recurring.nextDueDate);
        const diff = (recurring.dayOfWeek - current.getDay() + 7) % 7;
        next.setDate(current.getDate() + diff);
    }
    return next;
};

const processDueRecurring = async () => {
    const due = await RecurringPayment.find({ active: true, nextDueDate: { $lte: new Date() } });
    let processed = 0;

    for (const recurring of due) {
        const alreadyCreated = await Transaction.exists({
            user: recurring.user,
            category: recurring.category,
            amount: recurring.amount,
            type: recurring.type,
            description: recurring.description || recurring.name,
            createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
        });

        if (!alreadyCreated) {
            await Transaction.create({
                user: recurring.user,
                amount: recurring.amount,
                type: recurring.type,
                category: recurring.category,
                description: recurring.description || recurring.name,
                date: new Date()
            });
            await Notification.create({
                user: recurring.user,
                type: 'recurring',
                title: 'Recurring transaction processed',
                message: `${recurring.name} (${recurring.type === 'income' ? '+' : '-'}$${recurring.amount.toFixed(2)}) was recorded automatically.`
            });
            processed++;
        }

        recurring.nextDueDate = computeNextDue(recurring);
        recurring.lastProcessed = new Date();
        await recurring.save();
    }

    return processed;
};

const checkBudgetAlerts = async () => {
    const monthStart = startOfMonth(0);
    const nextMonth = startOfMonth(-1);
    const month = monthKey();
    const budgets = await Budget.find({ month });

    for (const budget of budgets) {
        const spent = await Transaction.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(budget.user),
                    type: 'expense',
                    category: { $regex: new RegExp(`^${budget.category}$`, 'i') },
                    date: { $gte: monthStart, $lt: nextMonth }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalSpent = spent[0]?.total || 0;
        const percentage = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

        const alertKey = `${budget.user}-${budget.category}-${month}`;
        const lastAlert = await Notification.findOne({
            user: budget.user,
            type: 'budget_alert',
            title: { $regex: new RegExp(budget.category, 'i') }
        }).sort({ createdAt: -1 });

        if (percentage >= 100 && (!lastAlert || !lastAlert.message.includes('exceeded'))) {
            await Notification.create({
                user: budget.user,
                type: 'budget_alert',
                title: `Budget exceeded for ${budget.category}`,
                message: `You have exceeded your ${budget.category} budget ($${totalSpent.toFixed(2)} spent of $${budget.amount.toFixed(2)}).`
            });
        } else if (percentage >= budget.alertThreshold && percentage < 100 && (!lastAlert || lastAlert.message.includes('exceeded') || !lastAlert.message.includes('used'))) {
            await Notification.create({
                user: budget.user,
                type: 'budget_alert',
                title: `Budget alert for ${budget.category}`,
                message: `You have used ${Math.round(percentage)}% of your ${budget.category} budget ($${totalSpent.toFixed(2)} of $${budget.amount.toFixed(2)}).`
            });
        }
    }
};

const startScheduler = () => {
    if (process.env.SCHEDULER_DISABLED === 'true') {
        console.log('[scheduler] disabled via SCHEDULER_DISABLED');
        return;
    }

    cron.schedule('*/10 * * * *', async () => {
        try {
            const processed = await processDueRecurring();
            if (processed > 0) console.log(`[scheduler] processed ${processed} recurring transaction(s)`);
        } catch (err) {
            console.error('[scheduler] recurring processing failed:', err.message);
        }
    });

    cron.schedule('0 */6 * * *', async () => {
        try {
            await checkBudgetAlerts();
            console.log('[scheduler] budget alerts checked');
        } catch (err) {
            console.error('[scheduler] budget alert check failed:', err.message);
        }
    });

    console.log('[scheduler] started (recurring transactions + budget alerts)');
};

module.exports = { startScheduler, processDueRecurring, checkBudgetAlerts, computeNextDue };
