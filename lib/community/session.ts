import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "ticket-frame.community-session.v1";

export type CommunitySession = {
  token: string;
  email: string;
  expiresAt: number;
  emailVerified: boolean;
  communityEligible: boolean;
  eligibilityPending: boolean;
};

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getCommunitySession(): Promise<CommunitySession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY, OPTIONS);
    if (!raw) return null;

    const value = JSON.parse(raw) as Partial<CommunitySession>;

    if (
      typeof value.token !== "string" ||
      !value.token ||
      typeof value.email !== "string" ||
      typeof value.expiresAt !== "number" ||
      value.expiresAt <= Date.now()
    ) {
      await SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS);
      return null;
    }

    return {
      token: value.token,
      email: value.email,
      expiresAt: value.expiresAt,
      emailVerified: value.emailVerified === true,
      communityEligible: value.communityEligible === true,
      eligibilityPending: value.eligibilityPending !== false,
    };
  } catch {
    return null;
  }
}

export async function saveCommunitySession(
  session: CommunitySession,
): Promise<void> {
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify(session),
    OPTIONS,
  );
}

export async function clearCommunitySession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS);
}
