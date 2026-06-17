import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, procedures, operationalSteps, copRequirements, procedureCopLinks, evidences } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Procedures queries
export async function getProcedures() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(procedures);
}

export async function getProcedureById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(procedures).where(eq(procedures.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProcedureByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(procedures).where(eq(procedures.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProcedure(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(procedures).values(data);
  return result;
}

export async function updateProcedure(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(procedures).set(data).where(eq(procedures.id, id));
}

export async function deleteProcedure(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(procedures).where(eq(procedures.id, id));
}

// Operational Steps queries
export async function getOperationalStepsByProcedure(procedureId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(operationalSteps).where(eq(operationalSteps.procedureId, procedureId));
}

export async function getOperationalStepById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(operationalSteps).where(eq(operationalSteps.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOperationalStep(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(operationalSteps).values(data);
}

export async function updateOperationalStep(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(operationalSteps).set(data).where(eq(operationalSteps.id, id));
}

export async function deleteOperationalStep(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(operationalSteps).where(eq(operationalSteps.id, id));
}

// COP Requirements queries
export async function getCopRequirements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(copRequirements);
}

export async function getCopRequirementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(copRequirements).where(eq(copRequirements.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCopRequirementByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(copRequirements).where(eq(copRequirements.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCopRequirement(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(copRequirements).values(data);
}

export async function updateCopRequirement(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(copRequirements).set(data).where(eq(copRequirements.id, id));
}

// Procedure-COP Links queries
export async function getProcedureCopLinks(procedureId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(procedureCopLinks).where(eq(procedureCopLinks.procedureId, procedureId));
}

export async function getCopLinksByRequirement(copRequirementId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(procedureCopLinks).where(eq(procedureCopLinks.copRequirementId, copRequirementId));
}

export async function createProcedureCopLink(procedureId: number, copRequirementId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(procedureCopLinks).values({ procedureId, copRequirementId });
}

export async function deleteProcedureCopLink(procedureId: number, copRequirementId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(procedureCopLinks).where(
    and(
      eq(procedureCopLinks.procedureId, procedureId),
      eq(procedureCopLinks.copRequirementId, copRequirementId)
    )
  );
}

// Evidences queries
export async function getEvidences() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidences);
}

export async function getEvidencesByProcedure(procedureId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidences).where(eq(evidences.procedureId, procedureId));
}

export async function getEvidencesByStep(stepId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidences).where(eq(evidences.operationalStepId, stepId));
}

export async function createEvidence(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(evidences).values(data);
}

export async function deleteEvidence(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(evidences).where(eq(evidences.id, id));
}
