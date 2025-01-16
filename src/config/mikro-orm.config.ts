import { MikroORM } from "@mikro-orm/core";
import {
	EntityManager,
	Options,
	PostgreSqlDriver,
	SqlEntityManager,
} from "@mikro-orm/postgresql";
import { config } from "dotenv";
import { Transaction } from "../entities/Transaction";

// Load environment variables
config();

// Default MikroORM configuration
const mikroOrmDefaultConfig: Options = {
	driver: PostgreSqlDriver, // Use PostgreSQL driver
	entities: [Transaction], // MikroORM entities
	dbName: process.env.DB_NAME, // Database name
	user: process.env.DB_USER, // Database user
	password: process.env.DB_PASSWORD, // Database password
	host: process.env.DB_HOST, // Database host
	port: Number(process.env.DB_PORT), // Database port
	debug: process.env.NODE_ENV !== "test", // Disable debug logs during tests
};

let orm: MikroORM;
// let orm: MikroORM;
// Function to initialize MikroORM
export async function initializeORM(customConfig?: Options) {
	try {
		// console.log("node_env",process.env.NODE_ENV);
		customConfig = {
			dbName: process.env.TEST_DB_NAME,
		};
		// console.log("customConfig", customConfig);
		// Use test database config if in test environment
		const finalConfig = { ...mikroOrmDefaultConfig, ...customConfig };
		console.log("DB name", finalConfig.dbName);

		// Initialize MikroORM with the final config
		orm = await MikroORM.init(finalConfig);
		// console.log(typeof orm);
		// return orm;
	} catch (error: unknown) {
		console.log("Unknown error during MikroORM initialization.", error);
		throw new Error(`Error initializing MikroORM: ${error}`);
	}
}

export async function getORM(customConfig?: Options) {
	if (orm === undefined || customConfig) {
		console.log("initializeORM called");

		await initializeORM(customConfig);
	}
	return orm;
}

export async function closeORM() {
	// console.log("orm", orm);

	if (orm) {
		await orm.close(true);
		console.log("orm defined");
	}
	console.log("orm closed");
	console.log("orm", orm === undefined);
}
