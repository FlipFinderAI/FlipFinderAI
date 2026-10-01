// V3.9.5 — Season Ticket Profiles (V3.9.6 ownership model).
//
// The season card STAYS in the ticket archive exactly as scanned (it is a
// possession). Selecting "Season Ticket" after a scan stores a profile here
// with the seat details used for attendance; the card is never expanded into
// individual fixture frames. Stored in its own namespace; saved-frame.v1 is
// untouched.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { canonicalClubName, normaliseFixtureText } from "./ticketText";

export const SEASON_TICKET_PROFILES_KEY =
  "ticket-frame.season-ticket-profiles.v1";

export type SeasonTicketProfile = {
  id: string;
  club: string;
  /** Stable link to the scanned ticket, independent of its restored file path. */
  ticketId?: string;
  /** "YYYY/YYYY". */
  seasonKey: string;
  stand?: string | null;
  block?: string | null;
  row?: string | null;
  seat?: string | null;
  fanId?: string | null;
  ticketNumber?: string | null;
  holderName?: string | null;
  /** Reference to the already-permanent scan image — never re-encoded. */
  imageUri?: string | null;
  /** Confirmed by the user after matchday media found repeated home games. */
  discoveredFromMedia?: boolean;
  createdAt: number;
};

export function newestSeasonTicketProfiles(
  records: SeasonTicketProfile[],
): SeasonTicketProfile[] {
  return [...records].sort(
    (a, b) =>
      b.seasonKey.localeCompare(a.seasonKey) ||
      a.club.localeCompare(b.club) ||
      a.createdAt - b.createdAt,
  );
}

export function newProfileId(): string {
  return `stp-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const identityFields = [
  "stand", "block", "row", "seat", "fanId", "ticketNumber", "holderName",
] as const;

function seasonIdentity(value: string): string {
  return value.trim().replace(/^(\d{4})[/-](?:\d{2})?(\d{2})$/, "$1/$2");
}

function sameSeason(a: SeasonTicketProfile, b: SeasonTicketProfile): boolean {
  return canonicalClubName(a.club) === canonicalClubName(b.club) &&
    seasonIdentity(a.seasonKey) === seasonIdentity(b.seasonKey);
}

function isPlaceholder(profile: SeasonTicketProfile): boolean {
  return Boolean(profile.discoveredFromMedia && !profile.ticketId && !profile.imageUri &&
    identityFields.every((field) => !normaliseFixtureText(profile[field])));
}

function sameTicket(a: SeasonTicketProfile, b: SeasonTicketProfile): boolean {
  if (!sameSeason(a, b)) return false;
  if (a.id === b.id || (a.ticketId && a.ticketId === b.ticketId)) return true;
  // Restoring an iPhone changes the sandbox prefix, but not the ticket filename.
  const imageName = (uri?: string | null) => uri?.split("/").pop();
  if (imageName(a.imageUri) && imageName(a.imageUri) === imageName(b.imageUri)) return true;
  // A conflicting holder, block or identifier is evidence of a distinct ticket.
  if (identityFields.some((field) => {
    const left = normaliseFixtureText(a[field]);
    const right = normaliseFixtureText(b[field]);
    return left && right && left !== right;
  })) return false;
  const matches = (field: typeof identityFields[number]) =>
    Boolean(normaliseFixtureText(a[field])) &&
    normaliseFixtureText(a[field]) === normaliseFixtureText(b[field]);
  return matches("ticketNumber") || matches("fanId") ||
    (matches("row") && matches("seat") && (matches("block") || matches("stand")));
}

function mergeProfile(existing: SeasonTicketProfile, incoming: SeasonTicketProfile): SeasonTicketProfile {
  const merged = { ...existing };
  for (const field of [...identityFields, "imageUri", "ticketId"] as const) {
    if (incoming[field]?.trim()) merged[field] = incoming[field];
  }
  merged.discoveredFromMedia = Boolean(existing.discoveredFromMedia || incoming.discoveredFromMedia);
  return merged;
}

/** Preserve ambiguous tickets; only collapse proven duplicates or a unique placeholder. */
export function deduplicateSeasonTicketProfiles(records: SeasonTicketProfile[]): SeasonTicketProfile[] {
  const result: SeasonTicketProfile[] = [];
  for (const profile of records) {
    const matches = result.filter((record) => sameTicket(record, profile));
    if (matches.length === 1) {
      const index = result.indexOf(matches[0]);
      result[index] = mergeProfile(matches[0], profile);
    } else result.push(profile);
  }
  // Media confirmation carries no seat/holder identity. Enrich it only when
  // exactly one actual ticket exists for that club and season.
  for (const placeholder of [...result].filter(isPlaceholder)) {
    const candidates = result.filter((record) => record !== placeholder &&
      sameSeason(record, placeholder));
    const actual = candidates.filter((record) => !isPlaceholder(record));
    const target = actual.length === 1 ? actual[0] :
      actual.length === 0 ? candidates.find(isPlaceholder) : undefined;
    if (!target) continue;
    const index = result.indexOf(placeholder);
    if (index < 0) continue;
    result[result.indexOf(target)] = mergeProfile(target, placeholder);
    result.splice(index, 1);
  }
  return newestSeasonTicketProfiles(result);
}

export function addSeasonTicketProfile(
  records: SeasonTicketProfile[],
  profile: SeasonTicketProfile,
): { records: SeasonTicketProfile[]; matchedExisting: boolean } {
  const next = deduplicateSeasonTicketProfiles([...records, profile]);
  return { records: next, matchedExisting: next.length < records.length + 1 };
}

/** Fail closed: a failed read must never enable an empty-list autosave. */
export async function loadSeasonTicketProfiles(): Promise<SeasonTicketProfile[]> {
  const raw = await AsyncStorage.getItem(SEASON_TICKET_PROFILES_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.some((record) =>
    !record || typeof record.id !== "string" || typeof record.club !== "string" ||
    typeof record.seasonKey !== "string" || typeof record.createdAt !== "number" ||
    [...identityFields, "imageUri", "ticketId"].some((field) =>
      record[field] != null && typeof record[field] !== "string"))) {
    throw new Error("Unreadable season ticket profiles");
  }
  const records = deduplicateSeasonTicketProfiles(parsed);
  if (records.length < parsed.length) {
    // Keep the original payload before the screen's normal autosave persists recovery.
    const backupKey = `${SEASON_TICKET_PROFILES_KEY}.before-dedup-v2`;
    if (await AsyncStorage.getItem(backupKey) === null)
      await AsyncStorage.setItem(backupKey, raw);
  }
  return records;
}

export async function saveSeasonTicketProfiles(
  records: SeasonTicketProfile[],
): Promise<void> {
  await AsyncStorage.setItem(
    SEASON_TICKET_PROFILES_KEY,
    JSON.stringify(newestSeasonTicketProfiles(records)),
  );
}
