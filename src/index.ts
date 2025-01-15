import express, { Request, Response } from "express";
// import { getORM, closeORM } from "./config/mikro-orm.config";
import transactionRoutes from "./routes/transactionRoutes";
// import { addTransaction } from "../src/controllers/transactionController";
// import { Transaction } from "./entities/Transaction";

// import pool from "./config/database"; // direct local DB

// Instantiate express
const app = express();

// Middleware to parse JSON
app.use(express.json());

// (async () => {
// 	await getORM();
// })();

// Verify database connection
// direct local DB

// pool
// 	.connect()
// 	.then(() => {
// 		console.log("Connected to the database successfully");
// 	})
// 	.catch((err) => {
// 		console.error("Error connecting to the database:", err.stack);
// 	});

// Default home route
app.get("/", (req: Request, res: Response) => {
	res.status(200).send("Server is up and running");
});

// Use the transaction routes
app.use("/api", transactionRoutes);

// Middleware for handling undefined routes
app.use((req, res) => {
	res.status(404).json({
		error: "Route not found",
		message: `Cannot ${req.method} ${req.originalUrl}`,
	});
});

// Start the server
// const server = app.listen(port, async () => {
// 	const dynamicPort = (server.address() as any).port;
// 	console.log(`The server is running at port ${dynamicPort}`);

// 	const orm = await getORM();
// });

// Graceful shutdown
// export const shutdown = async () => {
// 	try {
// 		console.log("Shutting down server...");
// 		// Close the server
// 		server.close(async () => {
// 			console.log("HTTP server closed.");
// 			// Close MikroORM connection
// 			await closeORM();
// 			console.log("ORM connection closed.");
// 		});
// 	} catch (error) {
// 		console.error("Error during shutdown:", error);
// 		process.exit(1); // Exit with error
// 	}
// };

// server.close(async () => {
// 	console.log("HTTP server closed.");
// 	// Close MikroORM connection
// 	await closeORM();
// 	console.log("ORM connection closed.");
// 	// process.exit(0); // Exit cleanly
// });

// // Handle termination signals
// process.on("SIGINT", shutdown); // Handle Ctrl+C
// process.on("SIGTERM", shutdown); // Handle termination signals

export { app };
