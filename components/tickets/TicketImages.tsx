import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { currentTicketUri } from "@/lib/ticketFiles";
import type { SeasonTicket } from "@/lib/ticketTypes";

const styles = StyleSheet.create({
  gridImage: { width: "100%", height: "100%" },
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

export function HomeTicketImage({
  ticket,
}: {
  ticket: SeasonTicket;
  styleKey?: string;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const uri = currentTicketUri(ticket.uri) ?? ticket.uri;
  const failed = failedUri !== null && failedUri === uri;
  if (!uri || failed) {
    return (
      <View style={styles.fileTicket}>
        <Ionicons name="ticket" size={14} color="#174a91" />
        <Text numberOfLines={2} style={styles.fileTicketText}>
          {ticket.name}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[
        styles.gridImage,
        {
          transform: [
            { scale: Number(ticket.scale) || 1 },
            { translateX: Number(ticket.offsetX) || 0 },
            { translateY: Number(ticket.offsetY) || 0 },
          ],
        },
      ]}
      resizeMode="contain"
      alt={ticket.name}
      onError={(event) => {
        setFailedUri(uri);
        console.log(
          "[HOME-TICKET-IMAGE] load failed:",
          ticket.name,
          "| uri:",
          uri,
          "| reason:",
          event.nativeEvent?.error ?? "unknown",
        );
      }}
    />
  );
}

export function WalletTicketImage({ ticket }: { ticket: SeasonTicket }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const uri = currentTicketUri(ticket.uri) ?? ticket.uri;
  const failed = failedUri !== null && failedUri === uri;

  if (!uri || failed) {
    return (
      <View
        style={[
          styles.fileTicket,
          {
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Ionicons name="ticket" size={20} color="#174a91" />
        <Text numberOfLines={2} style={styles.fileTicketText}>
          {ticket.name}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: "100%", height: "100%" }}
      resizeMode="stretch"
      alt={ticket.name}
      onError={() => setFailedUri(uri)}
    />
  );
}
