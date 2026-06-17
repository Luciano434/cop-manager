import { getDb } from "./server/db.ts";
import { procedures, operationalSteps, copRequirements, procedureCopLinks } from "./drizzle/schema.ts";

async function checkDB() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    console.log("=== CHECKING DATABASE ===\n");

    // Get all procedures
    const allProcedures = await db.select().from(procedures);
    console.log(`Total procedures in DB: ${allProcedures.length}\n`);
    
    for (const proc of allProcedures) {
      console.log(`\n📋 Procedure: ${proc.code} (ID: ${proc.id})`);
      console.log(`   Name: ${proc.name}`);
      console.log(`   Status: ${proc.status}`);
      
      // Get steps for this procedure
      const steps = await db
        .select()
        .from(operationalSteps)
        .where((t) => t.procedureId === proc.id);
      
      console.log(`   Steps: ${steps.length}`);
      for (const step of steps) {
        console.log(`     - Step ${step.stepNumber}: ${step.name}`);
      }
      
      // Get COP requirements for this procedure
      const links = await db
        .select()
        .from(procedureCopLinks)
        .where((t) => t.procedureId === proc.id);
      
      console.log(`   COP Requirements: ${links.length}`);
      for (const link of links) {
        const req = await db
          .select()
          .from(copRequirements)
          .where((t) => t.id === link.copRequirementId)
          .limit(1);
        if (req.length > 0) {
          console.log(`     - ${req[0].code}: ${req[0].description}`);
        }
      }
    }

    console.log("\n✅ Database check complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error checking database:", error);
    process.exit(1);
  }
}

checkDB();
