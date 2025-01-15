export interface TransactionInput {
	date: string; // Should be in dd-mm-yyyy format
	description: string;
	amount: number;
	currency: string;
}

// Validate a single transaction record
export const validateTransaction = (record: any): string[] => {
	const validationErrors: string[] = [];
	const { id, date, description, amount, currency } = record;
	// console.log("date", date, amount, typeof amount);

	// // Check if the required fields are present
	// if (!date) errors.push("Missing 'Date' field.");
	// if (!description) errors.push("Missing 'Description' field.");
	// if (!amount) errors.push("Missing 'Amount' field.");
	// if (!currency) errors.push("Missing 'Currency' field.");

	// Validate the id format (uuid)
	if (id !== undefined) {
		if (
			typeof id !== "string" ||
			!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
				id
			)
		) {
			validationErrors.push(
				`Invalid 'id' type: ${typeof id}. Expected type: uuid.`
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
			// Handle the possibility of `undefined`
			duplicates.push(index); // Add current index to duplicates
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

	return { validationErrors, duplicationErrors, duplicates };
};
