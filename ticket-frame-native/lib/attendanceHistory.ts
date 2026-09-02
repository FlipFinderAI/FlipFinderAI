// V3.9 — Football History foundation: attendance records.
//
// A ticket says "I own this ticket." An attendance record says
// "I attended this match." Related but different.
//
// ISOLATION & PRESERVATION CONTRACT
// • New namespace: ticket-frame.attendance-history.v1 — fully separate from
//   ticket-frame.saved-frame.v1. Existing ticket storage is NOT touched.
// • AttendanceRecord ids are always freshly generated (att-*) and never
//   reuse SeasonTicket ids.
// • Adding a ticket LINKS to an existing matching attendance (or creates
//   one); it never duplicates matches.
// • Nothing is ever inferred: counts only use confirmed, stored records.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { clubNamesMatch, normaliseFixtureText } from "./ticketText";

export const ATTENDANCE_HISTORY_KEY = "ticket-frame.attendance-history.v1";

export type AttendanceSource =
  | "ticket" // created when a ticket is successfully saved
  | "season-ticket" // V3.9.5 — confirmed from the season ticket home fixtures list
  | "manual" // created when the user manually adds a match
  | "imported-history" // reserved for future history import tools
  | "photo-discovery"; // reserved for future AI photo discovery

export type AttendanceResult = "win" | "draw" | "loss";

export type AttendanceRecord = {
  id: string;
  club: string;
  opponent: string;
  /** ISO yyyy-mm-dd, or null when unknown. */
  matchDate: string | null;
  /** "YYYY/YYYY". */
  season: string;
  competition: string | null;
  ground: string | null;
  homeAway: "home" | "away";
  result: AttendanceResult | null;
  homeScore: number | null;
  awayScore: number | null;
  /** Optional link to the SeasonTicket that proves/anchors this attendance. */
  ticketId?: string;
  /** Exact TFD fixture selected for this attendance, when known. */
  fixtureId?: string;
  /** Provenance for this attendance's match date. */
  dateProvenance?:
    | "licensed-source"
    | "manual-entry"
    | "user-confirmed-photo"
    | "user-confirmed-photo-gps";
  source: AttendanceSource;
  confirmed: boolean;
  notes?: string;
  createdAt: number;
};

/** Stable chronological storage order: oldest match first, unknown dates
 * last, with creation time only used to break ties. */
export function chronologicalAttendance(
  records: AttendanceRecord[],
): AttendanceRecord[] {
  return [...records].sort((a, b) => {
    if (a.matchDate && b.matchDate) {
      const dateOrder = a.matchDate.localeCompare(b.matchDate);
      if (dateOrder) return dateOrder;
    } else if (a.matchDate) return -1;
    else if (b.matchDate) return 1;
    return a.createdAt - b.createdAt || a.id.localeCompare(b.id);
  });
}

/**
 * Attendance-season derivation ("2009/10" style). Deliberately simpler than
 * lib/seasons.ts seasonForDate: any July–June window maps cleanly so history
 * entries never fall into an off-season gap.
 */
export function canonicalSeason(date: string | null | undefined): string {
  const match =
    typeof date === "string" ? date.match(/^(\d{4})-(\d{2})-\d{2}$/) : null;
  if (!match) return "";
  const startYear = Number(match[2]) >= 7 ? Number(match[1]) : Number(match[1]) - 1;
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
}

function newAttendanceId(): string {
  return `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Match identity: two records represent the same attendance when club,
 * opponent and date all match; competition and ground must agree only when
 * BOTH sides know them. Records without a date are never auto-matched
 * (unsafe), except against a candidate carrying the same explicit id link.
 */
export function sameMatchIdentity(
  a: Pick<AttendanceRecord, "club" | "opponent" | "matchDate" | "competition" | "ground">,
  b: Pick<AttendanceRecord, "club" | "opponent" | "matchDate" | "competition" | "ground">,
): boolean {
  if (!clubNamesMatch(a.club, b.club)) return false;
  if (!clubNamesMatch(a.opponent, b.opponent)) return false;
  if (!a.matchDate || !b.matchDate) return false;
  if (a.matchDate !== b.matchDate) return false;
  // Club + opponent + exact date is the match identity. Provider competition
  // and venue labels can legitimately differ and must not create duplicates.
  return true;
}

export function findMatchingAttendance(
  records: AttendanceRecord[],
  candidate: Pick<
    AttendanceRecord,
    "club" | "opponent" | "matchDate" | "competition" | "ground"
  >,
): AttendanceRecord | undefined {
  return records.find((record) => sameMatchIdentity(record, candidate));
}

/**
 * Stable deletion/suppression identity.
 * Uses actual home/away sides + exact date rather than a generated record id,
 * so a deliberately deleted match stays deleted even if Auto Add later creates
 * a new AttendanceRecord id for the same fixture.
 */
export function attendanceSuppressionKey(
  record: Pick<AttendanceRecord, "club" | "opponent" | "matchDate" | "homeAway">,
): string {
  if (!record.matchDate) return "";
  const club = normaliseFixtureText(record.club);
  const opponent = normaliseFixtureText(record.opponent);
  const home = record.homeAway === "home" ? club : opponent;
  const away = record.homeAway === "home" ? opponent : club;
  return `${record.matchDate}|${home}|${away}`;
}

/**
 * V3.9.7 — season-ticket attendance matching REQUIRES the actual fixture
 * date: a fixture without a date never matches, and neither does a dateless
 * attendance record. Opponent alone is never proof of attendance.
 */
export function isSeasonFixtureAttended(
  records: AttendanceRecord[],
  fixture: { opponent: string; date: string | null },
): boolean {
  if (!fixture.date) return false;
  return records.some(
    (record) =>
      record.source === "season-ticket" &&
      clubNamesMatch(record.opponent, fixture.opponent) &&
      record.matchDate === fixture.date,
  );
}

type UpsertInput = {
  club: string;
  opponent: string;
  matchDate: string | null;
  season: string;
  competition: string | null;
  ground: string | null;
  homeAway: "home" | "away";
};

function mergeIntoExisting(
  existing: AttendanceRecord,
  input: UpsertInput,
  patch: Partial<AttendanceRecord>,
): AttendanceRecord {
  // Null/unknown values in the patch never overwrite known data.
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== null && value !== undefined),
  ) as Partial<AttendanceRecord>;
  return {
    ...existing,
    ...cleanPatch,
    competition: existing.competition ?? input.competition,
    ground: existing.ground ?? input.ground,
  };
}

/**
 * Ticket saved → attendance exists. Links to a matching record when one is
 * present (no duplicates), otherwise creates a confirmed record sourced
 * from the ticket pipeline.
 */
export function upsertAttendanceForTicket(
  records: AttendanceRecord[],
  input: UpsertInput & { ticketId: string },
): { records: AttendanceRecord[]; linked: boolean } {
  const existing = findMatchingAttendance(records, input);
  if (existing) {
    return {
      linked: true,
      records: records.map((record) =>
        record.id === existing.id
          ? mergeIntoExisting(record, input, { ticketId: input.ticketId })
          : record,
      ),
    };
  }
  const record: AttendanceRecord = {
    id: newAttendanceId(),
    club: input.club,
    opponent: input.opponent,
    matchDate: input.matchDate,
    season: input.season,
    competition: input.competition,
    ground: input.ground,
    homeAway: input.homeAway,
    result: null,
    homeScore: null,
    awayScore: null,
    ticketId: input.ticketId,
    source: "ticket",
    confirmed: true,
    createdAt: Date.now(),
  };
  return { records: [...records, record], linked: false };
}

export type ManualAttendanceInput = UpsertInput & {
  result: AttendanceResult | null;
  homeScore: number | null;
  awayScore: number | null;
  notes?: string;
  fixtureId?: string;
  dateProvenance?:
    | "licensed-source"
    | "manual-entry"
    | "user-confirmed-photo"
    | "user-confirmed-photo-gps";
};

/**
 * Manual entry → same duplicate protection. If the match already exists the
 * existing record is enriched (and linked fields filled), never duplicated.
 * V3.9.5: `options.source` labels the origin of a NEW record (default
 * "manual"); season ticket confirmations pass "season-ticket". Existing
 * matched records keep their original source.
 */
export function addManualAttendance(
  records: AttendanceRecord[],
  input: ManualAttendanceInput,
  options?: { source?: AttendanceSource },
): { records: AttendanceRecord[]; matchedExisting: boolean; record: AttendanceRecord } {
  const existing = findMatchingAttendance(records, input);
  if (existing) {
    const merged = mergeIntoExisting(existing, input, {
      result: input.result,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      fixtureId: input.fixtureId,
      dateProvenance: input.dateProvenance,
      notes: input.notes ? input.notes : existing.notes,
    });
    return {
      matchedExisting: true,
      record: merged,
      records: records.map((record) =>
        record.id === existing.id ? merged : record,
      ),
    };
  }
  const record: AttendanceRecord = {
    id: newAttendanceId(),
    club: input.club,
    opponent: input.opponent,
    matchDate: input.matchDate,
    season: input.season,
    competition: input.competition,
    ground: input.ground,
    homeAway: input.homeAway,
    result: input.result,
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    fixtureId: input.fixtureId,
    dateProvenance: input.dateProvenance,
    source: options?.source ?? "manual",
    confirmed: true,
    notes: input.notes,
    createdAt: Date.now(),
  };
  return { records: [...records, record], matchedExisting: false, record };
}

/** Corrupt-safe read: an unreadable payload yields an empty history. */
export async function loadAttendanceHistory(): Promise<AttendanceRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(ATTENDANCE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AttendanceRecord[];
    return Array.isArray(parsed) ? chronologicalAttendance(parsed) : [];
  } catch {
    return [];
  }
}

export async function saveAttendanceHistory(
  records: AttendanceRecord[],
): Promise<void> {
  await AsyncStorage.setItem(
    ATTENDANCE_HISTORY_KEY,
    JSON.stringify(chronologicalAttendance(records)),
  );
}

/** Counts for the Football History section — confirmed stored data ONLY. */
export function historyCounts(records: AttendanceRecord[]): {
  matches: number;
  grounds: number;
  seasons: number;
} {
  const confirmed = records.filter((record) => record.confirmed);
  // Stadiums are deduped on normalised names: "Elland Road" and
  // "elland road" are the same ground; repeat visits never inflate this.
  const grounds = new Set(
    confirmed
      .map((r) => r.ground)
      .filter((g): g is string => Boolean(g))
      .map((g) => normaliseFixtureText(g)),
  );
  const seasons = new Set(confirmed.map((r) => r.season).filter(Boolean));
  return { matches: confirmed.length, grounds: grounds.size, seasons: seasons.size };
}
