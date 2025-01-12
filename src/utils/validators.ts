export interface TransactionInput {
	date: string; // Should be in dd-mm-yyyy format
	description: string;
	amount: number;
	currency: string;
}

// Validation function for a single transaction record
export const validateTransaction = (record: any): string[] => {
	const errors: string[] = [];

	// Check if the required fields are present
	if (!record.Date) errors.push("Missing 'Date' field.");
	if (!record.Description) errors.push("Missing 'Description' field.");
	if (!record.Amount) errors.push("Missing 'Amount' field.");
	if (!record.Currency) errors.push("Missing 'Currency' field.");

	// Validate the date format (dd-mm-yyyy)
	if (record.Date && !/^\d{2}-\d{2}-\d{4}$/.test(record.Date)) {
		errors.push(
			`Invalid 'Date' format: ${record.Date}. Expected format: dd-mm-yyyy.`
		);
	}

	// Validate that the amount is a positive number
	if (
		record.Amount &&
		(isNaN(Number(record.Amount)) || Number(record.Amount) <= 0)
	) {
		errors.push(
			`Invalid 'Amount': ${record.Amount}. Must be a positive number.`
		);
	}

	// Validate the currency (assume it's a 3-letter ISO code)
	if (record.Currency && !/^[A-Z]{3}$/.test(record.Currency)) {
		errors.push(
			`Invalid 'Currency': ${record.Currency}. Must be a 3-letter ISO code.`
		);
	}

	return errors;
};

// Function to validate an entire dataset
export const validateCSVData = (
	parsedData: any[]
): { validRecords: TransactionInput[]; errors: any[] } => {
	const validRecords: TransactionInput[] = [];
	const errors: any[] = [];

	parsedData.forEach((record, index) => {
		const validationErrors = validateTransaction(record);

		if (validationErrors.length > 0) {
			errors.push({
				recordIndex: index + 1,
				record,
				errors: validationErrors,
			});
		} else {
			validRecords.push({
				date: record.Date,
				description: record.Description,
				amount: Number(record.Amount),
				currency: record.Currency,
			});
		}
	});

	return { validRecords, errors };
};
