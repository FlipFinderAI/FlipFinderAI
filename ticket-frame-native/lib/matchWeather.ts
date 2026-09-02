export type MatchWeather = {
  tempC: number | null;
  precipProb: number | null;
  icon: string;
  label: string;
};

function describeWeatherCode(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Clear sky" };
  if (code === 1 || code === 2) return { icon: "⛅", label: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", label: "Overcast" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "Fog" };
  if (code >= 51 && code <= 57) return { icon: "🌦️", label: "Drizzle" };
  if (code >= 61 && code <= 67) return { icon: "🌧️", label: "Rain" };
  if (code >= 71 && code <= 77) return { icon: "🌨️", label: "Snow" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", label: "Showers" };
  if (code === 85 || code === 86) return { icon: "🌨️", label: "Snow showers" };
  if (code >= 95) return { icon: "⛈️", label: "Thunderstorms" };
  return { icon: "🌡️", label: "Mixed" };
}

export async function fetchMatchWeather(
  latitude: number,
  longitude: number,
  kickoffIso: string | null,
  matchDate: string,
): Promise<MatchWeather | null> {
  try {
    const base = new Date(`${matchDate}T00:00:00Z`);
    if (Number.isNaN(base.getTime())) return null;
    const day = (offset: number) =>
      new Date(base.getTime() + offset * 86400000).toISOString().slice(0, 10);
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&hourly=temperature_2m,weather_code,precipitation_probability` +
      `&start_date=${day(-1)}&end_date=${day(1)}&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      hourly?: {
        time?: string[];
        temperature_2m?: (number | null)[];
        weather_code?: (number | null)[];
        precipitation_probability?: (number | null)[];
      };
    };
    const hourly = data.hourly;
    const times = hourly?.time;
    if (!hourly || !times?.length) return null;

    let idx = -1;
    if (kickoffIso) {
      const ko = new Date(kickoffIso.endsWith("Z") ? kickoffIso : `${kickoffIso}Z`);
      if (!Number.isNaN(ko.getTime())) {
        let bestDiff = Number.POSITIVE_INFINITY;
        times.forEach((stamp, i) => {
          const diff = Math.abs(
            new Date(`${stamp.replace(" ", "T")}Z`).getTime() - ko.getTime(),
          );
          if (diff < bestDiff) {
            bestDiff = diff;
            idx = i;
          }
        });
        if (bestDiff > 3 * 3600000) idx = -1;
      }
    }
    if (idx < 0)
      idx = times.findIndex(
        (stamp) => stamp.slice(0, 10) === matchDate && stamp.slice(11, 13) === "15",
      );
    if (idx < 0) return null;

    const desc = describeWeatherCode(hourly.weather_code?.[idx] ?? -1);
    return {
      tempC: hourly.temperature_2m?.[idx] ?? null,
      precipProb: hourly.precipitation_probability?.[idx] ?? null,
      icon: desc.icon,
      label: desc.label,
    };
  } catch {
    return null;
  }
}
