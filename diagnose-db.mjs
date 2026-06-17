import { getDb } from "./server/db.ts";
import { procedures, operationalSteps, copRequirements, procedureCopLinks } from "./drizzle/schema.ts";

async function diagnoseDB() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    console.log("=== DATABASE DIAGNOSIS ===\n");

    // Get all procedures
    const allProcs = await db.select().from(procedures);
    console.log(`Total procedures: ${allProcs.length}`);
    for (const proc of allProcs) {
      console.log(`  - ${proc.code} (ID: ${proc.id})`);
    }

    console.log("\n=== OPERATIONAL STEPS ===");
    const allSteps = await db.select().from(operationalSteps);
    console.log(`Total steps: ${allSteps.length}`);
    
    // Group by procedure
    const stepsByProc = {};
    for (const step of allSteps) {
      if (!stepsByProc[step.procedureId]) {
        stepsByProc[step.procedureId] = [];
      }
      stepsByProc[step.procedureId].push(step);
    }

    for (const procId in stepsByProc) {
      const proc = allProcs.find(p => p.id === parseInt(procId));
      console.log(`\n${proc?.code} (ID: ${procId}): ${stepsByProc[procId].length} steps`);
      for (const step of stepsByProc[procId]) {
        console.log(`  - Step ${step.stepNumber}: ${step.name}`);
      }
    }

    console.log("\n=== COP REQUIREMENTS ===");
    const allReqs = await db.select().from(copRequirements);
    console.log(`Total COP requirements: ${allReqs.length}`);
    for (const req of allReqs) {
      console.log(`  - ${req.code} (ID: ${req.id}): ${req.description}`);
    }

    console.log("\n=== PROCEDURE-COP LINKS ===");
    const allLinks = await db.select().from(procedureCopLinks);
    console.log(`Total links: ${allLinks.length}`);
    
    const linksByProc = {};
    for (const link of allLinks) {
      if (!linksByProc[link.procedureId]) {
        linksByProc[link.procedureId] = [];
      }
      linksByProc[link.procedureId].push(link);
    }

    for (const procId in linksByProc) {
      const proc = allProcs.find(p => p.id === parseInt(procId));
      console.log(`\n${proc?.code} (ID: ${procId}): ${linksByProc[procId].length} COP links`);
      for (const link of linksByProc[procId]) {
        const req = allReqs.find(r => r.id === link.copRequirementId);
        console.log(`  - ${req?.code}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

diagnoseDB();
