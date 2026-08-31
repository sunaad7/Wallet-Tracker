const { test, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const app = require('../app');

const TEST_MONGO = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/wallettracker_test';

let server;
let base;
let token;
let userId;

const request = async (method, path, body, auth = true) => {
    const res = await fetch(`${base}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(auth && token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }
    return { status: res.status, data };
};

before(async () => {
    await mongoose.connect(TEST_MONGO);
    await mongoose.connection.dropDatabase();

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;

    const email = `test-${Date.now()}@wallettracker.test`;
    const reg = await request('POST', '/api/auth/register', { name: 'Tester', email, password: 'secret123' }, false);
    token = reg.data.token;
    userId = reg.data.user.id;
});

after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    server.close();
});

test('auth: register rejects missing fields', async () => {
    const res = await request('POST', '/api/auth/register', { name: 'X' }, false);
    assert.strictEqual(res.status, 400);
});

test('auth: login with wrong password is rejected', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'test@wallettracker.test', password: 'nope' }, false);
    assert.strictEqual(res.status, 401);
});

test('auth: protected route rejects no token', async () => {
    const res = await request('GET', '/api/transactions', null, false);
    assert.strictEqual(res.status, 401);
});

test('categories: default categories seeded on register', async () => {
    const res = await request('GET', '/api/categories');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.categories.length >= 10);
});

test('transactions: create income + expenses', async () => {
    await request('POST', '/api/transactions', { amount: 3000, type: 'income', category: 'Salary', description: 'Pay' });
    await request('POST', '/api/transactions', { amount: 400, type: 'expense', category: 'Groceries', description: 'Market' });
    await request('POST', '/api/transactions', { amount: 100, type: 'expense', category: 'Dining', description: 'Lunch' });
    const res = await request('GET', '/api/transactions');
    assert.strictEqual(res.data.transactions.length, 3);
});

test('transactions: filter endpoint with search + pagination', async () => {
    const res = await request('GET', '/api/transactions/filter?type=expense&search=market&page=1&limit=10');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.transactions.length, 1);
    assert.strictEqual(res.data.pagination.total, 1);
});

test('transactions: validation rejects negative amount', async () => {
    const res = await request('POST', '/api/transactions', { amount: -5, type: 'expense', category: 'X' });
    assert.strictEqual(res.status, 400);
});

test('transactions: update and delete', async () => {
    const list = await request('GET', '/api/transactions');
    const id = list.data.transactions[0]._id;
    const upd = await request('PUT', `/api/transactions/${id}`, { amount: 999 });
    assert.strictEqual(upd.status, 200);
    assert.strictEqual(upd.data.transaction.amount, 999);

    const del = await request('DELETE', `/api/transactions/${id}`);
    assert.strictEqual(del.status, 200);
    const after = await request('GET', `/api/transactions/${id}`);
    assert.strictEqual(after.status, 404);
});

test('budgets: create, list with spent, delete', async () => {
    const created = await request('POST', '/api/budgets', { category: 'Groceries', amount: 500 });
    assert.strictEqual(created.status, 201);

    const list = await request('GET', '/api/budgets');
    const budget = list.data.budgets.find(b => b.category === 'Groceries');
    assert.strictEqual(budget.spent, 400);

    const bad = await request('POST', '/api/budgets', { category: 'Groceries', amount: -1 });
    assert.strictEqual(bad.status, 400);
});

test('goals: create, add funds, complete flow', async () => {
    const created = await request('POST', '/api/goals', { name: 'Trip', targetAmount: 1000, currentAmount: 100 });
    assert.strictEqual(created.status, 201);
    const id = created.data.goal._id;

    await request('POST', `/api/goals/${id}/funds`, { amount: 900 });
    const list = await request('GET', '/api/goals');
    const goal = list.data.goals.find(g => g._id === id);
    assert.strictEqual(goal.completed, true);
    assert.strictEqual(goal.progress, 100);
});

test('recurring: create, list, delete', async () => {
    const created = await request('POST', '/api/recurring', {
        name: 'Netflix', amount: 15.99, category: 'Entertainment', frequency: 'monthly', nextDueDate: new Date(Date.now() + 86400000).toISOString()
    });
    assert.strictEqual(created.status, 201);

    const list = await request('GET', '/api/recurring');
    assert.strictEqual(list.data.recurring.length, 1);
});

test('dashboard: returns summary and charts data', async () => {
    const res = await request('GET', '/api/dashboard');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.summary.monthIncome, 3000);
    assert.strictEqual(res.data.summary.monthExpenses, 400);
    assert.ok(res.data.monthlySpending.length === 6);
    assert.ok(res.data.categoryBreakdown.length >= 1);
});

test('analytics: returns monthly + category breakdown', async () => {
    const res = await request('GET', '/api/analytics');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.monthly.length >= 1);
    assert.strictEqual(res.data.totals.income.total, 3000);
});

test('insights: returns AI-style insights', async () => {
    const res = await request('GET', '/api/insights');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.insights.length >= 1);
});

test('notifications: mark all read', async () => {
    const res = await request('PUT', '/api/notifications/read-all');
    assert.strictEqual(res.status, 200);
    const list = await request('GET', '/api/notifications');
    assert.strictEqual(list.data.unreadCount, 0);
});
