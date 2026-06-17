import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

async function cleanDb() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("Cleaning database...");
    
    // Delete in order of dependencies
    await db.execute(sql`DELETE FROM procedure_cop_links`);
    await db.execute(sql`DELETE FROM evidences`);
    await db.execute(sql`DELETE FROM operational_steps`);
    await db.execute(sql`DELETE FROM procedures`);
    await db.execute(sql`DELETE FROM cop_requirements`);
    
    console.log("Database cleaned successfully!");
  } catch (error) {
    console.error("Clean error:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

cleanDb();
