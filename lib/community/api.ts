import Constants from "expo-constants";
import {
  clearCommunitySession,
  getCommunitySession,
  saveCommunitySession,
  type CommunitySession,
} from "./session";

type AuthResponse = {
  token: string;
  email: string;
  expiresAt: number;
  emailVerified: boolean;
  communityEligible: boolean;
  eligibilityPending: boolean;
};

type SessionResponse = {
  signedIn: boolean;
  emailVerified: boolean;
  communityEligible: boolean;
  eligibilityPending: boolean;
  expiresAt: number;
};

function baseUrl() {
  return String(
    Constants.expoConfig?.extra?.communityServiceUrl || "",
  ).replace(/\/$/, "");
}

export function communityAvailable() {
  return /^https:\/\//.test(baseUrl());
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const base = baseUrl();

  if (!/^https:\/\//.test(base)) {
    throw new Error(
      "Community online service is not configured yet.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(init.headers || {}),
      },
    });

    let result: any = {};

    try {
      result = await response.json();
    } catch {
      throw new Error(
        "Community returned an invalid response.",
      );
    }

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Community request failed. Please try again.",
      );
    }

    return result as T;
  } finally {
    clearTimeout(timeout);
  }
}

function toSession(result: AuthResponse): CommunitySession {
  return {
    token: result.token,
    email: result.email,
    expiresAt: result.expiresAt,
    emailVerified: result.emailVerified === true,
    communityEligible:
      result.communityEligible === true,
    eligibilityPending:
      result.eligibilityPending !== false,
  };
}

export async function communitySignUp(
  email: string,
  password: string,
) {
  const result = await requestJson<AuthResponse>(
    "/api/community/auth/signup",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );

  const session = toSession(result);
  await saveCommunitySession(session);
  return session;
}

export async function communitySignIn(
  email: string,
  password: string,
) {
  const result = await requestJson<AuthResponse>(
    "/api/community/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );

  const session = toSession(result);
  await saveCommunitySession(session);
  return session;
}

export async function communityRestoreSession() {
  const stored = await getCommunitySession();
  if (!stored) return null;

  try {
    const result = await requestJson<SessionResponse>(
      "/api/community/auth/session",
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${stored.token}`,
        },
      },
    );

    const refreshed: CommunitySession = {
      ...stored,
      expiresAt: result.expiresAt,
      emailVerified: result.emailVerified === true,
      communityEligible:
        result.communityEligible === true,
      eligibilityPending:
        result.eligibilityPending !== false,
    };

    await saveCommunitySession(refreshed);
    return refreshed;
  } catch {
    await clearCommunitySession();
    return null;
  }
}

export async function communitySignOut() {
  const session = await getCommunitySession();

  if (session && communityAvailable()) {
    try {
      await requestJson<{ ok: boolean }>(
        "/api/community/auth/logout",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${session.token}`,
          },
          body: "{}",
        },
      );
    } catch {
      // Local logout must still succeed if the network is unavailable.
    }
  }

  await clearCommunitySession();
}

export async function communityRequestPasswordReset(
  email: string,
) {
  return requestJson<{
    ok: boolean;
    message: string;
  }>(
    "/api/community/auth/password/forgot",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function communityRequestEmailVerification() {
  const session = await getCommunitySession();

  if (!session) {
    throw new Error("Sign in to Community first.");
  }

  return requestJson<{
    ok: boolean;
    emailVerified: boolean;
    message?: string;
  }>(
    "/api/community/auth/verification/request",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.token}`,
      },
      body: "{}",
    },
  );
}

export async function communityDeleteAccount(
  password: string,
  confirmation: string,
) {
  const session = await getCommunitySession();

  if (!session) {
    throw new Error("Sign in to Community first.");
  }

  const result = await requestJson<{
    ok: boolean;
    deleted: boolean;
  }>(
    "/api/community/auth/account/delete",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        password,
        confirmation,
      }),
    },
  );

  if (result.deleted) {
    await clearCommunitySession();
  }

  return result;
}

export async function communityRequest<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const session = await getCommunitySession();

  if (!session) {
    throw new Error("Sign in to Community first.");
  }

  try {
    return await requestJson<T>(
      `/api/community${path}`,
      {
        method:
          method ||
          (body === undefined ? "GET" : "POST"),
        headers: {
          authorization: `Bearer ${session.token}`,
        },
        body:
          body === undefined
            ? undefined
            : JSON.stringify(body),
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sign in required."
    ) {
      await clearCommunitySession();
    }
    throw error;
  }
}
