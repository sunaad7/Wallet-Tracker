const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const protect = require("../middleware/authMiddleware");
const {
    createGoal,
    getGoals,
    updateGoal,
    addGoalFunds,
    deleteGoal
} = require("../controllers/goalController");

const router = express.Router();

router.use(protect);

router.post("/", validate([
    body("name").trim().notEmpty().withMessage("Goal name is required").isLength({ max: 100 }),
    body("targetAmount").isFloat({ gt: 0 }).withMessage("Target amount must be greater than 0"),
    body("currentAmount").optional().isFloat({ min: 0 }).withMessage("Current amount cannot be negative")
]), createGoal);

router.get("/", getGoals);

router.route("/:id")
    .put(validate([
        body("targetAmount").optional().isFloat({ gt: 0 }).withMessage("Target amount must be greater than 0"),
        body("currentAmount").optional().isFloat({ min: 0 }).withMessage("Current amount cannot be negative")
    ]), updateGoal)
    .delete(deleteGoal);

router.post("/:id/funds", validate([
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0")
]), addGoalFunds);

module.exports = router;
