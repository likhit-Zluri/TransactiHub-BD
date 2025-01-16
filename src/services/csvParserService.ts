// import { Readable } from "stream";
// import csv from "csv-parser";

// export const parseCSV = (buffer: Buffer): Promise<any[]> => {
// 	return new Promise((resolve, reject) => {
// 		const results: any[] = [];

// 		// Convert buffer to a readable stream
// 		const bufferStream = new Readable();
// 		bufferStream.push(buffer);
// 		bufferStream.push(null); // End the stream

// 		// Use the csv-parser to parse the data
// 		bufferStream
// 			.pipe(csv())
// 			.on("data", (data) => {
// 				// Remove BOM character from the header keys (only if BOM exists)
// 				if (Object.keys(data)[0].charCodeAt(0) === 0xfeff) {
// 					const cleanedData = Object.fromEntries(
// 						Object.entries(data).map(([key, value]) => [
// 							key.replace(/^﻿/, "").toLowerCase(), // Remove BOM character and convert to lowercase
// 							key.toLowerCase() === "amount" ? Number(value) : value,

// 							// console.log(key, value),
// 						])
// 					);
// 					results.push(cleanedData);
// 				} else {
// 					// Convert all keys to lowercase
// 					const cleanedData = Object.fromEntries(
// 						Object.entries(data).map(([key, value]) => [
// 							key.toLowerCase(), // Convert key to lowercase
// 							key.toLowerCase() === "amount" ? Number(value) : value,

// 							// console.log(key, value),
// 						])
// 					);
// 					results.push(cleanedData);
// 				}
// 			})
// 			.on("end", () => resolve(results))
// 			.on("error", (error) => reject(error));
// 	});
// };

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
				const keys = Object.keys(data);

				if (keys.length > 0) {
					// Check if the first key has a BOM character
					const firstKey = keys[0];
					if (firstKey.charCodeAt(0) === 0xfeff) {
						const cleanedData = Object.fromEntries(
							Object.entries(data).map(([key, value]) => [
								key.replace(/^﻿/, "").toLowerCase(), // Remove BOM and convert to lowercase
								key.toLowerCase() === "amount" ? Number(value) : value,
							])
						);
						results.push(cleanedData);
					} else {
						// Process normally without BOM removal
						const cleanedData = Object.fromEntries(
							Object.entries(data).map(([key, value]) => [
								key.toLowerCase(), // Convert to lowercase
								key.toLowerCase() === "amount" ? Number(value) : value,
							])
						);
						results.push(cleanedData);
					}
				}
			})
			.on("end", () => resolve(results))
			.on("error", (error) => reject(error));
	});
};
