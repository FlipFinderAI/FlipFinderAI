import type { RefObject } from "react";
import { StyleSheet, View } from "react-native";

import type { ClubOption } from "@/lib/clubCatalog";
import type { SeasonTicket } from "@/lib/ticketTypes";

import OldSchoolCard from "./OldSchoolCard";

export default function OldSchoolCaptureHost({
  captureRef,
  ticket,
  club,
}: {
  captureRef: RefObject<View | null>;
  ticket: SeasonTicket | null;
  club: ClubOption | null;
}) {
  return (
    <View pointerEvents="none" collapsable={false} style={styles.host}>
      {ticket && club ? (
        <View ref={captureRef} collapsable={false} style={styles.capture}>
          <OldSchoolCard ticket={ticket} club={club} renderScale={3.53} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 0,
    left: -9999,
    width: 1200,
    height: 480,
  },
  capture: { width: 1200, height: 480 },
});
