import { FOOTBALL_GROUNDS } from "@/lib/grounds";
import { TFD_CURRENT_GROUNDS } from "@/lib/tfdCurrentGrounds.generated";
import { normaliseFixtureText } from "@/lib/ticketText";

const CLUB_GROUND_ALIASES: Record<string, string> = {
  afcbournemouth: "Bournemouth",
  bournemouth: "Bournemouth",
  brighton: "Brighton & Hove Albion",
  cardiff: "Cardiff City",
  charlton: "Charlton Athletic",
  coventry: "Coventry City",
  huddersfield: "Huddersfield Town",
  hull: "Hull City",
  leicester: "Leicester City",
  mancity: "Manchester City",
  manutd: "Manchester United",
  middlesbrough: "Middlesbrough",
  newcastle: "Newcastle United",
  norwich: "Norwich City",
  nottinghamforest: "Nottingham Forest",
  forest: "Nottingham Forest",
  sheffieldunited: "Sheffield United",
  sheffieldwednesday: "Sheffield Wednesday",
  spurs: "Tottenham Hotspur",
  sunderland: "Sunderland A.F.C.",
  stoke: "Stoke City",
  watford: "Watford F.C.",
  westham: "West Ham United",
  wigan: "Wigan Athletic",
  wolves: "Wolverhampton Wanderers",
};

function normaliseClubName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

export function findGroundForClub(
  clubName: string,
  matchDate?: string | null,
) {
  const target = normaliseClubName(clubName);
  if (!target) return null;

  const alias = CLUB_GROUND_ALIASES[target];
  const resolvedTarget = normaliseClubName(alias ?? clubName);
  const date = matchDate?.slice(0, 10) || null;

  const available = FOOTBALL_GROUNDS.filter((ground) => {
    // Calls without a fixture date retain the existing behaviour: use the
    // present-day ground only.
    if (!date) return ground.league !== "Historical";

    // Date-aware matching includes historical grounds, but only while that
    // stadium was in use.
    if (ground.fromDate && date < ground.fromDate) return false;
    if (ground.toDate && date > ground.toDate) return false;

    return true;
  });

  const directMatches = available.filter((ground) => {
    const groundClub = normaliseClubName(ground.club);
    const groundStadium = normaliseClubName(ground.stadium);

    return (
      groundClub === target ||
      groundClub === resolvedTarget ||
      groundStadium === target
    );
  });

  // When a fixture date is known, an explicitly dated historical/temporary
  // tenancy wins over the generic present-day ground. This handles clubs
  // such as Coventry that temporarily played home matches elsewhere.
  const direct =
    date
      ? directMatches.find((ground) => ground.league === "Historical") ??
        directMatches[0]
      : directMatches[0];

  if (direct) return direct;

  const historicalOrKnownMatch =
    available.find((ground) => {
      const groundClub = normaliseClubName(ground.club);

      return (
        target.includes(groundClub) ||
        groundClub.includes(target) ||
        resolvedTarget.includes(groundClub) ||
        groundClub.includes(resolvedTarget)
      );
    }) ?? null;

  if (historicalOrKnownMatch) return historicalOrKnownMatch;

  /*
   * Verified 2026/27 CURRENT_HOME fallback.
   *
   * IMPORTANT:
   * - Never use a present-day ground as evidence for an older dated fixture.
   * - Dated fixtures must resolve through FOOTBALL_GROUNDS, whose fromDate /
   *   toDate periods describe known historical/current use.
   * - Calls without a match date are asking for the club's present ground, so
   *   the verified TFD CURRENT_HOME layer is authoritative as the fallback.
   */
  if (date) return null;

  return (
    TFD_CURRENT_GROUNDS.find((ground) => {
      const groundClub = normaliseClubName(ground.club);

      return (
        groundClub === target ||
        groundClub === resolvedTarget ||
        target.includes(groundClub) ||
        groundClub.includes(target) ||
        resolvedTarget.includes(groundClub) ||
        groundClub.includes(resolvedTarget)
      );
    }) ?? null
  );
}

export function footballGroundForName(name: string) {
  const wanted = normaliseFixtureText(name);
  if (!wanted) return undefined;
  const aliases: Record<string, string> = {
    "everton stadium": "hill dickinson stadium",
    "bramley moore dock": "hill dickinson stadium",
    "bramley moore dock stadium": "hill dickinson stadium",
    "st andrews stadium": "st andrews",
    "st andrews knighthead park": "st andrews",
    "the american express community stadium": "american express stadium",
    "aesseal new york stadium": "new york stadium",
    "the coventry building society arena": "coventry building society arena",
    "the mkm stadium": "mkm stadium",
  };
  const resolvedWanted = aliases[wanted] ?? wanted;
  return FOOTBALL_GROUNDS.find((item) => {
    const known = normaliseFixtureText(item.stadium);
    return known === resolvedWanted || known.startsWith(resolvedWanted) || resolvedWanted.startsWith(known);
  });
}

type VenueFixture = {
  venue?: string | null;
  homeName: string;
  date?: string | null;
  round?: string | null;
  competition?: string | null;
  season?: string | null;
};

/**
 * Return the official fixture venue when supplied by a provider. For ordinary
 * home fixtures, derive the dated home ground from the local catalogue.
 *
 * Finals and semi-finals are deliberately excluded from that fallback: their
 * venue may be neutral, and assigning the nominal home club's stadium would
 * turn missing data into a false stadium visit.
 */
export function venueForFixture(fixture: VenueFixture): string | null {
  // A recorded venue remains authoritative, including relocated cup fixtures.
  if (fixture.venue?.trim()) return fixture.venue.trim();

  const round = normaliseFixtureText(fixture.round ?? "");
  const competition = normaliseFixtureText(fixture.competition ?? "");
  const season = fixture.season?.match(/^(\d{4})[-/](\d{2}|\d{4})$/);
  let seasonStart: number | null = null;
  if (season) {
    const start = Number(season[1]);
    const expectedEnd = String(start + 1);
    if (season[2] === expectedEnd || season[2] === expectedEnd.slice(-2)) {
      seasonStart = start;
    }
  } else if (!fixture.season && fixture.date) {
    // Cached fixtures may only carry the match date.
    const day = fixture.date.slice(0, 10);
    const parsed = new Date(`${day}T00:00:00Z`);
    if (Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day) {
      seasonStart = parsed.getUTCFullYear() - (parsed.getUTCMonth() < 6 ? 1 : 0);
    }
  }

  if (competition === "fa cup" && seasonStart !== null && (
    (round === "final" && seasonStart >= 2006) ||
    (["semi final", "semi finals", "semifinal", "semifinals"].includes(round) && seasonStart >= 2007)
  )) {
    return "Wembley Stadium";
  }

  // Never replace an unresolved knockout showpiece with a club home ground.
  if (/\b(?:semi[- ]?finals?|finals?)\b/i.test(fixture.round ?? "")) return null;
  return findGroundForClub(fixture.homeName, fixture.date)?.stadium ?? null;
}
