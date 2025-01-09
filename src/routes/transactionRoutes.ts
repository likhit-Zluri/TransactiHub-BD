import express from "express";
import {
	addTransaction,
	getAllTransactions,
	softDeleteTransaction,
	hardDeleteTransaction,
} from "../controllers/transactionController";

const router = express.Router();

// Add a single transaction
router.post("/addTransaction", addTransaction);

// Get all transaction
router.get("/getAllTransactions", getAllTransactions);

router.delete("/softDeleteTransaction", softDeleteTransaction);

router.post("/hardDeleteTransaction", hardDeleteTransaction);

export default router;
