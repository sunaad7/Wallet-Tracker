const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },

    type: {
        type: String,
        enum: ["income", "expense"],
        required: true
    },

    color: {
        type: String,
        default: "#6366f1"
    },

    icon: {
        type: String,
        default: "tag"
    }
}, {
    timestamps: true
});

categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
