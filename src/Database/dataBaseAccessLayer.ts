import { Transaction } from "../entities/Transaction";

import { getForkedEntityManager } from "../utils/entityManager";
import { dateFormatter } from "../utils/dataFormatter";
import { convertCurrency } from "../utils/currencyConverter";
import { UUID } from "crypto";

export const addSingleTransaction = async (
	date: string,
	description: string,
	amount: number,
	currency: string
) => {
	try {
		const em = await getForkedEntityManager();

		// Create and populate a new transaction entry
		const transaction = em.create(Transaction, {
			date: date,
			description,
			parsedDate: dateFormatter(date),
			amount: amount * 100, // As we have a precision of two
			// to do update type as float in db but it would return a string from db
			amountInINR: await convertCurrency(amount * 100, currency, date),
			// amountInINR: amount * 100 * 80,
			currency,
			deleted: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Save the transaction to the database
		await em.persistAndFlush(transaction);

		return transaction;
	} catch (error) {
		// console.error("Error in addSingleTransactionToDB:", error);

		throw new Error("Error in addSingleTransactionToDB");
	}
};

export const findSingleTransactionByDateDesc = async (
	date: string,
	description: string
) => {
	try {
		const em = await getForkedEntityManager();

		const existingTransaction = await em.findOne(Transaction, {
			parsedDate: dateFormatter(date),
			description,
			deleted: false, // Ensure we're checking only non-deleted transactions
		});

		return existingTransaction;
	} catch {
		// console.error("Error in findSingleTransactionByDateDesc:", error);

		throw new Error("Error in findSingleTransactionByDateDesc");
	}
};

export const findSingleTransactionByID = async (id: UUID) => {
	try {
		const em = await getForkedEntityManager();

		const existingTransaction = await em.findOne(Transaction, {
			id,
			deleted: false, // Ensure we're checking only non-deleted transactions
		});

		return existingTransaction;
	} catch {
		// console.error("Error in findSingleTransactionByDateDesc:", error);

		throw new Error("Error in findSingleTransactionByDateDesc");
	}
};

export const findAndCountAllNonDeletedTransactions = async () => {
	try {
		const em = await getForkedEntityManager();

		const [transactions, totalCount] = await em.findAndCount(
			Transaction,
			{ deleted: false }, // dont get the deleted transaction
			{
				orderBy: { parsedDate: "DESC" },
			}
		);

		return { transactions, totalCount };
	} catch (error) {
		// console.error("Error in findAndCountAllNonDeletedTransactions:", error);

		throw new Error("Error in findAndCountAllNonDeletedTransactions");
	}
};

export const deleteSingleTransaction = async (transaction: Transaction) => {
	try {
		const em = await getForkedEntityManager();

		transaction.deleted = true;
		transaction.updatedAt = new Date();

		await em.flush();
	} catch (error) {
		// console.error("Error in deleteSingleTransaction:", error);

		throw new Error("Error in deleteSingleTransaction");
	}
};

export const deleteMultipleNonDeletedTransactions = async (ids: UUID[]) => {
	try {
		const em = await getForkedEntityManager();

		// Mark transactions as deleted by setting delete = true
		await em.nativeUpdate(Transaction, { id: { $in: ids } }, { deleted: true });
	} catch (error) {
		// console.error("Error in deleteMultipleTransactions:", error);

		throw new Error("Error in deleteMultipleTransactions");
	}
};

export const deleteAllNonDeletedTransactions = async () => {
	try {
		const em = await getForkedEntityManager();
		const { transactions, totalCount } =
			await findAndCountAllNonDeletedTransactions();

		if (totalCount === 0) {
			return [];
		}

		// Mark each transaction as deleted (soft delete)
		transactions.forEach((transaction) => {
			transaction.deleted = true;
			transaction.updatedAt = new Date(); // Update updatedAt timestamp
		});

		// Persist changes
		await em.persistAndFlush(transactions);

		return transactions.length;
	} catch (error) {
		// console.error("Error in deleteAllTransactions:", error);

		throw new Error("Error in deleteAllTransactions");
	}
};
