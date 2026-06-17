export type UserRole =
  | "USUARIO"
  | "ENGENHARIA"
  | "QUALIDADE"
  | "AUDITOR"
  | "ADMIN";

export type LoggedUser = {
  username: string;
  name: string;
  role: UserRole;
  active?: boolean;
  loginAt?: string;
};

export function normalizeProcedureCode(value?: string | null): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/^CPR(\d)/, "CPR-$1");
}

/**
 * Retorna a revisão sem prefixo R
 * Exemplos:
 * "R00" -> "00"
 * "00"  -> "00"
 * "R01" -> "01"
 */
export function normalizeRevisionNumber(
  value?: string | number | null
): string {
  const raw = String(value || "00")
    .trim()
    .toUpperCase();

  const withoutPrefix = raw.replace(/^R/, "");

  return withoutPrefix || "00";
}

/**
 * Retorna a revisão formatada com prefixo R
 * Exemplos:
 * "00"  -> "R00"
 * "01"  -> "R01"
 * "R02" -> "R02"
 */
export function formatRevision(
  value?: string | number | null
): string {
  return `R${normalizeRevisionNumber(value)}`;
}

/**
 * Mantida por compatibilidade com o código existente.
 * Sempre retorna revisão formatada (R00, R01, R02...)
 */
export function normalizeRevision(
  value?: string | number | null
): string {
  return formatRevision(value);
}

export function getCurrentUser(): LoggedUser {
  try {
    const stored = localStorage.getItem("user");

    if (!stored) {
      return {
        username: "sistema",
        name: "Sistema",
        role: "USUARIO",
        active: true,
      };
    }

    const parsed = JSON.parse(stored);

    return {
      username: parsed.username || "sistema",
      name: parsed.name || parsed.username || "Sistema",
      role: parsed.role || "USUARIO",
      active: parsed.active !== false,
      loginAt: parsed.loginAt,
    };
  } catch {
    return {
      username: "sistema",
      name: "Sistema",
      role: "USUARIO",
      active: true,
    };
  }
}

export function normalizeStatus(value?: string | null): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}