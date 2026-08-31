const express = require('express');
const { registerUser, loginUser, getProfile, updateProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);


module.exports = router;   
