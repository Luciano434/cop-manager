import { useMemo } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";
import { normalizeProcedureCode } from "@/lib/utils-cop";

type EvidenciaStatus = "OK" | "NOK" | "PARCIAL" | "PENDENTE" | "NA";

type EvidenciaLS = {
  id: number | string;
  cprCode: string;
  revision?: string;
  requirementId: string;
  status: EvidenciaStatus;
  evidences?: string[];
  registros?: string[];
  responsible?: string;
  updatedAt?: string;
  observacao?: string;
  requisito?: string;
};

function readEvidences(): EvidenciaLS[] {
  try {
    const raw = localStorage.getItem("evidences");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readProcedures(): any[] {
  try {
    const raw = localStorage.getItem("customProcedures");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getProcedureName(code: string, procedures: any[]) {
  const normalizedCode = normalizeProcedureCode(code);

  const found = procedures.find(
    (p) => normalizeProcedureCode(String(p.code || "")) === normalizedCode
  );

  return String(found?.name || found?.title || normalizedCode);
}

function hasObjectiveEvidence(ev: EvidenciaLS) {
  return Boolean(ev.evidences?.[0]?.trim()) || Boolean(ev.registros?.[0]?.trim());
}

function getProcedureFamily(code: string, procedures: any[]): string {
  const normalizedCode = normalizeProcedureCode(code);

  const found = procedures.find(
    (p) => normalizeProcedureCode(String(p.code || "")) === normalizedCode
  );

  const familyValue =
    found?.family ||
    found?.familyCOP ||
    found?.familia ||
    found?.copFamily ||
    found?.categoria ||
    found?.name ||
    found?.title ||
    "";

  return normalizeFamily(familyValue);
}

function calculateCompliance(total: number, atendido: number, parcial: number) {
  return total > 0 ? Math.round(((atendido + parcial * 0.5) / total) * 100) : 0;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeFamily(value: unknown): string {
  const normalized = normalizeText(value);

  if (!normalized) return "A classificar";
  if (normalized.includes("projeto")) return "Controle de Projeto";
  if (normalized.includes("material")) return "Controle de Materiais";
  if (normalized.includes("producao")) return "Controle de Produção";
  if (normalized.includes("liberacao")) return "Liberação Final";
  if (normalized.includes("aeronavegabilidade")) return "Aeronavegabilidade Continuada";
  if (normalized.includes("gestao") || normalized.includes("organizacional")) {
    return "Gestão Organizacional";
  }

  return "A classificar";
}

export default function RelatorioAuditoria() {
  const [, setLocation] = useLocation();

  const evidencias = useMemo(() => readEvidences(), []);
  const procedures = useMemo(() => readProcedures(), []);

  const validEvidencias = useMemo(() => {
    return evidencias.filter((ev) => String(ev.requirementId || "").includes("6."));
  }, [evidencias]);

  const stats = useMemo(() => {
    const total = validEvidencias.length;

    const atendido = validEvidencias.filter(
      (ev) => (ev.status === "OK" || ev.status === "NA") && hasObjectiveEvidence(ev)
    ).length;

    const parcial = validEvidencias.filter((ev) => ev.status === "PARCIAL").length;

    const naoAtendido = validEvidencias.filter(
      (ev) =>
        ev.status === "NOK" ||
        ev.status === "PENDENTE" ||
        (ev.status === "OK" && !hasObjectiveEvidence(ev))
    ).length;

    const conformidade =
      total > 0 ? Math.round(((atendido + parcial * 0.5) / total) * 100) : 0;

    return {
      total,
      atendido,
      parcial,
      naoAtendido,
      conformidade,
    };
  }, [validEvidencias]);

      const uniqueProcedures = new Set(
    validEvidencias.map((ev) => normalizeProcedureCode(ev.cprCode)).filter(Boolean)
  );

const resumoPorCPR = useMemo(() => {
  const map = new Map<
    string,
    {
      cprCode: string;
      procedureName: string;
      family: string;
      total: number;
      atendido: number;
      parcial: number;
      naoAtendido: number;
      conformidade: number;
    }
  >();

  validEvidencias.forEach((ev) => {
    const cprCode = normalizeProcedureCode(ev.cprCode);
    if (!cprCode) return;

    if (!map.has(cprCode)) {
      map.set(cprCode, {
        cprCode,
        procedureName: getProcedureName(cprCode, procedures),
        family: getProcedureFamily(cprCode, procedures),
        total: 0,
        atendido: 0,
        parcial: 0,
        naoAtendido: 0,
        conformidade: 0,
      });
    }

    const item = map.get(cprCode)!;
    item.total += 1;

    if ((ev.status === "OK" || ev.status === "NA") && hasObjectiveEvidence(ev)) {
      item.atendido += 1;
    } else if (ev.status === "PARCIAL") {
      item.parcial += 1;
    } else {
      item.naoAtendido += 1;
    }

    item.conformidade = calculateCompliance(
      item.total,
      item.atendido,
      item.parcial
    );
  });

  return Array.from(map.values()).sort((a, b) =>
    a.cprCode.localeCompare(b.cprCode, "pt-BR", { numeric: true })
  );
}, [validEvidencias, procedures]);

const resumoPorFamilia = useMemo(() => {
  const map = new Map<
    string,
    {
      family: string;
      cprs: Set<string>;
      total: number;
      atendido: number;
      parcial: number;
      naoAtendido: number;
      conformidade: number;
    }
  >();

  resumoPorCPR.forEach((cpr) => {
    if (!map.has(cpr.family)) {
      map.set(cpr.family, {
        family: cpr.family,
        cprs: new Set<string>(),
        total: 0,
        atendido: 0,
        parcial: 0,
        naoAtendido: 0,
        conformidade: 0,
      });
    }

    const item = map.get(cpr.family)!;
    item.cprs.add(cpr.cprCode);
    item.total += cpr.total;
    item.atendido += cpr.atendido;
    item.parcial += cpr.parcial;
    item.naoAtendido += cpr.naoAtendido;
    item.conformidade = calculateCompliance(
      item.total,
      item.atendido,
      item.parcial
    );
  });

  return Array.from(map.values()).sort((a, b) =>
    a.family.localeCompare(b.family, "pt-BR")
  );
}, [resumoPorCPR]);

  const dataRelatorio = new Date().toLocaleDateString("pt-BR");

  const imprimirRelatorio = () => {
    window.print();
  };

  return (
    <>
      <style>{`
  @media print {
    .no-print {
      display: none !important;
    }

    aside,
    header {
      display: none !important;
    }

    html,
    body,
    #root {
      background: white !important;
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
    }

    main {
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      display: block !important;
    }

    .print-container {
      max-width: 100% !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      height: auto !important;
    }

    .print-card {
      box-shadow: none !important;
      border: 1px solid #d4d4d8 !important;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .print-section {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

    * {
      overflow: visible !important;
    }

    @page {
      size: A4 portrait;
      margin: 8mm;
    }
  }
`}</style>

      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8 print-container">
          <div className="no-print flex items-center justify-between gap-4">
            <button
              onClick={() => setLocation("/dashboard-cop")}
              className="text-sm text-accent hover:underline"
            >
              ← Voltar ao Dashboard
            </button>

            <Button onClick={imprimirRelatorio} className="gap-2">
              <Printer className="w-4 h-4" />
              Exportar / Imprimir PDF
            </Button>
          </div>

          <Card className="p-8 print-card">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-8 h-8 text-accent" />
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Relatório Executivo COP
                  </h1>
                </div>

                <p className="text-muted-foreground">
                  Visão executiva da conformidade dos CPRs com base nas
                  Evidências Objetivas registradas no Item 6.
                </p>
              </div>

              <div className="text-right text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Data:</span>{" "}
                  {dataRelatorio}
                </p>
                <p>
                  <span className="font-medium text-foreground">CPRs:</span>{" "}
                  {uniqueProcedures.size}
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    Evidências:
                  </span>{" "}
                  {validEvidencias.length}
                </p>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-4 gap-4 print-section">
            <Card className="p-6 text-center print-card">
              <p className="text-sm text-muted-foreground">Total Requisitos</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.total}
              </p>
            </Card>

            <Card className="p-6 text-center print-card">
              <p className="text-sm text-muted-foreground">Atendidos</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.atendido}
              </p>
            </Card>

            <Card className="p-6 text-center print-card">
              <p className="text-sm text-muted-foreground">Parciais</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.parcial}
              </p>
            </Card>

            <Card className="p-6 text-center print-card">
              <p className="text-sm text-muted-foreground">Não Atendidos</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.naoAtendido}
              </p>
            </Card>
          </div>

          <Card className="p-6 print-card print-section overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-foreground">
                Conformidade Geral
              </h2>
              <span className="text-2xl font-bold text-accent">
                {stats.conformidade}%
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${stats.conformidade}%` }}
              />
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Cálculo: requisitos OK com evidência/registro contam integralmente;
              requisitos parciais contam com peso intermediário; pendentes, NOK
              ou OK sem comprovação não contam como conformes.
            </p>
          </Card>

          <Card className="p-6 print-card print-section">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Resumo Executivo
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              O sistema apresenta atualmente{" "}
              <strong>{stats.conformidade}%</strong> de conformidade geral nas
              Evidências Objetivas monitoradas. Há{" "}
              <strong>{stats.atendido}</strong> requisito(s) atendido(s),{" "}
              <strong>{stats.parcial}</strong> parcial(is) e{" "}
              <strong>{stats.naoAtendido}</strong> não atendido(s) ou pendente(s).
            </p>
          </Card>

          <Card className="p-6 print-card print-section overflow-hidden">
  <h2 className="text-xl font-semibold text-foreground mb-4">
    Resumo por Família COP
  </h2>

  <div className="w-full overflow-x-auto">
    <table className="min-w-[760px] w-full text-sm border-collapse">
      <thead>
        <tr className="border-b bg-slate-50">
          <th className="text-left p-2 font-semibold">Família COP</th>
          <th className="text-left p-2 font-semibold">CPRs</th>
          <th className="text-left p-2 font-semibold">Total</th>
          <th className="text-left p-2 font-semibold">Atendidos</th>
          <th className="text-left p-2 font-semibold">Parciais</th>
          <th className="text-left p-2 font-semibold">Não Atendidos</th>
          <th className="text-left p-2 font-semibold text-xs">
  Conform.
</th>
        </tr>
      </thead>

      <tbody>
        {resumoPorFamilia.map((item) => (
          <tr key={item.family} className="border-b">
            <td className="p-2">{item.family}</td>
            <td className="p-2">{item.cprs.size}</td>
            <td className="p-2">{item.total}</td>
            <td className="p-2 text-green-700 font-medium">{item.atendido}</td>
            <td className="p-2 text-yellow-700 font-medium">{item.parcial}</td>
            <td className="p-2 text-red-700 font-medium">{item.naoAtendido}</td>
            <td className="p-2 font-semibold">{item.conformidade}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</Card>

<Card className="p-6 print-card print-section overflow-hidden">
  <h2 className="text-xl font-semibold text-foreground mb-4">
    Resumo por CPR
  </h2>

  <div className="w-full overflow-x-auto">
  <table className="min-w-[900px] w-full table-fixed text-sm border-collapse">
      <colgroup>
        <col style={{ width: "8%" }} />
        <col style={{ width: "28%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "8%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "6%" }} />
      </colgroup>
      <thead>
        <tr className="border-b bg-slate-50">
          <th className="text-left p-2 font-semibold">CPR</th>
          <th className="text-left p-2 font-semibold">Procedimento</th>
          <th className="text-left p-2 font-semibold">Família</th>
          <th className="text-left p-2 font-semibold">Total</th>
          <th className="text-left p-2 font-semibold">Atendidos</th>
          <th className="text-left p-2 font-semibold">Parciais</th>
          <th className="text-left p-2 font-semibold">Não Atendidos</th>
          <th className="text-left p-2 font-semibold">Conform.</th>
        </tr>
      </thead>

      <tbody>
        {resumoPorCPR.map((item) => (
          <tr key={item.cprCode} className="border-b align-top">
            <td className="p-2 font-medium">{item.cprCode}</td>
            <td className="p-2 break-words">
  {item.procedureName}
</td>

<td className="p-2 break-words">
  {item.family}
</td>
            <td className="p-2">{item.total}</td>
            <td className="p-2 text-green-700 font-medium">{item.atendido}</td>
            <td className="p-2 text-yellow-700 font-medium">{item.parcial}</td>
            <td className="p-2 text-red-700 font-medium">{item.naoAtendido}</td>
            <td className="p-2 font-semibold">{item.conformidade}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</Card>

          
          <Card className="p-6 print-card print-section">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Conclusão da Auditoria
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              Recomenda-se tratar prioritariamente os requisitos classificados
              como <strong>parciais</strong>, <strong>NOK</strong> ou{" "}
              <strong>pendentes</strong>, bem como complementar evidências OK
              sem comprovação documental. O relatório agora utiliza a mesma base
              de dados do Dashboard COP e da Gestão de Evidências.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}