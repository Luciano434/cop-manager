import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user context
function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Procedures Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createMockContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("procedures.list", () => {
    it("should return a list of procedures", async () => {
      const result = await caller.procedures.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should contain PR-01 procedure", async () => {
      const result = await caller.procedures.list();
      const pr01 = result.find((p) => p.code === "PR-01");
      expect(pr01).toBeDefined();
      expect(pr01?.name).toBe("Controle de Dados de Projeto e Configuração");
      expect(pr01?.status).toBe("em_desenvolvimento");
    });
  });

  describe("procedures.getByCode", () => {
    it("should get PR-01 by code", async () => {
      const result = await caller.procedures.getByCode({ code: "PR-01" });
      expect(result).toBeDefined();
      expect(result?.code).toBe("PR-01");
      expect(result?.responsible).toBe("Engenharia");
    });

    it("should return undefined for non-existent code", async () => {
      const result = await caller.procedures.getByCode({ code: "PR-999" });
      expect(result).toBeUndefined();
    });
  });

  describe("copRequirements.list", () => {
    it("should return a list of COP requirements", async () => {
      const result = await caller.copRequirements.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should contain all required COP codes", async () => {
      const result = await caller.copRequirements.list();
      const codes = result.map((r) => r.code);
      expect(codes).toContain("1.A.1");
      expect(codes).toContain("1.A.2");
      expect(codes).toContain("1.A.3");
      expect(codes).toContain("1.B.1");
    });

    it("should have correct status for requirements", async () => {
      const result = await caller.copRequirements.list();
      result.forEach((req) => {
        expect(["nao_atendido", "parcial", "atendido"]).toContain(req.status);
      });
    });
  });

  describe("operationalSteps.listByProcedure", () => {
    it("should return 6 steps for PR-01", async () => {
      const procedure = await caller.procedures.getByCode({ code: "PR-01" });
      if (!procedure) throw new Error("PR-01 not found");

      const result = await caller.operationalSteps.listByProcedure({
        procedureId: procedure.id,
      });
      expect(result.length).toBe(6);
    });

    it("should have correct step names", async () => {
      const procedure = await caller.procedures.getByCode({ code: "PR-01" });
      if (!procedure) throw new Error("PR-01 not found");

      const result = await caller.operationalSteps.listByProcedure({
        procedureId: procedure.id,
      });

      const stepNames = result.map((s) => s.name);
      expect(stepNames).toContain("Recebimento do dado de projeto");
      expect(stepNames).toContain("Registro no controle de dados");
      expect(stepNames).toContain("Análise e classificação");
      expect(stepNames).toContain("Aprovação do dado");
      expect(stepNames).toContain("Liberação para uso");
      expect(stepNames).toContain("Controle de revisão");
    });

    it("should have all steps with evidence required", async () => {
      const procedure = await caller.procedures.getByCode({ code: "PR-01" });
      if (!procedure) throw new Error("PR-01 not found");

      const result = await caller.operationalSteps.listByProcedure({
        procedureId: procedure.id,
      });

      result.forEach((step) => {
        expect(step.evidenceRequired).toBe(true);
      });
    });
  });

  describe("procedureCopLinks", () => {
    it("should list links for PR-01", async () => {
      const procedure = await caller.procedures.getByCode({ code: "PR-01" });
      if (!procedure) throw new Error("PR-01 not found");

      const result = await caller.procedureCopLinks.listByProcedure({
        procedureId: procedure.id,
      });
      expect(result.length).toBe(4);
    });

    it("should have links to correct COP requirements", async () => {
      const procedure = await caller.procedures.getByCode({ code: "PR-01" });
      if (!procedure) throw new Error("PR-01 not found");

      const links = await caller.procedureCopLinks.listByProcedure({
        procedureId: procedure.id,
      });

      // Get the COP requirement IDs
      const requirements = await caller.copRequirements.list();
      const expectedCodes = ["1.A.1", "1.A.2", "1.A.3", "1.B.1"];
      const expectedIds = requirements
        .filter((r) => expectedCodes.includes(r.code))
        .map((r) => r.id);

      const linkedIds = links.map((l) => l.copRequirementId);
      expectedIds.forEach((id) => {
        expect(linkedIds).toContain(id);
      });
    });

    it("should list procedures for a COP requirement", async () => {
      const requirements = await caller.copRequirements.list();
      const req1A1 = requirements.find((r) => r.code === "1.A.1");
      if (!req1A1) throw new Error("1.A.1 not found");

      const result = await caller.procedureCopLinks.listByRequirement({
        copRequirementId: req1A1.id,
      });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((l) => l.copRequirementId === req1A1.id)).toBe(true);
    });
  });
});
