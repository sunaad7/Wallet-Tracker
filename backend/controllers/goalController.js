const Goal = require('../models/Goal');

const createGoal = async (req, res) => {
    const { name, targetAmount, currentAmount = 0, deadline, monthlyContribution = 0, color = '#10b981' } = req.body;

    const goal = await Goal.create({
        user: req.user.id,
        name: name.trim(),
        targetAmount,
        currentAmount,
        deadline: deadline || undefined,
        monthlyContribution,
        color
    });

    res.status(201).json({ message: 'Goal created', goal });
};

const getGoals = async (req, res) => {
    const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({
        goals: goals.map(g => ({
            ...g.toObject(),
            progress: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0
        }))
    });
};

const updateGoal = async (req, res) => {
    const { name, targetAmount, currentAmount, deadline, monthlyContribution, color, completed } = req.body;
    const updates = { name, targetAmount, currentAmount, deadline, monthlyContribution, color, completed };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    if (updates.currentAmount !== undefined && updates.currentAmount >= updates.targetAmount) {
        updates.completed = true;
    }

    const goal = await Goal.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        updates,
        { returnDocument: "after", runValidators: true }
    );

    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal updated', goal });
};

const addGoalFunds = async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Provide a valid amount to add' });

    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.currentAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    if (goal.currentAmount >= goal.targetAmount) goal.completed = true;
    await goal.save();

    res.json({ message: 'Funds added to goal', goal });
};

const deleteGoal = async (req, res) => {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
};

module.exports = { createGoal, getGoals, updateGoal, addGoalFunds, deleteGoal };
