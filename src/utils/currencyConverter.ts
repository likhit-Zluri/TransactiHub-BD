import axios from "axios";

export async function convertCurrency(
	amount: number,
	toCurrency: string,
	date: string
): Promise<number> {
	try {
		const apiUrl = `${process.env.CURRENCY_API_URL}apikey=${process.env.CURRENCY_API_KEY}&currencies=${toCurrency}&base_currency=INR&date=${date}`;

		// Fetch the exchange rates for the specified date
		const response = await axios.get(apiUrl);

		const rates = response.data.data;
		console.log("rates in converter", rates);

		// Check if the target currency exists in the rates
		if (!rates[toCurrency]) {
			throw new Error(`Unsupported target currency: ${toCurrency}`);
		}

		// Convert the amount
		const exchangeRate = rates[toCurrency].value;
		const convertedAmount = amount / exchangeRate;
		return convertedAmount;
	} catch (error) {
		console.error("Error in currency conversion:", error);
		throw new Error("Currency conversion failed. Please try again.");
	}
}
