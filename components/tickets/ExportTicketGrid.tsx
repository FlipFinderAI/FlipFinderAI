import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

import type { ClubOption } from "@/lib/clubCatalog";
import { effectiveTicketStyle } from "@/lib/ticketOrdering";
import type { SeasonTicket, TicketStyle } from "@/lib/ticketTypes";
import { ticketGridPercentSize } from "@/lib/ticketGridLayout";

import OldSchoolCard from "./OldSchoolCard";

export default function ExportTicketGrid({
  tickets,
  loadedRef,
  ticketStyle,
  club,
  oldSchoolAssets,
  renderScale = 1,
}: {
  tickets: SeasonTicket[];
  loadedRef: { current: Set<string> };
  ticketStyle: TicketStyle;
  club: ClubOption;
  oldSchoolAssets?: Record<string, string>;
  renderScale?: number;
}) {
  const { tileWidth, tileHeight } = ticketGridPercentSize(tickets.length);

  return (
    <View style={[styles.ticketGrid, { gap: 1 * renderScale }]}> 
      {tickets.map((ticket) => (
        <View
          key={ticket.id}
          style={[
            styles.gridTile,
            {
              width: tileWidth,
              height: tileHeight,
              transform: [{ scale: ticket.boxScale ?? 1 }],
            },
          ]}
        >
          {effectiveTicketStyle(ticket, ticketStyle) === "old-school" ? (
            oldSchoolAssets?.[ticket.fingerprint] ? (
              <Image
                source={{ uri: oldSchoolAssets[ticket.fingerprint] }}
                style={styles.gridImage}
                resizeMode="contain"
                alt={ticket.name}
                onLoad={() => loadedRef.current.add(ticket.id)}
                onError={() => loadedRef.current.add(ticket.id)}
              />
            ) : (
              <View
                onLayout={() => loadedRef.current.add(ticket.id)}
                style={styles.fullSize}
              >
                <OldSchoolCard ticket={ticket} club={club} />
              </View>
            )
          ) : ticket.uri ? (
            <Image
              source={{ uri: ticket.uri }}
              style={[
                styles.gridImage,
                {
                  transform: [
                    { scale: ticket.scale },
                    { translateX: ticket.offsetX },
                    { translateY: ticket.offsetY },
                  ],
                },
              ]}
              resizeMode="contain"
              alt={ticket.name}
              onLoad={() => loadedRef.current.add(ticket.id)}
              onError={() => loadedRef.current.add(ticket.id)}
            />
          ) : (
            <View style={styles.fileTicket}>
              <Ionicons name="ticket" size={20 * renderScale} color="#174a91" />
              <Text
                numberOfLines={2}
                style={[styles.fileTicketText, { fontSize: 6 * renderScale }]}
              >
                {ticket.name}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ticketGrid: {
    width: "100%",
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    alignContent: "space-evenly",
    gap: 2,
  },
  gridTile: { overflow: "hidden" },
  gridImage: { width: "100%", height: "100%" },
  fullSize: { width: "100%", height: "100%" },
  fileTicket: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fffaf0",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    borderTopWidth: 3,
    borderTopColor: "#174a91",
  },
  fileTicketText: { fontSize: 6, textAlign: "center", color: "#27362e" },
});
