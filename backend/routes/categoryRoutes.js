const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const protect = require("../middleware/authMiddleware");
const {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const router = express.Router();

router.use(protect);

router.post("/", validate([
    body("name").trim().notEmpty().withMessage("Category name is required").isLength({ max: 50 }),
    body("type").optional().isIn(["income", "expense"]).withMessage("Type must be income or expense")
]), createCategory);

router.get("/", getCategories);

router.route("/:id")
    .put(validate([
        body("name").optional().trim().notEmpty().withMessage("Category name cannot be empty"),
        body("type").optional().isIn(["income", "expense"]).withMessage("Type must be income or expense")
    ]), updateCategory)
    .delete(deleteCategory);

module.exports = router;
