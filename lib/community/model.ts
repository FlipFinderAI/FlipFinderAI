/** Deliberately separate from tickets, media and authentication records. */
export const AVATARS = ["⚽", "🏟️", "🦁", "🦊", "🦉", "🐝", "⭐", "🏆"] as const;
export type Avatar = typeof AVATARS[number];
export type PublicProfile = {
  id: string; displayName: string; avatar: Avatar; clubId: string;
  gamesAttended: number; groundsVisited: string[];
};
export type Preferences = {
  enabled: boolean;
  locationVisible: boolean;
  shareGames: boolean;
  shareGrounds: boolean;
  photoSharing: boolean;
};
export type Relationship = { id: string; status: "pending" | "accepted"; incoming: boolean; profile: PublicProfile };
export type Message = { id: string; sender: string; body: string; createdAt: number };
export type Conversation = { friend: PublicProfile; unread: number };
export type Presence = {
  fixtureId: string; stadium: string; latitude: number; longitude: number;
  expiresAt: number; onMap: boolean;
};
export type CommunityState = {
  profile: PublicProfile | null;
  preferences: Preferences;
  safetyId: string | null;
  serverNow: number;
};
export const OFF: Preferences = {
  enabled: false,
  locationVisible: false,
  shareGames: false,
  shareGrounds: false,
  photoSharing: false,
};
/** Only explicitly public aggregates cross this boundary. No spreading source objects. */
export function attendanceSummary(rows: { confirmed: boolean; ground: string | null }[]) {
  const confirmed = rows.filter(row => row.confirmed);
  return { gamesAttended: confirmed.length,
    groundsVisited: [...new Set(confirmed.map(row => row.ground?.trim()).filter((s): s is string => Boolean(s)))].sort() };
}
