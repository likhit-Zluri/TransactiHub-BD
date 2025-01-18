import express, { Request, Response } from "express";
import transactionRoutes from "./routes/transactionRoutes";
import cors from "cors";

// Instantiate express
const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(
	cors({
		origin: "*",
		credentials: true,
	})
);

// (async () => {
// 	await getORM();
// })();

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

export { app };
