import { Readable } from "stream";
import csv from "csv-parser";

export const parseCSV = (buffer: Buffer): Promise<any[]> => {
	return new Promise((resolve, reject) => {
		const requiredColumns = ["date", "description", "amount", "currency"];
		const results: any[] = [];
		const bufferStream = new Readable();
		let normalizedHeaders: string[] = []; // Store lowercase headers

		bufferStream.push(buffer);
		bufferStream.push(null);

		bufferStream
			.pipe(
				csv({
					mapHeaders: ({ header }) => header.trim().toLowerCase(), // Normalize headers to lowercase
				})
			)
			.on("headers", (headers) => {
				normalizedHeaders = headers;

				// Check if all required columns are present
				const missingColumns = requiredColumns.filter(
					(column) => !normalizedHeaders.includes(column)
				);

				if (missingColumns.length > 0) {
					return reject(
						new Error(`Missing required columns: ${missingColumns.join(", ")}.`)
					);
				}
			})
			.on("data", (data: Record<string, string>) => {
				// Convert amount to a number for consistency
				const cleanedData = Object.fromEntries(
					Object.entries(data).map(([key, value]) => [
						key,
						key === "amount" ? Number(value) : value.trim(),
					])
				);
				results.push(cleanedData);
			})
			.on("end", () => {
				resolve(results);
			})
			.on("error", (error) => reject(error));
	});
};
