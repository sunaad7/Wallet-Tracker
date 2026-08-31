const User = require("../models/User");
const Category = require("../models/Category");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { isMailConfigured, sendResetCodeEmail } = require("../services/mailer");

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

const seedDefaultCategories = async (userId) => {
    await Category.insertMany(
        DEFAULT_CATEGORIES.map(c => ({ ...c, user: userId })),
        { ordered: false }
    ).catch(() => {});
};

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const registerUser = async (req, res) => {
    try {
        const { name, email, password, currency } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide name, email and password"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            currency: currency || "USD"
        });

        await seedDefaultCategories(user._id);

        const token = generateToken(user._id);

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                currency: user.currency
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                currency: user.currency
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
};

const updateProfile = async (req, res) => {
    const { name, currency } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (currency) user.currency = currency;
    await user.save();

    res.json({
        message: "Profile updated",
        user: { id: user._id, name: user.name, email: user.email, currency: user.currency }
    });
};

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const generateResetCode = () => {
    // 6-digit code, zero-padded
    return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Please provide your email" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // Always respond 200 so we never reveal which emails are registered.
        if (!user) {
            return res.json({ message: "If that email is registered, a reset code has been sent." });
        }

        const resetCode = generateResetCode();
        user.resetPasswordToken = hashToken(resetCode);
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const mailed = await sendResetCodeEmail(user.email, user.name, resetCode);

        if (mailed) {
            return res.json({
                message: "If that email is registered, a reset code has been sent.",
                expiresInMinutes: 10
            });
        }

        // Dev mode: no mail service configured, so return the code to the client.
        res.json({
            message: "Password reset code generated (dev mode — no mail service configured)",
            devCode: resetCode,
            expiresInMinutes: 10
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code, password } = req.body;
        const submittedCode = (code || "").toString().trim();

        if (!email || !submittedCode || !password) {
            return res.status(400).json({
                message: "Please provide email, reset code and new password"
            });
        }

        if (!/^\d{6}$/.test(submittedCode)) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.resetPasswordToken) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        if (user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: "Reset code has expired" });
        }

        const codeHash = hashToken(submittedCode);
        const codeMatch = crypto.timingSafeEqual(
            Buffer.from(codeHash),
            Buffer.from(user.resetPasswordToken)
        );

        if (!codeMatch) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        const authToken = generateToken(user._id);

        res.json({
            message: "Password reset successfully",
            token: authToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                currency: user.currency
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword
};
