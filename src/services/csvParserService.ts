import { Readable } from "stream";
import csv from "csv-parser";

export const parseCSV = (buffer: Buffer): Promise<any[]> => {
	return new Promise((resolve, reject) => {
		const results: any[] = [];

		// Convert buffer to a readable stream
		const bufferStream = new Readable();
		bufferStream.push(buffer);
		bufferStream.push(null); // End the stream

		// Use the csv-parser to parse the data
		bufferStream
			.pipe(csv())
			.on("data", (data) => {
				// Remove BOM character from the header keys (only if BOM exists)
				if (Object.keys(data)[0].charCodeAt(0) === 0xfeff) {
					const cleanedData = Object.fromEntries(
						Object.entries(data).map(([key, value]) => [
							key.replace(/^﻿/, "").toLowerCase(), // Remove BOM character and convert to lowercase
							value,
						])
					);
					results.push(cleanedData);
				} else {
					// Convert all keys to lowercase
					const cleanedData = Object.fromEntries(
						Object.entries(data).map(([key, value]) => [
							key.toLowerCase(), // Convert key to lowercase
							value,
						])
					);
					results.push(cleanedData);
				}
			})
			.on("end", () => resolve(results))
			.on("error", (error) => reject(error));
	});
};
