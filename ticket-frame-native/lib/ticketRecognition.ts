import TextRecognition from "@react-native-ml-kit/text-recognition";
import {
  clubNamesMatch,
  competitionFromTicketText,
  dateFromTicketText,
  kickoffFromTicketText,
  matchFromTicketText,
  normaliseFixtureText,
  parseSeatDetails,
  roundFromTicketText,
  type TicketSeatDetails,
} from "./ticketText";
import { fetchAndCacheFixtures, type CachedFixture } from "./fixtureCache";
import { FOOTBALL_GROUNDS, type FootballGround } from "./grounds";
import { getAllBundledClubFixtures } from "./fixtures";

export type RecognizedTicket = {
  homeTeam: string | null;
  awayTeam: string | null;
  date: string | null;
  kickoff: string | null;
  competition: string | null;
  ground: string | null;
  seatDetails: TicketSeatDetails | null;
  confidence: number;
  fixtureBacked: boolean;
  /** Whether the OCR scan itself contains credible evidence that the image is a ticket/pass. */
  ticketEvidence?: boolean;
  ticketType?: string | null;
  seasonKey?: string | null;
  /** Exact fixture explicitly selected by the user. Manual selection is authoritative. */
  fixtureId?: string;
  fixtureHomeScore?: number | null;
  fixtureAwayScore?: number | null;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatRecognitionDate(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return value;
  return `${Number(match[3])} ${MONTH_NAMES[monthIndex]} ${match[1]}`;
}

export function buildTicketDisplayName(fields: {
  homeTeam?: string | null;
  awayTeam?: string | null;
  date?: string | null;
  kickoff?: string | null;
}): string | null {
  const home = fields.homeTeam?.replace(/\s+/g, " ").trim();
  const away = fields.awayTeam?.replace(/\s+/g, " ").trim();
  if (!home || !away) return null;
  const lines = [`${home} v ${away}`];
  const dateLabel = formatRecognitionDate(fields.date);
  const timeLabel = fields.kickoff?.trim() || null;
  if (dateLabel && timeLabel) lines.push(`${dateLabel} • ${timeLabel}`);
  else if (dateLabel) lines.push(dateLabel);
  else if (timeLabel) lines.push(timeLabel);
  return lines.join("\n");
}

const SEPARATOR_LINE = /^(?:v|vs|versus|against)\.?$/i;

function cleanSide(value: string) {
  return value
    .replace(/[\s|·•]+/g, " ")
    .replace(/[^A-Za-z0-9&'’.()\- ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isTeamish(line: string) {
  const value = line.trim();
  if (value.length < 3 || value.length > 48) return false;
  if (/^\d+/.test(value)) return false;
  if (/\d{1,2}[:/.]\d{2}/.test(value)) return false;
  // Whole words only — "Gateshead" must never trip the "gate" signage rule.
  if (/kick[\s-]?off|season\s*\d{4}|\bseat\b|\brow\b|\bblock\b|\bgate\b|turnstile/i.test(value))
    return false;
  const letters = value.replace(/[^A-Za-z]/g, "").length;
  return letters / value.length >= 0.6 && letters >= 3;
}

export function extractMatchSides(
  ocrText: string,
): { home: string; away: string } | null {
  const lines = ocrText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const inline = line.match(/^(.{2,45}?)\s+(?:v|vs)\.?\s+(.{2,45})$/i);
    if (inline) {
      const home = cleanSide(inline[1]);
      const away = cleanSide(inline[2]);
      if (home && away) return { home, away };
    }
  }

  for (let i = 1; i < lines.length - 1; i++) {
    if (!SEPARATOR_LINE.test(lines[i])) continue;
    const prev = lines[i - 1];
    const next = lines[i + 1];
    if (isTeamish(prev) && isTeamish(next)) {
      return { home: cleanSide(prev), away: cleanSide(next) };
    }
  }

  for (let i = 0; i < lines.length - 1; i++) {
    const trailing = lines[i].match(/^(.{2,45}?)\s+(?:v|vs)\.?$/i);
    if (trailing && isTeamish(lines[i + 1])) {
      return { home: cleanSide(trailing[1]), away: cleanSide(lines[i + 1]) };
    }
    const leading = lines[i].match(/^(?:v|vs)\.?\s+(.{2,45})$/i);
    if (leading && i > 0 && isTeamish(lines[i - 1])) {
      return { home: cleanSide(lines[i - 1]), away: cleanSide(leading[1]) };
    }
  }

  const loose = matchFromTicketText(ocrText);
  if (loose) {
    const parts = loose.split(/\s+vs\s+/i);
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { home: cleanSide(parts[0]), away: cleanSide(parts[1]) };
    }
  }
  return null;
}

function canonicalClubName(
  raw: string | null,
  extraNames: string[],
): string | null {
  if (!raw) return null;
  const target = normaliseFixtureText(raw);
  if (!target) return null;
  const pool = [
    ...extraNames,
    ...FOOTBALL_GROUNDS.map((ground) => ground.club),
  ];
  for (const name of pool) {
    if (!name) continue;
    if (normaliseFixtureText(name) === target) return name;
  }
  for (const name of pool) {
    if (!name) continue;
    const norm = normaliseFixtureText(name);
    if (
      norm.length >= 6 &&
      target.length >= 6 &&
      (norm.includes(target) || target.includes(norm))
    ) {
      return name;
    }
  }
  return null;
}

function windowContains(ground: FootballGround, matchDate: string): boolean {
  return (
    (!ground.fromDate || matchDate >= ground.fromDate) &&
    (!ground.toDate || matchDate <= ground.toDate)
  );
}

function windowDistance(ground: FootballGround, matchDate: string): number {
  const time = Date.parse(`${matchDate}T00:00:00Z`);
  if (Number.isNaN(time)) return 0;
  const from = ground.fromDate ? Date.parse(`${ground.fromDate}T00:00:00Z`) : null;
  const to = ground.toDate ? Date.parse(`${ground.toDate}T00:00:00Z`) : null;
  if (from !== null && time < from) return from - time;
  if (to !== null && time > to) return time - to;
  return 0;
}

export function groundForHomeTeam(
  homeTeam: string | null,
  matchDate?: string | null,
): string | null {
  if (!homeTeam) return null;
  const target = normaliseFixtureText(homeTeam);
  if (!target) return null;
  let candidates = FOOTBALL_GROUNDS.filter(
    (item) => normaliseFixtureText(item.club) === target,
  );
  if (!candidates.length) {
    candidates = FOOTBALL_GROUNDS.filter(
      (item) =>
        item.league !== "Historical" &&
        (normaliseFixtureText(item.club).includes(target) ||
          target.includes(normaliseFixtureText(item.club))),
    );
  }
  if (!candidates.length) return null;

  const dated = candidates.filter((item) => item.fromDate || item.toDate);
  const undatedCurrent =
    candidates.find((item) => !item.fromDate && !item.toDate && item.league !== "Historical") ??
    candidates.find((item) => !item.fromDate && !item.toDate);

  if (!dated.length) return (undatedCurrent ?? candidates[0]).stadium;

  // Historical ground rule: resolve the stadium for THIS match date.
  if (!matchDate) return (undatedCurrent ?? candidates[0]).stadium;
  const inside = dated.find((item) => windowContains(item, matchDate));
  if (inside) return inside.stadium;
  let best = dated[0];
  for (const item of dated) {
    if (windowDistance(item, matchDate) < windowDistance(best, matchDate)) best = item;
  }
  return best.stadium;
}

type FixtureMatchOptions = { league?: string };

// ---------------------------------------------------------------------------
// Generic football team-name affinity.
// No club alias lists: abbreviation expansion, initialisms, plural stemming,
// token prefixes and substring relations only — works for any club anywhere.
const GENERIC_NAME_TOKENS = new Set(["fc", "afc", "cf", "sc", "club", "football"]);
// Common football naming suffixes shared by dozens of clubs. Two different
// teams both ending in the same suffix word ("X United" vs "Y United",
// "X Town" vs "Y Town") is NOT meaningful name evidence on its own.
const SHARED_SUFFIX_WORDS = new Set([
  "united",
  "town",
  "city",
  "albion",
  "rovers",
  "wanderers",
  "athletic",
  "county",
  "alexandra",
  "dynamo",
  "spartak",
  "locomotiv",
  "sporting",
  "olympic",
]);
const TOKEN_EXPANSIONS: Record<string, string> = {
  utd: "united",
  ath: "athletic",
  assoc: "association",
  int: "international",
};

function stemToken(token: string): string {
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function significantTokens(normName: string): string[] {
  return normName
    .split(" ")
    .filter((token) => token && !GENERIC_NAME_TOKENS.has(token))
    .map((token) => TOKEN_EXPANSIONS[token] ?? token);
}

function tokensRelate(a: string, b: string): boolean {
  const sa = stemToken(a);
  const sb = stemToken(b);
  if (sa === sb) return true;
  const shortest = Math.min(sa.length, sb.length);
  if (shortest >= 3 && (sa.startsWith(sb) || sb.startsWith(sa))) return true;
  if (sa.length >= 4 && sb.length >= 4 && (sa.includes(sb) || sb.includes(sa)))
    return true;
  return false;
}

function initialismOf(tokens: string[]): string {
  return tokens.map((token) => token[0] ?? "").join("");
}

export function teamNameAffinity(
  sideRaw: string | null,
  canonicalName: string | null,
): number {
  if (!sideRaw || !canonicalName) return 0;
  const sideNorm = normaliseFixtureText(sideRaw);
  const canonNorm = normaliseFixtureText(canonicalName);
  if (!sideNorm || !canonNorm) return 0;

  // Exact initialisms only: "CPFC" = Crystal Palace (F)ootball (C)lub.
  // A generic club-type suffix may trail the initials. Prefix matches are NOT
  // enough — "spurs" must never count as the initials of "S(lavia) P(rague)".
  if (/^[a-z]{2,8}$/.test(sideNorm)) {
    let core = sideNorm;
    const genericSuffix = core.match(/(afc|fc|cf|sc)$/);
    if (genericSuffix && core.length - genericSuffix[1].length >= 2)
      core = core.slice(0, -genericSuffix[1].length);
    const target = initialismOf(significantTokens(canonNorm));
    if (core.length >= 2 && target.length >= 2 && core === target) return 18;
  }

  if (sideNorm === canonNorm) return 30;
  if (sideNorm.includes(canonNorm) || canonNorm.includes(sideNorm)) return 22;

  const sideTokens = significantTokens(sideNorm);
  const canonTokens = significantTokens(canonNorm);
  let strongHits = 0;
  for (const sideToken of sideTokens) {
    const related = canonTokens.find((canonToken) =>
      tokensRelate(sideToken, canonToken),
    );
    if (!related) continue;
    const sa = stemToken(sideToken);
    const sb = stemToken(related);
    // An identical shared suffix word alone proves nothing — only a relation
    // on a distinctive word (or an added suffix alongside one) counts.
    if (sa === sb && SHARED_SUFFIX_WORDS.has(sa)) continue;
    strongHits++;
  }
  if (strongHits > 0) return Math.min(22, strongHits * 11);
  return 0;
}

// Resolves an OCR clue to an OFFICIAL team identity drawn from the fixture
// provider's own team names (plus the selected club). Ambiguous ties are
// rejected rather than guessed — an unresolved clue never becomes a lookup key.
function resolveOfficialSide(
  clue: string | null,
  officialNames: string[],
): string | null {
  if (!clue) return null;
  let bestName: string | null = null;
  let bestScore = 0;
  let tied = false;
  for (const name of officialNames) {
    const score = teamNameAffinity(clue, name);
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
      tied = false;
    } else if (bestScore > 0 && score === bestScore && name !== bestName) {
      tied = true;
    }
  }
  if (!bestName || bestScore < 11 || tied) return null;
  return bestName;
}

// Universal engine: no clubs, dates or competitions are ever hard-coded here.
// The fixture database is the authority; OCR lines are only evidence used to
// rank candidates.
type FixtureCandidate = {
  fixture: CachedFixture;
  score: number;
  dateExact: boolean;
  opponentStrong: boolean;
  kickoffMatches: boolean;
  venueMatches: boolean;
  competitionMatches: boolean;
  roundMatches: boolean;
  competitionRoundMatch: boolean;
};

function normaliseRoundClue(value: string | null | undefined) {
  if (!value) return "";
  const normalised = normaliseFixtureText(value);

  const numbered = normalised.match(
    /\b(?:(\d{1,2})(?:st|nd|rd|th)?\s+round|round\s+(\d{1,2})|r\s*(\d{1,2}))\b/,
  );
  if (numbered) {
    const number = numbered[1] || numbered[2] || numbered[3];
    const replay = /\breplay(?:s)?\b/.test(normalised);
    return replay ? `round ${number} replay` : `round ${number}`;
  }

  return normalised;
}

function describeFixture(fixture: CachedFixture, clubName: string) {
  const pairing =
    fixture.homeAway === "home"
      ? `${clubName} v ${fixture.opponent}`
      : `${fixture.opponent} v ${clubName}`;
  return `${fixture.date || "?"} ${pairing} (${fixture.competition || "?"})`;
}

type FixtureSearchOutcome = {
  fixture: CachedFixture | null;
  method: string;
  candidates: FixtureCandidate[];
  competitionsSearched: string[];
};

async function bestFixtureForSides(
  clubName: string,
  season: string,
  fixtures: CachedFixture[],
  candidateOpponents: string[],
  clubIsHome: boolean | null,
  ocrDate: string | null,
  ocrKickoff: string | null,
  ocrCompetition: string | null,
  ocrRound: string | null,
  ocrText: string,
  ocrDateYearAuthoritative: boolean,
): Promise<FixtureSearchOutcome> {
  const hasTeamClue = candidateOpponents.length > 0;
  let searchMethod = "none";
  if (hasTeamClue && ocrDate)
    searchMethod = ocrKickoff ? "teams+date+kickoff" : "teams+date";
  else if (hasTeamClue) searchMethod = "teams";
  else if (ocrCompetition && ocrDate) searchMethod = "competition+date";
  else if (ocrDate) searchMethod = ocrKickoff ? "date+kickoff" : "date";

  const competitionsSearched = Array.from(
    new Set(fixtures.map((fixture) => fixture.competition).filter(Boolean)),
  );

  // Any single clue is enough to consult the fixture database.
  if (!hasTeamClue && !ocrDate && !ocrCompetition && !ocrRound) {
    console.log(
      `[ticket-recognition-fixture-search]\nsearch method: none\ncandidates: 0\nmatches:\n  (no usable OCR clues)`,
    );
    return { fixture: null, method: searchMethod, candidates: [], competitionsSearched };
  }

  // Fixtures were fetched by the caller so official identities could be
  // resolved BEFORE any lookup happens.
  if (!fixtures.length) {
    console.log(
      `[ticket-recognition-fixture-search]\nsearch method: ${searchMethod}\ncandidates: 0\nmatches:\n  (no fixtures for ${clubName} ${season})`,
    );
    return { fixture: null, method: searchMethod, candidates: [], competitionsSearched };
  }

  const scored: FixtureCandidate[] = [];
  for (const fixture of fixtures) {
    let opponentScore = 0;
    if (hasTeamClue) {
      if (!fixture.opponent) continue;
      for (const clue of candidateOpponents) {
        opponentScore = Math.max(
          opponentScore,
          teamNameAffinity(clue, fixture.opponent),
        );
      }
    }
    const dateExact = !!ocrDate && !!fixture.date && fixture.date === ocrDate;
    const dateDayMonthMatch =
      !!ocrDate &&
      !!fixture.date &&
      !ocrDateYearAuthoritative &&
      fixture.date.slice(5) === ocrDate.slice(5);
    const opponentStrong = opponentScore >= 11;
    const kickoffMatches =
      !!ocrKickoff && !!fixture.kickoff && ocrKickoff === fixture.kickoff;

    // Stadium/venue is supporting evidence read directly from the ticket.
    // It may strengthen or separate otherwise credible TFD candidates, but it
    // never overrides a conflicting opponent/date combination.
    const expectedVenue =
      fixture.venue ||
      (fixture.homeAway === "home"
        ? groundForHomeTeam(clubName, fixture.date)
        : groundForHomeTeam(fixture.opponent, fixture.date));
    const venueMatches =
      !!expectedVenue &&
      normaliseFixtureText(expectedVenue).length >= 5 &&
      normaliseFixtureText(ocrText).includes(
        normaliseFixtureText(expectedVenue),
      );

    const roundMatches =
      !!ocrRound &&
      !!fixture.round &&
      (() => {
        const clue = normaliseRoundClue(ocrRound);
        const official = normaliseRoundClue(fixture.round);
        return clue === official;
      })();
    const competitionMatches =
      !!ocrCompetition &&
      !!fixture.competition &&
      (() => {
        const clue = normaliseFixtureText(ocrCompetition);
        const official = normaliseFixtureText(fixture.competition);
        return (
          clue === official ||
          clue.includes(official) ||
          official.includes(clue)
        );
      })();
    // A round/stage clue may identify a fixture only when the competition also
    // agrees. TFD remains authoritative; generic words such as "Final" alone
    // must never choose a match.
    const competitionRoundMatch = roundMatches && competitionMatches;
    if (
      opponentScore <= 0 &&
      !dateExact &&
      !dateDayMonthMatch &&
      !competitionRoundMatch
    )
      continue;
    // Known club + opponent + exact date is the primary ticket identity.
    // Kickoff, venue, competition and home/away are corroboration/tie-breakers.
    let score =
      opponentScore +
      (dateExact ? 40 : 0) +
      (dateDayMonthMatch ? 40 : 0) +
      (opponentStrong && (dateExact || dateDayMonthMatch) ? 40 : 0) +
      (competitionRoundMatch ? 25 : 0);
    if (clubIsHome === true && fixture.homeAway !== "home") score -= 15;
    if (clubIsHome === false && fixture.homeAway !== "away") score -= 15;
    if (ocrCompetition && fixture.competition) {
      if (competitionMatches) score += 8;
      else score -= 6;
    }
    if (kickoffMatches) score += 8;
    if (venueMatches) score += 10;
    scored.push({
      fixture,
      score,
      dateExact,
      opponentStrong,
      kickoffMatches,
      venueMatches,
      competitionMatches,
      roundMatches,
      competitionRoundMatch,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  // DATE-FIRST RESOLUTION: club + season + date is enough on its own. With no
  // opponent clue, a single fixture on that date is THE match; corroborating
  // clues (kickoff/competition) may also separate a winner. If several
  // fixtures remain truly tied, selection is declined rather than guessed.
  let accepted: CachedFixture | null = null;
  let declineReason: string | null = null;
  const winner = scored[0];

  // Team names and home/away orientation alone can identify an opponent, but
  // they cannot prove which season an undated ticket belongs to. The selected
  // UI season is search context, not ticket evidence. Keep the TFD candidates
  // for manual selection rather than silently assigning the ticket to that
  // season.
  const teamsOnly =
    hasTeamClue &&
    !ocrDate &&
    !ocrKickoff &&
    !ocrCompetition &&
    !ocrRound;

  const acceptanceThreshold = hasTeamClue ? 30 : 25;
  const tied = winner
    ? scored.filter((candidate) => candidate.score === winner.score)
    : [];
  if (teamsOnly) {
    declineReason = "teams alone cannot prove the ticket season";
  } else if (!winner || winner.score < acceptanceThreshold) {
    declineReason = winner ? "no candidate reached the acceptance threshold" : null;
  } else if (tied.length > 1) {
    declineReason = `${tied.length} fixtures tie without enough evidence to separate them`;
  } else if (
    hasTeamClue &&
    ocrDate &&
    ocrDateYearAuthoritative &&
    winner.fixture.date !== ocrDate &&
    !winner.competitionRoundMatch
  ) {
    // A disagreeing OCR date normally blocks automatic selection. Recover
    // only when the unique TFD winner is independently corroborated by both
    // competition and round/stage; OCR dates are clues, not authority.
    declineReason = "team and OCR date point to different fixtures without competition/round confirmation";
  } else if (!hasTeamClue) {
    // Kickoff/competition agreement already separates candidates in the score;
    // an unchanged tie means the ticket carries nothing that decides it.
    accepted = winner.fixture;
  } else {
    accepted = winner.fixture;
  }
  if (declineReason)
    console.log(`[ticket-recognition-fixture-search] selection declined: ${declineReason}`);

  console.log(
    `[ticket-debug-fixture-results]\nnumber of fixtures returned: ${fixtures.length}\nmatching fixtures:\n${
      scored
        .slice(0, 5)
        .map(
          (candidate) =>
            `  ${describeFixture(candidate.fixture, clubName)} — score ${candidate.score}`,
        )
        .join("\n") || "  (none)"
    }\nselected fixture:\n${
      accepted
        ? `home: ${accepted.homeAway === "home" ? clubName : accepted.opponent}\naway: ${
            accepted.homeAway === "home" ? accepted.opponent : clubName
          }\ndate: ${accepted.date || "-"}\nkickoff: ${
            accepted.kickoff || "n/a (fixture source has no times)"
          }\ncompetition: ${
            accepted.competition || "-"
          }`
        : "(none)"
    }`,
  );

  console.log(
    `[ticket-recognition-fixture-search]\nsearch method: ${searchMethod}\ncandidates: ${fixtures.length}\nmatches:\n${
      scored
        .slice(0, 5)
        .map(
          (candidate) =>
            `  ${describeFixture(candidate.fixture, clubName)} — score ${candidate.score}`,
        )
        .join("\n") || "  (none)"
    }\nselected: ${accepted ? describeFixture(accepted, clubName) : "(none)"}`,
  );

  return { fixture: accepted, method: searchMethod, candidates: scored, competitionsSearched };
}

export async function recogniseTicketImage(
  imageUri: string,
  clubName: string,
  season: string,
  opts?: FixtureMatchOptions,
): Promise<RecognizedTicket> {
  let text = "";
  try {
    text = (await TextRecognition.recognize(imageUri)).text ?? "";
  } catch {
    text = "";
  }
  return recogniseFromText(text, clubName, season, opts);
}

export async function recogniseFromText(
  ocrText: string,
  clubName: string,
  season: string,
  opts?: FixtureMatchOptions,
): Promise<RecognizedTicket> {
  const carParkPassText =
    /\b(?:car\s*park(?:ing)?(?:\s+(?:pass|permit|ticket))?|parking\s+(?:pass|permit|ticket)|matchday\s+parking|season\s+parking(?:\s+(?:pass|permit))?)\b/i.test(
      ocrText,
    );

  if (carParkPassText) {
    const detectedDate = dateFromTicketText(ocrText, season);
    console.log(
      "[ticket-recognition-car-park]\nticketType: Car Park Pass\nmatch recognition skipped",
    );
    return {
      homeTeam: null,
      awayTeam: null,
      date: detectedDate,
      kickoff: null,
      competition: null,
      ground: null,
      seatDetails: parseSeatDetails(ocrText),
      confidence: 100,
      fixtureBacked: false,
      ticketEvidence: true,
      ticketType: "Car Park Pass",
      seasonKey: detectedDate ? null : season || null,
    };
  }

  // Season passes are not matches — detect and stop before any recognition.
  if (/season\s+(?:ticket|card|pass)/i.test(ocrText)) {
    const printedSeason = ocrText.match(/\b(20\d{2})\s*\/\s*(\d{2,4})\b/);
    const seasonKey = printedSeason
      ? `${printedSeason[1]}/${printedSeason[2].slice(-2)}`
      : null;
    console.log(
      "[ticket-recognition-season-ticket]\nticketType: Season Ticket\nmatch recognition skipped",
    );
    return {
      homeTeam: null,
      awayTeam: null,
      date: null,
      kickoff: null,
      competition: null,
      ground: null,
      seatDetails: parseSeatDetails(ocrText),
      confidence: 100,
      fixtureBacked: false,
      ticketEvidence: true,
      ticketType: "Season Ticket",
      seasonKey,
    };
  }

  const sides = extractMatchSides(ocrText);
  let homeRaw = sides?.home ?? null;
  let awayRaw = sides?.away ?? null;
  // A season printed on the ticket is stronger evidence than the Home
  // screen's selected season, especially when several tickets are imported.
  const ocrSeasonMatch = ocrText.match(
    /\b((?:20)?\d{2})\s*\/\s*(\d{2,4})\b/,
  );
  const ocrSeason = (() => {
    if (!ocrSeasonMatch) return null;

    const rawStart = ocrSeasonMatch[1];
    const rawEnd = ocrSeasonMatch[2];
    const startYear =
      rawStart.length === 2 ? 2000 + Number(rawStart) : Number(rawStart);
    const endYear =
      rawEnd.length === 2 ? 2000 + Number(rawEnd) : Number(rawEnd);

    if (
      !Number.isInteger(startYear) ||
      !Number.isInteger(endYear) ||
      startYear < 2000 ||
      startYear > 2098 ||
      endYear !== startYear + 1
    ) {
      return null;
    }

    return `${startYear}/${String(endYear).slice(-2)}`;
  })();
  const dateParsingSeason = ocrSeason || season || "";
  const date = dateFromTicketText(ocrText, dateParsingSeason);

  // A ticket that prints only day/month (for example "11 May") does NOT prove
  // a year. dateFromTicketText needs a season to construct an ISO date, but
  // that constructed year must remain provisional. TFD should determine the
  // real year from club + opponent + day/month (+ kickoff/venue when present).
  const ticketPrintsYear =
    /\b\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}\b/.test(ocrText) ||
    /\b\d{1,2}(?:st|nd|rd|th)?[ \t]*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[ \t]+\d{2,4}\b/i.test(ocrText) ||
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[ \t]*\d{1,2}(?:st|nd|rd|th)?[ \t]+\d{2,4}\b/i.test(ocrText);

  const dateSeason = (() => {
    if (!date) return null;
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
    const startYear = month >= 7 ? year : year - 1;
    return `${startYear}/${String(startYear + 1).slice(-2)}`;
  })();
  // A printed season is authoritative. Without one, OCR dates remain clues:
  // search both the selected season and the date-implied season when they
  // differ, then let the combined TFD evidence identify the fixture.
  const selectedSeasonStart = Number(season.split("/")[0]);
  const nearbySeasons =
    !ocrSeason &&
    date &&
    !ticketPrintsYear &&
    Number.isInteger(selectedSeasonStart)
      ? Array.from({ length: 8 }, (_, offset) => {
          const start = selectedSeasonStart - offset;
          return `${start}/${String(start + 1).slice(-2)}`;
        })
      : [];

  const searchSeasons = ocrSeason
    ? [ocrSeason]
    : Array.from(
        new Set(
          [season, dateSeason, ...nearbySeasons].filter(
            (value): value is string => !!value,
          ),
        ),
      );
  const searchSeason = searchSeasons[0] || "";
  let kickoff = kickoffFromTicketText(ocrText);

  console.log(
    `[ticket-recognition-ocr]\nraw text: ${JSON.stringify(
      ocrText,
    )}\nteams: ${
      homeRaw || awayRaw
        ? `${homeRaw ?? "?"} / ${awayRaw ?? "?"}`
        : "none"
    }\ndate: ${date ?? "none"}\nkickoff: ${kickoff ?? "none"}`,
  );

  let competition = competitionFromTicketText(ocrText);
  const roundClue = roundFromTicketText(ocrText);
  const seatDetails = parseSeatDetails(ocrText);

  // Ticket-image evidence is deliberately separate from match confidence.
  // Manual fixture selection may identify WHICH match a ticket belongs to,
  // but must never turn an arbitrary photo into a ticket.
  const explicitTicketText =
    /\b(?:match\s+ticket|e[-\s]?ticket|mobile\s+ticket|digital\s+ticket|admission|admit|entry|turnstile|ticket\s+type)\b/i.test(
      ocrText,
    );
  const seatingEvidence = Boolean(
    seatDetails?.stand ||
      seatDetails?.block ||
      seatDetails?.row ||
      seatDetails?.seat ||
      /\b(?:stand|tier|block|row|seat|gate|turnstile)\b/i.test(ocrText),
  );
  const teamPairEvidence = Boolean(homeRaw && awayRaw);
  const footballDetailCount = [
    Boolean(date),
    Boolean(kickoff),
    Boolean(competition),
    Boolean(roundClue),
    Boolean(homeRaw || awayRaw),
  ].filter(Boolean).length;
  const ticketEvidence =
    explicitTicketText ||
    seatingEvidence ||
    teamPairEvidence ||
    footballDetailCount >= 2;

  // Season evidence printed on the ticket itself (e.g. "2026/27"). Priority:
  // user-selected season first; this is only a fallback when none was passed.
  const detectedKickoff = kickoff;
  const detectedCompetition = competition;

  console.log(
    `[ticket-debug-ocr]\nraw text: ${JSON.stringify(
      ocrText,
    )}\nparsed teams: ${homeRaw ?? "-"} / ${awayRaw ?? "-"}\nparsed date: ${
      date ?? "-"
    }\nparsed kickoff: ${kickoff ?? "-"}`,
  );

  // OCR is a clue, not the final source. Whenever we hold any clue at all,
  // ask the fixture database to confirm and complete the picture — never stop
  // just because a team name is missing.
  let matchedFixture: CachedFixture | null = null;
  let searchOutcome: FixtureSearchOutcome | null = null;
  let resolvedDate = date;
  const hasAnyClue = !!(
    resolvedDate ||
    kickoff ||
    homeRaw ||
    awayRaw ||
    competition ||
    roundClue
  );

  // Provider fixtures arrive FIRST so every downstream step (fixture search,
  // ground lookup, competition matching, display naming, saved details) can
  // resolve against OFFICIAL team identities instead of raw OCR text.
  let seasonFixtures: CachedFixture[] = [];
  if (hasAnyClue) {
    try {
      const fixtureSets = await Promise.all(
        searchSeasons.map((candidateSeason) =>
          fetchAndCacheFixtures(clubName, candidateSeason, {
            league: opts?.league,
          }),
        ),
      );
      seasonFixtures = fixtureSets.flat();

      if (!date && !ocrSeason) {
        const allClubFixtures = getAllBundledClubFixtures(clubName)
          .filter((row) => !!row.date && row.date >= "2018-01-01")
          .map((row) => {
            const home = clubNamesMatch(row.homeName, clubName);
            return {
              fixtureId: row.id,
              opponent: home ? row.awayName : row.homeName,
              homeAway: home ? ("home" as const) : ("away" as const),
              date: row.date ?? "",
              kickoff: row.kickoff,
              competition: row.competition ?? "",
              season: row.season,
              round: row.round ?? null,
              venue: row.venue ?? null,
              homeScore: row.homeScore,
              awayScore: row.awayScore,
              attendance: row.attendance ?? null,
              homeScorers: row.homeScorers ?? [],
              awayScorers: row.awayScorers ?? [],
            } satisfies CachedFixture;
          });

        seasonFixtures = Array.from(
          new Map(
            [...seasonFixtures, ...allClubFixtures].map((fixture) => [
              fixture.fixtureId ??
                `${fixture.season}|${fixture.date}|${fixture.opponent}|${fixture.competition}`,
              fixture,
            ]),
          ).values(),
        );
      }
    } catch {
      console.log("[ticket-recognition-fixture-search] fixture fetch failed");
    }
  }

  const officialNames = Array.from(
    new Set(
      [
        clubName,
        ...seasonFixtures.map((fixture) => fixture.opponent),
      ].filter(Boolean),
    ),
  );
  const homeOfficial = resolveOfficialSide(homeRaw, officialNames);
  const awayOfficial = resolveOfficialSide(awayRaw, officialNames);

  // Stronger OCR fallback: tickets frequently print one club clearly while
  // splitting, distorting or omitting the normal "Home v Away" layout.
  // Scan plausible text lines against this season's OFFICIAL fixture names.
  // Only unambiguous provider-resolved identities survive; raw OCR fragments
  // still never become fixture lookup keys.
  const metadataLabelLine =
    /^(?:stand|block|row|seat|entrance|gate|turnstile|client(?:\s+ref(?:erence)?)?|price(?:\s+class)?|area(?:\s+desc(?:ription)?)?|full\s+name)$/i;

  const ocrLines = ocrText.split(/\r?\n/);

  const lineOfficialClues = Array.from(
    new Set(
      ocrLines
        .map((line, index) => ({
          line: cleanSide(line),
          previous: index > 0 ? cleanSide(ocrLines[index - 1]) : "",
        }))
        .filter(({ line, previous }) =>
          isTeamish(line) &&
          !metadataLabelLine.test(previous),
        )
        .map(({ line }) => resolveOfficialSide(line, officialNames))
        .filter((value): value is string => !!value),
    ),
  );

  if (homeRaw || awayRaw || lineOfficialClues.length)
    console.log(
      `[ticket-recognition-normalise]\n"${homeRaw ?? "-"}" → ${
        homeOfficial ?? "(unresolved)"
      }\n"${awayRaw ?? "-"}" → ${
        awayOfficial ?? "(unresolved)"
      }\nline clues: ${lineOfficialClues.join(", ") || "(none)"}`,
    );

  // From here on only normalised identities are used for lookups and display;
  // raw OCR text survives solely as a last-resort fallback.
  const homeIdentity = homeOfficial;
  const awayIdentity = awayOfficial;
  const identityIsClub = (identity: string | null) =>
    !!identity &&
    (identity === clubName || teamNameAffinity(identity, clubName) >= 11);
  const homeIsClub = identityIsClub(homeIdentity);
  const awayIsClub = identityIsClub(awayIdentity);
  // Only provider-resolved identities may drive fixture selection. Raw OCR
  // fragments remain available for the review UI, but a plausible-looking
  // fragment must never become a database lookup key.
  const candidateOpponents = Array.from(
    new Set(
      [homeOfficial, awayOfficial, ...lineOfficialClues].filter(
        (value): value is string => !!value && !identityIsClub(value),
      ),
    ),
  );
  const clubIsHome: boolean | null = homeIsClub
    ? true
    : awayIsClub
      ? false
      : null;

  if (hasAnyClue) {
    console.log(
      `[ticket-debug-fixture-input]\nselected club: ${clubName}\nseason: ${season}\nhome clue: ${
        homeIdentity ?? "-"
      }\naway clue: ${awayIdentity ?? "-"}\ndate clue: ${
        resolvedDate ?? "-"
      }\nkickoff clue: ${kickoff ?? "-"}`,
    );
    const search = await bestFixtureForSides(
      clubName,
      searchSeasons.join(" + "),
      seasonFixtures,
      candidateOpponents,
      clubIsHome,
      resolvedDate,
      kickoff,
      competition,
      roundClue,
      ocrText,
      ticketPrintsYear || !!ocrSeason,
    );
    matchedFixture = search.fixture;
    searchOutcome = search;
  }

  // Evidence actually read from the ticket, before fixture completion fills gaps.
  const ocrHomeEvidence = homeRaw;
  const ocrAwayEvidence = awayRaw;

  const fixtureBacked = !!matchedFixture;
  if (matchedFixture) {
    const fixtureHome =
      matchedFixture.homeAway === "home" ? clubName : matchedFixture.opponent;
    const fixtureAway =
      matchedFixture.homeAway === "home" ? matchedFixture.opponent : clubName;
    // Never reverse an order the OCR itself established — but a side that the
    // database proves plays the OTHER role is relocated, not mislabelled.
    if (!homeRaw && !awayRaw) {
      homeRaw = fixtureHome;
      awayRaw = fixtureAway;
    } else if (homeRaw && !awayRaw) {
      if (teamNameAffinity(homeRaw, fixtureHome) >= 11) {
        awayRaw = fixtureAway;
      } else {
        awayRaw = homeRaw;
        homeRaw = fixtureHome;
      }
    } else if (!homeRaw && awayRaw) {
      if (teamNameAffinity(awayRaw, fixtureAway) >= 11) {
        homeRaw = fixtureHome;
      } else {
        homeRaw = awayRaw;
        awayRaw = fixtureAway;
      }
    }
    // Competition authority sits with the fixture source: the provider label
    // wins over whatever phrasing the ticket used; the OCR fragment is only
    // kept when the fixture carries no label.
    if (matchedFixture.competition) competition = matchedFixture.competition;
    // The fixture database is authoritative: an OCR date that disagrees with
    // the confirmed fixture (e.g. a missing year) adopts the provider value.
    if (matchedFixture.date && matchedFixture.date !== resolvedDate)
      resolvedDate = matchedFixture.date;
    // A matched fixture is authoritative for kickoff. OCR is only a clue.
    if (matchedFixture.kickoff) kickoff = matchedFixture.kickoff;
  }

  // Final identities, best source first:
  //   1. provider-resolved official name (normalisation engine)
  //   2. canonical club name for the selected club's own side
  //   3. raw OCR text — last resort only; it never feeds database lookups
  //    when any better identity exists.
  const homeFinal =
    homeOfficial ?? canonicalClubName(homeRaw, [clubName]) ?? homeRaw;
  const awayFinal =
    awayOfficial ?? canonicalClubName(awayRaw, [clubName]) ?? awayRaw;
  // STEP 4 (venue resolution) — never assume the match is at the home team's
  // own stadium. Neutral-venue fixtures (FA Cup semi-finals/finals, playoffs,
  // moved games) carry an official venue in the fixture data:
  //   1. official fixture provider venue
  //   2. historical stadium database fallback via home team + matchDate
  // Once TFD has confirmed the fixture, use its authoritative home-team
  // identity for stadium lookup. Raw OCR abbreviations such as "CPFC" must
  // never prevent a known fixture from resolving its home ground.
  const fixtureHomeForGround = matchedFixture
    ? matchedFixture.homeAway === "home"
      ? clubName
      : matchedFixture.opponent
    : homeFinal;

  const ground =
    matchedFixture?.venue ||
    groundForHomeTeam(fixtureHomeForGround ?? null, resolvedDate);

  // Confidence answers: "how certain are we this is the correct match?" —
  // fixture confirmation dominates; raw OCR volume is irrelevant.
  const isClubSide = (side: string | null) => teamNameAffinity(side, clubName) >= 11;
  const clubAssociation =
    [homeFinal, awayFinal].some(isClubSide) || fixtureBacked;

  const seasonMatches =
    !!matchedFixture &&
    (!matchedFixture.season || searchSeasons.includes(matchedFixture.season));
  const ocrEvidenceSides = [ocrHomeEvidence, ocrAwayEvidence].filter(
    (value): value is string => !!value,
  );
  const teamsMatch =
    !!matchedFixture &&
    ocrEvidenceSides.length > 0 &&
    ocrEvidenceSides.every(
      (side) =>
        teamNameAffinity(side, matchedFixture!.opponent) >= 11 ||
        isClubSide(side),
    );

  const orderConfirmed =
    !!matchedFixture &&
    ((clubIsHome === true && matchedFixture.homeAway === "home") ||
      (clubIsHome === false && matchedFixture.homeAway === "away"));

  const exactDate =
    !!resolvedDate && /^\d{4}-\d{2}-\d{2}$/.test(resolvedDate);
  const dateConfirmed =
    !!matchedFixture &&
    exactDate &&
    !!matchedFixture.date &&
    matchedFixture.date === resolvedDate;
  const kickoffConfirmed =
    !!kickoff && /^\s*\d{1,2}\s*[:.]\s*\d{2}\s*$/.test(kickoff);
  const competitionFromFixture =
    !!matchedFixture?.competition && competition === matchedFixture.competition;

  let confidence = 0;
  if (matchedFixture) confidence += 50;
  if (clubAssociation) confidence += 15;
  if (orderConfirmed) confidence += 10;
  if (dateConfirmed) confidence += 10;
  if (kickoffConfirmed) confidence += 10;
  if (competitionFromFixture) confidence += 5;
  if (ground) confidence += 5;

  // Rule: the fixture database confirmed this exact match in this season for
  // these teams — never present it as low confidence.
  if (matchedFixture && seasonMatches && teamsMatch) {
    confidence = Math.max(confidence, 95);
  }
  confidence = Math.min(100, confidence);

  const candidateSummary =
    searchOutcome?.candidates
      .slice(0, 5)
      .map(
        (candidate) =>
          `  ${describeFixture(candidate.fixture, clubName)} — score ${candidate.score}`,
      )
      .join("\n") || "  (none)";
  console.log(
    `[ticket-fixture-engine]\nselected club: ${clubName}\nseason: ${
      searchSeason || "-"
    }\nOCR text: ${JSON.stringify(ocrText)}\ndetected teams: ${
      ocrHomeEvidence ?? "-"
    } / ${ocrAwayEvidence ?? "-"}\ndetected date: ${date ?? "-"}\ndetected kickoff: ${
      detectedKickoff ?? "-"
    }\ndetected competition: ${detectedCompetition ?? "-"}\nfixture search:\nnumber of fixtures: ${
      seasonFixtures.length
    }\ncompetitions searched: ${
      searchOutcome?.competitionsSearched.join(", ") || "(none)"
    }\ncandidate fixtures:\n${candidateSummary}\nsearch method: ${
      searchOutcome?.method ?? "none"
    }\nselected fixture:\nhome: ${homeFinal ?? "-"}\naway: ${
      awayFinal ?? "-"
    }\ndate: ${resolvedDate ?? "-"}\nkickoff: ${
      kickoff ?? "-"
    }\ncompetition: ${competition ?? "-"}\nvenue: ${
      matchedFixture?.venue ?? "-"
    } (ground: ${ground ?? "-"})\nfinal object:\nconfidence: ${confidence}%`,
  );

  return {
    homeTeam: homeFinal,
    awayTeam: awayFinal,
    date: resolvedDate,
    kickoff,
    competition,
    ground,
    seatDetails,
    confidence,
    fixtureBacked,
    ticketEvidence,
    seasonKey: matchedFixture?.season || ocrSeason || dateSeason || searchSeason || null,
    fixtureId: matchedFixture?.fixtureId,
    fixtureHomeScore: matchedFixture?.homeScore ?? null,
    fixtureAwayScore: matchedFixture?.awayScore ?? null,
  };
}
