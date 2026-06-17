import { normalizeProcedureCode } from "@/lib/utils-cop";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { baseProcedures } from "@/data/procedures/baseProcedures";

type Procedure = {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  responsible: string;
  createdAt: string;
  revision: string;
  family?: string;
};

type ProcedureFamily = {
  id: string;
  sigla: string;
  label: string;
  codes: string[];
  buttonClassName: string;
};

function normalizeRevision(value?: string) {
  const raw = String(value || "00").trim().toUpperCase();
  const withoutPrefix = raw.replace(/^R/, "");
  return withoutPrefix || "00";
}

const PROCEDURE_FAMILIES: ProcedureFamily[] = [
  {
    id: "controle-projeto",
    sigla: "CP",
    label: "CONTROLE DE PROJETO",
    codes: ["CPR-01", "CPR-02", "CPR-03"],
    buttonClassName: "bg-blue-600 text-white hover:bg-blue-700",
  },
  {
    id: "controle-materiais",
    sigla: "CM",
    label: "CONTROLE DE MATERIAIS",
    codes: ["CPR-04", "CPR-05", "CPR-06"],
    buttonClassName: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  {
    id: "controle-producao",
    sigla: "CPR",
    label: "CONTROLE DE PRODUÇÃO",
    codes: ["CPR-07", "CPR-08", "CPR-10"],
    buttonClassName: "bg-amber-500 text-white hover:bg-amber-600",
  },
  {
    id: "liberacao-final",
    sigla: "LIBF",
    label: "LIBERAÇÃO FINAL",
    codes: ["CPR-09", "CPR-11"],
    buttonClassName: "bg-purple-600 text-white hover:bg-purple-700",
  },
  {
    id: "aeronavegabilidade-continuada",
    sigla: "AC",
    label: "AERONAVEGABILIDADE CONTINUADA",
    codes: ["CPR-12"],
    buttonClassName: "bg-rose-600 text-white hover:bg-rose-700",
  },
  {
    id: "gestao-organizacional",
    sigla: "GO",
    label: "GESTÃO ORGANIZACIONAL",
    codes: ["CPR-13", "CPR-14", "CPR-15", "CPR-16"],
    buttonClassName: "bg-slate-700 text-white hover:bg-slate-800",
  },
];

function normalizeStatus(value?: string) {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "em revisão" ||
    normalized === "em revisao" ||
    normalized === "em_revisao"
  ) {
    return "em_revisao";
  }

  if (normalized === "aprovado") return "aprovado";
  if (normalized === "bloqueado") return "bloqueado";
  if (normalized === "cancelado") return "cancelado";
  if (normalized === "nao_iniciado") return "nao_iniciado";
  if (normalized === "implementado") return "implementado";
  if (normalized === "em_desenvolvimento") return "em_desenvolvimento";

  return "em_elaboracao";
}

function getStoredProcedureView(code: string) {
  try {
    const normalizedCode = normalizeProcedureCode(code);
    const raw = localStorage.getItem(`procedure-${normalizedCode}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readCustomProcedures() {
  try {
    const raw = localStorage.getItem("customProcedures");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeProcedure(item: any, fallbackId: number): Procedure | null {
  if (!item || !item.code || !item.name) return null;

  const normalizedCode = normalizeProcedureCode(String(item.code));
  const storedView = getStoredProcedureView(normalizedCode);

  const revision = normalizeRevision(storedView?.revision ?? item.revision ?? "00");

  const status = normalizeStatus(
    storedView?.status ?? item.status ?? "em_elaboracao"
  );

  return {
  id: Number(item.id ?? fallbackId),
  code: normalizedCode,
  name: String(item.name ?? ""),
  description: String(item.description ?? ""),
  status,
  responsible: String(item.responsible ?? "Engenharia"),
  createdAt: String(item.createdAt ?? ""),
  revision,
  family: item.family || undefined,
};
}

function formatStatusLabel(status: string) {
  const map: Record<string, string> = {
    nao_iniciado: "Não iniciado",
    em_desenvolvimento: "Em desenvolvimento",
    implementado: "Implementado",
    em_elaboracao: "Em elaboração",
    aprovado: "Aprovado",
    bloqueado: "Bloqueado",
    cancelado: "Cancelado",
    em_revisao: "Em revisão",
  };

  return map[status] || status;
}

function getStatusBadgeClass(status: string) {
  const map: Record<string, string> = {
    nao_iniciado: "bg-gray-100 text-gray-700",
    em_desenvolvimento: "bg-blue-100 text-blue-700",
    implementado: "bg-green-100 text-green-700",
    em_elaboracao: "bg-amber-100 text-amber-700",
    aprovado: "bg-green-100 text-green-700",
    bloqueado: "bg-gray-200 text-gray-900",
    cancelado: "bg-red-100 text-red-700",
    em_revisao: "bg-violet-100 text-violet-700",
  };

  return map[status] || "bg-slate-100 text-slate-700";
}

function getNumericProcedureBase(code: string) {
  const normalizedCode = normalizeProcedureCode(code);
  const match = normalizedCode.match(/^CPR-(\d+)/i);
  return match ? `CPR-${String(Number(match[1])).padStart(2, "0")}` : normalizedCode;
}

function findFamily(proc: Procedure) {
  if (proc.family) {
    const familyById = PROCEDURE_FAMILIES.find(
      (item) => item.id === proc.family
    );

    if (familyById) return familyById;
  }

  const baseCode = getNumericProcedureBase(proc.code);
  return PROCEDURE_FAMILIES.find((item) => item.codes.includes(baseCode)) || null;
}

function loadAllProcedures(): Procedure[] {
  const baseList = baseProcedures
    .map((item, idx) => normalizeProcedure(item, idx + 1))
    .filter(Boolean) as Procedure[];

  const customProcedures = readCustomProcedures()
    .map((item, idx) => normalizeProcedure(item, 1000 + idx))
    .filter(Boolean) as Procedure[];

  const mergedByCode = new Map<string, Procedure>();

  baseList.forEach((item) => {
    mergedByCode.set(item.code.toLowerCase(), item);
  });

  customProcedures.forEach((item) => {
    mergedByCode.set(item.code.toLowerCase(), item);
  });

  const result = Array.from(mergedByCode.values());

  result.sort((a, b) => {
    const numA = parseInt(String(a.code).replace(/\D/g, "")) || 0;
    const numB = parseInt(String(b.code).replace(/\D/g, "")) || 0;

    if (numA !== numB) return numA - numB;

    return a.code.localeCompare(b.code, "pt-BR", { numeric: true });
  });

  return result;
}

export default function Procedimentos() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>("controle-projeto");

  useEffect(() => {
    setProcedures(loadAllProcedures());
  }, [location]);

  const selectedFamilyData = useMemo(() => {
    return PROCEDURE_FAMILIES.find((family) => family.id === selectedFamily);
  }, [selectedFamily]);

  const filteredProcedures = useMemo(() => {
  if (!selectedFamilyData) return procedures;

  return procedures.filter((proc) => {
    const baseCode = getNumericProcedureBase(proc.code);

    const familyMatches =
      proc.family &&
      PROCEDURE_FAMILIES.some((family) => family.id === proc.family) &&
      proc.family === selectedFamilyData.id;

    const codeMatches = selectedFamilyData.codes.includes(baseCode);

    const text = `${proc.code} ${proc.name}`.toLowerCase();
    const searchMatch = text.includes(search.toLowerCase());

    return (familyMatches || codeMatches) && searchMatch;
  });
}, [procedures, selectedFamilyData, search]);

  function handleOpen(code: string) {
    const normalizedCode = normalizeProcedureCode(code);
    setLocation(`/procedimentos/${normalizedCode}`);
  }

  function handleNovo() {
    setLocation("/novo-procedimento");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Procedimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consulta de procedimentos por família.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNovo}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Novo Procedimento
        </button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {PROCEDURE_FAMILIES.map((family) => {
            const isActive = selectedFamily === family.id;

            return (
              <button
                key={family.id}
                type="button"
                onClick={() => setSelectedFamily(family.id)}
                className={`px-3 py-2 rounded-md text-xs font-semibold transition border ${
                  family.buttonClassName
                } ${isActive ? "ring-2 ring-offset-1 ring-slate-300" : ""}`}
              >
                {family.label}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
  <input
    type="text"
    placeholder="Buscar por código ou nome..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border p-2 rounded w-full"
  />
</div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {selectedFamilyData?.label || "FAMÍLIA"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Procedimentos pertencentes a esta família.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredProcedures.length} procedimento(s)
          </div>
        </div>
      </Card>

      {filteredProcedures.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Nenhum procedimento encontrado nesta família.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProcedures.map((proc) => {
            const family = findFamily(proc);

            return (
              <Card
  key={proc.code}
  className={`p-4 cursor-pointer hover:shadow-md transition border ${
    proc.status === "cancelado"
      ? "bg-red-50 border-red-200 opacity-80"
      : ""
  }`}
  onClick={() => handleOpen(proc.code)}
>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-lg">{proc.code}</span>

                      <span
  className={`text-xs px-2 py-1 rounded-full ${
    proc.status === "cancelado"
      ? "bg-red-200 text-red-800 font-semibold"
      : getStatusBadgeClass(proc.status)
  }`}
>
  {formatStatusLabel(proc.status)}
</span>

                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                        {proc.revision}
                      </span>
                    </div>

                    <div className="text-sm font-medium mt-2">{proc.name}</div>

                    <div className="text-xs text-muted-foreground mt-2">
                      {proc.description || "Sem descrição cadastrada."}
                    </div>
                  </div>

                  <div className="text-xs space-y-1 md:text-right shrink-0">
                    <div>
                      <span className="text-muted-foreground">Responsável: </span>
                      <span className="font-medium">{proc.responsible}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Família: </span>
                      <span className="font-medium">
                        {family ? `${family.sigla} - ${family.label}` : "SEM FAMÍLIA"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Data base: </span>
                      <span className="font-medium">{proc.createdAt || "-"}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}