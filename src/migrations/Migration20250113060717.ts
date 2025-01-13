import { Migration } from '@mikro-orm/migrations';

export class Migration20250113060717 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "transaction" alter column "date" type varchar(255) using ("date"::varchar(255));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "transaction" alter column "date" type timestamptz using ("date"::timestamptz);`);
  }

}
