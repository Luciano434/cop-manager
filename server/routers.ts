import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
});

export type AppRouter = typeof appRouter;
