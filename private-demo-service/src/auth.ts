import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

type Statement = {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
};

export type CommunityAuthEnv = {
  DB: {
    prepare(sql: string): Statement;
    batch(statements: Statement[]): Promise<unknown>;
  };
};

type Account = {
  id: string;
  email_normalized: string;
  password_hash: string;
  email_verified: number;
  community_eligible: number;
  is_child: number | null;
  status: "active" | "disabled" | "deleted";
  created_at: number;
  updated_at: number;
};

type SessionAccount = Account & {
  session_id: string;
  expires_at: number;
};

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;

// OWASP-listed scrypt configuration using ~16 MiB per operation.
// N=2^14, r=8, p=5 is used instead of the 128 MiB variant because
// Cloudflare Workers have a 128 MiB isolate memory ceiling.
const SCRYPT_N = 1 << 14;
const SCRYPT_R = 8;
const SCRYPT_P = 5;
const SCRYPT_KEYLEN = 32;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();

  if (
    email.length < 3 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return null;
  }

  return email;
}

function validPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 12 &&
    value.length <= 128
  );
}

function b64url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function emailKey(email: string) {
  return sha256(`ticket-frame-community-login:${email}`);
}

function hashPassword(password: string) {
  const salt = randomBytes(16);

  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    b64url(salt),
    b64url(derived),
  ].join("$");
}

function verifyPassword(password: string, encoded: string) {
  try {
    const [kind, nRaw, rRaw, pRaw, saltRaw, hashRaw] =
      encoded.split("$");

    if (
      kind !== "scrypt" ||
      !nRaw ||
      !rRaw ||
      !pRaw ||
      !saltRaw ||
      !hashRaw
    ) {
      return false;
    }

    const N = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);

    if (
      N !== SCRYPT_N ||
      r !== SCRYPT_R ||
      p !== SCRYPT_P
    ) {
      return false;
    }

    const salt = Buffer.from(saltRaw, "base64url");
    const expected = Buffer.from(hashRaw, "base64url");

    const actual = scryptSync(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: SCRYPT_MAXMEM,
    });

    return (
      actual.length === expected.length &&
      timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}

function bearer(request: Request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function issueSession(
  env: CommunityAuthEnv,
  accountId: string,
) {
  const token = b64url(randomBytes(32));
  const tokenHash = sha256(token);
  const id = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + SESSION_MS;

  await env.DB.prepare(
    `INSERT INTO community_sessions(
      id,account_id,token_hash,created_at,expires_at,last_used_at,revoked_at
    ) VALUES(?,?,?,?,?,?,NULL)`,
  )
    .bind(
      id,
      accountId,
      tokenHash,
      now,
      expiresAt,
      now,
    )
    .run();

  return { token, expiresAt };
}

async function loginBlocked(
  env: CommunityAuthEnv,
  email: string,
) {
  const key = emailKey(email);
  const now = Date.now();

  const row = await env.DB.prepare(
    `SELECT attempts,window_started_at
     FROM community_auth_limits
     WHERE email_key=?`,
  )
    .bind(key)
    .first<{
      attempts: number;
      window_started_at: number;
    }>();

  if (!row) return false;

  if (row.window_started_at + LOGIN_WINDOW_MS <= now) {
    await env.DB.prepare(
      "DELETE FROM community_auth_limits WHERE email_key=?",
    )
      .bind(key)
      .run();
    return false;
  }

  return row.attempts >= LOGIN_MAX_FAILURES;
}

async function failedLogin(
  env: CommunityAuthEnv,
  email: string,
) {
  const key = emailKey(email);
  const now = Date.now();

  const row = await env.DB.prepare(
    `SELECT attempts,window_started_at
     FROM community_auth_limits
     WHERE email_key=?`,
  )
    .bind(key)
    .first<{
      attempts: number;
      window_started_at: number;
    }>();

  if (!row || row.window_started_at + LOGIN_WINDOW_MS <= now) {
    await env.DB.prepare(
      `INSERT INTO community_auth_limits(
        email_key,attempts,window_started_at
      ) VALUES(?,?,?)
      ON CONFLICT(email_key) DO UPDATE SET
        attempts=excluded.attempts,
        window_started_at=excluded.window_started_at`,
    )
      .bind(key, 1, now)
      .run();
    return;
  }

  await env.DB.prepare(
    `UPDATE community_auth_limits
     SET attempts=attempts+1
     WHERE email_key=?`,
  )
    .bind(key)
    .run();
}

async function clearFailures(
  env: CommunityAuthEnv,
  email: string,
) {
  await env.DB.prepare(
    "DELETE FROM community_auth_limits WHERE email_key=?",
  )
    .bind(emailKey(email))
    .run();
}

export async function verifyCommunitySession(
  request: Request,
  env: CommunityAuthEnv,
) {
  const token = bearer(request);
  if (!token) return null;

  const now = Date.now();
  const tokenHash = sha256(token);

  const row = await env.DB.prepare(
    `SELECT
       a.*,
       s.id session_id,
       s.expires_at
     FROM community_sessions s
     JOIN community_accounts a ON a.id=s.account_id
     WHERE s.token_hash=?
       AND s.revoked_at IS NULL
       AND s.expires_at>?
       AND a.status='active'
     LIMIT 1`,
  )
    .bind(tokenHash, now)
    .first<SessionAccount>();

  if (!row) return null;

  await env.DB.prepare(
    `UPDATE community_sessions
     SET last_used_at=?
     WHERE id=?`,
  )
    .bind(now, row.session_id)
    .run();

  return {
    subject: `community-account:${row.id}`,
    communityEligible: row.community_eligible === 1,
    isChild:
      row.is_child === null
        ? undefined
        : row.is_child === 1,
    emailVerified: row.email_verified === 1,
    accountId: row.id,
    expiresAt: row.expires_at,
  };
}

export async function communityAuthFetch(
  request: Request,
  env: CommunityAuthEnv,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(
      "/api/community/auth",
      "",
    );

    if (path === "/signup" && request.method === "POST") {
      const raw = await request.text();

      if (raw.length > 4096) {
        return json({ error: "Request is too large." }, 413);
      }

      let data: Record<string, unknown>;

      try {
        data = JSON.parse(raw || "{}");
      } catch {
        return json({ error: "Invalid request." }, 400);
      }

      const email = normalizeEmail(data.email);

      if (!email) {
        return json(
          { error: "Enter a valid email address." },
          400,
        );
      }

      if (!validPassword(data.password)) {
        return json(
          {
            error:
              "Use a password between 12 and 128 characters.",
          },
          400,
        );
      }

      const existing = await env.DB.prepare(
        `SELECT id
         FROM community_accounts
         WHERE email_normalized=?`,
      )
        .bind(email)
        .first();

      if (existing) {
        return json(
          { error: "An account already exists for this email." },
          409,
        );
      }

      const id = crypto.randomUUID();
      const now = Date.now();
      const passwordHash = hashPassword(data.password);

      await env.DB.prepare(
        `INSERT INTO community_accounts(
          id,email_normalized,password_hash,
          email_verified,community_eligible,is_child,
          status,created_at,updated_at
        ) VALUES(?,?,?,0,0,NULL,'active',?,?)`,
      )
        .bind(
          id,
          email,
          passwordHash,
          now,
          now,
        )
        .run();

      const session = await issueSession(env, id);

      return json(
        {
          token: session.token,
          expiresAt: session.expiresAt,
          email,
          emailVerified: false,
          communityEligible: false,
          eligibilityPending: true,
        },
        201,
      );
    }

    if (path === "/login" && request.method === "POST") {
      const raw = await request.text();

      if (raw.length > 4096) {
        return json({ error: "Request is too large." }, 413);
      }

      let data: Record<string, unknown>;

      try {
        data = JSON.parse(raw || "{}");
      } catch {
        return json({ error: "Invalid request." }, 400);
      }

      const email = normalizeEmail(data.email);

      if (!email || typeof data.password !== "string") {
        return json(
          { error: "Email or password is incorrect." },
          401,
        );
      }

      if (await loginBlocked(env, email)) {
        return json(
          {
            error:
              "Too many sign-in attempts. Try again later.",
          },
          429,
        );
      }

      const account = await env.DB.prepare(
        `SELECT *
         FROM community_accounts
         WHERE email_normalized=?
           AND status='active'
         LIMIT 1`,
      )
        .bind(email)
        .first<Account>();

      if (
        !account ||
        !verifyPassword(
          data.password,
          account.password_hash,
        )
      ) {
        await failedLogin(env, email);

        return json(
          { error: "Email or password is incorrect." },
          401,
        );
      }

      await clearFailures(env, email);

      const session = await issueSession(
        env,
        account.id,
      );

      return json({
        token: session.token,
        expiresAt: session.expiresAt,
        email: account.email_normalized,
        emailVerified: account.email_verified === 1,
        communityEligible:
          account.community_eligible === 1,
        eligibilityPending:
          account.community_eligible !== 1 ||
          account.is_child === null,
      });
    }

    if (path === "/session" && request.method === "GET") {
      const identity =
        await verifyCommunitySession(request, env);

      if (!identity) {
        return json({ error: "Sign in required." }, 401);
      }

      return json({
        signedIn: true,
        emailVerified: identity.emailVerified,
        communityEligible:
          identity.communityEligible,
        eligibilityPending:
          identity.communityEligible !== true ||
          identity.isChild === undefined,
        expiresAt: identity.expiresAt,
      });
    }

    if (path === "/logout" && request.method === "POST") {
      const token = bearer(request);

      if (token) {
        await env.DB.prepare(
          `UPDATE community_sessions
           SET revoked_at=?
           WHERE token_hash=?
             AND revoked_at IS NULL`,
        )
          .bind(Date.now(), sha256(token))
          .run();
      }

      return json({ ok: true });
    }

    return json(
      { error: "Community authentication route not found." },
      404,
    );
  } catch {
    return json(
      {
        error:
          "Community authentication is unavailable. Please try again.",
      },
      500,
    );
  }
}
