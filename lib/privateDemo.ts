import Constants from "expo-constants";

import type { AttendanceRecord } from "@/lib/attendanceHistory";
import type { CarParkPass } from "@/lib/carParkPasses";
import type { FixtureRow, TableRow } from "@/lib/fixtures";
import type { SeasonTicketProfile } from "@/lib/seasonTicketProfiles";
import type { SeasonTicket } from "@/lib/ticketTypes";

export type PrivateDemoSnapshot = {
  schemaVersion: 1;
  viewerName: "David Batty";
  generatedAt: string;
  club: { name: string; league: string; primary: string; secondary: string };
  frame: { style: string; seasons: string[] };
  tickets: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    competition: string;
    ground: string;
    matchDate: string;
    kickoffTime: string;
    season: string;
    ticketType: string;
    seat: { stand: string; block: string; row: string; seat: string };
  }>;
  history: Array<{
    id: string;
    club: string;
    opponent: string;
    matchDate: string;
    season: string;
    competition: string;
    ground: string;
    homeAway: "home" | "away";
    result: "win" | "draw" | "loss" | null;
    homeScore: number | null;
    awayScore: number | null;
  }>;
  fixtures: FixtureRow[];
  table: TableRow[];
  seasonTickets: Array<{
    id: string;
    club: string;
    season: string;
    holderName: "David Batty";
    stand: string;
    block: string;
    row: string;
    seat: string;
  }>;
  carParkPasses: Array<{
    id: string;
    title: string;
    ground: string;
    matchDate: string;
    linkedClub: string;
    linkedOpponent: string;
  }>;
};

type SnapshotInput = {
  club: PrivateDemoSnapshot["club"];
  frameStyle: string;
  tickets: SeasonTicket[];
  attendanceHistory: AttendanceRecord[];
  fixtures: FixtureRow[];
  table: TableRow[];
  seasonTicketProfiles: SeasonTicketProfile[];
  carParkPasses: CarParkPass[];
};

const text = (value: string | null | undefined) => value?.trim() ?? "";

/**
 * Strict allow-list export. Image/video URIs, ticket scan names, fingerprints,
 * fan IDs, ticket numbers, notes, GPS coordinates and original holder names
 * never enter the demo payload.
 */
export function buildPrivateDemoSnapshot(input: SnapshotInput): PrivateDemoSnapshot {
  const seasons = Array.from(
    new Set(input.tickets.map((ticket) => text(ticket.seasonKey)).filter(Boolean)),
  ).sort().reverse();

  return {
    schemaVersion: 1,
    viewerName: "David Batty",
    generatedAt: new Date().toISOString(),
    club: input.club,
    frame: { style: input.frameStyle, seasons },
    tickets: input.tickets.map((ticket) => ({
      id: ticket.id,
      homeTeam: text(ticket.homeTeam),
      awayTeam: text(ticket.awayTeam),
      competition: text(ticket.competition),
      ground: text(ticket.ground),
      matchDate: text(ticket.matchDate),
      kickoffTime: text(ticket.kickoffTime),
      season: text(ticket.seasonKey),
      ticketType: text(ticket.ticketType) || "Match Ticket",
      seat: {
        stand: text(ticket.details?.stand),
        block: text(ticket.details?.block),
        row: text(ticket.details?.row),
        seat: text(ticket.details?.seat),
      },
    })),
    history: input.attendanceHistory
      .filter((record) => record.confirmed)
      .map((record) => ({
        id: record.id,
        club: text(record.club),
        opponent: text(record.opponent),
        matchDate: text(record.matchDate),
        season: text(record.season),
        competition: text(record.competition),
        ground: text(record.ground),
        homeAway: record.homeAway,
        result: record.result,
        homeScore: record.homeScore,
        awayScore: record.awayScore,
      })),
    fixtures: input.fixtures,
    table: input.table,
    seasonTickets: input.seasonTicketProfiles.map((profile) => ({
      id: profile.id,
      club: text(profile.club),
      season: text(profile.seasonKey),
      holderName: "David Batty",
      stand: text(profile.stand),
      block: text(profile.block),
      row: text(profile.row),
      seat: text(profile.seat),
    })),
    carParkPasses: input.carParkPasses.map((pass) => ({
      id: pass.id,
      title: "Match-day Car Park Pass",
      ground: text(pass.ground),
      matchDate: text(pass.matchDate),
      linkedClub: text(pass.linkedClub),
      linkedOpponent: text(pass.linkedOpponent),
    })),
  };
}

export async function createPrivateDemoLink(
  snapshot: PrivateDemoSnapshot,
  ownerCode: string,
): Promise<{ url: string; expiresAt: string }> {
  const serviceUrl = text(
    Constants.expoConfig?.extra?.privateDemoServiceUrl as string | undefined,
  ).replace(/\/$/, "");
  if (!serviceUrl) {
    throw new Error("The private demo service has not been connected yet.");
  }
  const response = await fetch(`${serviceUrl}/api/demos`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ownerCode}`,
    },
    body: JSON.stringify(snapshot),
  });
  const body = (await response.json().catch(() => null)) as
    | { url?: string; expiresAt?: string; error?: string }
    | null;
  if (!response.ok || !body?.url || !body.expiresAt) {
    throw new Error(body?.error || "The private demo link could not be created.");
  }
  return { url: body.url, expiresAt: body.expiresAt };
}
