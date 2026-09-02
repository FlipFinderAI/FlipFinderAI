export function normaliseFixtureText(value: unknown) {
  // Attendance/fixture records can outlive the build that created them and
  // external feeds are not guaranteed to keep every text field well-typed.
  // A malformed legacy field must never take down Home/History during a state
  // update. Ignore objects/null and safely accept primitive display values.
  const text =
    typeof value === "string"
      ? value
      : typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : "";
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const CLUB_NAME_ALIASES: Record<string, string> = {
  "milton keynes dons": "mk dons",
  "leeds united": "leeds",
  "derby county": "derby",
  "birmingham city": "birmingham",
  "west ham united": "west ham",
  "ipswich town": "ipswich",
  "leicester city": "leicester",
  "tottenham hotspur": "tottenham",
  "wolverhampton wanderers": "wolves",
  "west bromwich albion": "west brom",
  "brighton and hove albion": "brighton",
  "queens park rangers": "qpr",
};

/**
 * Provider-safe club comparison used throughout fixtures, history and tickets.
 * Removes identification-only FC/AFC affixes and handles established aliases,
 * while retaining the meaningful part of every club name.
 */
export function canonicalClubName(value: string): string {
  let name = normaliseFixtureText(value)
    .replace(/^(?:afc|fc)\s+/, "")
    .replace(/\s+(?:afc|fc|football club)$/, "")
    .trim();
  name = CLUB_NAME_ALIASES[name] ?? name;
  return name;
}

export function clubNamesMatch(a: string, b: string): boolean {
  const left = canonicalClubName(a);
  const right = canonicalClubName(b);
  if (!left || !right) return false;
  if (left === right) return true;

  // Some approved feeds shorten a club to its distinctive base name
  // (Leeds United -> Leeds, Birmingham City -> Birmingham). Only remove a
  // generic suffix when the other source already supplies that exact base;
  // never compare two stripped names, which would conflate Manchester City
  // and Manchester United.
  const withoutGenericSuffix = (value: string) =>
    value.replace(
      /\s+(?:united|city|town|county|rovers|wanderers|hotspur|albion)$/,
      "",
    );
  return (
    left === withoutGenericSuffix(right) ||
    right === withoutGenericSuffix(left)
  );
}

export function matchFromTicketText(text: string) {
  for (const line of text.split("\n")) {
    const match = line.trim().match(/^(.{2,45}?)\s+(?:v|vs)\.?\s+(.{2,45})$/i);
    if (match) return `${match[1].trim()} vs ${match[2].trim()}`;
  }
  return "";
}

export function dateFromTicketText(text: string, season: string) {
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  // Whitespace inside these patterns deliberately never crosses lines:
  // otherwise "11 May\n20:00" swallows the kickoff's digits as a year.
  const numeric = text.match(
    /\b(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2,4}))?\b/,
  );
  const named = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?[ \t]*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:[ \t]+(\d{2,4}))?\b/i,
  );
  const monthFirst = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[ \t]*(\d{1,2})(?:st|nd|rd|th)?(?:[ \t]+(\d{2,4}))?\b/i,
  );
  if (!numeric && !named && !monthFirst) return null;
  const start = Number(season.split("/")[0]);

  // Candidates compete by position in the text; the first one that forms a
  // real calendar date wins. Raw pattern priority must not decide — e.g.
  // turnstile ranges like "54-56" would otherwise beat "22 August 2026".
  const candidates = [numeric, named, monthFirst]
    .filter((m): m is RegExpMatchArray => !!m)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const build = (
    day: number,
    monthIndex: number,
    yearText: string | undefined,
  ): string | null => {
    let year = yearText ? Number(yearText) : monthIndex >= 6 ? start : start + 1;
    if (year < 100) year += 2000;
    const date = new Date(year, monthIndex, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== monthIndex ||
      date.getDate() !== day
    )
      return null;
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  for (const match of candidates) {
    if (match === numeric) {
      const day = Number(numeric![1]);
      const month = Number(numeric![2]) - 1;
      const built = build(day, month, numeric![3]);
      if (built) return built;
    } else {
      const isNamed = match === named;
      const day = Number(isNamed ? named![1] : monthFirst![2]);
      const monthToken = isNamed ? named![2] : monthFirst![1];
      const month = months.indexOf(monthToken.slice(0, 3).toLowerCase());
      const yearText = isNamed ? named![3] : monthFirst![3];
      const built = build(day, month, yearText);
      if (built) return built;
    }
  }
  return null;
}

export function kickoffFromTicketText(text: string) {
  const near = text.match(
    /(?:kick[\s-]?off|k\s*o)\D{0,24}?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i,
  );
  const generic = text.match(
    /\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/i,
  );
  const clock = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  const source = near?.[1] ? near : generic?.[1] ? generic : clock;
  if (!source) return null;
  let hours = Number(source[1]);
  const minutes = Number(source[2] ?? 0);
  const meridiem = source[3]?.toLowerCase();
  if (Number.isNaN(hours) || hours > 23 || minutes > 59) return null;
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (!meridiem && !source[2] && hours <= 12) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// Generic competition-line detection: purely linguistic keywords, no
// hard-coded competition names. The captured fragment is only a CLUE — the
// confirmed fixture's own competition label always wins for storage.
const COMPETITION_LINE =
  /\b(cup|league|liga|serie|premiership|championship|trophy|shield|division|pokal|coppa|europa|champions)\b/i;

export function competitionFromTicketText(text: string) {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.length > 60) continue;
    if (COMPETITION_LINE.test(line)) return line;
  }
  return null;
}

export type TicketSeatDetails = {
  stand?: string;
  entrance?: string;
  block?: string;
  row?: string;
  seat?: string;
  fanId?: string;
  ticketType?: string;
};

export function parseSeatDetails(text: string): TicketSeatDetails | null {
  const details: TicketSeatDetails = {};
  const clean = (value: string) => value.replace(/\s+/g, " ").trim();

  const block = text.match(/\bblock\s*[:\-]?\s*([A-Z]{0,2}\s?\d{1,3}[A-Z]?)(?![a-z])/i);
  if (block) details.block = clean(block[1]).toUpperCase();

  const row = text.match(/\brow\s*[:\-]?\s*([A-Z]{1,2}\s?\d{0,3}|\d{1,3})(?![a-z])/i);
  if (row) details.row = clean(row[1]).toUpperCase();

  const seat = text.match(
    /\bseats?(?:\s*(?:no\.?|number|num))?\s*[:\-]?\s*(\d{1,5}[A-Z]?)(?![a-z])/i,
  );
  if (seat) details.seat = clean(seat[1]).toUpperCase();

  const entrance = text.match(
    /\bentrance[s]?\s*[:\-]?\s*((?:[A-Z]|[0-9])(?:[A-Z0-9]*\s?\/?\s?[A-Z0-9])*)(?![a-z])/i,
  );
  if (entrance) details.entrance = clean(entrance[1]).toUpperCase();

  const stand = text.match(
    /((?:[A-Z][a-zA-Z''&.\-]+\s){0,3}[A-Z][a-zA-Z''&.\-]+)\s+(?:stand|tier)\b/i,
  );
  if (stand) {
    let standName = clean(stand[1]);
    standName = standName.replace(/^(the)\s+/i, "");
    details.stand =
      standName.charAt(0).toUpperCase() + standName.slice(1);
  }

  const fanId = text.match(
    /\b(?:fan|supporter|client|member)\s*id\s*[:\-]?\s*([A-Z0-9]{4,20})/i,
  );
  if (fanId) details.fanId = clean(fanId[1]).toUpperCase();

  const labelledType = text.match(
    /\bticket\s*type\s*[:\-]?\s*([A-Z][A-Z0-9\s\/&-]{2,30})(?=\n|[.,;]|$)/im,
  );
  if (labelledType) {
    details.ticketType = clean(labelledType[1]);
  } else if (/digital\s*nfc|\bnfc\b/i.test(text)) {
    details.ticketType = "Digital NFC";
  }

  return Object.keys(details).length ? details : null;
}
