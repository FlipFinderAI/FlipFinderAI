import { distanceMiles } from "../geoDistance";
export type VerifiedFixture = {
 id: string; clubIds: string[]; kickoff: string; stadium: string;
 latitude: number; longitude: number;
};
export function validCoordinates(lat: number, lon: number) {
 return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}
export function eligible(f: VerifiedFixture, clubId: string, now: number, location: {
 latitude: number; longitude: number; accuracy: number;
}) {
 // Ambiguous local kickoff times and unresolved stadiums must fail closed.
 if (!f || !Array.isArray(f.clubIds) || !f.clubIds.includes(clubId) || !f.stadium ||
   typeof f.kickoff !== "string" || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(f.kickoff) ||
   !validCoordinates(f.latitude, f.longitude) || !validCoordinates(location.latitude, location.longitude) ||
   !Number.isFinite(location.accuracy) || location.accuracy < 0 || location.accuracy > 500) return false;
 const kickoff = Date.parse(f.kickoff);
 return Number.isFinite(kickoff) && now >= kickoff - 2 * 3600000 && now < kickoff + 4 * 3600000 &&
   distanceMiles(location.latitude, location.longitude, f.latitude, f.longitude) + location.accuracy / 1609.344 <= 2;
}
