import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import { readableTextColour } from "@/lib/colorUtils";
import { formatKickoff12, formatTicketDate } from "@/lib/matchDisplayFormatting";
import { currentTicketUri } from "@/lib/ticketFiles";
import { FOOTBALL_GROUNDS } from "@/lib/grounds";
import { lastFiveSeasonOptions, seasonForDate, normaliseSeasonEntry, seasonTicketYearOptions } from "@/lib/seasons";
import { normaliseFixtureText } from "@/lib/ticketText";
import type { SeasonTicket } from "@/lib/ticketTypes";
import type { CachedFixture } from "@/lib/fixtureCache";
import type { RecognizedTicket } from "@/lib/ticketRecognition";
import {
  buildEditsFromRecognition,
  guessItemType,
  isConfidentCarParkText,
  ITEM_TYPE_LABELS,
  suggestCarParkFields,
  type ItemEditDraft,
  type ItemType,
} from "@/lib/ticketEdits";

const matchConfirmStyles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,13,11,0.9)",
    zIndex: 140,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  ticketPreview: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    marginBottom: 8,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    backgroundColor: "#fdfcf8",
    borderWidth: 1,
    borderColor: "#d8d1c2",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    maxHeight: "78%",
  },
  // V3.9.5 — type selection, edit details, profile and pass forms
  helpNote: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#657069",
    fontWeight: "600",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#c9c2b1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    marginTop: 6,
    marginBottom: 10,
    overflow: "hidden",
    minHeight: 228,
    padding: 8,
  },
  pickerWrapSmall: {
    borderWidth: 1,
    borderColor: "#c9c2b1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    marginBottom: 6,
    height: 58,
  },
  typeOption: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#c9c2b1",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginBottom: 7,
  },
  typeOptionSelected: {
    borderColor: "#174532",
    backgroundColor: "#e2ebe5",
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.7,
    textAlign: "center",
  },
  editScroll: { maxHeight: 500, marginTop: 4 },
  editScrollContent: { paddingBottom: 18 },
  editDragArea: {
    height: 34,
    marginBottom: 8,
    borderRadius: 9,
    backgroundColor: "#f1eee7",
    alignItems: "center",
    justifyContent: "center",
  },
  editDragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#aaa396",
    marginBottom: 4,
  },
  editDragText: { fontSize: 9, color: "#797267", fontWeight: "700" },
  fieldWrap: { marginBottom: 6 },
  fieldLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#8a8375",
    marginBottom: 3,
  },
  typeInput: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 7,
    minHeight: 46,
    fontSize: 14,
    color: "#17221c",
  },
  errorText: {
    color: "#a03030",
    fontSize: 12,
    fontWeight: "700",
    marginVertical: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#17221c",
    textAlign: "center",
  },
  confidenceBadge: {
    alignSelf: "center",
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  confidenceText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  rows: { marginTop: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eae4d7",
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#8b6b24",
    marginTop: 2,
  },
  rowValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#17221c",
    textAlign: "right",
  },
  rowValueMissing: { color: "#a09a8c", fontWeight: "600" },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    paddingVertical: 13,
  },
  fullWidthButton: {
    width: "100%",
    minHeight: 52,
  },
  typeContinueButton: {
    flex: 0,
    alignSelf: "center",
    width: "68%",
    minHeight: 46,
    marginTop: 14,
    backgroundColor: "#ffffff",
    borderWidth: 2,
  },
  confirmText: { fontSize: 13, fontWeight: "900", letterSpacing: 0.8 },
  altButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 13,
  },
  altText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.6 },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeader: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#8b6b24",
    marginTop: 4,
    marginBottom: 6,
    textAlign: "center",
  },
  listScroll: { maxHeight: 260 },
  fixtureRow: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eae4d7",
  },
  fixtureMain: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#17221c",
  },
  fixtureMeta: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#6d685c",
    marginTop: 2,
  },
  fixtureSub: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#6d685c",
    marginTop: 3,
  },
  listEmpty: {
    paddingVertical: 18,
    textAlign: "center",
    fontSize: 13,
    color: "#6d685c",
    fontWeight: "600",
  },
});

type SeasonProfileFields = {
  club: string;
  seasonKey: string;
  stand: string;
  block: string;
  row: string;
  seat: string;
  fanId: string;
  ticketNumber: string;
  holderName: string;
};

type CarParkFields = {
  title: string;
  seasonKey: string;
  matchDate: string;
  ground: string;
  linkedOpponent: string;
  linkedDate: string;
};

export default function MatchConfirmationOverlay({
  ticket,
  recognition,
  clubName,
  clubStadium,
  accent,
  secondaryAccent,
  alternatives,
  pickerNotice,
  onConfirm,
  onPickFixture,
  onSkip,
  onRequestAlternatives,
  onSaveEdits,
  onSaveSeasonProfile,
  onSaveCarParkPass,
}: {
  ticket: SeasonTicket;
  recognition: RecognizedTicket;
  clubName: string;
  clubStadium: string;
  accent: string;
  secondaryAccent: string;
  alternatives: CachedFixture[] | null;
  pickerNotice: string | null;
  onConfirm: () => void;
  onPickFixture: (fixture: CachedFixture) => string | null;
  onSkip: () => void;
  onRequestAlternatives: (seasonKey?: string) => void;
  onSaveEdits: (draft: ItemEditDraft) => string | null;
  onSaveSeasonProfile: (fields: SeasonProfileFields) => void;
  onSaveCarParkPass: (fields: CarParkFields, recognition: RecognizedTicket) => void;
}) {
  // V3.9.5 — stepped flow: TYPE OF ITEM first (AI preselects, user is the
  // source of truth), then the per-type path. The close button always
  // returns here or dismisses; nobody is ever trapped.
  const [choosing, setChoosing] = useState(false);
  // Strong match-ticket scans open on the useful confirmation summary. Less
  // certain scans and non-match items still begin at Type of Item so the user
  // remains the source of truth.
  const hasCompleteRecognisedMatch = Boolean(
    recognition.homeTeam &&
      recognition.awayTeam &&
      recognition.date &&
      recognition.competition,
  );
  const [step, setStep] = useState<"type" | ItemType | "edit">(() =>
    isConfidentCarParkText(recognition)
      ? "carpark"
      : guessItemType(recognition) === "match" && hasCompleteRecognisedMatch
        ? "match"
        : "type",
  );
  const [itemType, setItemType] = useState<ItemType>(() =>
    guessItemType(recognition),
  );
  const [editDraft, setEditDraft] = useState<ItemEditDraft>(() =>
    buildEditsFromRecognition(
      recognition,
      ticket.seasonKey || seasonForDate(new Date()) || "",
    ),
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [ticketPan] = useState(() => new Animated.ValueXY());
  const [ticketPanResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => ticketPan.extractOffset(),
      onPanResponderMove: Animated.event(
        [null, { dx: ticketPan.x, dy: ticketPan.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: () => ticketPan.flattenOffset(),
      onPanResponderTerminate: () => ticketPan.flattenOffset(),
    }),
  );
  const [editPhase, setEditPhase] = useState<"details" | "game">("details");
  const [seatDraft, setSeatDraft] = useState(() => ({
    stand: recognition.seatDetails?.stand ?? "",
    block: recognition.seatDetails?.block ?? "",
    row: recognition.seatDetails?.row ?? "",
    seat: recognition.seatDetails?.seat ?? "",
  }));
  useEffect(() => {
    // A fixture chosen from either picker updates the queued recognition.
    // Refresh Edit so the final confirmation's Edit button always opens the
    // exact match currently being reviewed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditDraft(
      buildEditsFromRecognition(
        recognition,
        ticket.seasonKey || seasonForDate(new Date()) || "",
      ),
    );
    setSeatDraft({
      stand: recognition.seatDetails?.stand ?? "",
      block: recognition.seatDetails?.block ?? "",
      row: recognition.seatDetails?.row ?? "",
      seat: recognition.seatDetails?.seat ?? "",
    });
  }, [recognition, ticket.seasonKey]);
  const [expandedPicker, setExpandedPicker] = useState<string | null>(null);
  const [selectedEditFixture, setSelectedEditFixture] = useState("");
  const [selectedCarparkFixture, setSelectedCarparkFixture] =
    useState("__season_pass__");
  const editFixturesRequestedRef = useRef(false);
  useEffect(() => {
    if (
      step === "edit" &&
      alternatives === null &&
      !editFixturesRequestedRef.current
    ) {
      editFixturesRequestedRef.current = true;
      onRequestAlternatives(editDraft.seasonKey);
    }
  }, [step, alternatives, editDraft.seasonKey, onRequestAlternatives]);
  useEffect(() => {
    if (
      step === "carpark" &&
      alternatives === null &&
      !editFixturesRequestedRef.current
    ) {
      editFixturesRequestedRef.current = true;
      onRequestAlternatives(
        ticket.seasonKey ||
          (recognition.date ? seasonForDate(recognition.date) : "") ||
          seasonForDate(new Date()) ||
          undefined,
      );
    }
  }, [step, alternatives, ticket.seasonKey, recognition.date, onRequestAlternatives]);
  const [seasonDraft, setSeasonDraft] = useState<SeasonProfileFields>(() => ({
    // Never assign a season card to Favourite Club implicitly. Use only club
    // evidence from this ticket; otherwise the user must choose the club.
    club:
      ticket.clubName?.trim() ||
      recognition.homeTeam?.trim() ||
      recognition.awayTeam?.trim() ||
      "",
    seasonKey:
      normaliseSeasonEntry(recognition.seasonKey ?? "") ??
      normaliseSeasonEntry(ticket.seasonKey || "") ??
      seasonTicketYearOptions()[0] ?? "2020/21",
    stand: recognition.seatDetails?.stand ?? "",
    block: recognition.seatDetails?.block ?? "",
    row: recognition.seatDetails?.row ?? "",
    seat: recognition.seatDetails?.seat ?? "",
    fanId: "",
    ticketNumber: "",
    holderName: "",
  }));
  const [carparkDraft, setCarparkDraft] = useState<CarParkFields>(() => ({
    ...suggestCarParkFields(recognition),
    seasonKey:
      ticket.seasonKey ||
      (recognition.date ? seasonForDate(recognition.date) : "") ||
      seasonForDate(new Date()) ||
      "",
  }));
  useEffect(() => {
    if (
      step !== "carpark" ||
      selectedCarparkFixture !== "__season_pass__" ||
      !clubStadium
    )
      return;
    // Season passes always begin at the favourite club's stadium. The field
    // remains editable in case the pass uses a different car park.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCarparkDraft((current) => ({ ...current, ground: clubStadium }));
  }, [step, selectedCarparkFixture, clubStadium]);
  const [carparkSeason, setCarparkSeason] = useState(
    ticket.seasonKey ||
      (recognition.date ? seasonForDate(recognition.date) : "") ||
      seasonForDate(new Date()) ||
      "",
  );

  const ink = readableTextColour(accent);
  const secondaryInk = readableTextColour(secondaryAccent);
  const confidenceColour =
    recognition.confidence >= 75
      ? "#2e7d32"
      : recognition.confidence >= 50
        ? "#b88d36"
        : "#a3493b";

  const seatBits = [
    recognition.seatDetails?.block ? `Block ${recognition.seatDetails.block}` : null,
    recognition.seatDetails?.row ? `Row ${recognition.seatDetails.row}` : null,
    recognition.seatDetails?.seat ? `Seat ${recognition.seatDetails.seat}` : null,
  ].filter(Boolean) as string[];

  const rows: { label: string; value: string | null }[] = [
    { label: "HOME", value: recognition.homeTeam },
    { label: "AWAY", value: recognition.awayTeam },
    { label: "DATE", value: formatTicketDate(recognition.date) ?? recognition.date },
    { label: "KICK OFF", value: formatKickoff12(recognition.kickoff) ?? recognition.kickoff },
    { label: "COMPETITION", value: recognition.competition },
    { label: "GROUND", value: recognition.ground },
    ...(seatBits.length ? [{ label: "SEAT", value: seatBits.join(" · ") }] : []),
  ];

  const pickerHeight = (key: string) =>
    expandedPicker === key ? 210 : 58;
  const fixtureKey = (fixture: CachedFixture) =>
    `${fixture.date}|${fixture.homeAway}|${fixture.opponent}`;
  const fixtureLabel = (fixture: CachedFixture) => {
    const home = fixture.homeAway === "home" ? clubName : fixture.opponent;
    const away = fixture.homeAway === "home" ? fixture.opponent : clubName;
    return `${formatTicketDate(fixture.date) ?? fixture.date} · ${home} v ${away}`;
  };
  const editFixtureChoices = alternatives ?? [];

  const expandablePicker = (
    key: string,
    selectedValue: string,
    onValueChange: (value: string) => void,
    items: { label: string; value: string }[],
  ) => (
    <View
      style={[
        matchConfirmStyles.pickerWrapSmall,
        { height: pickerHeight(key) },
      ]}
      onTouchStart={() => {
        Keyboard.dismiss();
        setExpandedPicker(key);
      }}
    >
      <Picker
        style={{ height: pickerHeight(key) }}
        itemStyle={{ height: pickerHeight(key), fontSize: expandedPicker === key ? 19 : 16 }}
        selectedValue={selectedValue}
        onValueChange={(value) => onValueChange(String(value))}
      >
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );

  const profileField = (
    label: string,
    key: keyof SeasonProfileFields,
  ) => (
    <View key={key} style={matchConfirmStyles.fieldWrap}>
      <Text style={matchConfirmStyles.fieldLabel}>{label}</Text>
      <TextInput
        value={seasonDraft[key]}
        onChangeText={(value) =>
          setSeasonDraft((current) => ({ ...current, [key]: value }))
        }
        style={matchConfirmStyles.typeInput}
      />
    </View>
  );

  const seasonOptions = seasonTicketYearOptions();

  const carparkField = (
    label: string,
    key: keyof CarParkFields,
  ) => (
    <View key={key} style={matchConfirmStyles.fieldWrap}>
      <Text style={matchConfirmStyles.fieldLabel}>{label}</Text>
      <TextInput
        value={carparkDraft[key]}
        onChangeText={(value) =>
          setCarparkDraft((current) => ({ ...current, [key]: value }))
        }
        style={matchConfirmStyles.typeInput}
      />
    </View>
  );

  const hasTeams = Boolean(recognition.homeTeam || recognition.awayTeam);

  return (
    <View style={matchConfirmStyles.backdrop}>
      {ticket.uri ? (
        <Animated.View
          style={[
            matchConfirmStyles.ticketPreview,
            { transform: ticketPan.getTranslateTransform() },
          ]}
          {...ticketPanResponder.panHandlers}
        >
          <Image
            source={{ uri: currentTicketUri(ticket.uri) ?? ticket.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            alt={ticket.name || "Imported ticket"}
          />
        </Animated.View>
      ) : null}
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={8}
        style={matchConfirmStyles.card}
      >
        <Pressable
          accessibilityLabel="Close item confirmation"
          hitSlop={8}
          onPress={() => (step === "type" ? onSkip() : setStep("type"))}
          style={matchConfirmStyles.closeButton}
        >
          <Ionicons name="close" size={20} color="#8b8578" />
        </Pressable>

        {/* ---------- STEP 1: TYPE OF ITEM ---------- */}

        {step === "type" ? (
          <>
            <Text style={matchConfirmStyles.title}>TYPE OF ITEM</Text>
            <Text style={matchConfirmStyles.helpNote}>
              AI preselected a type based on the scan — you decide. This choice
              is the source of truth.
            </Text>
            <View style={matchConfirmStyles.pickerWrap}>
              {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setItemType(key)}
                  style={[
                    matchConfirmStyles.typeOption,
                    itemType === key && matchConfirmStyles.typeOptionSelected,
                    key === "carpark" && { marginBottom: 0 },
                  ]}
                >
                  <Text style={matchConfirmStyles.typeOptionText}>
                    {ITEM_TYPE_LABELS[key].replace(/^[^A-Za-z]+\s*/, "").toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
            {itemType === "season" ? (
              <Text style={matchConfirmStyles.helpNote}>
                Kept in My Tickets + saved as a Season Ticket Profile with your
                seat details. It never becomes individual fixture frames.
              </Text>
            ) : null}
            {itemType === "carpark" ? (
              <Text style={matchConfirmStyles.helpNote}>
                Stays in My Tickets and can link to a fixture — but never
                counts towards attendance.
              </Text>
            ) : null}
            <Pressable
              onPress={() => setStep(itemType === "match" ? "edit" : itemType)}
              style={[
                matchConfirmStyles.confirmButton,
                matchConfirmStyles.typeContinueButton,
                { borderColor: accent },
              ]}
            >
              <Ionicons name="arrow-forward-circle-outline" size={17} color={accent} />
              <Text style={[matchConfirmStyles.confirmText, { color: accent }]}> 
                {itemType === "match" ? "FIND MATCH" : "CONTINUE"}
              </Text>
            </Pressable>
            <Text
              style={{
                marginTop: 10,
                textAlign: "center",
                fontSize: 10.5,
                letterSpacing: 0.8,
                color: "#a09a8c",
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {(ticket.name || "").toUpperCase()}
            </Text>
          </>
        ) : null}

        {/* ---------- MATCH TICKET ---------- */}

        {step === "match" && !choosing ? (
          <>
            <Text style={matchConfirmStyles.title}>IS THIS YOUR MATCH?</Text>
            <View
              style={[
                matchConfirmStyles.confidenceBadge,
                { backgroundColor: confidenceColour },
              ]}
            >
              <Text style={matchConfirmStyles.confidenceText}>
                CONFIDENCE {recognition.confidence}%
              </Text>
            </View>
            <View style={matchConfirmStyles.rows}>
              {rows.map((row) => (
                <View key={row.label} style={matchConfirmStyles.row}>
                  <Text style={matchConfirmStyles.rowLabel}>{row.label}</Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      matchConfirmStyles.rowValue,
                      !row.value && matchConfirmStyles.rowValueMissing,
                    ]}
                  >
                    {row.value || "Not found"}
                  </Text>
                </View>
              ))}
            </View>
            {!hasTeams ? (
              <Text style={matchConfirmStyles.helpNote}>
                Match not recognised — complete the details manually, or pick a
                possible match below.
              </Text>
            ) : null}
            {editError ? (
              <Text style={matchConfirmStyles.errorText}>{editError}</Text>
            ) : null}
            <Pressable
              onPress={() => setStep("edit")}
              style={[
                matchConfirmStyles.confirmButton,
                matchConfirmStyles.fullWidthButton,
                { backgroundColor: accent },
              ]}
            >
              <Ionicons name="create-outline" size={16} color={ink} />
              <Text style={[matchConfirmStyles.confirmText, { color: ink }]}>
                {hasTeams ? "EDIT" : "MANUAL MATCH ENTRY"}
              </Text>
            </Pressable>
            <View style={matchConfirmStyles.buttonRow}>
              <Pressable
                onPress={onConfirm}
                disabled={!hasTeams}
                style={[
                  matchConfirmStyles.altButton,
                  {
                    borderColor: secondaryAccent,
                    backgroundColor: secondaryAccent,
                    opacity: hasTeams ? 1 : 0.45,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={15}
                  color={secondaryInk}
                />
                <Text style={[matchConfirmStyles.altText, { color: secondaryInk }]}>
                  CONFIRM AS READ
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (alternatives === null) onRequestAlternatives();
                  setChoosing(true);
                }}
                style={[
                  matchConfirmStyles.confirmButton,
                  matchConfirmStyles.fullWidthButton,
                  { backgroundColor: accent, borderWidth: 2, borderColor: accent },
                ]}
              >
                <Text style={[matchConfirmStyles.altText, { color: ink }]}>
                  POSSIBLE MATCHES
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {step === "match" && choosing ? (
          <>
            <Text style={[matchConfirmStyles.listHeader, { marginTop: 14 }]}> 
              {clubName.toUpperCase()} · {ticket.seasonKey} FIXTURES — PICK A MATCH
            </Text>
            <ScrollView style={matchConfirmStyles.listScroll}>
              {pickerNotice ? (
                <Text style={matchConfirmStyles.listEmpty}>{pickerNotice}</Text>
              ) : null}
              {alternatives === null ? (
                <Text style={matchConfirmStyles.listEmpty}>Loading fixtures…</Text>
              ) : alternatives.length === 0 ? (
                <Text style={matchConfirmStyles.listEmpty}>
                  {pickerNotice ?? "No fixtures found for this season."}
                </Text>
              ) : (
                alternatives.map((fixture) => {
                  const home =
                    fixture.homeAway === "home" ? clubName : fixture.opponent;
                  const away =
                    fixture.homeAway === "home" ? fixture.opponent : clubName;
                  return (
                    <Pressable
                      key={`${fixture.date}|${fixture.homeAway}|${fixture.opponent}`}
                      style={matchConfirmStyles.fixtureRow}
                      onPress={() => {
                        const error = onPickFixture(fixture);
                        if (error) {
                          setEditError(error);
                          return;
                        }
                        setEditError(null);
                        setChoosing(false);
                      }}
                    >
                      <Text style={matchConfirmStyles.fixtureMain} numberOfLines={1}>
                        {home} v {away}
                      </Text>
                      <Text style={matchConfirmStyles.fixtureMeta} numberOfLines={1}>
                        {formatTicketDate(fixture.date) ?? fixture.date} ·{" "}
                        {fixture.competition}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Pressable
              hitSlop={10}
              onPress={() => setChoosing(false)}
              style={{ alignSelf: "center", marginTop: 10 }}
            >
              <Text style={{ color: "#657069", fontWeight: "700" }}>BACK</Text>
            </Pressable>
          </>
        ) : null}

        {/* ---------- EDIT DETAILS / MANUAL MATCH ENTRY ---------- */}

        {step === "edit" ? (
          <>
            <Text style={matchConfirmStyles.title}>EDIT DETAILS</Text>
            <Text style={matchConfirmStyles.helpNote}>
              Correct anything the scan got wrong, or complete it by hand.
              Nothing blocks saving.
            </Text>
            <ScrollView
              style={matchConfirmStyles.editScroll}
              contentContainerStyle={matchConfirmStyles.editScrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={Keyboard.dismiss}
            >
              <View style={matchConfirmStyles.editDragArea}>
                <View style={matchConfirmStyles.editDragHandle} />
                <Text style={matchConfirmStyles.editDragText}>SWIPE HERE TO SCROLL</Text>
              </View>
              {editPhase === "details" ? (
                <>
                  <View style={matchConfirmStyles.fieldWrap}>
                    <Text style={matchConfirmStyles.fieldLabel}>SEASON</Text>
                    {expandablePicker(
                      "edit-season",
                      editDraft.seasonKey || lastFiveSeasonOptions()[0] || "",
                      (season) => {
                        setEditDraft((current) => ({ ...current, seasonKey: season }));
                        setSelectedEditFixture("");
                        onRequestAlternatives(season);
                      },
                      lastFiveSeasonOptions().map((season) => ({ label: season, value: season })),
                    )}
                  </View>
                  {(["stand", "block", "row", "seat"] as const).map((field) => (
                    <View key={field} style={matchConfirmStyles.fieldWrap}>
                      <Text style={matchConfirmStyles.fieldLabel}>{field.toUpperCase()}</Text>
                      <TextInput
                        value={seatDraft[field]}
                        onChangeText={(value) => setSeatDraft((current) => ({ ...current, [field]: value }))}
                        placeholder="Manual entry"
                        style={matchConfirmStyles.typeInput}
                      />
                    </View>
                  ))}
                </>
              ) : (
                <View style={matchConfirmStyles.fieldWrap}>
                  <Text style={matchConfirmStyles.fieldLabel}>CHOOSE GAME — {editDraft.seasonKey}</Text>
                  {expandablePicker(
                    "edit-match",
                    selectedEditFixture,
                    setSelectedEditFixture,
                    [
                      { label: "Select a game", value: "" },
                      ...editFixtureChoices.map((fixture) => ({ label: fixtureLabel(fixture), value: fixtureKey(fixture) })),
                    ],
                  )}
                  {alternatives === null ? (
                    <Text style={matchConfirmStyles.helpNote}>Loading this season’s games…</Text>
                  ) : editFixtureChoices.length === 0 ? (
                    <Text style={matchConfirmStyles.helpNote}>No games are available for this season yet.</Text>
                  ) : null}
                </View>
              )}
              {editError ? (
                <Text style={matchConfirmStyles.errorText}>{editError}</Text>
              ) : null}
            </ScrollView>
            <View style={matchConfirmStyles.buttonRow}>
              <Pressable
                onPress={() => editPhase === "game" ? setEditPhase("details") : setStep("match")}
                style={matchConfirmStyles.altButton}
              >
                <Text style={matchConfirmStyles.altText}>{editPhase === "game" ? "BACK" : "CANCEL"}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const seat = [
                    seatDraft.stand ? `Stand ${seatDraft.stand}` : "",
                    seatDraft.block ? `Block ${seatDraft.block}` : "",
                    seatDraft.row ? `Row ${seatDraft.row}` : "",
                    seatDraft.seat ? `Seat ${seatDraft.seat}` : "",
                  ].filter(Boolean).join(" · ");
                  if (editPhase === "details") {
                    setEditDraft((current) => ({ ...current, seat }));
                    setEditError(null);
                    onRequestAlternatives(editDraft.seasonKey);
                    setEditPhase("game");
                    return;
                  }
                  const fixture = editFixtureChoices.find((candidate) => fixtureKey(candidate) === selectedEditFixture);
                  if (!fixture) {
                    setEditError("Choose a game before accepting.");
                    return;
                  }
                  const home = fixture.homeAway === "home" ? clubName : fixture.opponent;
                  const away = fixture.homeAway === "home" ? fixture.opponent : clubName;
                  const completedDraft = {
                    ...editDraft,
                    seat,
                    homeTeam: home,
                    awayTeam: away,
                    date: fixture.date,
                    kickoff: fixture.kickoff ?? "",
                    competition: fixture.competition,
                    ground: fixture.venue ?? editDraft.ground,
                    ticketType: "Match Ticket",
                  };
                  const error = onSaveEdits(completedDraft);
                  if (error) {
                    setEditError(error);
                    return;
                  }
                  setEditError(null);
                  // Manual fixture selection converges on the same final
                  // confirmation used by successful automatic recognition.
                  setEditPhase("details");
                  setStep("match");
                }}
                style={[matchConfirmStyles.confirmButton, { backgroundColor: accent }]}
              >
                <Ionicons name={editPhase === "details" ? "football-outline" : "checkmark-circle-outline"} size={16} color={ink} />
                <Text style={[matchConfirmStyles.confirmText, { color: ink }]}> 
                  {editPhase === "details" ? "CHOOSE GAME" : "ACCEPT GAME"}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {/* ---------- SEASON TICKET PROFILE ---------- */}

        {step === "season" ? (
          <>
            <Text style={matchConfirmStyles.title}>SEASON TICKET PROFILE</Text>
            <Text style={matchConfirmStyles.helpNote}>
              Your season card stays in My Tickets exactly as scanned. This
              profile stores the seat details used for attendance.
            </Text>
            <ScrollView
              style={matchConfirmStyles.editScroll}
              contentContainerStyle={matchConfirmStyles.editScrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={Keyboard.dismiss}
            >
              <View style={matchConfirmStyles.editDragArea}>
                <View style={matchConfirmStyles.editDragHandle} />
                <Text style={matchConfirmStyles.editDragText}>SWIPE HERE TO SCROLL</Text>
              </View>
              {profileField("CLUB ON THIS SEASON TICKET (REQUIRED)", "club")}
              <View style={matchConfirmStyles.fieldWrap}>
                <Text style={matchConfirmStyles.fieldLabel}>SEASON</Text>
                {expandablePicker(
                  "profile-season",
                  seasonDraft.seasonKey,
                  (season) =>
                    setSeasonDraft((current) => ({
                      ...current,
                      seasonKey: season,
                    })),
                  seasonOptions.map((season) => ({ label: season, value: season })),
                )}
              </View>
              {profileField("STAND", "stand")}
              {profileField("BLOCK", "block")}
              {profileField("ROW", "row")}
              {profileField("SEAT", "seat")}
              {profileField("FAN ID", "fanId")}
              {profileField("TICKET NUMBER", "ticketNumber")}
              {profileField("SEASON TICKET HOLDER (IF AVAILABLE)", "holderName")}
            </ScrollView>
            <View style={matchConfirmStyles.buttonRow}>
              <Pressable
                onPress={() => setStep("type")}
                style={matchConfirmStyles.altButton}
              >
                <Text style={matchConfirmStyles.altText}>CANCEL</Text>
              </Pressable>
              <Pressable
                onPress={() => onSaveSeasonProfile(seasonDraft)}
                style={[matchConfirmStyles.confirmButton, { backgroundColor: accent }]}
              >
                <Ionicons name="person-circle-outline" size={16} color={ink} />
                <Text style={[matchConfirmStyles.confirmText, { color: ink }]}>
                  SAVE PROFILE
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {/* ---------- CAR PARK PASS ---------- */}

        {step === "carpark" ? (
          <>
            <Text style={matchConfirmStyles.title}>CAR PARK PASS</Text>
            <Text style={matchConfirmStyles.helpNote}>
              Saved with your items. Never counts as attendance, stadium visit
              or season history. Linking a fixture is optional.
            </Text>
            <ScrollView
              style={matchConfirmStyles.editScroll}
              contentContainerStyle={matchConfirmStyles.editScrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={Keyboard.dismiss}
            >
              {carparkField("TITLE", "title")}
              <View style={matchConfirmStyles.fieldWrap}>
                <Text style={matchConfirmStyles.fieldLabel}>SEASON</Text>
                {expandablePicker(
                  "carpark-season",
                  carparkSeason || seasonOptions[0] || "",
                  (season) => {
                    setCarparkSeason(season);
                    setCarparkDraft((current) => ({
                      ...current,
                      seasonKey: season,
                    }));
                    setSelectedCarparkFixture("__season_pass__");
                    setCarparkDraft((current) => ({
                      ...current,
                      ground: current.ground || clubStadium,
                      matchDate: "",
                      linkedOpponent: "",
                      linkedDate: "",
                    }));
                    onRequestAlternatives(season);
                  },
                  seasonOptions.map((season) => ({ label: season, value: season })),
                )}
              </View>
              <View style={matchConfirmStyles.fieldWrap}>
                <Text style={matchConfirmStyles.fieldLabel}>GAME</Text>
                {expandablePicker(
                  "carpark-game",
                  selectedCarparkFixture,
                  (value) => {
                    setSelectedCarparkFixture(value);
                    if (value === "__season_pass__") {
                      setCarparkDraft((current) => ({
                        ...current,
                        ground: current.ground || clubStadium,
                        matchDate: "",
                        linkedOpponent: "",
                        linkedDate: "",
                      }));
                      return;
                    }
                    const fixture = (alternatives ?? []).find(
                      (candidate) => fixtureKey(candidate) === value,
                    );
                    if (!fixture) return;
                    const home =
                      fixture.homeAway === "home" ? clubName : fixture.opponent;
                    const away =
                      fixture.homeAway === "home" ? fixture.opponent : clubName;
                    const homeStadium = FOOTBALL_GROUNDS.find(
                      (ground) =>
                        normaliseFixtureText(ground.club) ===
                        normaliseFixtureText(home),
                    )?.stadium;
                    setCarparkDraft((current) => ({
                      ...current,
                      matchDate: fixture.date,
                      linkedDate: fixture.date,
                      linkedOpponent: `${home} v ${away}`,
                      ground:
                        fixture.venue ??
                        homeStadium ??
                        (fixture.homeAway === "home" ? clubStadium : current.ground),
                    }));
                  },
                  [
                    { label: "Season Pass", value: "__season_pass__" },
                    ...(alternatives ?? []).map((fixture) => ({
                      label: fixtureLabel(fixture),
                      value: fixtureKey(fixture),
                    })),
                  ],
                )}
              </View>
              {carparkField("STADIUM", "ground")}
              {carparkField("DATE", "matchDate")}
            </ScrollView>
            <View style={matchConfirmStyles.buttonRow}>
              <Pressable
                onPress={() => setStep("type")}
                style={matchConfirmStyles.altButton}
              >
                <Text style={matchConfirmStyles.altText}>CANCEL</Text>
              </Pressable>
              <Pressable
              onPress={() =>
                onSaveCarParkPass(
                  { ...carparkDraft, seasonKey: carparkSeason },
                  recognition,
                )
              }
                style={[matchConfirmStyles.confirmButton, { backgroundColor: accent }]}
              >
                <Ionicons name="car-outline" size={16} color={ink} />
                <Text style={[matchConfirmStyles.confirmText, { color: ink }]}>
                  Saved
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

      </KeyboardAvoidingView>
    </View>
  );
}
