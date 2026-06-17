import { useEffect, useState } from "react";

type UserRole = "USUARIO" | "ENGENHARIA" | "QUALIDADE" | "AUDITOR" | "ADMIN";

type User = {
  username: string;
  password?: string; // legado
  passwordHash?: string;
  name: string;
  role: UserRole;
  active: boolean;
};

type UserForm = {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  active: boolean;
};

const roles: UserRole[] = [
  "USUARIO",
  "ENGENHARIA",
  "QUALIDADE",
  "AUDITOR",
  "ADMIN",
];

async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function loadUsers(): User[] {
  try {
    const stored = localStorage.getItem("users");
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((u) => ({
      username: u.username || "",
      password: u.password || undefined,
      passwordHash: u.passwordHash || undefined,
      name: u.name || "",
      role: u.role || "USUARIO",
      active: u.active !== false,
    }));
  } catch {
    return [];
  }
}

export default function Usuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserForm>({
    username: "",
    password: "",
    name: "",
    role: "USUARIO",
    active: true,
  });

  useEffect(() => {
  async function migrateUsers() {
    const loadedUsers = loadUsers();

    let changed = false;

    const migratedUsers = await Promise.all(
      loadedUsers.map(async (user) => {
        if (user.password && !user.passwordHash) {
          changed = true;

          const passwordHash = await sha256(user.password);

          const migratedUser: User = {
            ...user,
            passwordHash,
          };

          delete migratedUser.password;

          return migratedUser;
        }

        return user;
      })
    );

    setUsers(migratedUsers);

    if (changed) {
      localStorage.setItem("users", JSON.stringify(migratedUsers));
    }
  }

  migrateUsers();
}, []);

  function saveUsers(updated: User[]) {
    setUsers(updated);
    localStorage.setItem("users", JSON.stringify(updated));
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      alert("Preencha nome, login e senha.");
      return;
    }

    if (form.password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const normalizedUsername = normalizeUsername(form.username);

    const exists = users.some(
      (u) => normalizeUsername(u.username) === normalizedUsername
    );

    if (exists) {
      alert("Este login já existe.");
      return;
    }

    const passwordHash = await sha256(form.password);

    const newUser: User = {
      username: normalizedUsername,
      name: form.name.trim(),
      role: form.role,
      active: true,
      passwordHash,
    };

    saveUsers([...users, newUser]);

    setForm({
      username: "",
      password: "",
      name: "",
      role: "USUARIO",
      active: true,
    });
  }

  function toggleActive(index: number) {
    const user = users[index];

    const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.active);

    if (user.role === "ADMIN" && user.active && activeAdmins.length <= 1) {
      alert("Não é permitido desativar o último ADMIN ativo.");
      return;
    }

    const updated = [...users];
    updated[index] = {
      ...updated[index],
      active: !updated[index].active,
    };

    saveUsers(updated);
  }

  function deleteUser(index: number) {
    const user = users[index];

    const loggedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (
      loggedUser &&
      normalizeUsername(String(loggedUser.username || "")) ===
        normalizeUsername(String(user.username || ""))
    ) {
      alert("Não é permitido excluir o próprio usuário logado.");
      return;
    }

    const activeAdminsAfterDelete = users.filter(
      (u, i) => i !== index && u.role === "ADMIN" && u.active
    );

    if (
      user.role === "ADMIN" &&
      user.active &&
      activeAdminsAfterDelete.length === 0
    ) {
      alert("Não é permitido excluir o último ADMIN ativo.");
      return;
    }

    if (!confirm(`Deseja excluir o usuário ${user.name}?`)) return;

    saveUsers(users.filter((_, i) => i !== index));
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
          onChange={(e) =>
            setForm({ ...form, role: e.target.value as UserRole })
          }
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
          className="col-span-2 bg-green-600 text-white p-2 rounded"
        >
          Cadastrar Usuário
        </button>
      </div>

      <div className="space-y-2">
        {users.map((u, i) => (
          <div
            key={u.username}
            className="flex justify-between items-center border p-3 rounded bg-white"
          >
            <div>
              <strong>{u.name}</strong> ({u.username}) — {u.role}
              {!u.active && <span className="text-red-500"> (Inativo)</span>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(i)}
                className="bg-gray-200 px-3 py-1 rounded"
              >
                {u.active ? "Desativar" : "Ativar"}
              </button>

              <button
                onClick={() => deleteUser(i)}
                className="bg-red-600 text-white px-3 py-1 rounded"
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