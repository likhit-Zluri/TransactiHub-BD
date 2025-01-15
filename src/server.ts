import { app } from "./index";
import { config } from "dotenv";
import { getORM } from "./config/mikro-orm.config";
config();

// Default port value
const port = process.env.PORT || 0; // 0 means it will use any available port

// Start the server
const server = app.listen(port, async () => {
	const dynamicPort = (server.address() as any).port;
	console.log(`The server is running at port ${dynamicPort}`);
	
	const orm = await getORM();
});
