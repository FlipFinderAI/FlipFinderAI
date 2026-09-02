export function normaliseIdentityText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalClub(value) {
  let name = normaliseIdentityText(value)
    .replace(/^(?:afc|fc)\s+/, "")
    .replace(/\s+(?:afc|fc|football club)$/, "")
    .trim();

  if (name === "milton keynes dons") {
    name = "mk dons";
  }

  return name;
}

const OPTIONAL_CLUB_SUFFIXES = new Set([
  "city",
  "united",
  "town",
  "rovers",
  "wanderers",
  "athletic",
  "county",
  "albion",
]);

function shortenedClub(value) {
  const name = canonicalClub(value);
  const parts = name.split(" ");

  if (
    parts.length > 1 &&
    OPTIONAL_CLUB_SUFFIXES.has(parts.at(-1))
  ) {
    return parts.slice(0, -1).join(" ");
  }

  return name;
}

export function clubsCompatible(left, right) {
  const a = canonicalClub(left);
  const b = canonicalClub(right);

  if (!a || !b) return false;
  if (a === b) return true;

  return shortenedClub(a) === shortenedClub(b);
}

export function canonicalCompetition(value) {
  const name = normaliseIdentityText(value);

  // Keep Scottish divisions distinct from their English namesakes.
  if (name.includes("scottish premiership"))
    return "scottish-premiership";

  if (name.includes("scottish championship"))
    return "scottish-championship";

  if (name.includes("scottish league one"))
    return "scottish-league-one";

  if (name.includes("scottish league two"))
    return "scottish-league-two";

  if (name.includes("scottish league cup"))
    return "scottish-league-cup";

  if (name.includes("scottish challenge cup"))
    return "scottish-challenge-cup";

  if (name.includes("champions league"))
    return "uefa-champions-league";

  if (name.includes("europa conference") ||
      name.includes("conference league"))
    return "uefa-conference-league";

  if (name.includes("europa league"))
    return "uefa-europa-league";

  if (
    name === "premier league" ||
    name.includes("english premier league")
  )
    return "premier-league";

  if (name.includes("championship"))
    return "championship";

  if (name.includes("league one"))
    return "league-one";

  if (name.includes("league two"))
    return "league-two";

  if (name === "fa cup" || name.includes("fa cup"))
    return "fa-cup";

  if (
    name.includes("league cup") ||
    name.includes("efl cup") ||
    name.includes("carabao cup")
  )
    return "league-cup";

  if (
    name.includes("efl trophy") ||
    name.includes("football league trophy")
  )
    return "efl-trophy";

  if (name.includes("community shield"))
    return "community-shield";

  if (name.includes("scottish cup"))
    return "scottish-cup";

  return name.replace(/\s+/g, "-");
}

function dateOnly(value) {
  return String(value ?? "").slice(0, 10);
}

export function fixtureIdentityCompatible(left, right) {
  if (
    left.season &&
    right.season &&
    String(left.season) !== String(right.season)
  ) {
    return false;
  }

  if (
    left.competition &&
    right.competition &&
    canonicalCompetition(left.competition) !==
      canonicalCompetition(right.competition)
  ) {
    return false;
  }

  if (
    dateOnly(left.date ?? left.kickoff) !==
    dateOnly(right.date ?? right.kickoff)
  ) {
    return false;
  }

  return (
    clubsCompatible(left.homeName, right.homeName) &&
    clubsCompatible(left.awayName, right.awayName)
  );
}

export function findUniqueFixtureMatch(matches, candidate) {
  const scoped = matches.filter((match) => {
    if (
      dateOnly(match.date ?? match.kickoff) !==
      dateOnly(candidate.date ?? candidate.kickoff)
    ) {
      return false;
    }

    if (
      match.competition &&
      candidate.competition &&
      canonicalCompetition(match.competition) !==
        canonicalCompetition(candidate.competition)
    ) {
      return false;
    }

    return true;
  });

  const exact = scoped.filter(
    (match) =>
      canonicalClub(match.homeName) ===
        canonicalClub(candidate.homeName) &&
      canonicalClub(match.awayName) ===
        canonicalClub(candidate.awayName),
  );

  if (exact.length === 1) return exact[0];

  const compatible = scoped.filter(
    (match) =>
      clubsCompatible(match.homeName, candidate.homeName) &&
      clubsCompatible(match.awayName, candidate.awayName),
  );

  return compatible.length === 1
    ? compatible[0]
    : null;
}
