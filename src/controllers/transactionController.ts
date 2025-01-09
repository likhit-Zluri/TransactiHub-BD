import { Application, Request, Response } from "express";
import { initializeORM } from "../config/mikro-orm.config";
import { Transaction } from "../entities/Transaction";

export const getEntityManager = async () => {
	const orm = await initializeORM(); // Initialize ORM
	const em = orm.em.fork(); // Get an isolated EntityManager instance

	return em;
};

// Add a transaction
export const addTransaction = async (req: Request, res: Response) => {
	const { date, description, amount, currency } = req.body;

	// Validating the input
	if (!date || !description || !amount || !currency) {
		res.status(400).json({
			message:
				"Missing required fields. Please provide date, description, amount, and currency.",
		});
	}

	const parseDate = (dateString: string): Date => {
		const [day, month, year] = dateString.split("-");
		return new Date(`${year}-${month}-${day}`);
	};

	console.log("date ", date, " parsed ", parseDate(date));

	try {
		const em = await getEntityManager();

		// Create and populate a new transaction entry
		const transaction = em.create(Transaction, {
			date: parseDate(date),
			description,
			amount: Number(amount), // Ensure amount is a number
			currency,
			deleted: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Save the transaction to the database
		await em.persistAndFlush(transaction);

		res.status(201).json({
			message: "Transaction added successfully",
			transaction,
		});
	} catch (error: unknown) {
		console.error("Error adding transaction:", error);

		res.status(500).json({
			message: "An error occurred while adding the transaction.",
			error: error,
		});
	}
};

// Get all transactions
export const getAllTransactions = async (req: Request, res: Response) => {
	try {
		const em = await getEntityManager();

		const transactions = await em.find(Transaction, {});

		res.status(200).json({
			message: "Transactions fetched successfully",
			data: transactions,
		});
	} catch (error: unknown) {
		console.error("Error fetching all transactions:", error);
		res.status(500).json({
			message: "Error fetching all transactions",
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
