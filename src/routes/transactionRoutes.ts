import express from "express";
import {
	getAllTransactions,
	softDeleteTransaction,
	hardDeleteTransaction,
	hardDeleteAllTransactions,
	softDeleteAllTransactions,
	processTransactions,
} from "../controllers/transactionController";

// import multer from "multer";
// const upload = multer();

import { handleUpload } from "../utils/multerConfig";

const router = express.Router();

// Add a single transaction
// router.post("/addTransaction", addTransaction);
router.post("/addTransaction", processTransactions);

// Get all transaction
router.get("/getAllTransactions", getAllTransactions);

router.delete("/softDeleteTransaction", softDeleteTransaction);

router.delete("/hardDeleteTransaction", hardDeleteTransaction);

// Uploading CSV
router.post("/processCSV", handleUpload, processTransactions);

router.delete("/softDeleteAllTransactions", softDeleteAllTransactions);

router.delete("/hardDeleteAllTransactions", hardDeleteAllTransactions);

export default router;
