const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
} = require("../controllers/transactionController");
const {
    getFilteredTransactions,
    invalidateTransactionCache
} = require("../controllers/analyticsController");


const router = express.Router();

router.use(protect);

router.route("/")
    .post(invalidateTransactionCache, createTransaction)
    .get(getTransactions);

router.get("/filter", getFilteredTransactions);

router.route("/:id")
    .get(getTransactionById)
    .put(invalidateTransactionCache, updateTransaction)
    .delete(invalidateTransactionCache, deleteTransaction);

module.exports = router;
