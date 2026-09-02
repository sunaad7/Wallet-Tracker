const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { notFound, errorHandler } = require('./middleware/errorHandler');

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required. Add it to your .env file.");
    process.exit(1);
}

const app = express();

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const goalRoutes = require("./routes/goalRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", analyticsRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Wallet Tracker API is running",
        version: "2.0.0",
        endpoints: {
            auth: "/api/auth",
            transactions: "/api/transactions",
            categories: "/api/categories",
            budgets: "/api/budgets",
            goals: "/api/goals",
            recurring: "/api/recurring",
            notifications: "/api/notifications",
            dashboard: "/api/dashboard",
            analytics: "/api/analytics",
            insights: "/api/insights"
        }
    });
});

// Public OAuth client identifiers for the frontend social-login buttons.
app.get("/api/auth/config", (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || "",
        facebookAppId: process.env.FACEBOOK_APP_ID || ""
    });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
