import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 as uuidv4 } from "uuid";

@Entity()
export class Transaction {
	@PrimaryKey({ type: "uuid" })
	id: string = uuidv4();

	@Property()
	date!: Date;

	@Property()
	description!: string;

	@Property()
	amount!: number;

	@Property()
	currency!: string;

	@Property({ onCreate: () => new Date() })
	createdAt: Date = new Date();

	@Property({ onUpdate: () => new Date() })
	updatedAt: Date = new Date();

	@Property({ default: false })
	deleted: boolean = false; // Boolean field for soft delete
}
