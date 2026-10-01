import { NativeModules } from "react-native";

export type NearbyParkingResult = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  previewUri?: string | null;
};

export type NearbyVenueKind =
  | "pub"
  | "restaurant"
  | "stadium"
  | "station"
  | "metro";

export type NearbyVenueResult = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  address?: string | null;
  cuisine?: string | null;
};

export const ParkingSearchModule = NativeModules.ParkingSearchModule as
  | {
      search(latitude: number, longitude: number): Promise<NearbyParkingResult[]>;
      searchPlaces(
        latitude: number,
        longitude: number,
        kind: NearbyVenueKind,
      ): Promise<NearbyVenueResult[]>;
      searchPlacesQuery(
        latitude: number,
        longitude: number,
        kind: NearbyVenueKind,
        query: string,
      ): Promise<NearbyVenueResult[]>;
    }
  | undefined;

export type SiriPendingAction =
  | { type: "open"; tab: "history" | "club" | "grounds" | "fixtures" }
  | { type: "ticket"; id: string }
  | { type: "memory"; id: string }
  | { type: "navigate"; name: string; latitude: number; longitude: number };

export const SiriShortcutsModule = NativeModules.SiriShortcutsModule as
  | {
      setEnabled(enabled: boolean): void;
      updateSnapshot(snapshot: Record<string, unknown>): void;
      consumePendingAction(): Promise<SiriPendingAction | null>;
    }
  | undefined;
