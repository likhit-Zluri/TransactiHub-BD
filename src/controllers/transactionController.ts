import { Request, Response } from "express";

import { Transaction } from "../entities/Transaction";

import { parseCSV } from "../services/csvParserService";

import {
	TransactionInput,
	validateTransaction,
	validateCSVData,
	checkForDuplicatesInDB,
} from "../utils/validators";

import { convertCurrency } from "../utils/currencyConverter";

import { getForkedEntityManager } from "../utils/entityManager";
import { dateFormatter } from "../utils/dataFormatter";
import { addSingleTransactionToDB } from "../Database/dataBaseAccessLayer";

// Add a single transaction
export const addTransaction = async (req: Request, res: Response) => {
	let { date, description, amount, currency } = req.body;
	description = description?.trim();

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
			data: { transaction: [] },
		});
		return;
	}
	console.log("body in addTransaction", date, description, amount, currency);

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
			parsedDate: dateFormatter(date),
			description,
			deleted: false, // Ensure we're checking only non-deleted transactions
		});
		console.log("after");

		if (existingTransaction) {
			res.status(400).json({
				success: false,
				message:
					"A transaction with the same date and description already exists.",
				data: { transaction: [] },
			});
			return;
		}

		console.log("Got here");

		// Create and populate a new transaction entry
		// const transaction = em.create(Transaction, {
		// 	date: date,
		// 	description,
		// 	parsedDate: dateFormatter(date),
		// 	amount: amount * 100, // As we have a precision of two
		// 	// to do update type as float in db but it would return a string from db
		// 	amountInINR: await convertCurrency(amount * 100, currency, date),
		// 	// amountInINR: amount * 100 * 80,
		// 	currency,
		// 	deleted: false,
		// 	createdAt: new Date(),
		// 	updatedAt: new Date(),
		// });

		// console.log("Creatingdata");

		// // Save the transaction to the database
		// await em.persistAndFlush(transaction);

		const transaction = await addSingleTransactionToDB(
			date,
			description,
			amount,
			currency
		);

		// Save the transaction to the database
		await em.persistAndFlush(transaction);

		res.status(201).json({
			success: true,
			message: "Transaction added successfully",
			data: { transaction },
		});
		return;
	} catch (error: unknown) {
		console.error("Error adding transaction:", error);

		if (error instanceof Error) {
			res.status(500).json({
				success: false,
				message: error.message,
			});
			return;
		}

		res.status(500).json({
			success: false,
			message: "An error occurred while adding the transaction.",
			data: { transaction: [] },
		});
		return;
	}
};

// Get all transactions
export const getAllTransactions = async (req: Request, res: Response) => {
	try {
		const em = await getForkedEntityManager();

		// Run queries in parallel using Promise.all
		const [transactions, totalCount] = await em.findAndCount(
			Transaction,
			{ deleted: false }, // dont get the deleted transaction
			{
				orderBy: { parsedDate: "DESC" },
			}
		);

		console.log("getAllTransactions response", transactions, totalCount);

		if (totalCount === 0) {
			// No transactions found
			res.status(200).json({
				success: true,
				message: "No transactions found.",
				data: {
					totalCount: 0,
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

		if (error instanceof Error) {
			res.status(500).json({
				success: false,
				message: error.message,
			});
			return;
		}
		// Internal Server Error
		res.status(500).json({
			success: false,
			message: "An error occurred while fetching all transactions.",
			data: {
				totalCount: -1,
				transactions: [],
			},
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
				success: false,
				message: "Transaction not found",
			});

			return;
		}

		transaction.deleted = true;
		await em.flush();

		res.status(200).json({
			success: true,
			message: "Transaction deleted successfully",
		});
		return;
	} catch (error: unknown) {
		console.error("Error soft deleting transaction:", error);

		if (error instanceof Error) {
			res.status(500).json({
				success: false,
				message: error.message,
			});
			return;
		}

		res.status(500).json({
			success: false,
			message: "An error occurred while deleting the transaction.",
			error: error,
		});
	}
};

// Soft delete all transaction
export const deleteAllTransactions = async (req: Request, res: Response) => {
	try {
		console.log("in deleteAllTransactions");

		const em = await getForkedEntityManager();

		// Fetch all active transactions (not deleted)
		const transactions = await em.find(Transaction, { deleted: false });

		if (transactions.length === 0) {
			res.status(404).json({
				success: false,
				message: "No transactions found to delete.",
			});
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
			success: true,
			message: "All transactions have been deleted successfully.",
			deletedTransactionsCount: transactions.length,
		});
	} catch (error: unknown) {
		console.error("Error soft deleting all transactions:", error);

		if (error instanceof Error) {
			res.status(500).json({
				success: false,
				message: error.message,
			});
			return;
		}

		res.status(500).json({
			success: false,
			message: "An error occurred while deleting all transactions.",
			error: error,
		});
	}
};

export const deleteMultipleTransactions = async (
	req: Request,
	res: Response
) => {
	const { ids } = req.body;
	console.log("req.body", req.body);
	console.log("ids", ids);

	if (!Array.isArray(ids) || ids.length === 0) {
		res
			.status(400)
			.json({ message: "Invalid input. 'ids' must be a non-empty array." });
		return;
	}

	try {
		const em = await getForkedEntityManager();

		// Mark transactions as deleted by setting delete = true
		await em.nativeUpdate(Transaction, { id: { $in: ids } }, { deleted: true });

		res
			.status(200)
			.json({ success: true, message: "Transactions deleted successfully." });
		return;
	} catch (error) {
		console.error("Error deleting transactions:", error);
		if (error instanceof Error) {
			res.status(500).json({
				success: false,
				message: error.message,
			});
			return;
		}

		res.status(500).json({
			message: "An error occurred while deleting transactions.",
			error,
		});
		return;
	}
};

// Add multiple transaction through csv file
export const processTransactions = async (req: Request, res: Response) => {
	try {
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
		const { validationErrors, DuplicationErrors, duplicates } =
			validateCSVData(parsedData);
		console.log(
			"result from validateCSVData",
			validationErrors,
			DuplicationErrors,
			duplicates
		);

		// If validation errors exist, return the errors
		if (
			validationErrors.length > 0 ||
			(DuplicationErrors.length > 0 && skipCSVDuplicates === "false")
		) {
			res.status(400).json({
				message: `Validation failed for some records.`,
				errors: {
					validationErrors: validationErrors,
					duplicationErrors:
						skipCSVDuplicates === "true" ? [] : DuplicationErrors,
					existingTransaction: [],
				},
			});
			return;
		}

		const existingTransaction = await checkForDuplicatesInDB(parsedData);

		console.log("existingTransaction", existingTransaction);

		// If duplication in db exist, return the errors
		if (existingTransaction.length > 0) {
			res.status(400).json({
				message: "Duplication present in DB for some records.",
				errors: {
					validationErrors: [],
					duplicationErrors: [],
					existingTransaction: existingTransaction,
				},
			});
			return;
		}

		// Prepare an array to store valid transaction data
		const transactionArray: TransactionInput[] = [];

		const em = await getForkedEntityManager();

		// Process valid records for insertion
		await Promise.all(
			parsedData.map(async (record, index) => {
				if (duplicates.includes(index + 1)) {
					return;
				}

				const { date, description, amount, currency } = record;
				const trimmedDescription = description?.trim();

				// console.log("record", record);

				// Ensure description does not exceed 255 characters
				const truncatedDescription: string =
					trimmedDescription.length > 255
						? trimmedDescription.slice(0, 255)
						: trimmedDescription;

				// // Convert date from dd-mm-yyyy to yyyy-mm-dd
				// const parseDate = (dateString: string): string => {
				// 	const [day, month, year] = dateString.split("-");
				// 	return `${year}-${month}-${day}`;
				// };

				// const parsedDate = parseDate(date);

				// Prepare the transaction data for insertion
				// const transaction = em.create(Transaction, {
				// 	date: date,
				// 	parsedDate: dateFormatter(date),
				// 	description: truncatedDescription,
				// 	amount: amount * 100,
				// 	amountInINR: await convertCurrency(amount * 100, currency, date),
				// 	// amountInINR: amount * 100 * 80,
				// 	currency,
				// 	deleted: false, // Default flag for new transactions
				// 	createdAt: new Date(),
				// 	updatedAt: new Date(),
				// });

				const transaction = await addSingleTransactionToDB(
					date,
					description,
					amount,
					currency
				);

				transactionArray.push(transaction);
			})
		);

		console.log("transactionArray", transactionArray);

		// Bulk insert the transactions
		await em.persistAndFlush(transactionArray);

		// Send response with the count of successful transactions
		res.status(201).json({
			message: `${transactionArray.length} transactions added successfully.`,
			successCount: transactionArray.length,
			data: transactionArray,
		});
	} catch (error: unknown) {
		console.error("Error in processing CSV file.", error);

		if (error instanceof Error) {
			res.status(500).json({
				success: false,
				message: error.message,
			});
			return;
		}

		res.status(500).json({
			message: "An error occurred while processing the CSV file.",
			error: error,
		});
	}
};

// Edit a transaction
export const editTransaction = async (req: Request, res: Response) => {
	const { id } = req.params; // Transaction ID from the request URL
	let { date, description, amount, currency } = req.body; // New data
	description = description?.trim();

	console.log("body", id, date, description, amount, currency);

	try {
		const em = await getForkedEntityManager();

		// Find the transaction by ID
		const transaction = await em.findOne(Transaction, { id, deleted: false });

		if (!transaction) {
			res.status(404).json({
				success: false,
				message: `Transaction not found.`,
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
				success: false,
				message: validationErrors.join(" "),
			});
			return;
		}

		// Update transaction fields only if they are provided

		if (description) transaction.description = description;
		if (amount || currency || date) {
			if (amount) {
				transaction.amount = amount * 100; // Update with precision
			}
			if (currency) {
				transaction.currency = currency;
			}
			if (date) {
				transaction.date = date;
				transaction.parsedDate = new Date(dateFormatter(date));
			}

			// Recalculate the amount in INR if amount, currency, or date changes
			const updatedAmount = amount ? amount * 100 : transaction.amount;
			const updatedCurrency = currency || transaction.currency;
			const updatedDate = date || transaction.date;

			// transaction.amountInINR = await convertCurrency(
			// 	updatedAmount,
			// 	updatedCurrency,
			// 	updatedDate
			// );

			transaction.amountInINR = amount
				? amount * 80 * 100
				: transaction.amountInINR;
		}

		transaction.updatedAt = new Date(); // Update timestamp

		// Persist changes
		await em.persistAndFlush(transaction);

		res.status(200).json({
			success: true,
			message: "Transaction updated successfully.",
			data: { transaction },
		});
		return;
	} catch (error: unknown) {
		if (error instanceof Error) {
			// console.error("Error editing transaction:", error);
			console.error("Error editing transaction:", error.message);
			if (
				error.message.includes(
					'violates unique constraint "unique_transction_not_deleted"'
				)
			)
				res.status(400).json({
					success: false,
					message:
						"Duplicate transaction: combination of date and description already exists.",
				});
			return;
		}

		res.status(500).json({
			success: false,
			message: "An error occurred while editing the transaction.",
		});
	}
};

// // Get all transactions as pagination is handled on the frontend
export const getPaginatedTransactions = async (req: Request, res: Response) => {
	try {
		// Get pagination and search parameters from the query string
		const { page = 1, limit = 10, search = "" } = req.query;

		// Convert page and limit to numbers
		const pageNumber = parseInt(page as string, 10);
		const pageSizeNumber = parseInt(limit as string, 10);

		console.log("getPaginatedTransactions2", pageNumber, pageSizeNumber);

		if (isNaN(pageNumber) || pageNumber < 1) {
			if (isNaN(pageSizeNumber) || pageSizeNumber < 1) {
				console.log("Invalid 'page' and 'limit'");
				// Combined response when both pageNum and limitNum are invalid
				res.status(400).json({
					success: false,
					message: "Invalid 'page' and 'limit'. Both must be positive numbers.",
					data: {
						totalCount: -1,
						transactions: null,
					},
				});
				return;
			}
			console.log("Invalid 'page'");
			// Response when only pageNum is invalid
			res.status(400).json({
				success: false,
				message: "Invalid 'page'. It must be a positive number.",
				data: {
					totalCount: -1,
					transactions: null,
				},
			});
			return;
		}

		if (isNaN(pageSizeNumber) || pageSizeNumber < 1) {
			// Response when only limitNum is invalid
			res.status(400).json({
				success: false,
				message: "Invalid 'limit'. It must be a positive number.",
				data: {
					totalCount: -1,
					transactions: null,
				},
			});
			return;
		}

		// Calculate offset for pagination
		const offset = (pageNumber - 1) * pageSizeNumber;

		// Build the search query
		const searchConditions: any = {};

		// Search by date if provided
		// if (date) {
		// 	console.log("date");
		// 	searchConditions.parsedDate = date; // Assuming the date is stored in `YYYY-MM-DD` format
		// }

		// Search by description if provided
		if (search) {
			console.log("search");
			searchConditions.description = {
				$ilike: `%${search}%`, // Case-insensitive partial match
			};
		}
		searchConditions.deleted = false;

		// Get the EntityManager from MikroORM
		const em = await getForkedEntityManager();

		// Retrieve transactions with pagination and search filters
		const [transactions, totalCount] = await em.findAndCount(
			Transaction,
			searchConditions,
			{
				orderBy: { parsedDate: "DESC" },
				limit: Number(pageSizeNumber),
				offset: offset,
			}
		);

		if (totalCount === 0) {
			// No transactions found
			res.status(200).json({
				success: true,
				message: "No transactions found.",
				data: {
					totalCount: 0,
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
	} catch (error) {
		console.error("Error fetching paginated transactions:", error);

		if (error instanceof Error) {
			res.status(500).json({
				success: false,
				message: error.message,
			});
			return;
		}

		res.status(500).json({
			success: false,
			message: "An error occurred while fetching paginated transactions.",
			data: {
				totalCount: -1,
				transactions: null,
			},
		});
		return;
	}
};
