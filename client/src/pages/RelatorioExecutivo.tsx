import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

function formatFamilyLabel(family: string): string {
  const map: Record<string, string> = {
    'controle-projeto': 'Controle de Projeto',
    'controle-materiais': 'Controle de Materiais',
    'controle-producao': 'Controle de Produção',
    'liberacao-final': 'Liberação Final',
    'aeronavegabilidade-continuada': 'Aeronavegabilidade Continuada',
    'gestao-organizacional': 'Gestão Organizacional',
    'a-classificar': 'A classificar',
  };
  return map[family] || family;
}

export default function RelatorioExecutivo() {
  const [, setLocation] = useLocation();
  const { data: copReqs = [], isLoading: loadingReqs } = trpc.copRequirements.list.useQuery();
  const { data: procedures = [], isLoading: loadingProcs } = trpc.procedures.list.useQuery();

  const stats = useMemo(() => {
    if (!copReqs.length) return { total: 0, atendidos: 0, parciais: 0, naoAtendidos: 0, conformidade: 0 };
    let atendidos = 0, parciais = 0, naoAtendidos = 0;
    copReqs.forEach(req => {
      if (req.status === 'atendido') atendidos++;
      else if (req.status === 'parcial') parciais++;
      else naoAtendidos++;
    });
    const conformidade = Math.round((atendidos / copReqs.length) * 100);
    return { total: copReqs.length, atendidos, parciais, naoAtendidos, conformidade };
  }, [copReqs]);

  const byFamilia = useMemo(() => {
    const map = new Map<string, { familia: string; total: number; atendidos: number; parciais: number; naoAtendidos: number }>();

    copReqs.forEach(req => {
      const proc = procedures.find(p => p.code === req.procedureCode);
      const familia = proc?.family || 'A classificar';

      if (!map.has(familia)) {
        map.set(familia, { familia, total: 0, atendidos: 0, parciais: 0, naoAtendidos: 0 });
      }
      const f = map.get(familia)!;
      f.total++;
      if (req.status === 'atendido') f.atendidos++;
      else if (req.status === 'parcial') f.parciais++;
      else f.naoAtendidos++;
    });

    return Array.from(map.values()).map(f => ({
      ...f,
      conformidade: f.total > 0 ? Math.round((f.atendidos / f.total) * 100) : 0,
    }));
  }, [copReqs, procedures]);

  const byCpr = useMemo(() => {
    const map = new Map<string, { cpr: string; nome: string; total: number; atendidos: number; parciais: number; naoAtendidos: number }>();

    copReqs.forEach(req => {
      if (!req.procedureCode) return;
      const proc = procedures.find(p => p.code === req.procedureCode);

      if (!map.has(req.procedureCode)) {
        map.set(req.procedureCode, {
          cpr: req.procedureCode,
          nome: proc?.name || req.procedureCode,
          total: 0, atendidos: 0, parciais: 0, naoAtendidos: 0
        });
      }
      const c = map.get(req.procedureCode)!;
      c.total++;
      if (req.status === 'atendido') c.atendidos++;
      else if (req.status === 'parcial') c.parciais++;
      else c.naoAtendidos++;
    });

    return Array.from(map.values()).map(c => ({
      ...c,
      conformidade: c.total > 0 ? Math.round((c.atendidos / c.total) * 100) : 0,
    })).sort((a, b) => b.naoAtendidos - a.naoAtendidos);
  }, [copReqs, procedures]);

  if (loadingReqs || loadingProcs) {
    return <div className="p-8 text-center text-muted-foreground">Carregando relatório...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="flex items-center justify-between no-print">
        <button onClick={() => setLocation('/dashboard-cop')} className="text-sm text-blue-600 hover:underline">
          ← Voltar ao Dashboard
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          🖨️ Imprimir / Exportar PDF
        </button>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Relatório Executivo COP</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tecplas Aerospace — Certificação Operacional ANAC
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
            <p>CPRs: {procedures.length}</p>
            <p>Requisitos: {stats.total}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center border-l-4 border-l-blue-500">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-xs text-muted-foreground">Atendidos</p>
          <p className="text-3xl font-bold text-green-600">{stats.atendidos}</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-yellow-500">
          <p className="text-xs text-muted-foreground">Parciais</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.parciais}</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-red-500">
          <p className="text-xs text-muted-foreground">Não Atendidos</p>
          <p className="text-3xl font-bold text-red-600">{stats.naoAtendidos}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between mb-2">
          <h2 className="font-semibold">Conformidade Geral</h2>
          <span className="text-2xl font-bold text-blue-600">{stats.conformidade}%</span>
        </div>
        <Progress value={stats.conformidade} className="h-4" />
        <p className="text-xs text-muted-foreground mt-2">
          {stats.atendidos} de {stats.total} requisitos COP atendidos
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Resumo por Família COP</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2">Família</th>
              <th className="pb-2 text-center">Total</th>
              <th className="pb-2 text-center text-green-600">Atendidos</th>
              <th className="pb-2 text-center text-yellow-600">Parciais</th>
              <th className="pb-2 text-center text-red-600">Pendentes</th>
              <th className="pb-2 text-right">Conform.</th>
            </tr>
          </thead>
          <tbody>
            {byFamilia.map(f => (
              <tr key={f.familia} className="border-b">
                <td className="py-2">{formatFamilyLabel(f.familia)}</td>
                <td className="py-2 text-center">{f.total}</td>
                <td className="py-2 text-center text-green-600 font-medium">{f.atendidos}</td>
                <td className="py-2 text-center text-yellow-600 font-medium">{f.parciais}</td>
                <td className="py-2 text-center text-red-600 font-medium">{f.naoAtendidos}</td>
                <td className="py-2 text-right font-bold">{f.conformidade}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Resumo por CPR</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2">CPR</th>
              <th className="pb-2">Nome</th>
              <th className="pb-2 text-center">Atendidos</th>
              <th className="pb-2 text-center">Total</th>
              <th className="pb-2 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {byCpr.map(c => (
              <tr key={c.cpr} className="border-b">
                <td className="py-2 font-mono font-bold">{c.cpr}</td>
                <td className="py-2 text-muted-foreground">{c.nome}</td>
                <td className="py-2 text-center text-green-600 font-medium">{c.atendidos}</td>
                <td className="py-2 text-center">{c.total}</td>
                <td className="py-2 text-right font-bold">{c.conformidade}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {byCpr.filter(c => c.naoAtendidos > 0).length > 0 && (
        <Card className="p-6 border-l-4 border-l-orange-400">
          <h2 className="font-semibold mb-3">⚠️ Próximas Ações</h2>
          <ul className="space-y-2 text-sm">
            {byCpr.filter(c => c.naoAtendidos > 0).map(c => (
              <li key={c.cpr} className="flex justify-between">
                <span><span className="font-mono font-bold">{c.cpr}</span> — {c.nome}</span>
                <span className="text-red-600 font-medium">{c.naoAtendidos} pendente(s)</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
