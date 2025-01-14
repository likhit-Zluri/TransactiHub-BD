import { initializeORM } from "../config/mikro-orm.config";

export const getEntityManager = async () => {
	const { orm, em } = await initializeORM(); // Initialize ORM
	return em;
};
