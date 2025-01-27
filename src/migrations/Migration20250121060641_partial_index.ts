import { Migration } from "@mikro-orm/migrations";

export class Migration20250121060641_partial_index extends Migration {
  async up(): Promise<void> {
    // Create a partial unique index for transactions where `isDeleted` is false
    this.addSql(`
          CREATE UNIQUE INDEX unique_transction_not_deleted
          ON "transaction" ("date", "description")
          WHERE "deleted" = false;
        `);
  }

  async down(): Promise<void> {
    // Drop the partial unique index if rolled back
    this.addSql("DROP INDEX IF EXISTS unique_transaction_not_deleted;");
  }
}