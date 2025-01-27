import { Transaction } from "../entities/Transaction";

import { getForkedEntityManager } from "../utils/entityManager";
import { dateFormatter } from "../utils/dataFormatter";
import { convertCurrency } from "../utils/currencyConverter";

export const addSingleTransactionToDB = async (
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

		// await em.persistAndFlush(transaction);

		return transaction;
	} catch (error) {
		console.error("Error adding transaction:", error);

		throw new Error("An error occurred while adding the transaction.");
	}
};
