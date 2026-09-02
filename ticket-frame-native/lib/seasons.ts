export type SeasonFrame = {
  id: string;
  clubName: string;
  season: string;
  title: string;
};

export function seasonForDate(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getMonth();
  const year = date.getFullYear();
  const startsThisYear = month >= 7;
  const start = startsThisYear ? year : year - 1;
  return `${start}/${String((start + 1) % 100).padStart(2, "0")}`;
}

export function seasonBoundsLabel(season: string): string {
  const startYear = Number(season.split("/")[0]);
  const endYear = startYear + 1;
  return `1 August ${startYear} - 31 July ${endYear}`;
}

export function nextSeason(season: string): string {
  const startYear = Number(season.split("/")[0]);
  return `${startYear + 1}/${String((startYear + 2) % 100).padStart(2, "0")}`;
}

export function createSeasonFrame(clubName: string, season: string): SeasonFrame {
  return {
    id: `${clubName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${season.replace("/", "-")}`,
    clubName,
    season,
    title: `${clubName} ${season} Season`,
  };
}

export function normaliseSeasonEntry(value: string): string | null {
  const compact = value.trim().replace(/\s+/g, "");
  const match = compact.match(/^(20\d{2})[\/-](\d{2}|20\d{2})$/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2].length === 2 ? `20${match[2]}` : match[2]);
  if (end !== start + 1) return null;
  return `${start}/${String(end).slice(-2)}`;
}

export function lastFiveSeasonOptions(): string[] {
  const current = seasonForDate(new Date());
  if (!current) return [];
  const start = Number(current.slice(0, 4));
  return Array.from({ length: 5 }, (_, index) => {
    const year = start - index;
    return `${year}/${String(year + 1).slice(-2)}`;
  });
}

export function seasonTicketYearOptions(): string[] {
  const current = seasonForDate(new Date());
  const currentStart = Number(current?.slice(0, 4) ?? 2020);
  const options: string[] = [];
  for (let year = currentStart; year >= 2020; year -= 1)
    options.push(`${year}/${String(year + 1).slice(-2)}`);
  return options;
}
