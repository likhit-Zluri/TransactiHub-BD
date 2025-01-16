import { EntityManager } from "@mikro-orm/postgresql";
import { getORM } from "../config/mikro-orm.config";

let em: EntityManager;
export const getEntityManager = async () => {
	if (em === undefined) em = (await getORM()).em as EntityManager;

	return em;
};

export const getForkedEntityManager = async () => {
	if (em === undefined) em = (await getORM()).em as EntityManager;

	// em.getContext()
	
	return em.fork();
};
