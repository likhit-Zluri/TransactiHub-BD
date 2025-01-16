import express from "express";
import {
	addTransaction,
	getAllTransactions,
	deleteTransaction,
	deleteAllTransactions,
	processTransactions,
	editTransaction,
} from "../controllers/transactionController";

// import multer from "multer";
// const upload = multer();

import { handleCSVUpload } from "../utils/multerConfig";

const router = express.Router();

// Add a single transaction
// router.post("/addTransaction", addTransaction);
router.post("/transactions", addTransaction);
// transaction addTransaction

//edit a transaction
router.put("/transactions/:id", editTransaction);
// put

// Get all transaction
router.get("/transactions", getAllTransactions);

router.delete("/transactions/:id", deleteTransaction);
// deleteTransaction/:id

// Uploading CSV
router.post("/transactions/upload", handleCSVUpload, processTransactions);

router.delete("/transactions", deleteAllTransactions);

export default router;
