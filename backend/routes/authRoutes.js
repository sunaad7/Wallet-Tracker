const express = require('express');
const { registerUser, loginUser, getProfile, updateProfile, forgotPassword, resetPassword, socialLogin } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/social", socialLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Public OAuth client identifiers for the frontend social-login buttons.
router.get("/config", (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || ""
    });
});

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);


module.exports = router;   
