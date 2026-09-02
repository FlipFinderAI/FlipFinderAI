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

export function findGroundForClub(clubName: string) {
  const active = FOOTBALL_GROUNDS.filter((g) => g.league !== "Historical");
  const target = normaliseClubName(clubName);
  if (!target) return null;
  const direct = active.find(
    (g) =>
      normaliseClubName(g.club) === target ||
      normaliseClubName(g.stadium) === target,
  );
  if (direct) return direct;
  const alias = CLUB_GROUND_ALIASES[target];
  if (alias)
    return active.find((g) => normaliseClubName(g.club) === normaliseClubName(alias)) ?? null;
  return (
    active.find(
      (g) =>
        target.includes(normaliseClubName(g.club)) ||
        normaliseClubName(g.club).includes(target),
    ) ?? null
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
