import { initializeORM } from "../config/mikro-orm.config";

export const getEntityManager = async () => {
	const orm = await initializeORM(); // Initialize ORM
	const em = orm.em.fork(); // Get an isolated EntityManager instance

	return em;
};
