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
  /**
   * Optional private email-delivery service binding.
   * The auth Worker never exposes verification/reset tokens publicly.
   */
  COMMUNITY_EMAIL?: {
    fetch(request: Request): Promise<Response>;
  };
  RESEND_API_KEY?: string;
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
const AUTH_ACTION_WINDOW_MS = 15 * 60 * 1000;
const AUTH_ACTION_MAX_REQUESTS = 3;
const VERIFY_EMAIL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_MS = 30 * 60 * 1000;

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
    value.length >= 6 &&
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

type AccountTokenPurpose =
  | "verify-email"
  | "password-reset";

function actionKey(
  purpose: AccountTokenPurpose,
  email: string,
) {
  return sha256(
    `ticket-frame-community-${purpose}:${email}`,
  );
}

async function allowAuthAction(
  env: CommunityAuthEnv,
  purpose: AccountTokenPurpose,
  email: string,
) {
  const key = actionKey(purpose, email);
  const now = Date.now();

  const row = await env.DB.prepare(
    `SELECT attempts,window_started_at
     FROM community_auth_action_limits
     WHERE action_key=?`,
  )
    .bind(key)
    .first<{
      attempts: number;
      window_started_at: number;
    }>();

  if (
    !row ||
    row.window_started_at + AUTH_ACTION_WINDOW_MS <= now
  ) {
    await env.DB.prepare(
      `INSERT INTO community_auth_action_limits(
        action_key,attempts,window_started_at
      ) VALUES(?,?,?)
      ON CONFLICT(action_key) DO UPDATE SET
        attempts=excluded.attempts,
        window_started_at=excluded.window_started_at`,
    )
      .bind(key, 1, now)
      .run();

    return true;
  }

  if (row.attempts >= AUTH_ACTION_MAX_REQUESTS) {
    return false;
  }

  await env.DB.prepare(
    `UPDATE community_auth_action_limits
     SET attempts=attempts+1
     WHERE action_key=?`,
  )
    .bind(key)
    .run();

  return true;
}

async function deliverAccountToken(
  env: CommunityAuthEnv,
  accountId: string,
  email: string,
  purpose: AccountTokenPurpose,
) {
  if (!env.COMMUNITY_EMAIL && !env.RESEND_API_KEY) return false;

  const token = b64url(randomBytes(32));
  const tokenHash = sha256(token);
  const now = Date.now();
  const expiresAt =
    now +
    (purpose === "verify-email"
      ? VERIFY_EMAIL_MS
      : PASSWORD_RESET_MS);

  await env.DB.prepare(
    `INSERT INTO community_account_tokens(
      id,account_id,purpose,token_hash,
      created_at,expires_at,used_at
    ) VALUES(?,?,?,?,?,?,NULL)`,
  )
    .bind(
      crypto.randomUUID(),
      accountId,
      purpose,
      tokenHash,
      now,
      expiresAt,
    )
    .run();

  try {
    if (purpose === "password-reset" && !env.COMMUNITY_EMAIL) {
      return false;
    }

    const response = env.RESEND_API_KEY && purpose === "verify-email"
      ? await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.RESEND_API_KEY}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: "Ticket Frame Community <verify@handytize.co.uk>",
            to: [email],
            subject: "Verify your Ticket Frame Community account",
            text: [
              "Verify your Ticket Frame Community email:",
              "",
              `https://ticket-frame-private-demo.ticket-frame-community.workers.dev/api/community/auth/verification/page#token=${encodeURIComponent(token)}`,
              "",
              "This link expires in 24 hours.",
            ].join("\n"),
          }),
        })
      : await env.COMMUNITY_EMAIL!.fetch(
      new Request(
        "https:" + "//email.internal/send",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            type: purpose,
            email,
            token,
            expiresAt,
          }),
        },
      ),
    );

    if (response.ok) {
      // A successfully accepted email must retain a usable token.
      // Older tokens expire naturally, avoiding concurrent-send races.
      return true;
    }
  } catch {
    // Delivery failure must never expose the raw token.
  }

  await env.DB.prepare(
    `UPDATE community_account_tokens
     SET used_at=?
     WHERE token_hash=?
       AND used_at IS NULL`,
  )
    .bind(Date.now(), tokenHash)
    .run();

  return false;
}

async function readSmallJson(request: Request) {
  const raw = await request.text();

  if (raw.length > 4096) return null;

  try {
    return JSON.parse(raw || "{}") as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
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


    if (
      path === "/verification/page" &&
      request.method === "GET"
    ) {
      const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>Ticket Frame Community — Verify email</title>
<style>
body {
  margin: 0;
  background: #f6f4ec;
  color: #173c2b;
  font-family: system-ui, sans-serif;
  display: grid;
  min-height: 100vh;
  place-items: center;
}
main {
  background: white;
  border-radius: 18px;
  padding: 32px;
  max-width: 420px;
  margin: 20px;
  text-align: center;
}
button {
  background: #174a38;
  color: white;
  border: 0;
  border-radius: 10px;
  padding: 15px 28px;
  font-weight: bold;
  cursor: pointer;
}
button:disabled { opacity: .5; }
</style>
</head>
<body>
<main>
<h1>Ticket Frame Community</h1>
<h2>Verify your email</h2>
<p id="message">Press the button to confirm your email address.</p>
<button id="verify">Verify email</button>
<p id="return-container" style="display:none">
  <a id="return-link" href="ticketframe:///community">
    Open Ticket Frame
  </a>
</p>
</main>
<script>
const button = document.getElementById("verify");
const message = document.getElementById("message");
const params = new URLSearchParams(
  location.hash.slice(1) || location.search.slice(1)
);
const token = params.get("token");
history.replaceState(null, "", location.pathname);

if (!token) {
  button.disabled = true;
  message.textContent = "This verification link is invalid.";
}

button.addEventListener("click", async () => {
  button.disabled = true;
  message.textContent = "Verifying your email…";

  try {
    const response = await fetch(
      "/api/community/auth/verification/confirm",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "omit"
      }
    );

    if (!response.ok) {
      throw new Error("Verification failed");
    }

    message.textContent =
      "Email verified successfully. Opening Ticket Frame…";
    button.textContent = "Verified ✓";

    document.getElementById("return-container").style.display = "block";

    // Attempt to reopen Ticket Frame after verification.
    setTimeout(() => {
      window.location.href = "ticketframe:///community";
    }, 900);
  } catch {
    message.textContent =
      "This verification link is invalid or expired. Request another email in Ticket Frame Community.";
  }
});
</script>
</body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "referrer-policy": "no-referrer",
          "x-content-type-options": "nosniff",
          "content-security-policy":
            "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        },
      });
    }

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

      if (data.age16Declared !== true) {
        return json(
          { error: "You must confirm that you are aged 16 or over to create a Community account." },
          403,
        );
      }

      const username =
        typeof data.username === "string"
          ? data.username.trim().replace(/^@/, "")
          : "";

      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        return json({
          error: "Username must be 3–20 letters, numbers or underscores.",
        }, 400);
      }

      const firstName =
        typeof data.firstName === "string" ? data.firstName.trim() : "";

      const surname =
        typeof data.surname === "string" ? data.surname.trim() : "";

      if (
        !firstName || firstName.length > 80 ||
        !surname || surname.length > 80
      ) {
        return json({
          error: "Enter your first name and surname.",
        }, 400);
      }

      const phone =
        typeof data.phoneNumber === "string"
          ? data.phoneNumber.trim().replace(/[\\s()-]/g, "")
          : "";

      if (!/^\\+[1-9][0-9]{7,14}$/.test(phone)) {
        return json({
          error: "Enter a phone number with country code, such as +447123456789.",
        }, 400);
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
              "Use a password between 6 and 128 characters.",
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

      try {
        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO community_accounts(
              id,email_normalized,password_hash,
              email_verified,community_eligible,is_child,
              status,created_at,updated_at
            ) VALUES(?,?,?,0,0,NULL,'active',?,?)`
          ).bind(id, email, passwordHash, now, now),

          env.DB.prepare(
            `INSERT INTO community_usernames(
              account_id,username,created_at,updated_at
            ) VALUES(?,?,?,?)`
          ).bind(id, username, now, now),

          env.DB.prepare(
            `INSERT INTO community_signup_details(
              account_id,first_name,surname,phone_e164,
              created_at,updated_at
            ) VALUES(?,?,?,?,?,?)`
          ).bind(id, firstName, surname, phone, now, now),
        ]);
      } catch (error) {
        console.error("Community signup transaction failed", error);
        return json({
          error: "Account could not be created. Check your email and username, then try again.",
        }, 409);
      }

      const session = await issueSession(env, id);

      // Attempt verification automatically after successful registration.
      // Email delivery failure must not prevent account creation.
      let verificationEmailSent = false;

      try {
        verificationEmailSent = await deliverAccountToken(
          env,
          id,
          email,
          "verify-email",
        );
      } catch {
        // Account remains valid; verification can be requested again.
      }

      return json(
        {
          verificationEmailSent,
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

    if (
      path === "/verification/request" &&
      request.method === "POST"
    ) {
      const identity =
        await verifyCommunitySession(request, env);

      if (!identity) {
        return json({ error: "Sign in required." }, 401);
      }

      const account = await env.DB.prepare(
        `SELECT id,email_normalized,email_verified
         FROM community_accounts
         WHERE id=?
           AND status='active'
         LIMIT 1`,
      )
        .bind(identity.accountId)
        .first<{
          id: string;
          email_normalized: string;
          email_verified: number;
        }>();

      if (!account) {
        return json({ error: "Sign in required." }, 401);
      }

      if (account.email_verified === 1) {
        return json({
          ok: true,
          emailVerified: true,
        });
      }

      // Enforce a server-side resend cooldown.
      const latestVerification = await env.DB.prepare(
        `SELECT created_at
         FROM community_account_tokens
         WHERE account_id=?
           AND purpose='verify-email'
           AND used_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
      )
        .bind(account.id)
        .first<{ created_at: number }>();

      if (
        latestVerification &&
        Date.now() - latestVerification.created_at < 60_000
      ) {
        return json(
          { error: "Please wait 60 seconds before requesting another verification email." },
          429,
        );
      }

      const allowed = await allowAuthAction(
        env,
        "verify-email",
        account.email_normalized,
      );

      if (!allowed) {
        return json(
          { error: "Too many verification requests. Please try again later." },
          429,
        );
      }

      const sent = await deliverAccountToken(
        env,
        account.id,
        account.email_normalized,
        "verify-email",
      );

      if (!sent) {
        return json(
          { error: "Unable to send verification email. Please try again later." },
          503,
        );
      }

      return json({
        ok: true,
        emailVerified: false,
        message: "Email sent ✓",
      });
    }

    if (
      path === "/verification/confirm" &&
      request.method === "POST"
    ) {
      const data = await readSmallJson(request);
      const token =
        typeof data?.token === "string"
          ? data.token.trim()
          : "";

      if (token.length < 20 || token.length > 200) {
        return json(
          { error: "Verification link is invalid or expired." },
          400,
        );
      }

      const now = Date.now();
      const row = await env.DB.prepare(
        `SELECT t.id,t.account_id
         FROM community_account_tokens t
         JOIN community_accounts a
           ON a.id=t.account_id
         WHERE t.token_hash=?
           AND t.purpose='verify-email'
           AND t.used_at IS NULL
           AND t.expires_at>?
           AND a.status='active'
         LIMIT 1`,
      )
        .bind(sha256(token), now)
        .first<{
          id: string;
          account_id: string;
        }>();

      if (!row) {
        return json(
          { error: "Verification link is invalid or expired." },
          400,
        );
      }

      await env.DB.batch([
        env.DB.prepare(
          `UPDATE community_account_tokens
           SET used_at=?
           WHERE id=?
             AND used_at IS NULL`,
        ).bind(now, row.id),
        env.DB.prepare(
          `UPDATE community_accounts
           SET email_verified=1,updated_at=?
           WHERE id=?
             AND status='active'`,
        ).bind(now, row.account_id),
      ]);

      return json({
        ok: true,
        emailVerified: true,
      });
    }

    if (
      path === "/password/forgot" &&
      request.method === "POST"
    ) {
      const data = await readSmallJson(request);
      const email = normalizeEmail(data?.email);

      if (email) {
        const allowed = await allowAuthAction(
          env,
          "password-reset",
          email,
        );

        const account = await env.DB.prepare(
          `SELECT id,email_normalized
           FROM community_accounts
           WHERE email_normalized=?
             AND status='active'
           LIMIT 1`,
        )
          .bind(email)
          .first<{
            id: string;
            email_normalized: string;
          }>();

        if (allowed && account) {
          await deliverAccountToken(
            env,
            account.id,
            account.email_normalized,
            "password-reset",
          );
        }
      }

      // Deliberately identical for existing and unknown accounts.
      return json({
        ok: true,
        message:
          "If the account can be recovered, password reset instructions will be sent.",
      });
    }

    if (
      path === "/password/reset" &&
      request.method === "POST"
    ) {
      const data = await readSmallJson(request);
      const token =
        typeof data?.token === "string"
          ? data.token.trim()
          : "";

      if (
        token.length < 20 ||
        token.length > 200 ||
        !validPassword(data?.password)
      ) {
        return json(
          {
            error:
              "Reset link is invalid or expired, or the new password is not valid.",
          },
          400,
        );
      }

      const now = Date.now();
      const row = await env.DB.prepare(
        `SELECT t.id,t.account_id
         FROM community_account_tokens t
         JOIN community_accounts a
           ON a.id=t.account_id
         WHERE t.token_hash=?
           AND t.purpose='password-reset'
           AND t.used_at IS NULL
           AND t.expires_at>?
           AND a.status='active'
         LIMIT 1`,
      )
        .bind(sha256(token), now)
        .first<{
          id: string;
          account_id: string;
        }>();

      if (!row) {
        return json(
          { error: "Reset link is invalid or expired." },
          400,
        );
      }

      const passwordHash = hashPassword(
        data.password as string,
      );

      await env.DB.batch([
        env.DB.prepare(
          `UPDATE community_accounts
           SET password_hash=?,updated_at=?
           WHERE id=?
             AND status='active'`,
        ).bind(passwordHash, now, row.account_id),
        env.DB.prepare(
          `UPDATE community_account_tokens
           SET used_at=?
           WHERE account_id=?
             AND purpose='password-reset'
             AND used_at IS NULL`,
        ).bind(now, row.account_id),
        env.DB.prepare(
          `UPDATE community_sessions
           SET revoked_at=?
           WHERE account_id=?
             AND revoked_at IS NULL`,
        ).bind(now, row.account_id),
      ]);

      return json({
        ok: true,
        signedIn: false,
        message:
          "Password changed. Sign in again with your new password.",
      });
    }

    if (
      path === "/account/delete" &&
      request.method === "POST"
    ) {
      const identity =
        await verifyCommunitySession(request, env);

      if (!identity) {
        return json({ error: "Sign in required." }, 401);
      }

      const data = await readSmallJson(request);

      if (
        data?.confirmation !== "DELETE" ||
        typeof data?.password !== "string"
      ) {
        return json(
          {
            error:
              "Enter your Community password and confirm DELETE.",
          },
          400,
        );
      }

      const account = await env.DB.prepare(
        `SELECT *
         FROM community_accounts
         WHERE id=?
           AND status='active'
         LIMIT 1`,
      )
        .bind(identity.accountId)
        .first<Account>();

      if (
        !account ||
        !verifyPassword(
          data.password,
          account.password_hash,
        )
      ) {
        return json(
          { error: "Community password is incorrect." },
          401,
        );
      }

      const subject =
        `community-account:${account.id}`;

      const member = await env.DB.prepare(
        `SELECT id
         FROM community_members
         WHERE subject=?
         LIMIT 1`,
      )
        .bind(subject)
        .first<{ id: string }>();

      const statements: Statement[] = [];

      if (member) {
        const memberId = member.id;

        statements.push(
          env.DB.prepare(
            `DELETE FROM community_messages
             WHERE sender=? OR recipient=?`,
          ).bind(memberId, memberId),
          env.DB.prepare(
            `DELETE FROM community_reports
             WHERE reporter=? OR reported=?`,
          ).bind(memberId, memberId),
          env.DB.prepare(
            `DELETE FROM community_relationships
             WHERE sender=? OR recipient=?`,
          ).bind(memberId, memberId),
          env.DB.prepare(
            `DELETE FROM community_blocks
             WHERE blocker=? OR blocked=?`,
          ).bind(memberId, memberId),
          env.DB.prepare(
            `DELETE FROM community_presence
             WHERE member_id=?`,
          ).bind(memberId),
          env.DB.prepare(
            `DELETE FROM community_matchday_experiences
             WHERE member_id=?`,
          ).bind(memberId),
          env.DB.prepare(
            `DELETE FROM community_members
             WHERE id=?`,
          ).bind(memberId),
        );
      }

      statements.push(
        env.DB.prepare(
          `DELETE FROM community_sessions
           WHERE account_id=?`,
        ).bind(account.id),
        env.DB.prepare(
          `DELETE FROM community_account_tokens
           WHERE account_id=?`,
        ).bind(account.id),
        env.DB.prepare(
          `DELETE FROM community_auth_limits
           WHERE email_key=?`,
        ).bind(emailKey(account.email_normalized)),
        env.DB.prepare(
          `DELETE FROM community_auth_action_limits
           WHERE action_key IN (?,?)`,
        ).bind(
          actionKey(
            "verify-email",
            account.email_normalized,
          ),
          actionKey(
            "password-reset",
            account.email_normalized,
          ),
        ),
        env.DB.prepare(
          `DELETE FROM community_accounts
           WHERE id=?`,
        ).bind(account.id),
      );

      await env.DB.batch(statements);

      return json({
        ok: true,
        deleted: true,
      });
    }

    if (path === "/username/availability" && request.method === "GET") {
      const requested = (url.searchParams.get("username") || "").trim();
      const username = requested.replace(/^@/, "");

      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        return json({
          username,
          available: false,
          error: "Username must be 3–20 letters, numbers or underscores.",
        }, 400);
      }

      const existing = await env.DB.prepare(
        `SELECT account_id FROM community_usernames
         WHERE username=? COLLATE NOCASE LIMIT 1`
      ).bind(username).first<{ account_id: string }>();

      return json({
        username,
        available: !existing,
      });
    }

    if (path === "/username/me" && request.method === "GET") {
      const identity = await verifyCommunitySession(request, env);

      if (!identity) {
        return json({ error: "Sign in required." }, 401);
      }

      const record = await env.DB.prepare(
        `SELECT username FROM community_usernames
         WHERE account_id=? LIMIT 1`
      ).bind(identity.accountId).first<{ username: string }>();

      return json({
        username: record?.username ?? null,
        registered: Boolean(record),
      });
    }

    if (path === "/username" && request.method === "GET") {
      const identity = await verifyCommunitySession(request, env);
      if (!identity) return json({ error: "Sign in required." }, 401);

      const requested = (url.searchParams.get("username") || "").trim();
      const username = requested.replace(/^@/, "");

      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        return json({
          error: "Username must be 3–20 letters, numbers or underscores.",
        }, 400);
      }

      const existing = await env.DB.prepare(
        `SELECT account_id FROM community_usernames
         WHERE username=? COLLATE NOCASE LIMIT 1`
      ).bind(username).first<{ account_id: string }>();

      return json({
        username,
        available: !existing || existing.account_id === identity.accountId,
        yours: existing?.account_id === identity.accountId,
      });
    }

    if (path === "/username" && request.method === "POST") {
      const identity = await verifyCommunitySession(request, env);
      if (!identity) return json({ error: "Sign in required." }, 401);

      const data = await readSmallJson(request);
      const requested =
        typeof data?.username === "string" ? data.username.trim() : "";
      const username = requested.replace(/^@/, "");

      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        return json({
          error: "Username must be 3–20 letters, numbers or underscores.",
        }, 400);
      }

      const current = await env.DB.prepare(
        `SELECT username FROM community_usernames
         WHERE account_id=? LIMIT 1`
      ).bind(identity.accountId).first<{ username: string }>();

      if (current) {
        if (current.username.toLowerCase() === username.toLowerCase()) {
          return json({ username: current.username, registered: true });
        }

        return json({
          error: "This account already has a username.",
        }, 409);
      }

      const now = Date.now();

      try {
        await env.DB.prepare(
          `INSERT INTO community_usernames
           (account_id, username, created_at, updated_at)
           VALUES (?, ?, ?, ?)`
        ).bind(identity.accountId, username, now, now).run();
      } catch {
        return json({
          error: "Username is unavailable. Please choose another.",
        }, 409);
      }

      return json({ username, registered: true });
    }

    if (path === "/marketing" && request.method === "GET") {
      const identity = await verifyCommunitySession(request, env);
      if (!identity) return json({ error: "Sign in required." }, 401);

      const record = await env.DB.prepare(
        `SELECT email_sms_consent, consent_recorded_at, consent_withdrawn_at
         FROM community_marketing_contacts
         WHERE account_id=?
         LIMIT 1`
      ).bind(identity.accountId).first<{
        email_sms_consent: number;
        consent_recorded_at: number | null;
        consent_withdrawn_at: number | null;
      }>();

      return json({
        emailSmsMarketing: record?.email_sms_consent === 1,
        consentRecordedAt: record?.consent_recorded_at ?? null,
        consentWithdrawnAt: record?.consent_withdrawn_at ?? null,
      });
    }

    if (path === "/marketing" && request.method === "POST") {
      const identity = await verifyCommunitySession(request, env);
      if (!identity) return json({ error: "Sign in required." }, 401);

      const data = await readSmallJson(request);
      if (typeof data?.emailSmsMarketing !== "boolean") {
        return json({ error: "Invalid marketing preference." }, 400);
      }

      const now = Date.now();
      const consent = data.emailSmsMarketing;
      const version = "community-marketing-v1";

      const account = await env.DB.prepare(
        `SELECT email_normalized FROM community_accounts
         WHERE id=? AND status='active' LIMIT 1`
      ).bind(identity.accountId).first<{ email_normalized: string }>();

      if (!account) return json({ error: "Account not found." }, 404);

      await env.DB.prepare(
        `INSERT INTO community_marketing_contacts (
           id, account_id, email_normalized, email_sms_consent,
           consent_recorded_at, consent_withdrawn_at,
           consent_source, consent_version, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(account_id) DO UPDATE SET
           email_normalized=excluded.email_normalized,
           email_sms_consent=excluded.email_sms_consent,
           consent_recorded_at=excluded.consent_recorded_at,
           consent_withdrawn_at=excluded.consent_withdrawn_at,
           consent_source=excluded.consent_source,
           consent_version=excluded.consent_version,
           updated_at=excluded.updated_at`
      ).bind(
        crypto.randomUUID(),
        identity.accountId,
        account.email_normalized,
        consent ? 1 : 0,
        consent ? now : null,
        consent ? null : now,
        "community-privacy-settings",
        version,
        now,
        now
      ).run();

      return json({
        emailSmsMarketing: consent,
        consentRecordedAt: consent ? now : null,
        consentWithdrawnAt: consent ? null : now,
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
