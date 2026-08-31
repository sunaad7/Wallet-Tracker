const mongoose = require('mongoose');

const recurringSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: String,
        required: true,
        trim: true
    },

    type: {
        type: String,
        enum: ["income", "expense"],
        default: "expense"
    },

    frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
        required: true
    },

    dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
        default: 1
    },

    dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        default: 1
    },

    description: {
        type: String,
        trim: true
    },

    nextDueDate: {
        type: Date,
        required: true
    },

    active: {
        type: Boolean,
        default: true
    },

    lastProcessed: {
        type: Date
    }
}, {
    timestamps: true
});

recurringSchema.index({ user: 1, active: 1, nextDueDate: 1 });

module.exports = mongoose.model("RecurringPayment", recurringSchema);
