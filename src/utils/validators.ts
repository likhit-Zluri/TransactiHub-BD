export interface TransactionInput {
	date: string; // Should be in dd-mm-yyyy format
	description: string;
	amount: number;
	currency: string;
}

// Validate a single transaction record
export const validateTransaction = (record: any): string[] => {
	const errors: string[] = [];
	const { date, description, amount, currency } = record;

	// Check if the required fields are present
	if (!date) errors.push("Missing 'Date' field.");
	if (!description) errors.push("Missing 'Description' field.");
	if (!amount) errors.push("Missing 'Amount' field.");
	if (!currency) errors.push("Missing 'Currency' field.");

	// Validate the date format (dd-mm-yyyy)
	if (date && !/^\d{2}-\d{2}-\d{4}$/.test(date)) {
		errors.push(`Invalid 'Date' format: ${date}. Expected format: dd-mm-yyyy.`);
	}

	// Validate that the amount is a positive number
	if (amount && (isNaN(Number(amount)) || Number(amount) <= 0)) {
		errors.push(`Invalid 'Amount': ${amount}. Must be a positive number.`);
	}

	// Validate the currency (assume it's a 3-letter ISO code)
	if (currency && !/^[A-Z]{3}$/.test(currency)) {
		errors.push(
			`Invalid 'Currency': ${currency}. Must be a 3-letter ISO code.`
		);
	}

	return errors;
};

// Function to check for duplicates in CSV data
export const checkForDuplicatesInCSV = (
	parsedData: TransactionInput[]
): string[] => {
	const errors: string[] = [];
	const seenTransactions: Map<string, number[]> = new Map();

	parsedData.forEach((record, index) => {
		const transactionKey = `${record.description}-${record.date}`;

		if (seenTransactions.has(transactionKey)) {
			// If duplicate found, append the current index to the existing list of indexes
			const existingIndexes = seenTransactions.get(transactionKey);
			existingIndexes?.push(index + 1); // Store the 1-based index of the duplicate
			errors.push(
				`Duplicate found at indexes ${existingIndexes?.join(
					", "
				)}: ${transactionKey}`
			);
		} else {
			seenTransactions.set(transactionKey, [index + 1]); // Store the 1-based index of the first occurrence
		}
	});

	console.log("errors in checkForDuplicatesInCSV", errors);
	return errors;
};

// Main CSV validation function that returns an array of errors
export const validateCSVData = (parsedData: TransactionInput[]) => {
	const errors: string[] = [];

	// Validate each transaction record
	parsedData.forEach((record, index) => {
		const validationErrors = validateTransaction(record);

		if (validationErrors.length > 0) {
			errors.push(
				`Record at index ${
					index + 1
				} has the following errors: ${validationErrors.join(", ")}`
			);
		}
	});

	// Check for duplicates in CSV data
	const csvDuplicates = checkForDuplicatesInCSV(parsedData);
	if (csvDuplicates.length > 0) {
		errors.push(...csvDuplicates);
	}

	console.log("errors in validateCSVData", errors);
	return { errors };
};
