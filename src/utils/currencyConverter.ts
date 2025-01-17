import axios from "axios";

// https://api.currencyapi.com/v3/historical?apikey=cur_live_CnAZTilCUXaanXgF95Wsu6xTYX9ecRZXSvFXsE3P&currencies=EUR%2CUSD%2CCAD&date=2025-01-16
export async function convertCurrency(
	amount: number,
	fromCurrency: string,
	toCurrency: string
): Promise<number> {
	try {
		// Replace with your preferred API or service endpoint
		const apiKey = "your_api_key_here"; // If needed
		const apiUrl = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;

		// Fetch the exchange rates
		const response = await axios.get(apiUrl);
		const rates = response.data.rates;

		// Check if the target currency exists in the rates
		if (!rates[toCurrency]) {
			throw new Error(`Unsupported target currency: ${toCurrency}`);
		}

		// Convert the amount
		const convertedAmount = amount * rates[toCurrency];
		return convertedAmount;
	} catch (error) {
		console.error("Error in currency conversion:", error);
		throw new Error("Currency conversion failed. Please try again.");
	}
}
