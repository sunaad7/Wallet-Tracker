const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const protect = require("../middleware/authMiddleware");
const {
    createRecurring,
    getRecurring,
    updateRecurring,
    deleteRecurring
} = require("../controllers/recurringController");

const router = express.Router();

router.use(protect);

router.post("/", validate([
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("type").optional().isIn(["income", "expense"]).withMessage("Type must be income or expense"),
    body("frequency").isIn(["daily", "weekly", "monthly", "yearly"]).withMessage("Invalid frequency"),
    body("dayOfMonth").optional().isInt({ min: 1, max: 31 }).withMessage("Day of month must be 1-31"),
    body("dayOfWeek").optional().isInt({ min: 0, max: 6 }).withMessage("Day of week must be 0-6"),
    body("nextDueDate").optional().isISO8601().withMessage("Invalid due date")
]), createRecurring);

router.get("/", getRecurring);

router.route("/:id")
    .put(validate([
        body("amount").optional().isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"),
        body("frequency").optional().isIn(["daily", "weekly", "monthly", "yearly"]).withMessage("Invalid frequency")
    ]), updateRecurring)
    .delete(deleteRecurring);

module.exports = router;
