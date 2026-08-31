const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
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

    targetAmount: {
        type: Number,
        required: true,
        min: 1
    },

    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    deadline: {
        type: Date
    },

    monthlyContribution: {
        type: Number,
        default: 0,
        min: 0
    },

    color: {
        type: String,
        default: "#10b981"
    },

    completed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Goal", goalSchema);
