const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { monthKey, startOfMonth } = require('../services/analyticsService');
const { delPattern } = require('../services/cacheService');

const createBudget = async (req, res) => {
    const { category, amount, month = monthKey(), alertThreshold = 80 } = req.body;

    const exists = await Budget.findOne({ user: req.user.id, category: category.trim(), month });
    if (exists) {
        return res.status(400).json({ message: 'A budget for this category already exists for this month' });
    }

    const budget = await Budget.create({ user: req.user.id, category: category.trim(), amount, month, alertThreshold });
    await delPattern(`dashboard:${req.user.id}:*`);
    res.status(201).json({ message: 'Budget created', budget });
};

const getBudgets = async (req, res) => {
    const { month = monthKey() } = req.query;
    const budgets = await Budget.find({ user: req.user.id, month }).sort({ amount: -1 });

    const monthStart = startOfMonth(0);
    const nextMonth = startOfMonth(-1);
    const budgetWithProgress = await Promise.all(
        budgets.map(async (budget) => {
            const spent = await Transaction.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(req.user.id),
                        type: 'expense',
                        category: { $regex: new RegExp(`^${budget.category}$`, 'i') },
                        date: { $gte: monthStart, $lt: nextMonth }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            return { ...budget.toObject(), spent: spent[0]?.total || 0 };
        })
    );

    res.json({ budgets: budgetWithProgress });
};

const updateBudget = async (req, res) => {
    const { category, amount, month, alertThreshold } = req.body;
    const updates = { category, amount, month, alertThreshold };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const budget = await Budget.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        updates,
        { returnDocument: "after", runValidators: true }
    );

    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    await delPattern(`dashboard:${req.user.id}:*`);
    res.json({ message: 'Budget updated', budget });
};

const deleteBudget = async (req, res) => {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    await delPattern(`dashboard:${req.user.id}:*`);
    res.json({ message: 'Budget deleted' });
};

module.exports = { createBudget, getBudgets, updateBudget, deleteBudget };
