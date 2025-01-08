import express, { Request, Response } from "express";

// instantiation of express
const app = express();

// default post value
const port = process.env.PORT || 3000;

// default home path
app.get("/", (req: Request, res: Response) => {
	res.json({ message: "Welcome to the Server!" });
});

// Start the server
app.listen(port, () => {
	console.log(`The server is running at port ${port}`);
});
