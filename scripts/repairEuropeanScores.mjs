import { readFileSync, writeFileSync, existsSync } from "node:fs";

const europaResults = {
  "1392421451": [1, 4],
  "1392502296": [1, 0],
  "1392526975": [0, 0],
  "1392529528": [1, 0],
  "1392428259": [2, 0],
  "1392462299": [0, 0],
  "1392499743": [2, 1],
  "1392412941": [0, 2],
  "1392417196": [1, 2],
  "1392479319": [0, 1],
  "1392495488": [2, 0],
  "1392434216": [4, 1],
  "1392481021": [1, 2],
  "1392450385": [4, 0],
  "1392473362": [5, 0],
  "1392509955": [1, 2],
  "1392446981": [1, 3],
  "1392505700": [0, 3],
};

const norm = value =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "");

const aliases = new Map();

const alias = (key, ...names) => {
  for (const name of names) aliases.set(norm(name), key);
};

alias("lens", "Lens", "Racing Club de Lens");
alias("sporting", "Sporting CP", "Sporting Clube de Portugal");
alias("sabah", "Sabah FA", "Sabah FK");
alias("slavia", "Slavia Praha", "SK Slavia Praha");
alias("villarreal", "Villarreal", "Villarreal CF");
alias("napoli", "Napoli", "SSC Napoli");
alias("viking", "Viking", "Viking FK");
alias("bayern", "Bayern Munich", "FC Bayern München");
alias("leipzig", "RB Leipzig");
alias("psv", "PSV Eindhoven", "PSV");
alias("inter", "Inter", "FC Internazionale Milano");
alias("brugge", "Club Brugge KV");
alias("galatasaray", "Galatasaray", "Galatasaray SK");
alias("barcelona", "Barcelona", "FC Barcelona");
alias("atletico", "Atlético Madrid", "Club Atlético de Madrid");
alias("manutd", "Manchester United", "Manchester United FC");
alias("arsenal", "Arsenal", "Arsenal FC");
alias("lille", "Lille", "Lille OSC");

const clubKey = name => aliases.get(norm(name)) ?? norm(name);

const hasScore = row =>
  row?.homeScore !== null &&
  row?.homeScore !== undefined &&
  row?.awayScore !== null &&
  row?.awayScore !== undefined;

const sourceHighlightlyId = row => {
  const direct = String(row?.providerId ?? "");
  if (europaResults[direct]) return direct;

  const ownId = String(row?.id ?? "").replace(/^highlightly:/, "");
  if (europaResults[ownId]) return ownId;

  for (const source of row?.sources ?? []) {
    if (
      String(source?.provider ?? "").toLowerCase() === "highlightly" &&
      europaResults[String(source?.providerId ?? "")]
    ) {
      return String(source.providerId);
    }
  }

  return null;
};

const patchEuropa = db => {
  let patched = 0;

  const seasons =
    db?.competitions?.["UEFA Europa League"] ?? {};

  for (const bundle of Object.values(seasons)) {
    for (const row of bundle?.fixtures ?? []) {
      const id = sourceHighlightlyId(row);
      if (!id) continue;

      const [home, away] = europaResults[id];

      row.homeScore = home;
      row.awayScore = away;
      row.fullTimeHomeScore = home;
      row.fullTimeAwayScore = away;
      row.status = "FINISHED";
      patched++;
    }
  }

  return patched;
};

const scoredChampionsRows = db => {
  const out = [];

  const seasons =
    db?.competitions?.["UEFA Champions League"] ?? {};

  for (const bundle of Object.values(seasons)) {
    for (const row of bundle?.fixtures ?? []) {
      if (hasScore(row)) out.push(row);
    }
  }

  return out;
};

const patchChampionsDuplicates = (db, referenceRows) => {
  let patched = 0;

  const seasons =
    db?.competitions?.["UEFA Champions League"] ?? {};

  for (const bundle of Object.values(seasons)) {
    for (const row of bundle?.fixtures ?? []) {
      if (hasScore(row)) continue;

      const date = String(row.date ?? "").slice(0, 10);

      const match = referenceRows.find(source =>
        String(source.date ?? "").slice(0, 10) === date &&
        clubKey(source.homeName) === clubKey(row.homeName) &&
        clubKey(source.awayName) === clubKey(row.awayName) &&
        hasScore(source)
      );

      if (!match) continue;

      row.homeScore = match.homeScore;
      row.awayScore = match.awayScore;
      row.fullTimeHomeScore =
        match.fullTimeHomeScore ?? match.homeScore;
      row.fullTimeAwayScore =
        match.fullTimeAwayScore ?? match.awayScore;
      row.status = match.status ?? "FINISHED";
      patched++;
    }
  }

  return patched;
};

const files = [
  "data/highlightlyProviderCache.json",
  "data/matchDatabase.json",
  "data/runtimeMatchDatabase.json",
];

const databases = new Map();

for (const file of files) {
  if (!existsSync(file)) continue;
  databases.set(file, JSON.parse(readFileSync(file, "utf8")));
}

const built = databases.get("data/matchDatabase.json");

if (!built) {
  throw new Error("data/matchDatabase.json missing");
}

const referenceChampions = scoredChampionsRows(built);

let europaPatched = 0;
let championsPatched = 0;

for (const [file, db] of databases) {
  europaPatched += patchEuropa(db);

  championsPatched +=
    patchChampionsDuplicates(db, referenceChampions);

  writeFileSync(
    file,
    `${JSON.stringify(db, null, 2)}\n`,
    "utf8",
  );
}

console.log(
  `European score repair: Europa ${europaPatched}; Champions duplicates ${championsPatched}`
);
