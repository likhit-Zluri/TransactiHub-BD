import { Migration } from '@mikro-orm/migrations';

export class Migration20250113073252 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "transaction" add constraint "transaction_date_description_unique" unique ("date", "description");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "transaction" drop constraint "transaction_date_description_unique";`);
  }

}
