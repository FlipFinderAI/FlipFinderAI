import { StyleSheet } from "react-native";

export const VIEWER_MIN_SCALE = 1;
export const VIEWER_MAX_SCALE = 8;
export const VIEWER_DOUBLE_TAP_SCALE = 2.5;
export const VIEWER_SPRING = { damping: 30, stiffness: 280, mass: 0.9 };

export const viewerStyles = StyleSheet.create({
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
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,13,11,0.98)",
    zIndex: 120,
  },
  canvas: { flex: 1, alignItems: "center", justifyContent: "center" },
  stage: { alignItems: "center", justifyContent: "center" },
  image: { backgroundColor: "transparent" },
  closeButton: {
    position: "absolute",
    top: 58,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 130,
  },
  resetButton: {
    position: "absolute",
    bottom: 96,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    zIndex: 130,
  },
  resetText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  caption: {
    position: "absolute",
    bottom: 44,
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 130,
  },
  captionName: {
    color: "#e8e2d2",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },
  hint: {
    color: "rgba(232,226,210,0.65)",
    fontSize: 9.5,
    letterSpacing: 1.4,
    marginTop: 6,
    textAlign: "center",
  },
});
