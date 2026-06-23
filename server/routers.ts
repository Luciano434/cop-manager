import bcrypt from "bcryptjs";
import { COOKIE_NAME, NOT_ADMIN_ERR_MSG } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getProcedures,
  getProcedureById,
  getProcedureByCode,
  createProcedure,
  updateProcedure,
  deleteProcedure,
  getOperationalStepsByProcedure,
  getOperationalStepById,
  createOperationalStep,
  updateOperationalStep,
  deleteOperationalStep,
  getCopRequirements,
  getCopRequirementById,
  getCopRequirementByCode,
  createCopRequirement,
  updateCopRequirement,
  getProcedureCopLinks,
  getCopLinksByRequirement,
  createProcedureCopLink,
  deleteProcedureCopLink,
  getEvidences,
  getEvidencesByProcedure,
  getEvidencesByStep,
  createEvidence,
  deleteEvidence,
  getUserByUsername,
  hasAnyUser,
  createLocalUser,
  listUsers as listUsersFromDb,
  setUserActive,
  deleteUserById,
  updateUserPassword,
  getEvidenceVerifications,
  upsertEvidenceVerification,
  updateEvidenceVerificationCopCodes,
  getEvidenceVerificationCopCodes,
  getEvidenceVerificationsByCopCode,
  recalcCopRequirementStatus,
  updateCopRequirementStatusByCode,
  getProcedureSections,
  updateProcedureSections,
  syncCopRequirementsFromCap7,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      const { passwordHash: _, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    hasUsers: publicProcedure.query(async () => {
      return hasAnyUser();
    }),

    login: publicProcedure
      .input(z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByUsername(input.username.trim().toLowerCase());

        if (!user || !user.passwordHash || !user.active) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos" });
        }

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos" });
        }

        const token = await sdk.signSession({
          openId: user.username!,
          appId: "local-auth",
          name: user.name || user.username!,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        const { passwordHash: _, ...safeUser } = user;
        return { user: safeUser };
      }),

    createFirstAdmin: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        username: z.string().min(1),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const alreadyExists = await hasAnyUser();
        if (alreadyExists) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sistema já possui usuários cadastrados" });
        }

        const username = input.username.trim().toLowerCase();
        const passwordHash = await bcrypt.hash(input.password, 10);
        await createLocalUser({ username, name: input.name.trim(), passwordHash, role: "ADMIN" });

        const user = await getUserByUsername(username);
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usuário" });
        }

        const token = await sdk.signSession({
          openId: user.username!,
          appId: "local-auth",
          name: user.name || user.username!,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        const { passwordHash: _, ...safeUser } = user;
        return { user: safeUser };
      }),

    listUsers: adminProcedure.query(async () => {
      return listUsersFromDb();
    }),

    createUser: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        username: z.string().min(1),
        password: z.string().min(6),
        role: z.enum(["ADMIN", "ENGENHARIA", "QUALIDADE", "AUDITOR", "USUARIO"]),
      }))
      .mutation(async ({ input }) => {
        const username = input.username.trim().toLowerCase();
        const existing = await getUserByUsername(username);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Este login já existe" });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        await createLocalUser({ username, name: input.name.trim(), passwordHash, role: input.role });
        return { success: true };
      }),

    toggleActive: adminProcedure
      .input(z.object({ id: z.number(), active: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (input.id === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Não é permitido alterar o próprio status" });
        }
        await setUserActive(input.id, input.active);
        return { success: true };
      }),

    deleteUser: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (input.id === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Não é permitido excluir o próprio usuário" });
        }
        await deleteUserById(input.id);
        return { success: true };
      }),

    changePassword: adminProcedure
      .input(z.object({ id: z.number(), password: z.string().min(6) }))
      .mutation(async ({ input }) => {
        const passwordHash = await bcrypt.hash(input.password, 10);
        await updateUserPassword(input.id, passwordHash);
        return { success: true };
      }),
  }),

  // Procedures
  procedures: router({
    list: publicProcedure.query(async () => {
      return getProcedures();
    }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProcedureById(input.id);
      }),

    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return getProcedureByCode(input.code);
      }),

    create: protectedProcedure
      .input(z.object({
        code: z.string(),
        name: z.string(),
        description: z.string().optional(),
        status: z.enum(["nao_iniciado", "em_desenvolvimento", "implementado"]),
        responsible: z.string().optional(),
        family: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return createProcedure({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["nao_iniciado", "em_desenvolvimento", "implementado"]).optional(),
        responsible: z.string().optional(),
        family: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateProcedure(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteProcedure(input.id);
      }),

    getSections: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProcedureSections(input.id);
      }),

    updateSections: protectedProcedure
      .input(z.object({
        id: z.number(),
        sections: z.any(),
      }))
      .mutation(async ({ input }) => {
        await updateProcedureSections(input.id, input.sections);

        const procedure = await getProcedureById(input.id);
        if (procedure?.code && Array.isArray(input.sections)) {
          const result = await syncCopRequirementsFromCap7(
            procedure.code,
            input.sections
          );
          console.log(
            `[syncCop] ${procedure.code}: ${result.inserted} inseridos, ${result.updated} atualizados`
          );
        }

        return { success: true };
      }),
  }),

  // Operational Steps
  operationalSteps: router({
    listByProcedure: publicProcedure
      .input(z.object({ procedureId: z.number() }))
      .query(async ({ input }) => {
        return getOperationalStepsByProcedure(input.procedureId);
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOperationalStepById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        procedureId: z.number(),
        stepNumber: z.number(),
        name: z.string(),
        description: z.string().optional(),
        responsible: z.string().optional(),
        input: z.string().optional(),
        output: z.string().optional(),
        evidenceRequired: z.boolean().default(true),
        status: z.enum(["nao_iniciado", "em_desenvolvimento", "implementado"]),
      }))
      .mutation(async ({ input }) => {
        return createOperationalStep(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        stepNumber: z.number().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        responsible: z.string().optional(),
        input: z.string().optional(),
        output: z.string().optional(),
        evidenceRequired: z.boolean().optional(),
        status: z.enum(["nao_iniciado", "em_desenvolvimento", "implementado"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateOperationalStep(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteOperationalStep(input.id);
      }),
  }),

  // COP Requirements
  copRequirements: router({
    list: publicProcedure.query(async () => {
      return getCopRequirements();
    }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getCopRequirementById(input.id);
      }),

    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return getCopRequirementByCode(input.code);
      }),

    create: protectedProcedure
      .input(z.object({
        code: z.string(),
        description: z.string().optional(),
        status: z.enum(["nao_atendido", "parcial", "atendido"]),
      }))
      .mutation(async ({ input }) => {
        return createCopRequirement(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["nao_atendido", "parcial", "atendido"]).optional(),
        procedureCode: z.string().optional(),
        expectedEvidence: z.string().optional(),
        expectedRecord: z.string().optional(),
        verificationMethod: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateCopRequirement(id, data);
      }),
  }),

  // Procedure-COP Links
  procedureCopLinks: router({
    listByProcedure: publicProcedure
      .input(z.object({ procedureId: z.number() }))
      .query(async ({ input }) => {
        return getProcedureCopLinks(input.procedureId);
      }),

    listByRequirement: publicProcedure
      .input(z.object({ copRequirementId: z.number() }))
      .query(async ({ input }) => {
        return getCopLinksByRequirement(input.copRequirementId);
      }),

    create: protectedProcedure
      .input(z.object({
        procedureId: z.number(),
        copRequirementId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return createProcedureCopLink(input.procedureId, input.copRequirementId);
      }),

    delete: protectedProcedure
      .input(z.object({
        procedureId: z.number(),
        copRequirementId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return deleteProcedureCopLink(input.procedureId, input.copRequirementId);
      }),
  }),

  // Evidences
  evidences: router({
    list: publicProcedure.query(async () => {
      return getEvidences();
    }),

    listByProcedure: publicProcedure
      .input(z.object({ procedureId: z.number() }))
      .query(async ({ input }) => {
        return getEvidencesByProcedure(input.procedureId);
      }),

    listByStep: publicProcedure
      .input(z.object({ stepId: z.number() }))
      .query(async ({ input }) => {
        return getEvidencesByStep(input.stepId);
      }),

    create: protectedProcedure
      .input(z.object({
        procedureId: z.number().optional(),
        operationalStepId: z.number().optional(),
        copRequirementId: z.number().optional(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        mimeType: z.string().optional(),
        fileSize: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return createEvidence({
          ...input,
          uploadedBy: ctx.user.id,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteEvidence(input.id);
      }),
  }),

  // Evidence Verifications (verificações por requisito COP)
  evidenceVerifications: router({
    listByCpr: publicProcedure
      .input(z.object({ cprCode: z.string(), revision: z.string() }))
      .query(async ({ input }) => {
        return getEvidenceVerifications(input.cprCode, input.revision);
      }),

    upsert: protectedProcedure
      .input(z.object({
        cprCode: z.string(),
        revision: z.string(),
        requirementId: z.string(),
        status: z.enum(["PENDENTE", "OK", "NOK", "PARCIAL", "NA"]),
        evidenceText: z.string().optional(),
        registroText: z.string().optional(),
        responsible: z.string().optional(),
        observacao: z.string().optional(),
        copCode: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const savedId = await upsertEvidenceVerification({ ...input, updatedBy: ctx.user.id });
        if (input.copCode) {
          await updateCopRequirementStatusByCode(input.copCode, input.cprCode, input.status);
        } else {
          const linkedCodes = await getEvidenceVerificationCopCodes(savedId);
          for (const code of linkedCodes) {
            await recalcCopRequirementStatus(code, input.cprCode);
          }
        }
        return savedId;
      }),

    updateCopCodes: protectedProcedure
      .input(z.object({
        id: z.number(),
        copCodes: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        await updateEvidenceVerificationCopCodes(input.id, input.copCodes);
        return { success: true };
      }),

    listByCopCode: publicProcedure
      .input(z.object({ copCode: z.string(), procedureCode: z.string() }))
      .query(async ({ input }) => {
        return getEvidenceVerificationsByCopCode(input.copCode, input.procedureCode);
      }),
  }),
});

export type AppRouter = typeof appRouter;
