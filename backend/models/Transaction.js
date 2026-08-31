const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    type: {
        type: String,
        enum: ["income", "expense"],
        required: true
    },

    category: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    paymentMethod: {
        type: String,
        enum: ["cash", "credit card", "debit card", "bank transfer", "other"],
        default: "other"
    },

    date: {
        type: Date,
        default: Date.now
    }
},
    {
        timestamps: true
    }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;