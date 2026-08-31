const Category = require('../models/Category');
const { delPattern } = require('../services/cacheService');

const createCategory = async (req, res) => {
    const { name, type = 'expense', color = '#6366f1', icon = 'tag' } = req.body;

    const exists = await Category.findOne({ user: req.user.id, name: name.trim(), type });
    if (exists) {
        return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const category = await Category.create({ user: req.user.id, name: name.trim(), type, color, icon });
    await delPattern(`categories:${req.user.id}:*`);
    res.status(201).json({ message: 'Category created', category });
};

const getCategories = async (req, res) => {
    const { type } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.type = type;

    const categories = await Category.find(filter).sort({ name: 1 });
    res.json({ categories });
};

const updateCategory = async (req, res) => {
    const { name, type, color, icon } = req.body;
    const updates = { name, type, color, icon };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const category = await Category.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        updates,
        { returnDocument: "after", runValidators: true }
    );

    if (!category) return res.status(404).json({ message: 'Category not found' });
    await delPattern(`categories:${req.user.id}:*`);
    res.json({ message: 'Category updated', category });
};

const deleteCategory = async (req, res) => {
    const category = await Category.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await delPattern(`categories:${req.user.id}:*`);
    res.json({ message: 'Category deleted' });
};

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
