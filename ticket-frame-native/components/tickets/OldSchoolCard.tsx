import { Fragment, useEffect, useMemo, useState } from "react";
import { Image, Text, View } from "react-native";
import TextRecognition from "@react-native-ml-kit/text-recognition";

import { buildOldSchoolStyles } from "@/components/tickets/oldSchoolTicketStyles";
import type { ClubOption } from "@/lib/clubCatalog";
import { readableTextColour } from "@/lib/colorUtils";
import { clubInitials } from "@/lib/clubDisplay";
import {
  formatKickoff12,
  formatTicketDate,
  formatTicketShortDate,
  splitFixtureName,
} from "@/lib/matchDisplayFormatting";
import { extractTicketPalette, type TicketPalette } from "@/lib/ticketPalette";
import { extractTicketQrDataUri } from "@/lib/ticketQr";
import { currentTicketUri } from "@/lib/ticketFiles";
import { normaliseFixtureText, parseSeatDetails, type TicketSeatDetails } from "@/lib/ticketText";
import type { SeasonTicket } from "@/lib/ticketTypes";

export default function OldSchoolCard({
  ticket,
  club,
  onDetailsFound,
  renderScale = 1,
}: {
  ticket: SeasonTicket;
  club: ClubOption;
  onDetailsFound?: (ticket: SeasonTicket, details: TicketSeatDetails) => void;
  renderScale?: number;
}) {
  const styles = useMemo(() => buildOldSchoolStyles(renderScale), [renderScale]);
  const fallbackSecondary = club.secondary || club.primary;
  const [palette, setPalette] = useState<TicketPalette>({
    primary: club.primary,
    secondary: fallbackSecondary,
  });
  const [qrUri, setQrUri] = useState<string | null>(null);
  const photoUri = ticket.uri
    ? currentTicketUri(ticket.uri) ?? ticket.uri
    : null;

  useEffect(() => {
    let alive = true;
    if (!photoUri) return;
    void extractTicketPalette(photoUri, club.primary, fallbackSecondary).then(
      (result) => {
        if (alive) setPalette(result);
      },
    );
    void extractTicketQrDataUri(photoUri).then((result) => {
      if (alive) setQrUri(result);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUri]);

  useEffect(() => {
    let alive = true;
    if (ticket.details || !ticket.uri || !onDetailsFound) return;
    (async () => {
      try {
        const liveUri = currentTicketUri(ticket.uri!) ?? ticket.uri!;
        const recognised = (await TextRecognition.recognize(liveUri)).text;
        const parsed = parseSeatDetails(recognised ?? "");
        if (alive && parsed) onDetailsFound(ticket, parsed);
      } catch {
        // detail backfill is best effort
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.fingerprint, ticket.details]);

  const details = ticket.details;
  const fixture = splitFixtureName(ticket.name ?? "", club.name);
  const clubNorm = normaliseFixtureText(club.name);
  const homeNorm = normaliseFixtureText(fixture.home);
  const awayNorm = normaliseFixtureText(fixture.away);
  const awayIsClub = !!fixture.away && awayNorm === clubNorm;
  const homeIsClub = homeNorm === clubNorm;
  const clubSide = awayIsClub
    ? fixture.away
    : homeIsClub
      ? fixture.home
      : club.name;
  const opponent = awayIsClub
    ? fixture.home
    : fixture.away && !homeIsClub
      ? fixture.away
      : "";
  const dateLabel = formatTicketDate(ticket.matchDate);
  const shortDate = formatTicketShortDate(ticket.matchDate);
  const kickoff12 = formatKickoff12(ticket.kickoffTime);
  type InfoEntry = { label: string; value: string };
  const infoEntries: InfoEntry[] = [];
  if (details?.stand && details?.entrance)
    infoEntries.push({
      label: "STAND / ENTRANCE",
      value: `${details.stand} - Entrances ${details.entrance}`,
    });
  else if (details?.stand)
    infoEntries.push({ label: "STAND", value: details.stand });
  else if (details?.entrance)
    infoEntries.push({ label: "ENTRANCE", value: details.entrance });
  if (details?.block)
    infoEntries.push({ label: "BLOCK", value: details.block });
  if (dateLabel) infoEntries.push({ label: "DATE", value: dateLabel });
  if (kickoff12) infoEntries.push({ label: "KICK-OFF", value: kickoff12 });
  if (details?.ticketType)
    infoEntries.push({ label: "TICKET TYPE", value: details.ticketType });
  if (details?.fanId) infoEntries.push({ label: "FAN ID", value: details.fanId });

  const seatCells: InfoEntry[] = [];
  if (details?.row) seatCells.push({ label: "ROW", value: details.row });
  if (details?.seat) seatCells.push({ label: "SEAT", value: details.seat });
  if (details?.block) seatCells.push({ label: "BLOCK", value: details.block });
  if (details?.entrance)
    seatCells.push({ label: "ENTRANCE", value: details.entrance });

  return (
    <View style={styles.card}>
      <View style={styles.sheet}>
        <View style={styles.main}>
          <View style={[styles.header, { backgroundColor: palette.primary }]}>
            <View
              style={[
                styles.badgeFallback,
                { backgroundColor: palette.secondary },
              ]}
            >
              <Text
                style={[
                  styles.badgeFallbackText,
                  { color: readableTextColour(palette.secondary) },
                ]}
              >
                {clubInitials(club.name)}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.clubName}>
              {(club.name || "").toUpperCase()}
            </Text>
            {ticket.seasonKey ? (
              <Text style={[styles.seasonTag, { color: palette.secondary }]}>
                {ticket.seasonKey}
              </Text>
            ) : null}
          </View>
          <View style={styles.metaStrip}>
            {[club.stadium, ticket.competition]
              .filter(Boolean)
              .map((value, index) => (
                <Fragment key={`${value}`}>
                  {index > 0 ? <Text style={styles.metaDot}>|</Text> : null}
                  <Text numberOfLines={1} style={styles.metaItem}>
                    {value}
                  </Text>
                </Fragment>
              ))}
          </View>
          <View style={styles.matchup}>
            <Text numberOfLines={1} style={styles.homeName}>
              {clubSide}
            </Text>
            <View style={styles.versusWrap}>
              <View style={styles.versusRule} />
              <Text style={styles.versus}>V</Text>
              <View style={styles.versusRule} />
            </View>
            {opponent ? (
              <Text numberOfLines={2} style={styles.awayName}>
                {opponent}
              </Text>
            ) : null}
          </View>
          {seatCells.length ? (
            <View style={styles.seatPanel}>
              {seatCells.map((cell) => (
                <View key={cell.label} style={styles.seatCell}>
                  <Text style={styles.seatLabel}>{cell.label}</Text>
                  <Text style={styles.seatValue}>{cell.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {infoEntries.length ? (
            <View style={styles.infoArea}>
              {infoEntries.map((entry) => (
                <View key={entry.label} style={styles.infoCell}>
                  <Text style={styles.infoLabel}>{entry.label}</Text>
                  <Text numberOfLines={1} style={styles.infoValue}>
                    {entry.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ height: 4 * renderScale }} />
          )}
          <View style={[styles.footerBand, { backgroundColor: palette.secondary }]}>
            <Text numberOfLines={1} style={styles.footerText}>
              {(club.stadium || club.name || "").toUpperCase()}
              {dateLabel || kickoff12
                ? `  ·  ${[dateLabel, kickoff12].filter(Boolean).join(" · ")}`
                : ""}
            </Text>
          </View>
        </View>
        <View style={styles.perf}>
          <View style={styles.notchTop} />
          <View style={styles.notchBottom} />
        </View>
        <View style={styles.stub}>
          <View style={[styles.stubBand, { backgroundColor: palette.primary }]}>
            <Text style={styles.stubBandText}>MATCH TICKET</Text>
          </View>
          <View style={styles.stubFixture}>
            <Text numberOfLines={2} style={styles.stubTeams}>
              {[clubSide, opponent].filter(Boolean).join(" V ")}
            </Text>
            {shortDate ? (
              <Text numberOfLines={1} style={styles.stubDate}>
                {shortDate}
              </Text>
            ) : null}
          </View>
          <View style={styles.stubDivider} />
          <View style={styles.stubSeatBlock}>
            {details?.block ? (
              <Text style={styles.stubSeatLine}>BLK {details.block}</Text>
            ) : null}
            {details?.row ? (
              <Text style={styles.stubSeatLine}>ROW {details.row}</Text>
            ) : null}
            {details?.seat ? (
              <Text style={styles.stubSeatLine}>SEAT {details.seat}</Text>
            ) : null}
          </View>
          {qrUri ? (
            <View style={styles.stubQrFrame}>
              <Image
                source={{ uri: qrUri }}
                style={styles.qrImage}
                resizeMode="contain"
                alt="Ticket QR code"
              />
            </View>
          ) : null}
          <Text style={styles.stubAdmit}>ADMIT ONE</Text>
        </View>
      </View>
    </View>
  );
}
