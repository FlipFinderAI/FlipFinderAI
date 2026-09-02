// HISTORY CORRECTION FOUNDATION
//
// Football History now DERIVES from the user's existing ticket collection
// (ticket-frame.saved-frame.v1 → tickets[]). A saved ticket is evidence of
// attendance. Tickets stay first-class: nothing is deleted, IDs are never
// modified, no data moves to another database, image storage untouched.
//
// Filtering rules:
// • INCLUDE: match / away / cup / playoff / European tickets — anything with
//   recognised match data.
// • EXCLUDE: car park tickets, parking passes, season ticket cards,
//   membership cards, non-match documents. These are never counted.
//
// Nothing is inferred beyond what is stored: scores/results stay null unless
// a user entered them manually elsewhere.

import {
  canonicalSeason,
  sameMatchIdentity,
  type AttendanceRecord,
  type AttendanceResult,
} from "./attendanceHistory";
import type { CachedFixture } from "./fixtureCache";
import { clubNamesMatch, normaliseFixtureText } from "./ticketText";

/** Structural view of a saved ticket (mirrors SeasonTicket — read-only). */
export type TicketLike = {
  id: string;
  homeTeam?: string | null;
  awayTeam?: string | null;
  matchDate?: string | null;
  kickoffTime?: string | null;
  competition?: string | null;
  ground?: string | null;
  ticketType?: string | null;
  seasonKey?: string | null;
};

const NON_MATCH_TYPE_PATTERNS: RegExp[] = [
  /car\s*park/i,
  /parking/i,
  /\bpass\b.*park/i,
  /membership/i,
  /season\s*(ticket|card|pass)/i,
  /seasonal\s*(ticket|card|pass)/i,
  /hospitality/i,
  /^other$/i,
];

/** True for car-park/parking/membership/season-card style non-match items. */
export function isNonMatchTicketType(
  ticketType: string | null | undefined,
): boolean {
  const value = (ticketType ?? "").trim();
  if (!value) return false;
  return NON_MATCH_TYPE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * A ticket counts as attended-match evidence when it is not a non-match item
 * AND carries recognisable match data (at least one team name).
 */
export function isValidMatchTicket(ticket: TicketLike): boolean {
  if (isNonMatchTicketType(ticket.ticketType)) return false;
  const hasTeam = Boolean(
    (ticket.homeTeam ?? "").trim() || (ticket.awayTeam ?? "").trim(),
  );
  return hasTeam;
}

function teamOr(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

/**
 * Derive one attendance record per valid match ticket. Duplicate physical
 * copies of the SAME fixture collapse later via identity matching (see
 * mergeDerivedWithManual usage); distinct matches always count separately.
 */
export function deriveAttendancesFromTickets(
  tickets: TicketLike[],
  preferredClubName: string | null | undefined,
): AttendanceRecord[] {
  const clubNorm = normaliseFixtureText(preferredClubName ?? "");
  const records: AttendanceRecord[] = [];
  for (const ticket of tickets) {
    if (!isValidMatchTicket(ticket)) continue;
    const home = teamOr(ticket.homeTeam);
    const away = teamOr(ticket.awayTeam);
    const homeIsClub = Boolean(clubNorm && home && clubNamesMatch(home, preferredClubName ?? ""));
    const awayIsClub = Boolean(clubNorm && away && clubNamesMatch(away, preferredClubName ?? ""));

    let club: string;
    let opponent: string;
    let homeAway: "home" | "away";
    if (homeIsClub && away) {
      club = home!;
      opponent = away;
      homeAway = "home";
    } else if (awayIsClub && home) {
      club = away!;
      opponent = home;
      homeAway = "away";
    } else if (home && away) {
      // Neutral record — both sides stored as played, no club assumed.
      club = home;
      opponent = away;
      homeAway = "home";
    } else {
      // Only one side known — store what exists, never fabricate an opponent.
      club = (home ?? away) as string;
      opponent = "";
      homeAway = "home";
    }

    records.push({
      id: `att-derived-${ticket.id}`, // never reuses the ticket id itself
      club,
      opponent,
      matchDate: teamOr(ticket.matchDate),
      season: ticket.seasonKey?.trim() || canonicalSeason(ticket.matchDate) || "",
      competition: teamOr(ticket.competition),
      ground: teamOr(ticket.ground),
      homeAway,
      result: null,
      homeScore: null,
      awayScore: null,
      ticketId: ticket.id, // soft link back to the evidence
      source: "ticket",
      confirmed: true,
      createdAt: 0,
    });
  }
  return records;
}


/**
 * Union of two record sets with duplicate protection. Records without an
 * opponent can't be identity-matched safely — they are deduped only by their
 * shared ticket link; otherwise every record counts separately.
 */
export function mergeHistoryRecords(
  primary: AttendanceRecord[],
  secondary: AttendanceRecord[],
): AttendanceRecord[] {
  const merged: AttendanceRecord[] = [];
  // Start empty so duplicates already stored within either input are also
  // collapsed. The underlying records remain untouched and recoverable.
  for (const record of [...primary, ...secondary]) {
    const duplicateIndex = merged.findIndex((existing) =>
      existing.opponent && record.opponent
        ? sameMatchIdentity(existing, record)
        : Boolean(
            existing.ticketId &&
              record.ticketId &&
              existing.ticketId === record.ticketId,
          ),
    );
    if (duplicateIndex < 0) {
      merged.push(record);
    } else {
      // Preserve the richer manual/season attendance record while attaching
      // its physical ticket evidence so tapping History can open that ticket.
      // The accepted ticket is authoritative for fixture identity and side:
      // stale manual rows must not turn an away ticket back into a home game
      // after the app is reopened.
      merged[duplicateIndex] = {
        ...merged[duplicateIndex],
        club: merged[duplicateIndex].club || record.club,
        opponent: merged[duplicateIndex].opponent || record.opponent,
        matchDate: merged[duplicateIndex].matchDate || record.matchDate,
        season: merged[duplicateIndex].season || record.season,
        competition:
          record.competition ?? merged[duplicateIndex].competition,
        ground: record.ground ?? merged[duplicateIndex].ground,
        homeAway: record.ticketId ? record.homeAway : merged[duplicateIndex].homeAway,
        result: merged[duplicateIndex].result ?? record.result,
        homeScore: merged[duplicateIndex].homeScore ?? record.homeScore,
        awayScore: merged[duplicateIndex].awayScore ?? record.awayScore,
        notes: merged[duplicateIndex].notes ?? record.notes,
        ticketId: merged[duplicateIndex].ticketId ?? record.ticketId,
      };
    }
  }
  return merged;
}

export function scoresForAttendance(
  record: AttendanceRecord,
  fixture?: CachedFixture,
) {
  return {
    // A provider result tied to this exact fixture is authoritative. Old
    // attendance rows may contain scores entered with the club treated as
    // the home side even when the ticket was for an away game.
    home: fixture?.homeScore ?? record.homeScore ?? null,
    away: fixture?.awayScore ?? record.awayScore ?? null,
  };
}

export function resultForAttendance(
  record: AttendanceRecord,
  fixture?: CachedFixture,
): AttendanceResult | null {
  if (fixture?.shootoutWinner) {
    return fixture.shootoutWinner === fixture.homeAway ? "win" : "loss";
  }
  if (record.result) return record.result;

  const scores = scoresForAttendance(record, fixture);
  if (scores.home == null || scores.away == null) return null;

  const homeAway = fixture?.homeAway ?? record.homeAway;
  const mine = homeAway === "home" ? scores.home : scores.away;
  const theirs = homeAway === "home" ? scores.away : scores.home;
  return mine > theirs ? "win" : mine < theirs ? "loss" : "draw";
}
