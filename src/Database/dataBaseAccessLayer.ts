import { UUID } from "crypto";

import { Transaction } from "../entities/Transaction";
import { TransactionInput } from "../utils/validators";

import { getForkedEntityManager } from "../utils/entityManager";
import { dateFormatter } from "../utils/dataFormatter";
import { convertCurrency } from "../utils/currencyConverter";

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

export const addMultipleTransaction = async (
	parsedData: TransactionInput[],
	duplicates: Number[]
) => {
	try {
		// Prepare an array to store valid transaction data
		const transactionArray: TransactionInput[] = [];

		const em = await getForkedEntityManager();

		// Process valid records for insertion
		await Promise.all(
			parsedData.map(async (record, index) => {
				if (duplicates.includes(index + 1)) {
					return;
				}

				let { date, description, amount, currency } = record;
				description = description?.trim();

				// Prepare the transaction data for insertion
				const transaction = em.create(Transaction, {
					date: date,
					parsedDate: dateFormatter(date),
					description: description,
					amount: amount * 100,
					amountInINR: await convertCurrency(amount * 100, currency, date),
					// amountInINR: amount * 100 * 80,
					currency,
					deleted: false, // Default flag for new transactions
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				transactionArray.push(transaction);
			})
		);

		// console.log("transactionArray", transactionArray);

		// Bulk insert the transactions
		await em.persistAndFlush(transactionArray);

		return transactionArray;
	} catch (error) {
		// console.error("Error in addMultipleTransaction:", error);

		throw new Error("Error in addMultipleTransaction");
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

export const findAndCountPaginatedNonDeletedTransactions = async (
	searchConditions?: Record<string, any>,
	offset?: number,
	pageSizeNumber?: number
) => {
	try {
		const em = await getForkedEntityManager();

		console.log("searchConditions", searchConditions, offset, pageSizeNumber);
		const queryOptions: Record<string, any> = {
			orderBy: { parsedDate: "DESC" },
			limit: Number(pageSizeNumber),
			offset: offset,
		};

		// Include offset only if searchConditions.description does NOT exist
		if (!searchConditions || !searchConditions.description) {
			queryOptions.offset = offset; // Add offset for pagination
		}

		const [transactions, totalCount] = await em.findAndCount(
			Transaction,
			{ ...searchConditions, deleted: false }, // dont get the deleted transaction
			queryOptions
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
			await findAndCountPaginatedNonDeletedTransactions();

		if (totalCount === 0) {
			return 0;
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

export const editSingleTransaction = async (
	id: UUID,
	newdate: string,
	newdescription: string,
	newamount: number,
	newcurrency: string
) => {
	try {
		const em = await getForkedEntityManager();

		const transaction = await findSingleTransactionByID(id);

		if (newdescription) transaction!.description = newdescription;
		if (newamount || newcurrency || newdate) {
			if (newamount) {
				transaction!.amount = newamount * 100; // Update with precision
			}
			if (newcurrency) {
				transaction!.currency = newcurrency;
			}
			if (newdate) {
				transaction!.date = newdate;
				transaction!.parsedDate = new Date(dateFormatter(newdate));
			}

			// Recalculate the amount in INR if amount, currency, or date changes
			// const updatedAmount = amount ? amount * 100 : transaction.amount;
			const updatedCurrency = newcurrency || transaction!.currency;
			const updatedDate = newdate || transaction!.date;

			// transaction.amountInINR = await convertCurrency(
			// 	updatedAmount,
			// 	updatedCurrency,
			// 	updatedDate
			// );

			transaction!.amountInINR = newamount
				? newamount * 80 * 100
				: transaction!.amountInINR;
		}

		transaction!.updatedAt = new Date(); // Update timestamp

		// Persist changes
		await em.persistAndFlush(transaction!);

		return transaction;
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error in editSingleTransaction:", error.message);

			throw new Error(error.message);
		}
	}
};
