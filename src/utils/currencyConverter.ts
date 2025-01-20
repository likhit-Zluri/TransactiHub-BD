import axios from "axios";

export async function convertCurrency(
	amount: number,
	toCurrency: string,
	date: string
): Promise<number> {
	try {
		// const apiUrl = `${process.env.CURRENCY_API_URL}apikey=${process.env.CURRENCY_API_KEY}&currencies=${toCurrency}&base_currency=INR&date=${date}`;
		const parsedData = date.split("-").reverse().join("-");
		console.log("Data", parsedData, toCurrency);

		const apiUrl = `${process.env.CURRENCY_API_URL}/${parsedData}/${toCurrency}`;

		// Fetch the exchange rates for the specified date
		const response = await axios.get(apiUrl);
		console.log("res", response);

		const rates = response.data;
		console.log("rates in converter", rates);
		// Check if the target currency exists in the rates
		if (!rates[toCurrency]) {
			throw new Error(`Unsupported target currency: ${toCurrency}`);
		}

		// Convert the amount
		const exchangeRate = rates[toCurrency];

		console.log("exchangeRate", exchangeRate);

		const convertedAmount = amount * exchangeRate;
		return convertedAmount;
	} catch (error) {
		console.error("Error in currency conversion:", error);
		throw new Error("Currency conversion failed. Please try again.");
	}
}
