import { Migration } from '@mikro-orm/migrations';

export class Migration20250117121854 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "transaction" ("id" uuid not null, "date" varchar(255) not null, "description" varchar(255) not null, "amount" int not null, "amount_in_inr" int not null, "currency" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted" boolean not null default false, constraint "transaction_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "transaction" cascade;`);
  }

}
