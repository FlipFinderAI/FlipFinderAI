import { FOOTBALL_GROUNDS } from "@/lib/grounds";
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

  return (
    available.find((ground) => {
      const groundClub = normaliseClubName(ground.club);

      return (
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
  };
  const resolvedWanted = aliases[wanted] ?? wanted;
  return FOOTBALL_GROUNDS.find((item) => {
    const known = normaliseFixtureText(item.stadium);
    return known === resolvedWanted || known.startsWith(resolvedWanted) || resolvedWanted.startsWith(known);
  });
}
