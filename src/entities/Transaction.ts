import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Transaction {
	@PrimaryKey()
	id!: number;

	@Property()
	date!: string;

	@Property()
	description!: string;

	@Property()
	amount!: number;

	@Property()
	currency!: string;
}
