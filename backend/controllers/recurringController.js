const RecurringPayment = require('../models/RecurringPayment');
const { computeNextDue } = require('../services/schedulerService');

const createRecurring = async (req, res) => {
    const {
        name, amount, category, type = 'expense', frequency,
        dayOfMonth = 1, dayOfWeek = 1, description, nextDueDate
    } = req.body;

    const dueDate = nextDueDate ? new Date(nextDueDate) : new Date();

    const recurring = await RecurringPayment.create({
        user: req.user.id,
        name: name.trim(),
        amount,
        category: category.trim(),
        type,
        frequency,
        dayOfMonth,
        dayOfWeek,
        description,
        nextDueDate: dueDate
    });

    res.status(201).json({ message: 'Recurring payment created', recurring });
};

const getRecurring = async (req, res) => {
    const recurring = await RecurringPayment.find({ user: req.user.id }).sort({ nextDueDate: 1 });
    res.json({ recurring });
};

const updateRecurring = async (req, res) => {
    const { name, amount, category, type, frequency, dayOfMonth, dayOfWeek, description, nextDueDate, active } = req.body;
    const updates = { name, amount, category, type, frequency, dayOfMonth, dayOfWeek, description, nextDueDate, active };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const recurring = await RecurringPayment.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        updates,
        { returnDocument: "after", runValidators: true }
    );

    if (!recurring) return res.status(404).json({ message: 'Recurring payment not found' });
    res.json({ message: 'Recurring payment updated', recurring });
};

const deleteRecurring = async (req, res) => {
    const recurring = await RecurringPayment.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!recurring) return res.status(404).json({ message: 'Recurring payment not found' });
    res.json({ message: 'Recurring payment deleted' });
};

module.exports = { createRecurring, getRecurring, updateRecurring, deleteRecurring };
