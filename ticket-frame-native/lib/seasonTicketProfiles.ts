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

function identityKey(profile: {
  club: string;
  seasonKey: string;
  row?: string | null;
  seat?: string | null;
}): string {
  return [
    canonicalClubName(profile.club),
    profile.seasonKey,
    normaliseFixtureText(profile.row ?? ""),
    normaliseFixtureText(profile.seat ?? ""),
  ].join("|");
}

/** Duplicate-safe add: the same club+season+row+seat is never stored twice. */
export function addSeasonTicketProfile(
  records: SeasonTicketProfile[],
  profile: SeasonTicketProfile,
): { records: SeasonTicketProfile[]; matchedExisting: boolean } {
  const key = identityKey(profile);
  const existing = records.find((record) => identityKey(record) === key);
  if (existing) {
    // Enrich the existing profile with any newly provided details.
    const merged: SeasonTicketProfile = {
      ...existing,
      stand: profile.stand ?? existing.stand,
      block: profile.block ?? existing.block,
      row: profile.row ?? existing.row,
      seat: profile.seat ?? existing.seat,
      fanId: profile.fanId ?? existing.fanId,
      ticketNumber: profile.ticketNumber ?? existing.ticketNumber,
      holderName: profile.holderName ?? existing.holderName,
      imageUri: profile.imageUri ?? existing.imageUri,
    };
    return {
      records: records.map((record) => (record.id === existing.id ? merged : record)),
      matchedExisting: true,
    };
  }
  return { records: [...records, profile], matchedExisting: false };
}

/** Corrupt-safe read: an unreadable payload yields an empty list. */
export async function loadSeasonTicketProfiles(): Promise<SeasonTicketProfile[]> {
  try {
    const raw = await AsyncStorage.getItem(SEASON_TICKET_PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SeasonTicketProfile[];
    return Array.isArray(parsed) ? newestSeasonTicketProfiles(parsed) : [];
  } catch {
    return [];
  }
}

export async function saveSeasonTicketProfiles(
  records: SeasonTicketProfile[],
): Promise<void> {
  await AsyncStorage.setItem(
    SEASON_TICKET_PROFILES_KEY,
    JSON.stringify(newestSeasonTicketProfiles(records)),
  );
}
