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
import {
	addMultipleTransaction,
	addSingleTransaction,
	deleteAllNonDeletedTransactions,
	deleteMultipleNonDeletedTransactions,
	deleteSingleTransaction,
	editSingleTransaction,
	findAndCountPaginatedNonDeletedTransactions,
	findSingleTransactionByDateDesc,
	findSingleTransactionByID,
} from "../Database/dataBaseAccessLayer";
import { UUID } from "crypto";

// Add a single transaction
export const addTransaction = async (req: Request, res: Response) => {
	let { date, description, amount, currency } = req.body;

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

	description = description?.trim();

	try {
		const existingTransaction = await findSingleTransactionByDateDesc(
			date,
			description
		);

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

		const transaction = await addSingleTransaction(
			date,
			description,
			amount,
			currency
		);

		res.status(201).json({
			success: true,
			message: "Transaction added successfully",
			data: { transaction },
		});
		return;
	} catch (error: unknown) {
		console.error("Error in addTransaction:", error);

		res.status(500).json({
			success: false,
			message: "An error occurred while adding the transaction.",
			data: { transaction: [] },
		});
		return;
	}
};

// Get all transactions
// export const getAllTransactions = async (req: Request, res: Response) => {
// 	try {
// 		const { transactions, totalCount } =
// 			await findAndCountAllNonDeletedTransactions();

// 		console.log("getAllTransactions response", transactions, totalCount);

// 		if (totalCount === 0) {
// 			// No transactions found
// 			res.status(200).json({
// 				success: true,
// 				message: "No transactions found.",
// 				data: {
// 					totalCount: 0,
// 					transactions: [],
// 				},
// 			});
// 			return;
// 		}

// 		// Transactions fetched successfully
// 		res.status(200).json({
// 			success: true,
// 			message: "Transactions fetched successfully.",
// 			data: {
// 				totalCount: totalCount,
// 				transactions: transactions,
// 			},
// 		});
// 		return;
// 	} catch (error: unknown) {
// 		console.error("Error in getAllTransactions", error);

// 		if (error instanceof Error) {
// 			res.status(500).json({
// 				success: false,
// 				message: error.message,
// 			});
// 			return;
// 		}
// 		// Internal Server Error
// 		res.status(500).json({
// 			success: false,
// 			message: "An error occurred while fetching all transactions.",
// 			data: {
// 				totalCount: -1,
// 				transactions: [],
// 			},
// 		});
// 		return;
// 	}
// };

// Soft delete a transaction
export const deleteTransaction = async (req: Request, res: Response) => {
	try {
		const { id } = req.params as { id: UUID };
		console.log("id", id);

		const transaction = await findSingleTransactionByID(id);
		// check for already deleted

		if (!transaction) {
			res.status(404).json({
				success: false,
				message: "Transaction not found",
			});

			return;
		}

		await deleteSingleTransaction(transaction);

		res.status(200).json({
			success: true,
			message: "Transaction deleted successfully",
		});
		return;
	} catch (error: unknown) {
		console.error("Error in deleteTransaction", error);

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

		const deletedTransactionsCount = await deleteAllNonDeletedTransactions();

		if (deletedTransactionsCount === 0) {
			res.status(200).json({
				success: true,
				message: "No transaction found to delete.",
				deletedTransactionsCount: 0,
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "All transactions have been deleted successfully.",
			deletedTransactionsCount: deletedTransactionsCount,
		});
	} catch (error: unknown) {
		console.error("Error in deleteAllTransactions", error);

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

// Soft delete multiple transaction
export const deleteMultipleTransactions = async (
	req: Request,
	res: Response
) => {
	const { ids } = req.body;
	console.log("ids", ids);

	if (!Array.isArray(ids) || ids.length === 0) {
		res
			.status(400)
			.json({ message: "Invalid input. 'ids' must be a non-empty array." });
		return;
	}

	try {
		await deleteMultipleNonDeletedTransactions(ids);

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
		console.log("parsedData", parsedData);

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

		const transactionArray = await addMultipleTransaction(
			parsedData,
			duplicates
		);

		// Send response with the count of successful transactions
		res.status(201).json({
			message: `${
				transactionArray?.length ?? 0
			} transactions added successfully.`,
			successCount: transactionArray?.length ?? 0,
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
	const { id } = req.params as { id: UUID }; // Transaction ID from the request URL
	let { date, description, amount, currency } = req.body; // New data

	console.log("body", id, date, description, amount, currency);

	try {
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
		
		description = description?.trim();

		// Find the transaction by ID
		const transaction = await findSingleTransactionByID(id);

		if (!transaction) {
			res.status(404).json({
				success: false,
				message: `Transaction not found.`,
			});
			return;
		}

		const editedTransaction = await editSingleTransaction(
			id,
			date,
			description,
			amount,
			currency
		);

		res.status(200).json({
			success: true,
			message: "Transaction updated successfully.",
			data: { editedTransaction },
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
			) {
				res.status(400).json({
					success: false,
					message:
						"Duplicate transaction: combination of date and description already exists.",
				});
				return;
			}
		}

		res.status(500).json({
			success: false,
			message: "An error occurred while editing the transaction.",
		});
	}
};

// Get all transactions as pagination is handled on the frontend
export const getPaginatedTransactions = async (req: Request, res: Response) => {
	try {
		// Get pagination and search parameters from the query string
		const { page = 1, limit = 10, search = "" } = req.query;

		// Convert page and limit to numbers
		const pageNumber = parseInt(page as string, 10);
		const pageSizeNumber = parseInt(limit as string, 10);

		console.log("getPaginatedTransactions", pageNumber, pageSizeNumber);

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
		const searchConditions: Record<string, any> = {};

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
		// searchConditions.deleted = false;

		const { transactions, totalCount } =
			await findAndCountPaginatedNonDeletedTransactions(
				searchConditions,
				offset,
				pageSizeNumber
			);

		// // Get the EntityManager from MikroORM
		// const em = await getForkedEntityManager();

		// // Retrieve transactions with pagination and search filters
		// const [transactions, totalCount] = await em.findAndCount(
		// 	Transaction,
		// 	searchConditions,
		// 	{
		// 		orderBy: { parsedDate: "DESC" },
		// 		limit: Number(pageSizeNumber),
		// 		offset: offset,
		// 	}
		// );

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
