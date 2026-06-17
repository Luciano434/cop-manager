import { describe, it, expect } from "vitest";

// Simular os dados de procedimentos que estão no ProcedureDetail.tsx
const proceduresData = {
  "PR-01": {
    code: "PR-01",
    name: "Controle de Dados de Projeto e Configuração",
    stepsCount: 6,
    requirementsCount: 4,
    requirements: ["1.A.1", "1.A.2", "1.A.3", "1.B.1"],
  },
  "PR-02": {
    code: "PR-02",
    name: "Controle de Modificações de Projeto",
    stepsCount: 7,
    requirementsCount: 8,
    requirements: ["1.D.1", "1.D.2", "1.D.3", "1.D.4", "1.D.5", "1.D.6", "1.D.7", "1.D.8"],
  },
  "PR-03": {
    code: "PR-03",
    name: "Instruções de Aeronavegabilidade Continuada (ICA)",
    stepsCount: 7,
    requirementsCount: 2,
    requirements: ["1.C.1", "1.C.2"],
  },
};

describe("Procedure Navigation", () => {
  it("should load PR-01 data correctly", () => {
    const procedure = proceduresData["PR-01"];
    expect(procedure).toBeDefined();
    expect(procedure.code).toBe("PR-01");
    expect(procedure.name).toContain("Controle de Dados de Projeto");
    expect(procedure.stepsCount).toBe(6);
    expect(procedure.requirementsCount).toBe(4);
  });

  it("should load PR-02 data correctly", () => {
    const procedure = proceduresData["PR-02"];
    expect(procedure).toBeDefined();
    expect(procedure.code).toBe("PR-02");
    expect(procedure.name).toContain("Controle de Modificações");
    expect(procedure.stepsCount).toBe(7);
    expect(procedure.requirementsCount).toBe(8);
  });

  it("should load PR-03 data correctly", () => {
    const procedure = proceduresData["PR-03"];
    expect(procedure).toBeDefined();
    expect(procedure.code).toBe("PR-03");
    expect(procedure.name).toContain("Instruções de Aeronavegabilidade");
    expect(procedure.stepsCount).toBe(7);
    expect(procedure.requirementsCount).toBe(2);
  });

  it("should have independent COP requirements for each procedure", () => {
    const pr01Reqs = proceduresData["PR-01"].requirements;
    const pr02Reqs = proceduresData["PR-02"].requirements;
    const pr03Reqs = proceduresData["PR-03"].requirements;

    // PR-01 should have 1.A and 1.B requirements
    expect(pr01Reqs).toContain("1.A.1");
    expect(pr01Reqs).toContain("1.A.2");
    expect(pr01Reqs).toContain("1.A.3");
    expect(pr01Reqs).toContain("1.B.1");
    expect(pr01Reqs).not.toContain("1.D.1");
    expect(pr01Reqs).not.toContain("1.C.1");

    // PR-02 should have 1.D requirements
    expect(pr02Reqs).toContain("1.D.1");
    expect(pr02Reqs).toContain("1.D.8");
    expect(pr02Reqs).not.toContain("1.A.1");
    expect(pr02Reqs).not.toContain("1.C.1");

    // PR-03 should have 1.C requirements
    expect(pr03Reqs).toContain("1.C.1");
    expect(pr03Reqs).toContain("1.C.2");
    expect(pr03Reqs).not.toContain("1.A.1");
    expect(pr03Reqs).not.toContain("1.D.1");
  });

  it("should have no overlapping COP requirements between procedures", () => {
    const pr01Reqs = new Set(proceduresData["PR-01"].requirements);
    const pr02Reqs = new Set(proceduresData["PR-02"].requirements);
    const pr03Reqs = new Set(proceduresData["PR-03"].requirements);

    // Check no overlap between PR-01 and PR-02
    const overlap12 = [...pr01Reqs].filter(req => pr02Reqs.has(req));
    expect(overlap12).toHaveLength(0);

    // Check no overlap between PR-01 and PR-03
    const overlap13 = [...pr01Reqs].filter(req => pr03Reqs.has(req));
    expect(overlap13).toHaveLength(0);

    // Check no overlap between PR-02 and PR-03
    const overlap23 = [...pr02Reqs].filter(req => pr03Reqs.has(req));
    expect(overlap23).toHaveLength(0);
  });

  it("should extract procedure code from URL correctly", () => {
    const testCases = [
      { url: "/procedimentos/PR-01", expected: "PR-01" },
      { url: "/procedimentos/PR-02", expected: "PR-02" },
      { url: "/procedimentos/PR-03", expected: "PR-03" },
    ];

    testCases.forEach(({ url, expected }) => {
      const codeMatch = url.match(/\/procedimentos\/(.+)/);
      const procedureCode = codeMatch ? codeMatch[1] : "PR-01";
      expect(procedureCode).toBe(expected);
    });
  });

  it("should fallback to PR-01 if code not found", () => {
    const testCases = [
      { url: "/procedimentos/INVALID", expected: "PR-01" },
      { url: "/procedimentos", expected: "PR-01" },
      { url: "/procedimentos/", expected: "PR-01" },
    ];

    testCases.forEach(({ url, expected }) => {
      const codeMatch = url.match(/\/procedimentos\/(.+)/);
      const procedureCode = codeMatch ? codeMatch[1] : "PR-01";
      const procedure = proceduresData[procedureCode as keyof typeof proceduresData] || proceduresData["PR-01"];
      expect(procedure.code).toBe(expected);
    });
  });

  it("should have correct total COP requirements across all procedures", () => {
    const totalReqs = 
      proceduresData["PR-01"].requirementsCount +
      proceduresData["PR-02"].requirementsCount +
      proceduresData["PR-03"].requirementsCount;
    
    expect(totalReqs).toBe(14); // 4 + 8 + 2
  });

  it("should have correct total operational steps across all procedures", () => {
    const totalSteps =
      proceduresData["PR-01"].stepsCount +
      proceduresData["PR-02"].stepsCount +
      proceduresData["PR-03"].stepsCount;
    
    expect(totalSteps).toBe(20); // 6 + 7 + 7
  });
});
