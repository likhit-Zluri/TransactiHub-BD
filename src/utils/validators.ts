import e from "express";
import { getORM } from "../config/mikro-orm.config";
import { Transaction } from "../entities/Transaction";

export interface TransactionInput {
	date: string; // Should be in dd-mm-yyyy format
	description: string;
	amount: number;
	currency: string;
}

export interface Record {
	date: string;
	description: string;
	amount: string; // Amount as a string
	currency: string;
}

// Validate a single transaction record
export const validateTransaction = (record: any): string[] => {
	const validationErrors: string[] = [];
	const { id, date, description, amount, currency } = record;
	console.log("record in validateTransaction", date, amount, typeof amount);

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
		validationErrors.push(
			`Missing required fields: ${missingFields.join(
				", "
			)}. Please provide the missing fields.`
		);
	}

	if (validationErrors.length > 0) {
		return validationErrors;
	}

	// Validate the id format (uuid)
	if (id !== undefined) {
		if (id && typeof id !== "string") {
			console.log("invalid id type");
			validationErrors.push(
				`Invalid 'id' type: ${typeof id}. Expected type: string.`
			);
		} else if (
			!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
				id
			)
		) {
			console.log("invalid id format");
			validationErrors.push(
				`Invalid 'id' format: ${id}. Expected format: uuid (32 hexadecimal digits in the group of form 8-4-4-4-12)`
			);
		}
	}

	// Validate the date format (dd-mm-yyyy)
	if (date !== undefined) {
		if (date && typeof date !== "string") {
			validationErrors.push(
				`Invalid 'Date' type: ${typeof date}. Expected type: string.`
			);
		} else if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) {
			validationErrors.push(
				`Invalid 'Date' format: ${date}. Expected format: dd-mm-yyyy.`
			);
		}
	}

	// Validate that the amount is a positive number
	if (amount !== undefined) {
		if (amount && typeof amount !== "number") {
			validationErrors.push(
				`Invalid 'Amount' type: ${typeof amount}. Expected format: number.`
			);
		} else if (isNaN(Number(amount)) || Number(amount) <= 0) {
			validationErrors.push(
				`Invalid 'Amount': ${amount}. Must be a positive number.`
			);
		}
	}

	// Validate that the description is a string
	if (description !== undefined) {
		if (description && typeof description !== "string") {
			validationErrors.push(
				`Invalid 'Description' type: ${typeof description}. Expected type: string.`
			);
		}
	}

	// Validate the currency (assume it's a 3-letter ISO code)
	if (currency !== undefined) {
		if (currency && !/^[A-Z]{3}$/.test(currency)) {
			validationErrors.push(
				`Invalid 'Currency': ${currency}. Expected format: 3-letter ISO code.`
			);
		}
	}
	console.log("validationErrors in validateTransaction", validationErrors);
	return validationErrors;
};

// Function to check for duplicates in CSV data
export const checkForDuplicatesInCSV = (parsedData: TransactionInput[]) => {
	const DuplicationErrors: string[] = [];
	const seenTransactions: Map<string, number> = new Map();
	const duplicates: Number[] = [];

	parsedData.forEach((record, index) => {
		const transactionKey = `${record.description}-${record.date}`;

		const firstIndex = seenTransactions.get(transactionKey);

		if (firstIndex !== undefined) {
			console.log("firstIndex", firstIndex);

			// Handle the possibility of `undefined`
			duplicates.push(index + 1); // Add current index to duplicates
			DuplicationErrors.push(
				`Record at ${index + 1} is a duplicate of record at ${firstIndex + 1}`
			);
		} else {
			seenTransactions.set(transactionKey, index); // Add new transaction to the Map
		}
	});

	console.log(
		"errors, duplicates in checkForDuplicatesInCSV",
		DuplicationErrors,
		duplicates
	);
	return { DuplicationErrors, duplicates };
};

// Main CSV validation function that returns an array of errors
export const validateCSVData = (parsedData: TransactionInput[]) => {
	const validationErrors: string[] = [];
	const duplicationErrors: string[] = [];

	// Validate each transaction record
	parsedData.forEach((record, index) => {
		const validationError = validateTransaction(record);

		if (validationError.length > 0) {
			validationErrors.push(
				`Record at index ${
					index + 1
				} has the following errors: ${validationError.join(", ")}`
			);
		}
	});

	// Check for duplicates in CSV data
	const { DuplicationErrors, duplicates } = checkForDuplicatesInCSV(parsedData);
	if (DuplicationErrors.length > 0) {
		duplicationErrors.push(...DuplicationErrors);
	}
	console.log(
		"errors in validateCSVData",
		validationErrors,
		duplicationErrors,
		duplicates
	);

	return { validationErrors, duplicationErrors, duplicates };
};

export const checkForDuplicatesInDB = async (
	parsedData: TransactionInput[]
): Promise<string[]> => {
	const em = (await getORM()).em.fork();
	const transactionRepo = em.getRepository(Transaction);

	// Extract unique combinations of date and description from parsedData
	const uniquePairs = parsedData.map((data, index) => ({
		index: index + 1,
		date: data.date,
		description: data.description,
	}));

	// Check for existing transactions in the database with the same date and description
	const existingTransactions = await transactionRepo.find({
		$or: uniquePairs.map(({ date, description }) => ({
			date,
			description,
			deleted: false,
		})),
	});

	// Find duplicates and return a string array with messages
	return uniquePairs
		.filter(({ date, description }) =>
			existingTransactions.some(
				(tx) => tx.date === date && tx.description === description
			)
		)
		.map(
			({ index }) =>
				`Record at index ${index} has a duplication in the database.`
		);
};
