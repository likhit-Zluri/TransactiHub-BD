import express from "express";
import {
	addTransaction,
	// getAllTransactions,
	deleteTransaction,
	deleteAllTransactions,
	processTransactions,
	editTransaction,
	deleteMultipleTransactions,
	getPaginatedTransactions,
} from "../controllers/transactionController";

// import multer from "multer";
// const upload = multer();

import { handleCSVUpload } from "../utils/multerConfig";

const router = express.Router();

// Add a single transaction
router.post("/transactions", addTransaction);

// Edit a transaction
router.put("/transactions/:id", editTransaction);

// Get all transactions
// router.get("/alltransactions", getAllTransactions);

// Get paginated transactions
router.get("/transactions", getPaginatedTransactions);
// router.get("/searchtransactions", getPaginatedTransactions2);

// Delete a transaction
router.delete("/transactions/:id", deleteTransaction);

// Add multiple transactions through csv
router.post("/transactions/upload", handleCSVUpload, processTransactions);

// Delete all transactions
router.delete("/allTransactions", deleteAllTransactions);

// Delete multiple transactions
router.delete("/transactions", deleteMultipleTransactions);

export default router;
