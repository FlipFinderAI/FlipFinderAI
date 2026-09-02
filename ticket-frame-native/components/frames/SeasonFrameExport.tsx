import type { RefObject } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ClubOption } from "@/lib/clubCatalog";
import {
  FRAME_EXPORT_HEIGHT,
  FRAME_EXPORT_SCALE,
  FRAME_EXPORT_WIDTH,
} from "@/lib/frameExportSizing";
import type { SeasonTicket, TicketStyle } from "@/lib/ticketTypes";
import ExportTicketGrid from "@/components/tickets/ExportTicketGrid";

export default function SeasonFrameExport({
  captureRef,
  tickets,
  loadedRef,
  ticketStyle,
  club,
  oldSchoolAssets,
  title,
  frameColour,
  frameAccent,
  frameHighlight,
}: {
  captureRef: RefObject<View | null>;
  tickets: SeasonTicket[];
  loadedRef: { current: Set<string> };
  ticketStyle: TicketStyle;
  club: ClubOption;
  oldSchoolAssets: Record<string, string>;
  title: string;
  frameColour: string;
  frameAccent: string;
  frameHighlight: string;
}) {
  return (
    <View
      ref={captureRef}
      collapsable={false}
      pointerEvents="none"
      style={styles.captureHost}
    >
      <View
        style={[
          styles.seasonFrame,
          {
            backgroundColor: frameColour,
            borderColor: frameHighlight,
          },
        ]}
      >
        <View
          style={[
            styles.seasonBevel,
            {
              backgroundColor: frameAccent,
              borderColor: frameHighlight,
            },
          ]}
        >
          <View style={[styles.seasonMount, { borderColor: frameColour }]}>
            <Text style={styles.seasonTitle}>{title}</Text>
            <Text style={styles.seasonCount}>{tickets.length} MATCHES</Text>
            <ExportTicketGrid
              tickets={tickets}
              loadedRef={loadedRef}
              ticketStyle={ticketStyle}
              club={club}
              oldSchoolAssets={oldSchoolAssets}
              renderScale={FRAME_EXPORT_SCALE}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  captureHost: {
    position: "absolute",
    top: 0,
    left: 0,
    width: FRAME_EXPORT_WIDTH,
    height: FRAME_EXPORT_HEIGHT,
    backgroundColor: "#ffffff",
  },
  seasonFrame: {
    width: FRAME_EXPORT_WIDTH,
    height: FRAME_EXPORT_HEIGHT,
    backgroundColor: "#111",
    padding: 4 * FRAME_EXPORT_SCALE,
    borderWidth: 2 * FRAME_EXPORT_SCALE,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 26,
    shadowOffset: { width: 10, height: 18 },
  },
  seasonBevel: {
    flex: 1,
    padding: 5 * FRAME_EXPORT_SCALE,
    borderWidth: 2 * FRAME_EXPORT_SCALE,
    borderTopWidth: 4 * FRAME_EXPORT_SCALE,
    borderLeftWidth: 4 * FRAME_EXPORT_SCALE,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  seasonMount: {
    flex: 1,
    backgroundColor: "#ece7db",
    padding: 6 * FRAME_EXPORT_SCALE,
    borderWidth: 3 * FRAME_EXPORT_SCALE,
    alignItems: "center",
  },
  seasonTitle: {
    fontFamily: "Georgia",
    fontWeight: "700",
    fontSize: 16 * FRAME_EXPORT_SCALE,
    color: "#17221c",
    marginTop: 2 * FRAME_EXPORT_SCALE,
  },
  seasonCount: {
    fontSize: 8 * FRAME_EXPORT_SCALE,
    letterSpacing: 2 * FRAME_EXPORT_SCALE,
    color: "#8b6b24",
    marginTop: 2 * FRAME_EXPORT_SCALE,
    marginBottom: 4 * FRAME_EXPORT_SCALE,
  },
});
