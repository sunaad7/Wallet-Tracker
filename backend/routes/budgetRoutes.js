const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const protect = require("../middleware/authMiddleware");
const {
    createBudget,
    getBudgets,
    updateBudget,
    deleteBudget
} = require("../controllers/budgetController");

const router = express.Router();

router.use(protect);

router.post("/", validate([
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"),
    body("month").optional().matches(/^\d{4}-\d{2}$/).withMessage("Month must be YYYY-MM"),
    body("alertThreshold").optional().isInt({ min: 0, max: 100 }).withMessage("Alert threshold must be 0-100")
]), createBudget);

router.get("/", getBudgets);

router.route("/:id")
    .put(validate([
        body("amount").optional().isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"),
        body("month").optional().matches(/^\d{4}-\d{2}$/).withMessage("Month must be YYYY-MM")
    ]), updateBudget)
    .delete(deleteBudget);

module.exports = router;
