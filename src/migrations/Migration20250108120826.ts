import { Migration } from '@mikro-orm/migrations';

export class Migration20250108120826 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "transaction" ("id" serial primary key, "date" varchar(255) not null, "description" varchar(255) not null, "amount" int not null, "currency" varchar(255) not null);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "transaction" cascade;`);
  }

}
