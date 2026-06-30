/**
 * db/index.ts
 * Initialises and exports the database connection singleton.
 *
 * Uses better-sqlite3 (synchronous SQLite driver) with Drizzle ORM.
 * The DB file path comes from the DATABASE_PATH environment variable.
 *
 * On startup:
 *   1. Creates the data/ directory if it doesn't exist.
 *   2. Opens (or creates) the SQLite file.
 *   3. Runs pending migrations.
 *   4. Returns the typed Drizzle db instance.
 *
 * Implementation: next session.
 */
export {};
