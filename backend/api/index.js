const express = require('express');
const connectDB = require('../config/db');
const app = require('../app');

let connected = false;

const api = express();

api.use(async (req, res, next) => {
    if (connected) return next();
    try {
        console.log('[api] connecting to DB...');
        await connectDB();
        connected = true;
        console.log('[api] DB connected');
        next();
    } catch (err) {
        console.error('[api] DB connection failed:', err.message);
        res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
});

api.use(app);

api.use((err, req, res, next) => {
    console.error('[api] handler error:', err && err.stack ? err.stack : err);
    if (res.headersSent) return next(err);
    res.status(500).json({ message: 'Server error', error: err.message });
});

module.exports = api;