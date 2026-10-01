// V3.9.5 — Car Park Passes.
//
// Car park passes are valid saved items but never count as match
// attendance, stadium visits or season history. Optionally linked to a
// match date / ground / fixture. Own namespace; saved-frame.v1 untouched.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { normaliseFixtureText } from "./ticketText";

export const CAR_PARK_PASSES_KEY = "ticket-frame.car-park-passes.v1";

export type CarParkPass = {
  id: string;
  title: string;
  ground?: string | null;
  /** ISO yyyy-mm-dd, or null when unlinked. */
  matchDate?: string | null;
  /** Optional fixture link. */
  linkedClub?: string | null;
  linkedOpponent?: string | null;
  linkedDate?: string | null;
  imageUri?: string | null;
  createdAt: number;
};

export function newCarParkPassId(): string {
  return `cpp-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function identityKey(pass: Pick<CarParkPass, "title" | "matchDate">): string {
  return `${normaliseFixtureText(pass.title)}|${pass.matchDate ?? ""}`;
}

/** Duplicate-safe add for car park passes. */
export function addCarParkPass(
  records: CarParkPass[],
  pass: CarParkPass,
): { records: CarParkPass[]; matchedExisting: boolean } {
  const key = identityKey(pass);
  const existing = records.find((record) => identityKey(record) === key);
  if (existing) {
    const merged: CarParkPass = {
      ...existing,
      ground: pass.ground ?? existing.ground,
      linkedClub: pass.linkedClub ?? existing.linkedClub,
      linkedOpponent: pass.linkedOpponent ?? existing.linkedOpponent,
      linkedDate: pass.linkedDate ?? existing.linkedDate,
      imageUri: pass.imageUri ?? existing.imageUri,
    };
    return {
      records: records.map((record) => (record.id === existing.id ? merged : record)),
      matchedExisting: true,
    };
  }
  return { records: [...records, pass], matchedExisting: false };
}

/** Corrupt-safe read: an unreadable payload yields an empty list. */
export async function loadCarParkPasses(): Promise<CarParkPass[]> {
  try {
    const raw = await AsyncStorage.getItem(CAR_PARK_PASSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CarParkPass[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCarParkPasses(records: CarParkPass[]): Promise<void> {
  await AsyncStorage.setItem(CAR_PARK_PASSES_KEY, JSON.stringify(records));
}
