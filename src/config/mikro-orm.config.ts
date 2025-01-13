import { MikroORM, defineConfig } from "@mikro-orm/core";
import { Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { SeedManager } from "@mikro-orm/seeder";
import { Migrator } from "@mikro-orm/migrations";

import { config } from "dotenv";
import { Transaction } from "../entities/Transaction";
config();


const mikroOrmDeafultConfig: Options = {
	driver: PostgreSqlDriver, // Use the correct driver
	entities: [Transaction], // MikroORM entities
	dbName: process.env.DB_NAME, // Database name
	user: process.env.DB_USER, // Database user
	password: process.env.DB_PASSWORD, // Database password
	host: process.env.DB_HOST, // Database host
	port: Number(process.env.DB_PORT), // Database port
	// debug: true,
	debug: process.env.NODE_ENV !== "test", // Disable debug logs during tests
	// extensions: [SeedManager, Migrator],
};
export default mikroOrmConfig;

	// extensions: [SeedManager, Migrator],
};
export default mikroOrmDeafultConfig;

export async function initializeORM(customConfig?: Options) {
	try {
		const finalConfig = {
			...mikroOrmDeafultConfig,
			...customConfig,
		};

		// console.log("finalConfig", finalConfig);

		const orm = await MikroORM.init(finalConfig);
		
		// console.log("MikroORM initialized successfully.");

		return orm;
	} catch (error: unknown) {
		// console.error("Error initializing MikroORM:", error);
		throw new Error(`Error initializing MikroORM: ${error}`);
	}
}
