import { normaliseFixtureText } from "./ticketText";

const FIXTURE_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FIXTURE_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function splitFixtureName(
  raw: string,
  clubName: string,
): { home: string; away: string; hasSides: boolean } {
  const text = (raw ?? "").trim();
  if (!text) return { home: clubName, away: "", hasSides: false };
  const parts = text.split(/\s+(?:v\.?|vs\.?|versus)\s+/i);
  if (parts.length === 2 && parts[0] && parts[1]) {
    const clubNorm = normaliseFixtureText(clubName);
    const aNorm = normaliseFixtureText(parts[0]);
    const bNorm = normaliseFixtureText(parts[1]);
    const aIsClub =
      aNorm === clubNorm ||
      aNorm.includes(clubNorm) ||
      clubNorm.includes(aNorm);
    const bIsClub =
      bNorm === clubNorm ||
      bNorm.includes(clubNorm) ||
      clubNorm.includes(bNorm);
    if (bIsClub && !aIsClub) {
      return { home: parts[1], away: parts[0], hasSides: true };
    }
    return { home: parts[0], away: parts[1], hasSides: true };
  }
  const single = normaliseFixtureText(text);
  const clubNorm = normaliseFixtureText(clubName);
  if (single && clubNorm && single === clubNorm) {
    return { home: clubName, away: "", hasSides: false };
  }
  return { home: clubName, away: text, hasSides: true };
}

export function formatTicketDate(date: string | null | undefined): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

export function formatKickoff12(kickoff: string | null | undefined): string | null {
  if (!kickoff) return null;
  const match = kickoff.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return kickoff;
  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${meridiem}`;
}

export function formatTicketShortDate(date: string | null | undefined): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

export function formatHistoryDate(iso: string | null): string {
  if (!iso) return "Date unknown";
  const parsed = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatFixtureDay(date?: string | null) {
  if (!date) return "Date TBC";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${FIXTURE_DAYS[parsed.getDay()]} ${parsed.getDate()} ${
    FIXTURE_MONTHS[parsed.getMonth()]
  }`;
}

export function formatKickoffTime(kickoff?: string | null) {
  if (!kickoff) return null;
  const dayPart = kickoff.slice(0, 10);
  const timePart = kickoff.length > 10 ? kickoff.slice(11).trim() : "";
  const isoish = `${dayPart}T${timePart || "12:00:00"}`;
  const parsed = new Date(isoish.endsWith("Z") ? isoish : `${isoish}Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const hh = String(parsed.getHours()).padStart(2, "0");
  const mm = String(parsed.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatLastUpdated(at: number | null) {
  if (!at) return null;
  const d = new Date(at);
  const date = d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date}, ${hh}:${mm}`;
}
