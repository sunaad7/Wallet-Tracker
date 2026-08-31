const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
    getDashboard,
    getAnalytics
} = require("../controllers/analyticsController");
const { getInsights } = require("../controllers/insightsController");

const router = express.Router();

router.use(protect);

router.get("/dashboard", getDashboard);
router.get("/analytics", getAnalytics);
router.get("/insights", getInsights);

module.exports = router;
