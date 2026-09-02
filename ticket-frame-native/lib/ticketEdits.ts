// V3.9.5 — Ticket types and recognition improvement.
//
// Pure helpers backing the post-scan TYPE OF ITEM step and the EDIT DETAILS
// screen. Kept framework-free so they are unit-testable outside React.

import { clubNamesMatch, normaliseFixtureText } from "./ticketText";

export type ItemType = "match" | "season" | "carpark";

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  match: "🎫 Match Ticket",
  season: "🎫 Season Ticket",
  carpark: "🚗 Car Park Pass",
};

const SEASON_TYPE_PATTERN =
  /season\s*(ticket|card|pass)|seasonal\s*(ticket|card|pass)/i;
// CONFIDENT tier: wording that only ever appears on car-park items — safe
// enough to skip the TYPE OF ITEM step and open the pass form directly.
const CARPARK_CONFIDENT_PATTERN = /car\s*park|parking/i;
// GUESS tier: still parking-flavoured, but only preselects the dropdown —
// the user decides. Bare "permit" is deliberately excluded because it also
// appears on real match tickets and must never misclassify them.
const CARPARK_GUESS_PATTERN =
  /car\s*park|parking|matchday\s+park(ing)?|park(ing)?\s*permit/i;

/**
 * AI's best guess at what the scanned item is. The user can always override;
 * the selected type becomes the source of truth. Wording such as
 * "Elland Road Car Park", "Matchday Parking" or "Season Parking Permit"
 * suggests Car Park Pass even before teams are considered.
 */
export function guessItemType(rec: {
  homeTeam?: string | null;
  awayTeam?: string | null;
  ticketType?: string | null;
  ground?: string | null;
  competition?: string | null;
}): ItemType {
  const haystack = [rec.ticketType, rec.ground, rec.competition]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
  if (SEASON_TYPE_PATTERN.test(haystack)) return "season";
  if (CARPARK_GUESS_PATTERN.test(haystack)) return "carpark";
  if (rec.homeTeam || rec.awayTeam) return "match";
  return "match";
}

/** True when OCR wording itself names a car-park item (confident skip). */
export function isConfidentCarParkText(rec: {
  ticketType?: string | null;
  ground?: string | null;
}): boolean {
  const haystack = `${rec.ticketType ?? ""} ${rec.ground ?? ""}`;
  return CARPARK_CONFIDENT_PATTERN.test(haystack);
}

/**
 * Seed the Car Park Pass form from whatever OCR read: strip parking words
 * out of the ground so the saved pass keeps a clean venue name, and keep
 * any detected date as both pass date and fixture link date.
 */
export function suggestCarParkFields(rec: {
  homeTeam?: string | null;
  awayTeam?: string | null;
  date?: string | null;
  ground?: string | null;
}): {
  title: string;
  ground: string;
  matchDate: string;
  linkedOpponent: string;
  linkedDate: string;
} {
  const rawGround = (rec.ground ?? "").trim();
  const cleanGround = rawGround
    .replace(/\b(car\s*park(ing)?|parking|permit)s?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s·,\-–—]+|[\s·,\-–—]+$/g, "");
  const baseGround = cleanGround || rawGround;
  const title = baseGround ? `${baseGround} Car Park Pass` : "";
  return {
    title,
    ground: baseGround,
    matchDate: rec.date ?? "",
    linkedOpponent:
      rec.homeTeam && rec.awayTeam ? `${rec.homeTeam} v ${rec.awayTeam}` : "",
    linkedDate: rec.date ?? "",
  };
}

/** Loose club match — same semantics as the fixture-source name matching. */
function looseClubMatch(side: string, clubNorm: string): boolean {
  return clubNamesMatch(side, clubNorm);
}

/**
 * Split a user-entered fixture link ("Leeds v Arsenal", "Arsenal v Leeds" or
 * a lone opponent) into club/opponent storage. Whenever one side names the
 * favourite club (loosely), only the opponent is stored; otherwise the raw
 * text is kept verbatim so no detail is ever lost.
 */
export function splitLinkedFixture(
  raw: string,
  clubName: string,
): { linkedClub: string | null; linkedOpponent: string | null } {
  const text = raw.trim();
  if (!text) return { linkedClub: null, linkedOpponent: null };
  const clubNorm = normaliseFixtureText(clubName);
  const sides = text
    .split(/\s+(?:v\.?|vs\.?|versus)\s+/i)
    .map((side) => side.trim())
    .filter(Boolean);
  if (sides.length === 2) {
    const aIsClub = looseClubMatch(sides[0], clubNorm);
    const bIsClub = looseClubMatch(sides[1], clubNorm);
    if (aIsClub && !bIsClub)
      return { linkedClub: clubName, linkedOpponent: sides[1] };
    if (bIsClub && !aIsClub)
      return { linkedClub: clubName, linkedOpponent: sides[0] };
    return { linkedClub: null, linkedOpponent: text };
  }
  if (sides.length === 1 && !looseClubMatch(sides[0], clubNorm)) {
    return { linkedClub: clubName, linkedOpponent: sides[0] };
  }
  return { linkedClub: null, linkedOpponent: text };
}

/** One editable line for seat info: "Block 12 · Row 14 · Seat 5". */
export function seatDetailsToLine(
  seat: SeatParts | null | undefined,
): string {
  if (!seat) return "";
  return (
    [
      seat.stand ? `Stand ${seat.stand}` : null,
      seat.block ? `Block ${seat.block}` : null,
      seat.row ? `Row ${seat.row}` : null,
      seat.seat ? `Seat ${seat.seat}` : null,
    ]
      .filter(Boolean)
      .join(" · ") ?? ""
  );
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/** Accepts ISO, UK numeric, month-name and ordinal dates → ISO or null. */
export function parseFlexibleDateInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (m) {
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    }
    return null;
  }
  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(value);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${m[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return null;
  }
  const cleaned = value.replace(/(\d)(st|nd|rd|th)\b/gi, "$1");
  m = /^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})$/.exec(cleaned);
  if (m) {
    const month = MONTH_NAMES[m[2].toLowerCase()];
    if (month && Number(m[1]) >= 1 && Number(m[1]) <= 31) {
      return `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    }
    return null;
  }
  m = /^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i.exec(cleaned);
  if (m) {
    const month = MONTH_NAMES[m[1].toLowerCase()];
    if (month && Number(m[2]) >= 1 && Number(m[2]) <= 31) {
      return `${m[3]}-${String(month).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    }
  }
  return null;
}

export type ItemEditDraft = {
  homeTeam: string;
  awayTeam: string;
  date: string;
  kickoff: string;
  competition: string;
  ground: string;
  seasonKey: string;
  seat: string;
  ticketType: string;
};

/** Prefill the EDIT DETAILS form from whatever OCR managed to read. */
export function buildEditsFromRecognition(
  rec: {
    homeTeam?: string | null;
    awayTeam?: string | null;
    date?: string | null;
    kickoff?: string | null;
    competition?: string | null;
    ground?: string | null;
    seatDetails?: SeatParts | null;
    ticketType?: string | null;
  },
  fallbackSeasonKey: string,
): ItemEditDraft {
  return {
    homeTeam: rec.homeTeam ?? "",
    awayTeam: rec.awayTeam ?? "",
    date: rec.date ?? "",
    kickoff: rec.kickoff ?? "",
    competition: rec.competition ?? "",
    ground: rec.ground ?? "",
    seasonKey: fallbackSeasonKey,
    seat: seatDetailsToLine(rec.seatDetails),
    ticketType: rec.ticketType ?? "",
  };
}

export type SeatParts = {
  stand?: string;
  block?: string;
  row?: string;
  seat?: string;
};

export type RecognitionPatch = {
  homeTeam?: string | null;
  awayTeam?: string | null;
  date?: string | null;
  kickoff?: string | null;
  competition?: string | null;
  ground?: string | null;
  seatDetails?: SeatParts | null;
  ticketType?: string | null;
  seasonKey?: string | null;
};

/** "Stand A · Block 12 · Row 14 · Seat 5" → structured parts. */
export function parseSeatLine(line: string): SeatParts {
  const parts: SeatParts = {};
  for (const chunk of line.split(/[·,\n]|\s{2,}/)) {
    const value = chunk.trim();
    if (!value) continue;
    let m = /^stand\s+(.+)$/i.exec(value);
    if (m) {
      parts.stand = m[1];
      continue;
    }
    m = /^block\s+(.+)$/i.exec(value);
    if (m) {
      parts.block = m[1];
      continue;
    }
    m = /^row\s+(.+)$/i.exec(value);
    if (m) {
      parts.row = m[1];
      continue;
    }
    m = /^seat\s+(.+)$/i.exec(value);
    if (m) {
      parts.seat = m[1];
    }
  }
  return parts;
}

/**
 * Convert the edit form into a patch for the saved ticket. Empty text clears
 * a field; an unparsable date is reported instead of silently dropped.
 */
export function buildRecognitionPatch(draft: ItemEditDraft): {
  patch: RecognitionPatch;
  dateError: string | null;
} {
  const clean = (value: string) => value.trim();
  const seatLine = clean(draft.seat);
  const seatDetails = seatLine ? parseSeatLine(seatLine) : null;
  let dateError: string | null = null;
  let date: string | null = null;
  if (clean(draft.date)) {
    const parsed = parseFlexibleDateInput(draft.date);
    if (parsed) {
      date = parsed;
    } else {
      dateError = "Enter the date as YYYY-MM-DD or e.g. 14 March 2010.";
    }
  }
  return {
    patch: {
      homeTeam: clean(draft.homeTeam) || null,
      awayTeam: clean(draft.awayTeam) || null,
      date,
      kickoff: clean(draft.kickoff) || null,
      competition: clean(draft.competition) || null,
      ground: clean(draft.ground) || null,
      seasonKey: clean(draft.seasonKey) || null,
      ticketType: clean(draft.ticketType) || null,
      seatDetails,
    },
    dateError,
  };
}

/** "Stand … · Block … · Row … · Seat …" notes line for attendance records. */
export function composeSeatNotes(
  parts: SeatParts | null | undefined,
): string | null {
  const line = seatDetailsToLine(parts);
  return line || null;
}

/** Normalised identity helper reused by dedupe checks. */
export function sameGroundIdentity(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return normaliseFixtureText(a) === normaliseFixtureText(b);
}
