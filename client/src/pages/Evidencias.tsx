import { normalizeProcedureCode, normalizeRevision, getCurrentUser } from "@/lib/utils-cop";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

type EvidenciaStatus = "OK" | "NOK" | "PARCIAL" | "PENDENTE" | "NA";

function getSelectedRevision(cpr: any) {
  return normalizeRevision(cpr?.revision || "00");
}

function isValidRequirementRow(row: any[]) {
  if (!Array.isArray(row)) return false;
  const requisito = String(row[0] || "").trim();
  const evidencia = String(row[1] || "").trim();
  const registro = String(row[2] || "").trim();
  const verificacao = String(row[3] || "").trim();
  if (!requisito && !evidencia && !registro && !verificacao) return false;
  const joined = row.join(" ").toLowerCase();
  if (joined.includes("requisito") && joined.includes("evid") && joined.includes("registro")) return false;
  if (!requisito || requisito.trim() === "") return false;
  return true;
}

export default function Evidencias() {
  const [selectedCpr, setSelectedCpr] = useState<any>(null);
  const [localChanges, setLocalChanges] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const currentUser = getCurrentUser();

  const { data: cprs = [] } = trpc.procedures.list.useQuery();

  const cprCode = selectedCpr ? normalizeProcedureCode(selectedCpr.code) : "";
  const revision = selectedCpr ? getSelectedRevision(selectedCpr) : "";

  const { data: verificacoesBanco, refetch } = trpc.evidenceVerifications.listByCpr.useQuery(
    { cprCode, revision },
    { enabled: !!selectedCpr }
  );

  const upsertMutation = trpc.evidenceVerifications.upsert.useMutation({
    onSuccess: () => { refetch(); },
  });

  const { data: dbSections } = trpc.procedures.getSections.useQuery(
    { id: selectedCpr?.id ?? 0 },
    { enabled: !!selectedCpr?.id }
  );

  function getRequirements() {
    if (!selectedCpr) return [];

    const code = normalizeProcedureCode(selectedCpr.code);

    let sections: any[] = [];
    if (Array.isArray(dbSections) && dbSections.length > 0) {
      sections = dbSections;
    } else {
      try {
        const raw = localStorage.getItem(`sections:${code}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) sections = parsed;
        }
      } catch {}
    }

    if (sections.length === 0) return [];

    const item6 = sections.find(
      (s: any) =>
        s.number === 6 ||
        s.number === "6" ||
        s.item === 6 ||
        s.item === "6" ||
        (typeof s.title === "string" && s.title.startsWith("6"))
    );

    const rows = item6?.table?.rows || item6?.importedTable?.rows || item6?.rows || [];
    if (!Array.isArray(rows)) return [];

    return rows.filter(isValidRequirementRow).map((row: any[], index: number) => ({
      id: `6.${index + 1}`,
      requisito: String(row[0] || "").trim(),
      evidenciaEsperada: String(row[1] || "").trim(),
      registroEsperado: String(row[2] || "").trim(),
      verificacaoEsperada: String(row[3] || "").trim(),
      copCode: String(row[4] || "").trim(),
    }));
  }

  function getBancoData(requirementId: string) {
    return verificacoesBanco?.find((v) => v.requirementId === requirementId);
  }

  function getLocalData(requirementId: string) {
    return localChanges[requirementId] || {};
  }

  function getMerged(requirementId: string) {
    const banco = getBancoData(requirementId);
    const local = getLocalData(requirementId);
    return {
      status: local.status ?? banco?.status ?? "PENDENTE",
      evidenceText: local.evidenceText ?? banco?.evidenceText ?? "",
      registroText: local.registroText ?? banco?.registroText ?? "",
      responsible: local.responsible ?? banco?.responsible ?? "",
      observacao: local.observacao ?? banco?.observacao ?? "",
      updatedAt: banco?.updatedAt ?? null,
    };
  }

  function handleChange(requirementId: string, field: string, value: string) {
    setLocalChanges((prev) => ({
      ...prev,
      [requirementId]: { ...prev[requirementId], [field]: value },
    }));
  }

  async function handleSave(requirementId: string) {
    const merged = getMerged(requirementId);

    if (merged.status === "OK" && !merged.evidenceText?.trim() && !merged.registroText?.trim()) {
      alert("Não é possível marcar como OK sem evidência ou registro.");
      return;
    }

    setSaving((prev) => ({ ...prev, [requirementId]: true }));
    try {
      await upsertMutation.mutateAsync({
        cprCode,
        revision,
        requirementId,
        status: merged.status as EvidenciaStatus,
        evidenceText: merged.evidenceText,
        registroText: merged.registroText,
        responsible: merged.responsible,
        observacao: merged.observacao,
      });
      setLocalChanges((prev) => {
        const updated = { ...prev };
        delete updated[requirementId];
        return updated;
      });
    } finally {
      setSaving((prev) => ({ ...prev, [requirementId]: false }));
    }
  }

  const requirements = selectedCpr ? getRequirements() : [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Gestão de Evidências</h1>

      <Card className="p-4">
        <select
          className="border p-2 w-full"
          value={selectedCpr?.code || ""}
          onChange={(e) => {
            setSelectedCpr(cprs.find((c) => c.code === e.target.value) || null);
            setLocalChanges({});
          }}
        >
          <option value="">Selecione um CPR</option>
          {cprs.map((c) => (
            <option key={c.code} value={c.code}>
              {normalizeProcedureCode(c.code)} - {c.name}
            </option>
          ))}
        </select>
      </Card>

      {selectedCpr && (
        <div className="space-y-4">
          {requirements.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-gray-600">
                Nenhum requisito válido encontrado em Evidências Objetivas deste CPR.
              </p>
            </Card>
          ) : (
            requirements.map((req) => {
              const merged = getMerged(req.id);
              const isDirty = !!localChanges[req.id];
              const isSaving = saving[req.id];

              return (
                <Card key={req.id} className="p-4 flex flex-col gap-3">
                  <div className="space-y-2">
                    <p className="font-semibold">{req.id}</p>
                    <p className="text-sm"><span className="font-medium">Requisito:</span> {req.requisito || "-"}</p>
                    <p className="text-sm text-gray-600"><span className="font-medium">Evidência esperada:</span> {req.evidenciaEsperada || "-"}</p>
                    <p className="text-sm text-gray-600"><span className="font-medium">Registro esperado:</span> {req.registroEsperado || "-"}</p>
                    <p className="text-sm text-gray-600"><span className="font-medium">Forma de verificação:</span> {req.verificacaoEsperada || "-"}</p>
                    {req.copCode && (
                      <p className="text-xs text-blue-600 font-medium">
                        Item COP: {req.copCode}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Evidência apresentada</label>
                      <textarea
                        disabled={currentUser.role === "USUARIO"}
                        className="border p-2 w-full rounded min-h-[80px]"
                        value={merged.evidenceText}
                        onChange={(e) => handleChange(req.id, "evidenceText", e.target.value)}
                        placeholder="Descreva a evidência objetiva apresentada"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Registro / link / caminho</label>
                      <textarea
                        disabled={currentUser.role === "USUARIO"}
                        className="border p-2 w-full rounded min-h-[80px]"
                        value={merged.registroText}
                        onChange={(e) => handleChange(req.id, "registroText", e.target.value)}
                        placeholder="Ex.: F-CPR01-01, link, pasta, arquivo"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Responsável pela verificação</label>
                      <input
                        disabled={currentUser.role === "USUARIO"}
                        className="border p-2 w-full rounded"
                        value={merged.responsible}
                        onChange={(e) => handleChange(req.id, "responsible", e.target.value)}
                        placeholder="Ex.: Qualidade / Engenharia"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Observação / pendência</label>
                      <input
                        disabled={currentUser.role === "USUARIO"}
                        className="border p-2 w-full rounded"
                        value={merged.observacao}
                        onChange={(e) => handleChange(req.id, "observacao", e.target.value)}
                        placeholder="Ex.: aguardando registro"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    <Badge>{merged.status}</Badge>
                    <select
                      disabled={currentUser.role === "USUARIO"}
                      value={merged.status}
                      onChange={(e) => handleChange(req.id, "status", e.target.value)}
                      className="border p-2"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="OK">OK</option>
                      <option value="NOK">NOK</option>
                      <option value="PARCIAL">Parcial</option>
                      <option value="NA">N/A</option>
                    </select>

                    {currentUser.role !== "USUARIO" && (
                      <button
                        onClick={() => handleSave(req.id)}
                        disabled={!isDirty || isSaving}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                          isDirty
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {isSaving ? "Salvando..." : isDirty ? "💾 Salvar" : "✓ Salvo"}
                      </button>
                    )}
                  </div>

                  {merged.updatedAt && (
                    <p className="text-xs text-gray-500">
                      Última atualização: {new Date(merged.updatedAt).toLocaleString()}
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
