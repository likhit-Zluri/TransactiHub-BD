import { MikroORM } from "@mikro-orm/core";
import { Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
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

// Override config for tests
const testDbConfig: Options = {
	...mikroOrmDefaultConfig,
	dbName: process.env.TEST_DB_NAME, // Test database name
	user: process.env.TEST_DB_USER, // Test database user
	password: process.env.TEST_DB_PASSWORD, // Test database password
	host: process.env.TEST_DB_HOST, // Test database host
	port: Number(process.env.TEST_DB_PORT), // Test database port
};

// Function to initialize MikroORM
export async function initializeORM(customConfig?: Options) {
	try {
		// Use test database config if in test environment
		const finalConfig =
			process.env.NODE_ENV === "test"
				? { ...mikroOrmDefaultConfig, ...testDbConfig, ...customConfig }
				: { ...mikroOrmDefaultConfig, ...customConfig };

		// Initialize MikroORM with the final config
		const orm = await MikroORM.init(finalConfig);
		return orm;
	} catch (error: unknown) {
		// Handle error
		if (error instanceof Error) {
			console.error("Error initializing MikroORM:", error.message);
			throw new Error(`Error initializing MikroORM: ${error.message}`);
		} else {
			console.error("Unknown error during MikroORM initialization.");
			throw new Error("Error initializing MikroORM: Unknown error.");
		}
	}
}
