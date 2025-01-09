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

router.get("/softDeleteTransaction", softDeleteTransaction);

router.get("/hardDeleteTransaction", hardDeleteTransaction);

export default router;
