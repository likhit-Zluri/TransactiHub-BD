import { Migration } from '@mikro-orm/migrations';

export class Migration20250109124029 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "transaction" add column "created_at" timestamptz not null, add column "updated_at" timestamptz not null, add column "deleted" boolean not null default false;`);
    this.addSql(`alter table "transaction" alter column "id" drop default;`);
    this.addSql(`alter table "transaction" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "transaction" alter column "date" type timestamptz using ("date"::timestamptz);`);
    this.addSql(`alter table "transaction" alter column "id" drop default;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "transaction" alter column "id" type text using ("id"::text);`);

    this.addSql(`alter table "transaction" drop column "created_at", drop column "updated_at", drop column "deleted";`);

    this.addSql(`alter table "transaction" alter column "id" type int using ("id"::int);`);
    this.addSql(`alter table "transaction" alter column "date" type varchar(255) using ("date"::varchar(255));`);
    this.addSql(`create sequence if not exists "transaction_id_seq";`);
    this.addSql(`select setval('transaction_id_seq', (select max("id") from "transaction"));`);
    this.addSql(`alter table "transaction" alter column "id" set default nextval('transaction_id_seq');`);
  }

}
