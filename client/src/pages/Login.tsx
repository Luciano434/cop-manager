import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type UserRole = "ADMIN" | "QUALIDADE" | "ENGENHARIA" | "AUDITOR" | "USUARIO";

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export default function Login() {
  const [, setLocation] = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [firstAdminName, setFirstAdminName] = useState("");
  const [firstAdminUsername, setFirstAdminUsername] = useState("");
  const [firstAdminPassword, setFirstAdminPassword] = useState("");
  const [firstAdminPasswordConfirm, setFirstAdminPasswordConfirm] = useState("");

  const [error, setError] = useState("");

  const { data: hasUsers, isLoading: checkingUsers } = trpc.auth.hasUsers.useQuery();
  const isFirstAccess = hasUsers === false;

  const loginMutation = trpc.auth.login.useMutation();
  const createFirstAdminMutation = trpc.auth.createFirstAdmin.useMutation();

  async function handleCreateFirstAdmin() {
    const name = firstAdminName.trim();
    const adminUsername = normalizeUsername(firstAdminUsername);
    const adminPassword = firstAdminPassword;

    if (!name || !adminUsername || !adminPassword) {
      setError("Informe nome, usuário e senha do primeiro administrador.");
      return;
    }

    if (adminPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (adminPassword !== firstAdminPasswordConfirm) {
      setError("A confirmação da senha não confere.");
      return;
    }

    try {
      const result = await createFirstAdminMutation.mutateAsync({
        name,
        username: adminUsername,
        password: adminPassword,
      });

      localStorage.setItem("user", JSON.stringify({
        username: result.user.username,
        name: result.user.name,
        role: result.user.role as UserRole,
      }));

      setLocation("/procedimentos");
    } catch (err: any) {
      setError(err?.message || "Erro ao criar administrador.");
    }
  }

  async function handleLogin() {
    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername || !password) {
      setError("Informe usuário e senha.");
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        username: normalizedUsername,
        password,
      });

      localStorage.setItem("user", JSON.stringify({
        username: result.user.username,
        name: result.user.name,
        role: result.user.role as UserRole,
      }));

      setLocation("/procedimentos");
    } catch {
      setError("Usuário ou senha inválidos");
    }
  }

  if (checkingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white text-sm">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />

      <div className="relative w-[440px] bg-white/95 p-8 rounded-2xl shadow-2xl space-y-6 border border-white/20">
        <div className="flex justify-center">
          <img
            src="/logo-tecplas.png"
            alt="Tecplas Aerospace"
            className="h-20 w-full object-contain"
          />
        </div>

        <div className="text-center space-y-2 border-t pt-5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            COP Manager
          </h1>
          <p className="text-sm text-slate-500">
            Sistema de Gestão COP – RBAC 21
          </p>
        </div>

        {isFirstAccess ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              Primeiro acesso detectado. Crie o administrador inicial do sistema.
            </div>

            <input
              type="text"
              placeholder="Nome do administrador"
              className="w-full border border-slate-300 px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              value={firstAdminName}
              onChange={(e) => { setFirstAdminName(e.target.value); setError(""); }}
            />

            <input
              type="text"
              placeholder="Usuário administrador"
              className="w-full border border-slate-300 px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              value={firstAdminUsername}
              onChange={(e) => { setFirstAdminUsername(e.target.value); setError(""); }}
            />

            <input
              type="password"
              placeholder="Senha"
              className="w-full border border-slate-300 px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              value={firstAdminPassword}
              onChange={(e) => { setFirstAdminPassword(e.target.value); setError(""); }}
            />

            <input
              type="password"
              placeholder="Confirmar senha"
              className="w-full border border-slate-300 px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              value={firstAdminPasswordConfirm}
              onChange={(e) => { setFirstAdminPasswordConfirm(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFirstAdmin(); }}
            />

            {error && (
              <div className="text-red-600 text-sm text-center font-medium">{error}</div>
            )}

            <button
              onClick={handleCreateFirstAdmin}
              disabled={createFirstAdminMutation.isPending}
              className="w-full bg-slate-900 hover:bg-blue-900 disabled:opacity-50 text-white py-3 rounded-lg transition font-semibold tracking-wide"
            >
              {createFirstAdminMutation.isPending ? "Criando..." : "Criar administrador"}
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Usuário"
                className="w-full border border-slate-300 px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
              />

              <input
                type="password"
                placeholder="Senha"
                className="w-full border border-slate-300 px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center font-medium">{error}</div>
            )}

            <button
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              className="w-full bg-slate-900 hover:bg-blue-900 disabled:opacity-50 text-white py-3 rounded-lg transition font-semibold tracking-wide"
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </button>
          </>
        )}

        <div className="text-center text-xs text-slate-400 pt-2">
          RL Consulting · Tecplas Aerospace
        </div>
      </div>
    </div>
  );
}
