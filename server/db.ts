import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, procedures, operationalSteps, copRequirements, procedureCopLinks, evidences, evidenceVerifications } from "../drizzle/schema";
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

// Local auth queries
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function hasAnyUser(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: users.id }).from(users).limit(1);
  return result.length > 0;
}

export async function createLocalUser(data: {
  username: string;
  name: string;
  passwordHash: string;
  role: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(users).values({
    openId: data.username,
    username: data.username,
    name: data.name,
    passwordHash: data.passwordHash,
    role: data.role,
    active: true,
    lastSignedIn: new Date(),
  });
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    username: users.username,
    name: users.name,
    email: users.email,
    role: users.role,
    active: users.active,
    createdAt: users.createdAt,
  }).from(users);
}

export async function setUserActive(id: number, active: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ active }).where(eq(users.id, id));
}

export async function deleteUserById(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}

export async function getProcedureSections(procedureId: number): Promise<any[] | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ sections: procedures.sections })
    .from(procedures)
    .where(eq(procedures.id, procedureId))
    .limit(1);
  if (!result[0]?.sections) return null;
  try {
    return JSON.parse(result[0].sections);
  } catch {
    return null;
  }
}

export async function updateProcedureSections(procedureId: number, sections: any[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(procedures)
    .set({ sections: JSON.stringify(sections) })
    .where(eq(procedures.id, procedureId));
}

export async function updateUserPassword(id: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

// Evidence Verifications queries
export async function getEvidenceVerifications(cprCode: string, revision: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidenceVerifications)
    .where(and(
      eq(evidenceVerifications.cprCode, cprCode),
      eq(evidenceVerifications.revision, revision),
    ));
}

export async function upsertEvidenceVerification(data: {
  cprCode: string;
  revision: string;
  requirementId: string;
  status: "PENDENTE" | "OK" | "NOK" | "PARCIAL" | "NA";
  evidenceText?: string;
  registroText?: string;
  responsible?: string;
  observacao?: string;
  updatedBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select({ id: evidenceVerifications.id })
    .from(evidenceVerifications)
    .where(and(
      eq(evidenceVerifications.cprCode, data.cprCode),
      eq(evidenceVerifications.revision, data.revision),
      eq(evidenceVerifications.requirementId, data.requirementId),
    )).limit(1);

  if (existing.length > 0) {
    await db.update(evidenceVerifications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(evidenceVerifications.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(evidenceVerifications).values(data);
    return (result[0] as any).insertId;
  }
}

export async function updateEvidenceVerificationCopCodes(
  id: number,
  copCodes: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(evidenceVerifications)
    .set({ copRequirementCodes: JSON.stringify(copCodes) })
    .where(eq(evidenceVerifications.id, id));
}

export async function getEvidenceVerificationCopCodes(id: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ copRequirementCodes: evidenceVerifications.copRequirementCodes })
    .from(evidenceVerifications)
    .where(eq(evidenceVerifications.id, id))
    .limit(1);
  if (!result[0]?.copRequirementCodes) return [];
  try {
    const codes = JSON.parse(result[0].copRequirementCodes);
    return Array.isArray(codes) ? codes : [];
  } catch { return []; }
}

export async function getEvidenceVerificationsByCopCode(
  copCode: string,
  procedureCode: string
): Promise<(typeof evidenceVerifications.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select().from(evidenceVerifications)
    .where(eq(evidenceVerifications.cprCode, procedureCode));
  return all.filter(ev => {
    if (!ev.copRequirementCodes) return false;
    try {
      const codes = JSON.parse(ev.copRequirementCodes);
      return Array.isArray(codes) && codes.includes(copCode);
    } catch { return false; }
  });
}

export async function recalcCopRequirementStatus(
  copCode: string,
  procedureCode: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const evs = await getEvidenceVerificationsByCopCode(copCode, procedureCode);

  const hasOk      = evs.some(e => e.status === 'OK');
  const hasNok     = evs.some(e => e.status === 'NOK');
  const hasParcial = evs.some(e => e.status === 'PARCIAL');

  let newStatus: 'atendido' | 'parcial' | 'nao_atendido' = 'nao_atendido';
  if (hasOk && !hasNok) newStatus = 'atendido';
  else if (hasParcial || (hasOk && hasNok)) newStatus = 'parcial';

  await db.update(copRequirements)
    .set({ status: newStatus })
    .where(
      and(
        eq(copRequirements.code, copCode),
        eq(copRequirements.procedureCode, procedureCode)
      )
    );
}

export function normalizeCopCode(code: string): string {
  const trimmed = code.trim();
  if (/\(\d+\)$/.test(trimmed)) return trimmed;
  return trimmed + '(1)';
}
