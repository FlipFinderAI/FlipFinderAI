import type { NearbyVenueKind } from "@/lib/nativeIntegrations";

export type MatchdayFinderKind = NearbyVenueKind | "carPark";
export type PubSupporterAudience = "home" | "away" | "mixed" | "unsure";

export type PubVisitReport = {
  id: string;
  venueId: string;
  venueName: string;
  groundId: string;
  groundName: string;
  audience: PubSupporterAudience;
  matchId: string;
  matchDate: string | null;
  submittedAt: string;
  locationConfirmed: boolean;
  confirmationDistanceMiles?: number;
  syncStatus: "local";
};

export type MatchdaySupporterType = "home" | "away";

export type MatchdayVenueVisit = {
  id: string;
  venueId: string;
  venueName: string;
  kind: MatchdayFinderKind;
  latitude?: number;
  longitude?: number;
  // GPS of the user's media when this venue was confirmed. This lets
  // Ticket Frame recognise the same real-world location again without
  // depending on a fresh Apple Maps search.
  confirmedFromLatitude?: number;
  confirmedFromLongitude?: number;
  rating?: 1 | 2 | 3 | 4 | 5;
  supporterAudience?: PubSupporterAudience;
  visitedAt: string;
};

export type MatchdayExperienceRecord = {
  id: string;
  matchId: string;
  matchDate: string | null;
  clubName: string;
  opponentName: string;
  kickoff?: string | null;
  groundId: string;
  groundName: string;
  supporter: MatchdaySupporterType;
  captureEnabled: boolean;
  collapsed: boolean;
  closePromptAt?: string;
  closePromptCount?: number;
  autoOffAt?: string;
  venues: MatchdayVenueVisit[];
  createdAt: string;
  updatedAt: string;
};

export type MatchdayMediaAssignment = {
  placeName: string;
  placeKind: "stadium" | MatchdayFinderKind | "station" | "metro" | "location";
  venueVisitId?: string;
  latitude?: number;
  longitude?: number;
  source: "automatic" | "manual";
};

export type MatchdayCustomLocation = {
  id: string;
  name: string;
  kind: "stadium" | "pub" | "restaurant" | "station" | "metro" | "location";
  createdAt: string;
};
