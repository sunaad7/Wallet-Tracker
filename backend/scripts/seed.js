const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const RecurringPayment = require('../models/RecurringPayment');

const DEFAULT_CATEGORIES = [
    { name: "Groceries", type: "expense", color: "#22c55e", icon: "shopping-cart" },
    { name: "Dining", type: "expense", color: "#f59e0b", icon: "utensils" },
    { name: "Transport", type: "expense", color: "#3b82f6", icon: "car" },
    { name: "Utilities", type: "expense", color: "#06b6d4", icon: "zap" },
    { name: "Rent", type: "expense", color: "#8b5cf6", icon: "home" },
    { name: "Entertainment", type: "expense", color: "#ec4899", icon: "film" },
    { name: "Shopping", type: "expense", color: "#f97316", icon: "bag" },
    { name: "Health", type: "expense", color: "#ef4444", icon: "heart-pulse" },
    { name: "Salary", type: "income", color: "#10b981", icon: "wallet" },
    { name: "Freelance", type: "income", color: "#0ea5e9", icon: "briefcase" },
    { name: "Investments", type: "income", color: "#84cc16", icon: "trending-up" }
];

const EXPENSE_PATTERNS = [
    { category: "Groceries", min: 80, max: 320, desc: ["Weekly groceries", "Supermarket run", "Farmers market"] },
    { category: "Dining", min: 15, max: 90, desc: ["Coffee & pastry", "Team lunch", "Dinner out", "Sushi night"] },
    { category: "Transport", min: 20, max: 120, desc: ["Fuel fill-up", "Uber ride", "Metro card top-up"] },
    { category: "Utilities", min: 40, max: 180, desc: ["Electricity bill", "Internet", "Water bill"] },
    { category: "Entertainment", min: 10, max: 60, desc: ["Movie night", "Concert ticket", "Game purchase"] },
    { category: "Shopping", min: 30, max: 250, desc: ["Clothes", "Electronics", "Home decor"] },
    { category: "Health", min: 20, max: 150, desc: ["Pharmacy", "Gym membership", "Doctor visit"] }
];

const rand = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const pad = (n) => String(n).padStart(2, '0');
const monthKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const nextOccurrence = (day) => {
    const d = new Date();
    if (d.getDate() >= day) {
        d.setDate(1);
        d.setMonth(d.getMonth() + 1);
    }
    d.setDate(day);
    d.setHours(9, 0, 0, 0);
    return d;
};

const inMonths = (count) => {
    const d = new Date();
    d.setMonth(d.getMonth() + count);
    return d;
};

const run = async () => {
    dotenv.config();
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/WalletTracker';
    await mongoose.connect(MONGO_URI);

    const email = 'demo@wallettracker.dev';
    const existing = await User.findOne({ email });
    if (existing) {
        await Transaction.deleteMany({ user: existing._id });
        await Budget.deleteMany({ user: existing._id });
        await Goal.deleteMany({ user: existing._id });
        await RecurringPayment.deleteMany({ user: existing._id });
        await Category.deleteMany({ user: existing._id });
        await User.deleteOne({ _id: existing._id });
    }

    const hashed = await bcrypt.hash('demo123', 10);
    const user = await User.create({ name: 'Demo User', email, password: hashed, currency: 'USD' });
    const categories = await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id })));
    const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));

    const tx = [];
    for (let month = 5; month >= 0; month--) {
        const ref = new Date();
        ref.setMonth(ref.getMonth() - month);
        const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();

        tx.push({
            user: user._id, amount: 3200, type: 'income', category: 'Salary',
            description: 'Monthly salary', paymentMethod: 'bank transfer',
            date: new Date(ref.getFullYear(), ref.getMonth(), 1, 9, 0)
        });
        tx.push({
            user: user._id, amount: rand(200, 600), type: 'income', category: 'Freelance',
            description: 'Freelance project', paymentMethod: 'bank transfer',
            date: new Date(ref.getFullYear(), ref.getMonth(), 12, 14, 0)
        });
        tx.push({
            user: user._id, amount: 1200, type: 'expense', category: 'Rent',
            description: 'Monthly rent', paymentMethod: 'bank transfer',
            date: new Date(ref.getFullYear(), ref.getMonth(), 2, 8, 0)
        });

        for (let d = 1; d <= daysInMonth; d += Math.floor(Math.random() * 3) + 1) {
            const pattern = pick(EXPENSE_PATTERNS);
            tx.push({
                user: user._id,
                amount: rand(pattern.min, pattern.max),
                type: 'expense',
                category: pattern.category,
                description: pick(pattern.desc),
                paymentMethod: pick(['debit card', 'credit card', 'cash', 'bank transfer']),
                date: new Date(ref.getFullYear(), ref.getMonth(), d, rand(8, 21), rand(0, 59))
            });
        }
    }
    await Transaction.insertMany(tx);

    const month = monthKey();
    await Budget.insertMany([
        { user: user._id, category: 'Groceries', amount: 600, month, alertThreshold: 75 },
        { user: user._id, category: 'Dining', amount: 300, month, alertThreshold: 80 },
        { user: user._id, category: 'Transport', amount: 250, month, alertThreshold: 80 },
        { user: user._id, category: 'Entertainment', amount: 150, month, alertThreshold: 80 },
        { user: user._id, category: 'Shopping', amount: 400, month, alertThreshold: 70 }
    ]);

    await Goal.insertMany([
        { user: user._id, name: 'Emergency Fund', targetAmount: 10000, currentAmount: 4200, monthlyContribution: 500, deadline: inMonths(10), color: '#10b981' },
        { user: user._id, name: 'Japan Trip', targetAmount: 5000, currentAmount: 1250, monthlyContribution: 300, deadline: inMonths(5), color: '#6366f1' },
        { user: user._id, name: 'New Laptop', targetAmount: 2500, currentAmount: 2300, monthlyContribution: 200, deadline: inMonths(3), color: '#f59e0b' }
    ]);

    await RecurringPayment.insertMany([
        { user: user._id, name: 'Netflix', amount: 15.99, category: 'Entertainment', frequency: 'monthly', type: 'expense', dayOfMonth: 15, nextDueDate: nextOccurrence(15), active: true },
        { user: user._id, name: 'Spotify', amount: 9.99, category: 'Entertainment', frequency: 'monthly', type: 'expense', dayOfMonth: 5, nextDueDate: nextOccurrence(5), active: true },
        { user: user._id, name: 'Gym', amount: 45, category: 'Health', frequency: 'monthly', type: 'expense', dayOfMonth: 1, nextDueDate: nextOccurrence(1), active: true },
        { user: user._id, name: 'Internet', amount: 60, category: 'Utilities', frequency: 'monthly', type: 'expense', dayOfMonth: 10, nextDueDate: nextOccurrence(10), active: true }
    ]);

    await mongoose.disconnect();
    console.log('Seed complete.');
    console.log('Login with  demo@wallettracker.dev / demo123');
    console.log(`Currency: ${user.currency} · ${tx.length} transactions · 5 budgets · 3 goals · 4 recurring payments`);
    console.log(`Budget month: ${month}`);
};

run().catch((err) => { console.error(err); process.exit(1); });