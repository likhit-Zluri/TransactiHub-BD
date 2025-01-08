import { MikroORM, defineConfig } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Transaction } from "../entities/Transaction";
import {config} from "dotenv";
config();

console.log("db name", process.env.DB_NAME);
console.log("db name", process.env.DB_PORT);

const mikroOrmConfig = defineConfig({
	entities: [Transaction], // MikroORM entities
	dbName: process.env.DB_NAME, // Database name
	user: process.env.DB_USER, // Database user
	password: process.env.DB_PASSWORD, // Database password
	host: process.env.DB_HOST, // Database host
	port: Number(process.env.DB_PORT), // Database port
	driver: PostgreSqlDriver, // Use the correct driver
});

export async function initializeORM() {
	try {
		const orm = await MikroORM.init(mikroOrmConfig);
		// Your logic after initializing the ORM
		console.log("MikroORM initialized successfully.");
	} catch (error) {
		console.error("Error initializing MikroORM:", error);
	}
}
