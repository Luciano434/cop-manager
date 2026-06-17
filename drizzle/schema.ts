import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Procedimentos Operacionais
export const procedures = mysqlTable("procedures", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["nao_iniciado", "em_desenvolvimento", "implementado"]).notNull().default("nao_iniciado"),
  responsible: varchar("responsible", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
}, (table) => ({
  codeIdx: index("code_idx").on(table.code),
}));

export type Procedure = typeof procedures.$inferSelect;
export type InsertProcedure = typeof procedures.$inferInsert;

// Etapas Operacionais (subtarefas de um procedimento)
export const operationalSteps = mysqlTable("operational_steps", {
  id: int("id").autoincrement().primaryKey(),
  procedureId: int("procedureId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  responsible: varchar("responsible", { length: 255 }),
  input: text("input"),
  output: text("output"),
  evidenceRequired: boolean("evidenceRequired").default(true).notNull(),
  status: mysqlEnum("status", ["nao_iniciado", "em_desenvolvimento", "implementado"]).notNull().default("nao_iniciado"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  procedureIdIdx: index("procedureId_idx").on(table.procedureId),
}));

export type OperationalStep = typeof operationalSteps.$inferSelect;
export type InsertOperationalStep = typeof operationalSteps.$inferInsert;

// Requisitos COP (Certificação Operacional)
export const copRequirements = mysqlTable("cop_requirements", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  status: mysqlEnum("status", ["nao_atendido", "parcial", "atendido"]).notNull().default("nao_atendido"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  codeIdx: index("cop_code_idx").on(table.code),
}));

export type CopRequirement = typeof copRequirements.$inferSelect;
export type InsertCopRequirement = typeof copRequirements.$inferInsert;

// Vínculo entre Procedimentos e Requisitos COP (relação muitos-para-muitos)
export const procedureCopLinks = mysqlTable("procedure_cop_links", {
  id: int("id").autoincrement().primaryKey(),
  procedureId: int("procedureId").notNull(),
  copRequirementId: int("copRequirementId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  procedureIdIdx: index("link_procedureId_idx").on(table.procedureId),
  copRequirementIdIdx: index("link_copRequirementId_idx").on(table.copRequirementId),
}));

export type ProcedureCopLink = typeof procedureCopLinks.$inferSelect;
export type InsertProcedureCopLink = typeof procedureCopLinks.$inferInsert;

// Evidências (arquivos e documentos)
export const evidences = mysqlTable("evidences", {
  id: int("id").autoincrement().primaryKey(),
  procedureId: int("procedureId"),
  operationalStepId: int("operationalStepId"),
  copRequirementId: int("copRequirementId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: decimal("fileSize", { precision: 12, scale: 0 }),
  description: text("description"),
  uploadedBy: int("uploadedBy"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  procedureIdIdx: index("evidence_procedureId_idx").on(table.procedureId),
  stepIdIdx: index("evidence_stepId_idx").on(table.operationalStepId),
  copIdIdx: index("evidence_copId_idx").on(table.copRequirementId),
}));

export type Evidence = typeof evidences.$inferSelect;
export type InsertEvidence = typeof evidences.$inferInsert;

// Relations
export const proceduresRelations = relations(procedures, ({ many }) => ({
  operationalSteps: many(operationalSteps),
  copLinks: many(procedureCopLinks),
  evidences: many(evidences),
}));

export const operationalStepsRelations = relations(operationalSteps, ({ one, many }) => ({
  procedure: one(procedures, {
    fields: [operationalSteps.procedureId],
    references: [procedures.id],
  }),
  evidences: many(evidences),
}));

export const copRequirementsRelations = relations(copRequirements, ({ many }) => ({
  procedureLinks: many(procedureCopLinks),
  evidences: many(evidences),
}));

export const procedureCopLinksRelations = relations(procedureCopLinks, ({ one }) => ({
  procedure: one(procedures, {
    fields: [procedureCopLinks.procedureId],
    references: [procedures.id],
  }),
  copRequirement: one(copRequirements, {
    fields: [procedureCopLinks.copRequirementId],
    references: [copRequirements.id],
  }),
}));

export const evidencesRelations = relations(evidences, ({ one }) => ({
  procedure: one(procedures, {
    fields: [evidences.procedureId],
    references: [procedures.id],
  }),
  operationalStep: one(operationalSteps, {
    fields: [evidences.operationalStepId],
    references: [operationalSteps.id],
  }),
  copRequirement: one(copRequirements, {
    fields: [evidences.copRequirementId],
    references: [copRequirements.id],
  }),
}));