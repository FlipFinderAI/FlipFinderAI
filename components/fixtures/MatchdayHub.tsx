import { useEffect, useState } from "react";
import { AppState, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { FixtureRow } from "@/lib/fixtures";
import type { ClubOption } from "@/lib/clubCatalog";
import type { SeasonTicket } from "@/lib/ticketTypes";
import { clubNamesMatch } from "@/lib/ticketText";
import { clubInitials } from "@/lib/clubDisplay";
import { fixtureClubBadgeForName } from "@/lib/fixtureClubBadges";
import { readableTextColour } from "@/lib/colorUtils";
import { footballGroundForName, venueForFixture } from "@/lib/clubGroundMatching";
import { stadiumPhotoForId } from "@/lib/homeStadiumPhotos";
import { homeStadiumForClub } from "@/lib/homeStadiumIdentity";
import { formatFixtureDay } from "@/lib/matchDisplayFormatting";
import { fetchMatchWeather, type MatchWeather } from "@/lib/matchWeather";
import { hubCountdown, hubKickoffMs } from "@/lib/matchdayHub";

type Props = {
  match: FixtureRow;
  clubs: ClubOption[];
  tickets: SeasonTicket[];
  favouriteClub: ClubOption;
  directionsGroundId?: string;
  canNavigate: boolean;
  onDirections: () => void;
};

export default function MatchdayHub({ match, clubs, tickets, favouriteClub, directionsGroundId, canNavigate, onDirections }: Props) {
  const { fontScale } = useWindowDimensions();
  const primary = favouriteClub.primary;
  const secondary = favouriteClub.secondary;
  const panelInk = readableTextColour(primary);
  const accentInk = readableTextColour(secondary);
  const panelText = { color: panelInk };
  const accentText = { color: accentInk };
  const [width, setWidth] = useState(0);
  const [now, setNow] = useState(Date.now);
  const kickoff = hubKickoffMs(match);
  const countdown = hubCountdown(kickoff, now);
  const venue = venueForFixture(match);
  const ground = venue ? footballGroundForName(venue) : null;
  // A recorded venue takes priority over the nominal home stadium.
  // Otherwise resolve the home club, never the supporter's favourite club.
  const fixtureHomeGround = homeStadiumForClub(null, match.homeName);
  const photoGround = match.venue?.trim()
    ? ground
    : fixtureHomeGround ?? ground;
  const photo = stadiumPhotoForId(photoGround?.id);
  const weatherKey = `${match.id}|${kickoff}|${ground?.id}`;
  const [forecast, setForecast] = useState<{ key: string; data: MatchWeather } | null>(null);
  const weather = forecast?.key === weatherKey && countdown ? forecast.data : null;
  const ticket = tickets.find((item) => item.confirmedMatch && item.uri && item.matchDate === match.date &&
    !!item.homeTeam && !!item.awayTeam && clubNamesMatch(item.homeTeam, match.homeName) && clubNamesMatch(item.awayTeam, match.awayName));
  const seats = ticket?.details;
  const seatText = seats ? [["Stand", seats.stand], ["Block", seats.block], ["Row", seats.row], ["Seat", seats.seat]]
    .filter(([, value]) => value?.trim()).map(([label, value]) => `${label} ${value}`).join(" · ") : "";

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 1000);
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  useEffect(() => {
    let active = true;
    // The weather service accepts UTC ISO. Only request a verified venue and
    // an actual kickoff, avoiding its fallback afternoon forecast.
    if (ground && kickoff !== null && kickoff > Date.now()) {
      const iso = new Date(kickoff).toISOString();
      void fetchMatchWeather(ground.latitude, ground.longitude, iso, iso.slice(0, 10)).then((data) => {
        if (active && data && data.label !== "Mixed") setForecast({ key: weatherKey, data });
      });
    }
    return () => { active = false; };
  }, [ground, kickoff, weatherKey]);

  const team = (name: string) => {
    const club = clubs.find((item) => clubNamesMatch(item.name, name));
    const primary = club?.primary ?? favouriteClub.primary;
    return <View style={s.team}>
      <FixtureTeamBadge name={name} primary={primary} secondary={club?.secondary ?? favouriteClub.secondary} />
      <View style={[s.teamNameLines, s.photoCaption]}>
        {(club?.name ?? name).trim().split(/\s+/).map((word, index) => (
          <Text key={`${word}-${index}`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={s.teamName}>
            {word}
          </Text>
        ))}
      </View>
    </View>;
  };
  const stacked = (width > 0 && width < 300) || fontScale > 1.3;
  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[s.card, { borderColor: secondary, backgroundColor: primary }]}>
    {photo ? <Image source={photo} resizeMode="cover" accessibilityLabel={venue ?? "Match stadium"} style={[StyleSheet.absoluteFill, s.stadiumPhoto]} /> : null}
    <View style={[s.columns, stacked && s.stacked]}>
      <View style={s.left}>
        <View style={s.fixture}>
          <Text style={[s.heading, { backgroundColor: secondary, color: accentInk }]}>MATCHDAY HUB</Text>
          <View style={s.teams}>{team(match.homeName)}<Text style={[s.versus, { backgroundColor: secondary, color: accentInk }]}>v</Text>{team(match.awayName)}</View>
          <Text style={[s.meta, s.photoCaption]}>{formatFixtureDay(match.date)}{kickoff !== null ? ` · ${new Date(kickoff).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}` : " · Kick-off TBC"}</Text>
          <Text style={[s.copy, s.photoCaption]}>{venue ?? "Venue to be confirmed"}</Text>
          {match.competition ? <Text style={[s.muted, s.photoCaption]}>{match.competition}</Text> : null}
        </View>
      </View>
      <View style={[s.details, { backgroundColor: /^#[0-9a-f]{6}$/i.test(primary) ? `${primary}70` : primary }]}>
        <Text style={[s.kicker, panelText]}>{countdown ? "COUNTDOWN" : "KICK-OFF"}</Text>
        {countdown ? <View style={s.clock} accessibilityLabel={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes until kickoff`}>
          {[[countdown.days, "DAYS"], [countdown.hours, "HRS"], [countdown.minutes, "MINS"]].map(([value, label]) => <View key={label} style={[s.unit, { backgroundColor: secondary }]}>
            <Text style={[s.number, accentText]}>{value}</Text><Text style={[s.unitLabel, accentText]}>{label}</Text>
          </View>)}
        </View> : <Text style={[s.copy, panelText]}>{kickoff !== null && kickoff <= now ? "Kick-off reached" : /postpon/i.test(match.status) ? "Postponed" : /cancel/i.test(match.status) ? "Cancelled" : match.played ? "Match finished" : "Countdown unavailable"}</Text>}
        {ticket ? <View style={[s.detailRow, { borderTopColor: `${panelInk}33` }]}><Text style={[s.kicker, panelText]}>{seatText ? "YOUR SEAT" : "YOUR TICKET"}</Text><Text style={[s.copy, panelText]}>{seatText || "Ticket saved"}</Text></View> : null}
        {weather ? <View style={[s.detailRow, { borderTopColor: `${panelInk}33` }]}><Text style={[s.kicker, panelText]}>FORECAST</Text><Text style={[s.copy, panelText]}>{weather.icon} {weather.tempC !== null ? `${Math.round(weather.tempC)}°C · ` : ""}{weather.label}</Text>{weather.precipProb !== null ? <Text style={[s.muted, panelText]}>{weather.precipProb}% rain</Text> : null}</View> : null}
        {canNavigate && ground?.id === directionsGroundId ? <Pressable accessibilityRole="button" accessibilityLabel="Navigate to the match ground" onPress={onDirections} style={[s.button, { backgroundColor: secondary }]}><Text style={[s.buttonText, accentText]}>Get Directions ↗</Text></Pressable> : null}
      </View>
    </View>
  </View>;
}


function FixtureTeamBadge({ name, primary, secondary }: { name: string; primary: string; secondary: string }) {
  const source = fixtureClubBadgeForName(name);
  const [failedName, setFailedName] = useState<string | null>(null);
  const showCrest = source !== null && failedName !== name;
  return <View
    accessibilityLabel={`${name} ${showCrest ? "club badge" : "initials"}`}
    style={[s.badge, { backgroundColor: showCrest ? "#ffffff" : primary, borderColor: secondary }]}
  >
    {showCrest ? <Image source={source} resizeMode="contain" style={s.crest} onError={() => setFailedName(name)} /> :
      <Text style={[s.initials, { color: readableTextColour(primary) }]}>{clubInitials(name)}</Text>}
  </View>;
}

const s = StyleSheet.create({
  card: { width: "100%", alignSelf: "stretch", marginBottom: 2, borderWidth: 2, borderRadius: 20, overflow: "hidden" },
  stadiumPhoto: { width: "100%", height: "100%" },
  heading: { fontSize: 14, fontWeight: "900", paddingHorizontal: 6, paddingVertical: 5, borderRadius: 5 },
  columns: { flexDirection: "row", alignItems: "stretch" }, stacked: { flexDirection: "column" },
  left: { flex: 1.12, minWidth: 0 },
  fixture: { flex: 1, padding: 10, gap: 7, justifyContent: "center" }, teams: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  photoCaption: { backgroundColor: "rgba(0,0,0,0.42)", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  team: { flex: 1, minWidth: 0, alignItems: "center", gap: 6 },
  badge: { width: 52, height: 58, borderWidth: 2, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  crest: { width: 46, height: 52 },
  teamNameLines: { alignSelf: "stretch", alignItems: "stretch" },
  initials: { fontSize: 17, fontWeight: "900" }, teamName: { color: "#ffffff", fontSize: 12, fontWeight: "800", textAlign: "center" },
  versus: { fontSize: 18, fontWeight: "900", marginTop: 12, paddingHorizontal: 3, borderRadius: 4, overflow: "hidden" },
  details: { flex: 1, minWidth: 0, padding: 10, gap: 8, margin: 8, marginLeft: 0, borderRadius: 12 },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  clock: { flexDirection: "row", gap: 4, flexWrap: "wrap" }, unit: { flexGrow: 1, minWidth: 34, borderRadius: 8, alignItems: "center", paddingVertical: 8, paddingHorizontal: 2 },
  number: { fontSize: 23, fontWeight: "900", fontVariant: ["tabular-nums"] }, unitLabel: { color: "#ffffff", fontSize: 10, fontWeight: "700" },
  meta: { color: "#ffffff", fontSize: 13, fontWeight: "800" }, copy: { color: "#ffffff", fontSize: 13, lineHeight: 19 }, muted: { color: "#cad8e9", fontSize: 12, lineHeight: 18 },
  detailRow: { borderTopWidth: 1, paddingTop: 9, gap: 4 },
  button: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 9, justifyContent: "center", marginTop: 4 }, buttonText: { fontSize: 13, fontWeight: "800", textAlign: "center" },
});
