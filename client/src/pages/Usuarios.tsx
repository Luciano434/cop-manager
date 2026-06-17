import { useState } from "react";
import { trpc } from "@/lib/trpc";

type UserRole = "ADMIN" | "ENGENHARIA" | "QUALIDADE" | "AUDITOR" | "USUARIO";

type UserForm = {
  username: string;
  password: string;
  name: string;
  role: UserRole;
};

const roles: UserRole[] = ["ADMIN", "ENGENHARIA", "QUALIDADE", "AUDITOR", "USUARIO"];

export default function Usuarios() {
  const utils = trpc.useUtils();

  const { data: users = [], isLoading } = trpc.auth.listUsers.useQuery();

  const createUser = trpc.auth.createUser.useMutation({
    onSuccess: () => utils.auth.listUsers.invalidate(),
  });

  const toggleActiveMutation = trpc.auth.toggleActive.useMutation({
    onSuccess: () => utils.auth.listUsers.invalidate(),
  });

  const deleteUserMutation = trpc.auth.deleteUser.useMutation({
    onSuccess: () => utils.auth.listUsers.invalidate(),
  });

  const [form, setForm] = useState<UserForm>({
    username: "",
    password: "",
    name: "",
    role: "USUARIO",
  });

  async function handleAdd() {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      alert("Preencha nome, login e senha.");
      return;
    }

    try {
      await createUser.mutateAsync({
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      setForm({ username: "", password: "", name: "", role: "USUARIO" });
    } catch (err: any) {
      alert(err?.message || "Erro ao cadastrar usuário.");
    }
  }

  async function handleToggleActive(id: number, currentActive: boolean) {
    const user = users.find((u) => u.id === id);
    const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.active);

    if (user?.role === "ADMIN" && currentActive && activeAdmins.length <= 1) {
      alert("Não é permitido desativar o último ADMIN ativo.");
      return;
    }

    try {
      await toggleActiveMutation.mutateAsync({ id, active: !currentActive });
    } catch (err: any) {
      alert(err?.message || "Erro ao alterar status.");
    }
  }

  async function handleDelete(id: number, name: string) {
    const user = users.find((u) => u.id === id);
    const activeAdminsAfterDelete = users.filter(
      (u) => u.id !== id && u.role === "ADMIN" && u.active
    );

    if (user?.role === "ADMIN" && user.active && activeAdminsAfterDelete.length === 0) {
      alert("Não é permitido excluir o último ADMIN ativo.");
      return;
    }

    if (!confirm(`Deseja excluir o usuário ${name}?`)) return;

    try {
      await deleteUserMutation.mutateAsync({ id });
    } catch (err: any) {
      alert(err?.message || "Erro ao excluir usuário.");
    }
  }

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Usuários</h1>

      <div className="grid grid-cols-2 gap-4 p-4 border rounded bg-white">
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
        />

        <input
          placeholder="Login"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Senha"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border p-2 rounded"
        />

        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
          className="border p-2 rounded"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <button
          onClick={handleAdd}
          disabled={createUser.isPending}
          className="col-span-2 bg-green-600 text-white p-2 rounded disabled:opacity-50"
        >
          {createUser.isPending ? "Cadastrando..." : "Cadastrar Usuário"}
        </button>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex justify-between items-center border p-3 rounded bg-white"
          >
            <div>
              <strong>{u.name}</strong> ({u.username}) — {u.role}
              {!u.active && <span className="text-red-500"> (Inativo)</span>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggleActive(u.id, Boolean(u.active))}
                disabled={toggleActiveMutation.isPending}
                className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
              >
                {u.active ? "Desativar" : "Ativar"}
              </button>

              <button
                onClick={() => handleDelete(u.id, u.name ?? u.username ?? String(u.id))}
                disabled={deleteUserMutation.isPending}
                className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
