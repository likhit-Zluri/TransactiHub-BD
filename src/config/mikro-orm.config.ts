import { MikroORM } from "@mikro-orm/core";
import { defineConfig, Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { config } from "dotenv";
import { Transaction } from "../entities/Transaction";

// Load environment variables
config();

// Default MikroORM configuration
const mikroOrmDefaultConfig: Options = defineConfig({
	driver: PostgreSqlDriver, // Use PostgreSQL driver
	entities: [Transaction], // MikroORM entities
	// dbName: process.env.DB_NAME, // Database name
	// user: process.env.DB_USER, // Database user
	// password: process.env.DB_PASSWORD, // Database password
	// host: process.env.DB_HOST, // Database host
	// port: Number(process.env.DB_PORT), // Database port
	// debug: process.env.NODE_ENV !== "test", // Disable debug logs during tests
	clientUrl: process.env.CLIENT_URL,
	driverOptions: {
		connection: {
			ssl: true,
		},
	},
});

let orm: MikroORM;

// Function to initialize MikroORM
export async function initializeORM() {
	try {
		// console.log("node_env",process.env.NODE_ENV);
		const testConfig = {
			dbName: process.env.TEST_DB_NAME,
		};
		// console.log("testConfig", testConfig);

		// Use test database config if in test environment
		let finalConfig = { ...mikroOrmDefaultConfig };

		// console.log("process.env.NODE_env", process.env.NODE_env);
		if (process.env.NODE_env === "test") {
			// console.log("test");
			finalConfig = { ...finalConfig, ...testConfig };
		}

		console.log("DB name", finalConfig.dbName);

		// Initialize MikroORM with the final config
		orm = await MikroORM.init(finalConfig);
		console.log("orm intialized");
		// return orm;
	} catch (error: unknown) {
		console.log("Unknown error during MikroORM initialization.", error);
		throw new Error(`Error initializing MikroORM: ${error}`);
	}
}

export async function getORM() {
	if (orm === undefined) {
		console.log("initializeORM called");

		await initializeORM();
	}
	return orm;
}

export async function closeORM() {
	if (orm) {
		await orm.close(true);
		console.log("orm defined and closed");
	}
}

export default mikroOrmDefaultConfig;
