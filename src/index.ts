import express, { Request, Response } from "express";
import { initializeORM } from "./config/mikro-orm.config";

import pool from "./config/database"; // direct local DB

// Instantiate express
const app = express();

// Default port value
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

initializeORM();

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
	res.json({ message: "Welcome to the Server!" });
});

// Start the server
app.listen(port, () => {
	console.log(`The server is running at port ${port}`);
});
