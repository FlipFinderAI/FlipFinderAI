import Constants from "expo-constants";
import { NativeModules } from "react-native";

/** Adapter for the app's future authenticated session; never ship an owner/admin secret. */
type SessionBridge = { getAccessToken(): Promise<string | null> };
export function communityAvailable() {
  return Boolean(Constants.expoConfig?.extra?.communityServiceUrl &&
    (NativeModules.CommunitySession as SessionBridge | undefined)?.getAccessToken);
}
export async function communityRequest<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const base = String(Constants.expoConfig?.extra?.communityServiceUrl || "").replace(/\/$/, "");
  if (!/^https:\/\//.test(base)) throw new Error("Community service is not connected yet.");
  const bridge = NativeModules.CommunitySession as SessionBridge | undefined;
  const token = await bridge?.getAccessToken();
  if (!token) throw new Error("Community sign-in is not connected yet.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}/api/community${path}`, {
      method: method || (body === undefined ? "GET" : "POST"),
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Community request failed. Please try again.");
    return result as T;
  } finally { clearTimeout(timeout); }
}
