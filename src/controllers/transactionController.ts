import { Application, Request, response, Response } from "express";

import { Transaction } from "../entities/Transaction";
import { parseCSV } from "../services/csvParserService";

import {
	TransactionInput,
	validateTransaction,
	validateCSVData,
} from "../utils/validators";
import { getEntityManager } from "../utils/entitiyManager";

// Add a transaction
export const addTransaction = async (transactionData: TransactionInput) => {
	const { date, description, amount, currency } = transactionData;

	// Validating the input
	if (!date || !description || !amount || !currency) {
		return {
			status: 400,
			message:
				"Missing required fields. Please provide date, description, amount, and currency.",
		};
	}

	// Checking validations and returning corresponding errors
	const validationErrors = validateTransaction({
		date,
		description,
		amount,
		currency,
	});

	if (validationErrors.length > 0) {
		return {
			status: 400,
			message: validationErrors.join(" "),
		};
	}

	// Converting date from dd-mm-yyyy to yyyy-mm-dd
	const parseDate = (dateString: string): string => {
		const [day, month, year] = dateString.split("-");
		return `${year}-${month}-${day}`;
	};

	const parsedDate = parseDate(date);

	try {
		const em = await getEntityManager();

		// Find if a transaction with the same date and description already exists
		const existingTransaction = await em.findOne(Transaction, {
			date: parsedDate,
			description,
			deleted: false, // Ensure we're checking only non-deleted transactions
		});

		if (existingTransaction) {
			return {
				status: 400,
				message:
					"A transaction with the same date and description already exists.",
			};
		}

		// Create and populate a new transaction entry
		const transaction = em.create(Transaction, {
			date: parsedDate,
			description,
			amount: Number(amount * 100), // As we have a precision of two
			currency,
			deleted: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Save the transaction to the database
		await em.persistAndFlush(transaction);

		return {
			status: 201,
			message: "Transaction added successfully",
			transaction,
		};
	} catch (error: unknown) {
		console.error("Transaction", transactionData);
		console.log("Error adding transaction:", error);

		return {
			status: 500,
			message: "An error occurred while adding the transaction.",
			error,
		};
	}
};

// Get all transactions
export const getAllTransactions = async (req: Request, res: Response) => {
	const { page = 1, limit = 10 } = req.query;

	try {
		const em = await getEntityManager();

		// Validate page and limit inputs
		const pageNum = Number(page);
		const limitNum = Number(limit);

		console.log(page, limit);
		console.log(pageNum, limitNum);

		if (isNaN(pageNum) || pageNum < 1) {
			if (isNaN(limitNum) || limitNum < 1) {
				// Combined response when both pageNum and limitNum are invalid
				res.status(400).json({
					message: "Invalid page and limit. Both must be positive numbers.",
				});
			} else {
				// Response when only pageNum is invalid
				res.status(400).json({
					message: "Invalid page. It must be a positive number.",
				});
			}
			return;
		}

		if (isNaN(limitNum) || limitNum < 1) {
			// Response when only limitNum is invalid
			res.status(400).json({
				message: "Invalid limit. It must be a positive number.",
			});
			return;
		}

		const transactions = await em
			.createQueryBuilder(Transaction)
			.orderBy({ date: "DESC" })
			.limit(Number(limitNum))
			.offset((Number(pageNum) - 1) * Number(limitNum))
			.getResultList();

		// console.log("transactions", transactions.length);

		// Fetch total count of transactions
		const totalCount = await em.count(Transaction);

		// If no transactions are found, return appropriate message
		if (totalCount === 0) {
			res.status(200).json({
				message: "Transactions fetched successfully. No transactions found.",
				data: totalCount,
				transactions: [],
			});
			return;
		}

		res.status(200).json({
			message: `${(pageNum - 1) * limitNum + 1} - ${
				(pageNum - 1) * limitNum + transactions.length
			} Transactions fetched successfully`,
			data: totalCount,
			transactions,
		});
	} catch (error: unknown) {
		console.error("Error fetching transactions", error);
		res.status(500).json({
			message: "Error fetching transactions",
			error: error,
		});
	}
};

// Soft delete a transaction
export const softDeleteTransaction = async (req: Request, res: Response) => {
	try {
		const em = await getEntityManager();

		const { id } = req.body;
		// const { id } = req.params;

		const transaction = await em.findOne(Transaction, { id });

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
	} catch (error: unknown) {
		console.error("Error soft deleting transaction:", error);

		res.status(500).json({
			message: "Error soft deleting transaction",
			error: error,
		});
	}
};

// Hard delete a transaction
export const hardDeleteTransaction = async (req: Request, res: Response) => {
	try {
		const em = await getEntityManager();

		const { id } = req.body;

		const transaction = await em.findOne(Transaction, { id });

		if (!transaction) {
			res.status(404).json({
				message: "Transaction not found",
			});

			return;
		}

		// Remove the transaction permanently
		await em.removeAndFlush(transaction);

		res.status(200).json({
			message: "Transaction deleted successfully",
			transaction,
		});
	} catch (error: unknown) {
		console.error("Error deleting transaction:", error);

		res.status(500).json({
			message: "Error deleting transaction",
			error: (error as Error).message,
		});
	}
};

export const softDeleteAllTransactions = async (
	req: Request,
	res: Response
) => {
	try {
		const em = await getEntityManager();

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

// Hard delete all transactions
export const hardDeleteAllTransactions = async (
	req: Request,
	res: Response
) => {
	try {
		const em = await getEntityManager();

		// Fetch all transactions (no "deleted" filter here for hard delete)
		const transactions = await em.find(Transaction, {});

		if (transactions.length === 0) {
			res.status(404).json({ message: "No transactions found to delete." });
		}

		// Permanently remove all transactions from the database
		await em.removeAndFlush(transactions);

		res.status(200).json({
			message: "All transactions have been permanently deleted.",
			deletedTransactionsCount: transactions.length,
		});
	} catch (error) {
		console.error("Error hard deleting all transactions:", error);
		res.status(500).json({
			message: "An error occurred while hard deleting all transactions.",
			error: error,
		});
	}
};

export const processTransactions = async (req: Request, res: Response) => {
	try {
		const routePath = req.originalUrl;
		console.log(`Request received from route: ${routePath}`);

		// Handle direct transaction addition for /api/addtransaction
		if (routePath == "/api/addTransaction") {
			// Validate if a single transaction payload is provided
			const { date, description, amount, currency } = req.body;

			if (!date && !description && !amount && !currency) {
				res.status(400).json({
					message:
						"Missing required fields: date, description, amount, currency. Please provide the missing fields.",
				});
				return;
			}

			const missingFields: string[] = [];

			if (!date) {
				missingFields.push("date");
			}

			if (!description) {
				missingFields.push("description");
			}

			if (!amount) {
				missingFields.push("amount");
			}

			if (!currency) {
				missingFields.push("currency");
			}

			if (missingFields.length > 0) {
				res.status(400).json({
					message: `Missing required fields: ${missingFields.join(
						", "
					)}. Please provide the missing fields.`,
				});
				return;
			}

			// Prepare transaction data
			const transactionData = {
				date: date.toString(), // Ensure proper date conversion
				description: description,
				amount: Number(amount) * 100, // Convert to cents if needed
				currency: currency,
			};

			// Add the transaction
			const result = await addTransaction(transactionData);
			console.log("Result of direct transaction addition:", result);

			if (result.status !== 201) {
				res.status(result.status).json({ message: result.message });
				return;
			}

			res.status(201).json({
				message: "Transaction added successfully.",
				transaction: transactionData,
			});
			return;
		}
		// Handle CSV upload
		if (req.file == null) {
			res.status(400).json({ message: "No file uploaded" });
			return;
		}

		console.log("req.file", req.file);

		// Parse the CSV data into JSON format
		const parsedData = await parseCSV(req.file.buffer);
		console.log("parsedData", parsedData);

		// Validate the parsed data
		const validationErrors = validateCSVData(parsedData);
		console.log("validationErrors", validationErrors);

		// If validation errors exist, return the errors
		if (validationErrors.errors.length > 0) {
			res.status(400).json({
				message: "Validation failed for some records.",
				errors: validationErrors.errors,
			});
			return;
		}

		// Prepare an array to store valid transaction data
		const transactionArray: TransactionInput[] = [];

		// Get the entity manager
		const entityManager = await getEntityManager();

		// Process valid records for insertion
		parsedData.forEach((record) => {
			const { date, description, amount, currency } = record;

			console.log("record", record);

			// Convert date from dd-mm-yyyy to yyyy-mm-dd
			const parseDate = (dateString: string): string => {
				const [day, month, year] = dateString.split("-");
				return `${year}-${month}-${day}`;
			};

			const parsedDate = parseDate(date);

			// Prepare the transaction data for insertion
			const transaction = entityManager.create(Transaction, {
				date: parsedDate,
				description,
				amount: Number(amount) * 100, // Convert to cents if needed
				currency,
				deleted: false, // Default flag for new transactions
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			transactionArray.push(transaction);
		});

		// Bulk insert the transactions
		await entityManager.persistAndFlush(transactionArray);

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
