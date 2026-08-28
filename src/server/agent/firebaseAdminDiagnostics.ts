/** Safe Firebase Admin diagnostics — never log secrets or credential payloads. */

export type SafeAdminDiagnostics = {
  ADMIN_ENV_PRESENT: boolean;
  ADMIN_PATH_ENV_PRESENT: boolean;
  ADMIN_JSON_PARSE: boolean;
  ADMIN_PROJECT_ID: string | null;
  CLIENT_EMAIL_PRESENT: boolean;
  PRIVATE_KEY_PRESENT: boolean;
  ADMIN_INIT: boolean;
  ADMIN_DB: boolean;
  ADMIN_INIT_ERROR_MESSAGE: string | null;
  CREDENTIAL_SOURCE: string | null;
};

const SECRET_LINE_PATTERN =
  /private_key|BEGIN [A-Z ]+PRIVATE KEY|client_email|@"|AIza[0-A-Za-z_-]{20,}/i;

export function safeErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
  const sanitized = raw
    .split("\n")
    .filter((line) => !SECRET_LINE_PATTERN.test(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return sanitized.slice(0, 300) || "unknown error";
}

export function extractFirestoreError(error: unknown): {
  code: string | null;
  message: string;
} {
  if (error && typeof error === "object") {
    const record = error as { code?: unknown; message?: unknown };
    return {
      code: record.code != null ? String(record.code) : null,
      message: safeErrorMessage(error),
    };
  }
  return { code: null, message: safeErrorMessage(error) };
}

export function normalizeJsonEnvRaw(raw: string): string {
  let value = raw.trim().replace(/^\uFEFF/, "");
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"') && !value.startsWith('{"'))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

/** Parse env JSON; supports double-encoded JSON strings from some hosting panels. */
export function parseJsonEnvValue(raw: string): unknown {
  let current: unknown = normalizeJsonEnvRaw(raw);
  for (let attempt = 0; attempt < 3; attempt++) {
    if (typeof current !== "string") return current;
    const trimmed = normalizeJsonEnvRaw(current);
    try {
      current = JSON.parse(trimmed);
    } catch (error) {
      if (attempt === 0) throw error;
      return current;
    }
  }
  return current;
}

export function readCredentialSource(): string | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return "FIREBASE_SERVICE_ACCOUNT_JSON";
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()) return "FIREBASE_SERVICE_ACCOUNT_PATH";
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) return "GOOGLE_APPLICATION_CREDENTIALS";
  return null;
}

type ParsedServiceAccountPeek = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

export function peekServiceAccountFromEnv(): {
  jsonParse: boolean;
  projectId: string | null;
  clientEmailPresent: boolean;
  privateKeyPresent: boolean;
  parseError: string | null;
} {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    return {
      jsonParse: false,
      projectId: null,
      clientEmailPresent: false,
      privateKeyPresent: false,
      parseError: null,
    };
  }
  try {
    const parsed = parseJsonEnvValue(raw) as ParsedServiceAccountPeek;
    if (!parsed || typeof parsed !== "object") {
      return {
        jsonParse: false,
        projectId: null,
        clientEmailPresent: false,
        privateKeyPresent: false,
        parseError: "JSON root is not an object",
      };
    }
    return {
      jsonParse: true,
      projectId: parsed.project_id?.trim() || null,
      clientEmailPresent: Boolean(parsed.client_email?.trim()),
      privateKeyPresent: Boolean(parsed.private_key?.trim()),
      parseError: null,
    };
  } catch (error) {
    return {
      jsonParse: false,
      projectId: null,
      clientEmailPresent: false,
      privateKeyPresent: false,
      parseError: safeErrorMessage(error),
    };
  }
}

export function buildEnvDiagnostics(): Omit<
  SafeAdminDiagnostics,
  "ADMIN_INIT" | "ADMIN_DB" | "ADMIN_INIT_ERROR_MESSAGE"
> {
  const peek = peekServiceAccountFromEnv();
  return {
    ADMIN_ENV_PRESENT: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()),
    ADMIN_PATH_ENV_PRESENT: Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
    ),
    ADMIN_JSON_PARSE: peek.jsonParse,
    ADMIN_PROJECT_ID: peek.projectId,
    CLIENT_EMAIL_PRESENT: peek.clientEmailPresent,
    PRIVATE_KEY_PRESENT: peek.privateKeyPresent,
    CREDENTIAL_SOURCE: readCredentialSource(),
  };
}
