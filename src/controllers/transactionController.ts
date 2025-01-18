import { Request, Response } from "express";

import { Transaction } from "../entities/Transaction";
import { parseCSV } from "../services/csvParserService";

import {
	TransactionInput,
	validateTransaction,
	validateCSVData,
	checkForDuplicatesInCSV,
	checkForDuplicatesInDB,
} from "../utils/validators";

import { getForkedEntityManager } from "../utils/entityManager";

// Add a single transaction
export const addTransaction = async (req: Request, res: Response) => {
	const { date, description, amount, currency } = req.body;

	// Checking validations and returning corresponding errors
	const validationErrors = validateTransaction({
		date,
		description,
		amount,
		currency,
	});

	if (validationErrors.length > 0) {
		res.status(400).json({
			success: false,
			message: validationErrors.join(" "),
		});
		return;
	}
	// console.log("date", date, description, amount, currency);

	// // Converting date from dd-mm-yyyy to yyyy-mm-dd
	// const parseDate = (dateString: string): string => {
	// 	const [day, month, year] = dateString.split("-");
	// 	return `${year}-${month}-${day}`;
	// };

	// const parsedDate = parseDate(date);

	try {
		const em = await getForkedEntityManager();

		// Find if a transaction with the same date and description already exists
		const existingTransaction = await em.findOne(Transaction, {
			date: date,
			description,
			deleted: false, // Ensure we're checking only non-deleted transactions
		});

		if (existingTransaction) {
			res.status(400).json({
				success: false,
				message:
					"A transaction with the same date and description already exists.",
			});
			return;
		}

		// Create and populate a new transaction entry
		const transaction = em.create(Transaction, {
			date: date,
			description,
			amount: amount * 100, // As we have a precision of two
			// to do update type as float in db but it would return a string from db
			amountInINR: amount * 100 * 80,
			currency,
			deleted: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Save the transaction to the database
		await em.persistAndFlush(transaction);

		res.status(201).json({
			success: true,
			message: "Transaction added successfully",
			transaction,
		});
		return;
	} catch (error: unknown) {
		console.error("Error adding transaction:", error);

		res.status(500).json({
			success: false,
			message: "An error occurred while adding the transaction.",
			error: error,
		});
		return;
	}
};

// Get all transactions
export const getAllTransactions = async (req: Request, res: Response) => {
	const { page = 1, limit = 10 } = req.query;

	try {
		const em = await getForkedEntityManager();

		// Validate page and limit inputs
		const pageNum = Number(page);
		const limitNum = Number(limit);

		if (isNaN(pageNum) || pageNum < 1) {
			if (isNaN(limitNum) || limitNum < 1) {
				// Combined response when both pageNum and limitNum are invalid
				res.status(400).json({
					success: false,
					message: "Invalid 'page' and 'limit'. Both must be positive numbers.",
					data: null,
				});
				return;
			}

			// Response when only pageNum is invalid
			res.status(400).json({
				success: false,
				message: "Invalid 'page'. It must be a positive number.",
				data: null,
			});
			return;
		}

		if (isNaN(limitNum) || limitNum < 1) {
			// Response when only limitNum is invalid
			res.status(400).json({
				success: false,
				message: "Invalid 'limit'. It must be a positive number.",
				data: null,
			});
			return;
		}

		// Run queries in parallel using Promise.all
		const [transactions, totalCount] = await Promise.all([
			em.find(
				Transaction,
				{ deleted: false }, // Exclude deleted transactions
				{
					orderBy: { date: "DESC" },
					limit: limitNum,
					offset: (pageNum - 1) * limitNum,
				}
			),
			em.count(Transaction, { deleted: false }),
		]);

		if (totalCount === 0) {
			// No transactions found
			res.status(204).json({
				success: true,
				message: "No transactions found.",
				data: {
					totalCount: totalCount,
					transactions: [],
				},
			});
			return;
		}

		// Transactions fetched successfully
		res.status(200).json({
			success: true,
			message: "Transactions fetched successfully.",
			data: {
				totalCount: totalCount,
				transactions: transactions,
			},
		});
		return;
	} catch (error: unknown) {
		console.error("Error fetching transactions", error);

		// Internal Server Error
		res.status(500).json({
			success: false,
			message: "An error occurred while fetching transactions.",
			error: error instanceof Error ? error.message : "Unknown error",
			data: null,
		});
		return;
	}
};

// Soft delete a transaction
export const deleteTransaction = async (req: Request, res: Response) => {
	try {
		const em = await getForkedEntityManager();

		// const { id } = req.body;
		const { id } = req.params;
		console.log("id", id);

		const transaction = await em.findOne(Transaction, { id, deleted: false });
		// check for already deleted

		if (!transaction) {
			res.status(404).json({
				message: "Transaction not found",
			});

			return;
		}

		transaction.deleted = true;
		await em.flush();

		res.status(200).json({
			message: "Transaction soft deleted successfully",
			transaction,
		});
		return;
	} catch (error: unknown) {
		console.error("Error soft deleting transaction:", error);

		res.status(500).json({
			message: "Error soft deleting transaction",
			error: error,
		});
	}
};

// Soft delete all transaction
export const deleteAllTransactions = async (req: Request, res: Response) => {
	try {
		const em = await getForkedEntityManager();

		// Fetch all active transactions (not deleted)
		const transactions = await em.find(Transaction, { deleted: false });

		if (transactions.length === 0) {
			res
				.status(404)
				.json({ message: "No transactions found to soft delete." });
			return;
		}

		// Mark each transaction as deleted (soft delete)
		transactions.forEach((transaction) => {
			transaction.deleted = true;
			transaction.updatedAt = new Date(); // Update updatedAt timestamp
		});

		// Persist changes
		await em.persistAndFlush(transactions);

		res.status(200).json({
			message: "All transactions have been soft deleted successfully.",
			deletedTransactionsCount: transactions.length,
		});
	} catch (error) {
		console.error("Error soft deleting all transactions:", error);
		res.status(500).json({
			message: "An error occurred while soft deleting all transactions.",
			error: error,
		});
	}
};

// Add multiple transaction through csv file
export const processTransactions = async (req: Request, res: Response) => {
	try {
		// const routePath = req.originalUrl;
		// console.log(`Request received from route: ${routePath}`);

		// // Handle direct transaction addition for /api/addtransaction
		// if (routePath === "/api/addTransaction") {
		// }
		// console.log("out");

		const skipCSVDuplicates = req.body?.skipCSVDuplicates || "false";

		console.log(
			"skipCSVDuplicates",
			skipCSVDuplicates,
			typeof skipCSVDuplicates,
			req.headers
		);

		// Handle CSV upload
		if (req.file == null) {
			res.status(400).json({ message: "No file uploaded" });
			return;
		}
		// console.log("req", req);
		// console.log("req.file", req.file);

		// Parse the CSV data into JSON format
		const parsedData: TransactionInput[] = await parseCSV(req.file.buffer);
		// console.log("parsedData", parsedData);

		// Validate the parsed data
		const { validationErrors, duplicationErrors, duplicates } =
			validateCSVData(parsedData);
		console.log(
			"result from validateCSVData",
			validationErrors,
			duplicationErrors,
			duplicates
		);

		// If validation errors exist, return the errors
		if (
			validationErrors.length > 0 ||
			(duplicationErrors.length > 0 && skipCSVDuplicates === "false")
		) {
			res.status(400).json({
				message: `Validation failed for some records.`,
				validationErrors: validationErrors,
				duplicationErrors: duplicationErrors,
			});
			return;
		}

		const existingTransaction = await checkForDuplicatesInDB(parsedData);

		console.log("existingTransaction", existingTransaction);

		// If duplication in db exist, return the errors
		if (existingTransaction.length > 0) {
			res.status(400).json({
				message: `duplication in DB for some records.`,
				existingTransaction: existingTransaction,
			});
			return;
		}

		// Prepare an array to store valid transaction data
		const transactionArray: TransactionInput[] = [];

		const em = await getForkedEntityManager();

		// Process valid records for insertion
		parsedData.forEach((record, index) => {
			if (duplicates.includes(index + 1)) {
				return;
			}

			const { date, description, amount, currency } = record;

			console.log("record", record);

			// Ensure description does not exceed 255 characters
			const truncatedDescription: string =
				description.length > 255 ? description.slice(0, 255) : description;

			// // Convert date from dd-mm-yyyy to yyyy-mm-dd
			// const parseDate = (dateString: string): string => {
			// 	const [day, month, year] = dateString.split("-");
			// 	return `${year}-${month}-${day}`;
			// };

			// const parsedDate = parseDate(date);

			// Prepare the transaction data for insertion
			const transaction = em.create(Transaction, {
				date: date,
				description: truncatedDescription,
				amount: amount * 100,
				amountInINR: amount * 100 * 80,
				currency,
				deleted: false, // Default flag for new transactions
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			transactionArray.push(transaction);
		});

		// Bulk insert the transactions
		await em.persistAndFlush(transactionArray);

		// Send response with the count of successful transactions
		res.status(201).json({
			message: `${transactionArray.length} transactions added successfully.`,
			successCount: transactionArray.length,
			data: transactionArray,
		});
	} catch (error: unknown) {
		console.error("Error while uploading and processing CSV:", error);

		// Handle general errors
		res.status(500).json({
			message: "An error occurred while processing the CSV file.",
			error: (error as Error).message || "Unknown error",
		});
	}
};

// Edit a transaction
export const editTransaction = async (req: Request, res: Response) => {
	const { id } = req.params; // Transaction ID from the request URL
	const { date, description, amount, currency } = req.body; // New data
	console.log("body", id, date, description, amount, currency);

	try {
		const em = await getForkedEntityManager();

		// Find the transaction by ID
		const transaction = await em.findOne(Transaction, { id, deleted: false });

		if (!transaction) {
			res.status(404).json({
				message: `Transaction with ID ${id} not found.`,
			});
			return;
		}

		// Validate new data
		const validationErrors = validateTransaction({
			date,
			description,
			amount,
			currency,
		});

		if (validationErrors.length > 0) {
			res.status(400).json({
				message: validationErrors.join(" "),
			});
			return;
		}

		// Update transaction fields only if they are provided
		if (date) {
			transaction.date = date;
		}
		if (description) transaction.description = description;
		if (amount) transaction.amount = amount * 100; // Update with precision
		if (currency) transaction.currency = currency;

		transaction.updatedAt = new Date(); // Update timestamp

		// Persist changes
		await em.persistAndFlush(transaction);

		res.status(200).json({
			message: "Transaction updated successfully.",
			transaction,
		});
		return;
	} catch (error) {
		console.error("Error editing transaction:", error);
		res.status(500).json({
			message: "An error occurred while editing the transaction.",
			error,
		});
		return;
	}
};
