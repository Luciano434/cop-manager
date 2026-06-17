import { getDb } from "./server/db.ts";
import { procedures, operationalSteps, copRequirements, procedureCopLinks } from "./drizzle/schema.ts";

async function cleanAndReseed() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    console.log("🧹 Cleaning database...\n");

    // Delete all procedure-COP links
    await db.delete(procedureCopLinks);
    console.log("✓ Deleted all procedure-COP links");

    // Delete all operational steps
    await db.delete(operationalSteps);
    console.log("✓ Deleted all operational steps");

    // Delete all procedures
    await db.delete(procedures);
    console.log("✓ Deleted all procedures");

    // Delete all COP requirements
    await db.delete(copRequirements);
    console.log("✓ Deleted all COP requirements");

    console.log("\n✅ Database cleaned successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error cleaning database:", error);
    process.exit(1);
  }
}

cleanAndReseed();
