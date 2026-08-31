const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

const isValidTransactionId = (id) => mongoose.Types.ObjectId.isValid(id);

const createTransaction = async (req, res) => {
    try {
        const { amount, type, category, description, paymentMethod, date } = req.body;

        if (amount === undefined || !type || !category) {
            return res.status(400).json({
                message: "Please provide amount, type and category"
            });
        }

        const transaction = await Transaction.create({
            user: req.user.id,
            amount,
            type,
            category,
            description,
            paymentMethod,
            date
        });

        return res.status(201).json({
            message: "Transaction created successfully",
            transaction
        });
    } catch (error) {
        return res.status(400).json({
            message: "Could not create transaction",
            error: error.message
        });
    }
};

const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
        return res.json({ transactions });
    } catch (error) {
        return res.status(500).json({ message: "Could not get transactions", error: error.message });
    }
};

const getTransactionById = async (req, res) => {
    try {
        if (!isValidTransactionId(req.params.id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        return res.json({ transaction });
    } catch (error) {
        return res.status(500).json({ message: "Could not get transaction", error: error.message });
    }
};

const updateTransaction = async (req, res) => {
    try {
        if (!isValidTransactionId(req.params.id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        const allowedFields = ["amount", "type", "category", "description", "paymentMethod", "date"];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
        );

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "Provide at least one valid field to update" });
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            updates,
            { returnDocument: "after", runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        return res.json({ message: "Transaction updated successfully", transaction });
    } catch (error) {
        return res.status(400).json({ message: "Could not update transaction", error: error.message });
    }
};

const deleteTransaction = async (req, res) => {
    try {
        if (!isValidTransactionId(req.params.id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        return res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Could not delete transaction", error: error.message });
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};
