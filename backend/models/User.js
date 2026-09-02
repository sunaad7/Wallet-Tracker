const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: false
    },

    provider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },

    providerId: {
        type: String,
        default: null
    },

    currency: {
        type: String,
        default: "USD",
        trim: true
    },

    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
        default: null
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
