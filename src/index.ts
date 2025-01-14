import express, { Request, Response } from "express";
import { initializeORM } from "./config/mikro-orm.config";
import transactionRoutes from "./routes/transactionRoutes";
import { addTransaction } from "../src/controllers/transactionController";
import { Transaction } from "./entities/Transaction";

// import pool from "./config/database"; // direct local DB

// Instantiate express
const app = express();

// Default port value
const port = process.env.PORT || 0; // 0 means it will use any available port

// Middleware to parse JSON
app.use(express.json());

// initializeORM();

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
const server = app.listen(port, () => {
	const dynamicPort = (server.address() as any).port;
	console.log(`The server is running at port ${dynamicPort}`);
});

export { app, server };
