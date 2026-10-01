// V3.7.1 — Demo Mode data namespace.
//
// ─────────────────────────────────────────────────────────────────────────
// ISOLATION CONTRACT
//
// Everything exported from this file is DISPLAY-ONLY sample data.
// It must never be:
//   • written to AsyncStorage or any real storage key
//   • inserted into the user's collection (userTickets / tickets state)
//   • counted in seasons, grounds visited, statistics, achievements,
//     history, exports or print output
//
// Namespace separation:
//   demoTickets / demoMatches / demoGrounds  ← this file (sample only)
//   userTickets / attendanceHistory / groundVisits ← live in app/index.tsx
//     and are persisted under "ticket-frame.*" keys. No code path may mix
//     the two; Demo Mode components must not receive collection setters.
// ─────────────────────────────────────────────────────────────────────────

export type DemoTicket = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  venue: string;
  dateLabel: string;
  kickoffLabel: string;
  season: string;
  matchDate: string;
  gateTime: string;
  seat: { stand: string; block: string; row: string; seat: string };
  ticketNo: string;
  category: string;
  price: string;
  club: { name: string; primary: string; secondary: string };
};

export type DemoMatch = {
  ticketId: string;
  homeTeam: string;
  awayTeam: string;
  scoreHome: number;
  scoreAway: number;
  competition: string;
  season: string;
  matchDate: string;
};

export type DemoGround = {
  ticketId: string;
  name: string;
  city: string;
  country: string;
};

/** Display-only sample tickets — one per league tier. */
export const demoTickets: DemoTicket[] = [
  {
    id: "demo-pl",
    homeTeam: "Everton",
    awayTeam: "Leeds United",
    competition: "Premier League",
    venue: "Hill Dickinson Stadium",
    dateLabel: "Sat 26 Jan",
    kickoffLabel: "20:00",
    season: "2025/26",
    matchDate: "2026-01-26",
    gateTime: "18:30",
    seat: { stand: "South Stand", block: "12", row: "K", seat: "044" },
    ticketNo: "EFC-260126-08817",
    category: "Adult",
    price: "\u00a342.50",
    club: { name: "Everton", primary: "#003399", secondary: "#ffffff" },
  },
  {
    id: "demo-championship",
    homeTeam: "Sheffield Wednesday",
    awayTeam: "Preston North End",
    competition: "Championship",
    venue: "Hillsborough Stadium",
    dateLabel: "Tue 03 Feb",
    kickoffLabel: "19:45",
    season: "2025/26",
    matchDate: "2026-02-03",
    gateTime: "18:15",
    seat: { stand: "Kop", block: "C", row: "11", seat: "128" },
    ticketNo: "SWFC-260203-02451",
    category: "Adult",
    price: "\u00a330.00",
    club: { name: "Sheffield Wednesday", primary: "#005eb8", secondary: "#ffffff" },
  },
  {
    id: "demo-scottish",
    homeTeam: "Heart of Midlothian",
    awayTeam: "Kilmarnock",
    competition: "Scottish Premiership",
    venue: "Tynecastle Park",
    dateLabel: "Sat 21 Feb",
    kickoffLabel: "15:00",
    season: "2025/26",
    matchDate: "2026-02-21",
    gateTime: "13:45",
    seat: { stand: "Gorgie Stand", block: "M", row: "F", seat: "032" },
    ticketNo: "HMFC-260221-00764",
    category: "Adult",
    price: "\u00a328.00",
    club: { name: "Heart of Midlothian", primary: "#7c2128", secondary: "#f2d29b" },
  },
  {
    id: "demo-league-two",
    homeTeam: "Salford City",
    awayTeam: "Mansfield Town",
    competition: "League Two",
    venue: "The Peninsula Stadium",
    dateLabel: "Sat 07 Mar",
    kickoffLabel: "12:30",
    season: "2025/26",
    matchDate: "2026-03-07",
    gateTime: "11:30",
    seat: { stand: "West Stand", block: "B", row: "H", seat: "019" },
    ticketNo: "SCFC-260307-00932",
    category: "Adult",
    price: "\u00a325.00",
    club: { name: "Salford City", primary: "#b30838", secondary: "#f9b233" },
  },
  {
    id: "demo-national",
    homeTeam: "York City",
    awayTeam: "Forest Green Rovers",
    competition: "National League",
    venue: "The LNER Community Stadium",
    dateLabel: "Sat 14 Mar",
    kickoffLabel: "15:00",
    season: "2025/26",
    matchDate: "2026-03-14",
    gateTime: "13:30",
    seat: { stand: "West Stand", block: "22", row: "D", seat: "051" },
    ticketNo: "YCFC-260314-00410",
    category: "Adult",
    price: "\u00a322.00",
    club: { name: "York City", primary: "#c8102e", secondary: "#f9e300" },
  },
];

/** Display-only sample match records aligned to demoTickets by id. */
export const demoMatches: readonly DemoMatch[] = [
  {
    ticketId: "demo-pl",
    homeTeam: "Everton",
    awayTeam: "Leeds United",
    scoreHome: 1,
    scoreAway: 1,
    competition: "Premier League",
    season: "2025/26",
    matchDate: "2026-01-26",
  },
  {
    ticketId: "demo-championship",
    homeTeam: "Sheffield Wednesday",
    awayTeam: "Preston North End",
    scoreHome: 2,
    scoreAway: 0,
    competition: "Championship",
    season: "2025/26",
    matchDate: "2026-02-03",
  },
  {
    ticketId: "demo-scottish",
    homeTeam: "Heart of Midlothian",
    awayTeam: "Kilmarnock",
    scoreHome: 3,
    scoreAway: 1,
    competition: "Scottish Premiership",
    season: "2025/26",
    matchDate: "2026-02-21",
  },
  {
    ticketId: "demo-league-two",
    homeTeam: "Salford City",
    awayTeam: "Mansfield Town",
    scoreHome: 0,
    scoreAway: 1,
    competition: "League Two",
    season: "2025/26",
    matchDate: "2026-03-07",
  },
  {
    ticketId: "demo-national",
    homeTeam: "York City",
    awayTeam: "Forest Green Rovers",
    scoreHome: 2,
    scoreAway: 2,
    competition: "National League",
    season: "2025/26",
    matchDate: "2026-03-14",
  },
];

/** Display-only sample ground records aligned to demoTickets by id. */
export const demoGrounds: readonly DemoGround[] = [
  {
    ticketId: "demo-pl",
    name: "Hill Dickinson Stadium",
    city: "Liverpool",
    country: "England",
  },
  {
    ticketId: "demo-championship",
    name: "Hillsborough Stadium",
    city: "Sheffield",
    country: "England",
  },
  {
    ticketId: "demo-scottish",
    name: "Tynecastle Park",
    city: "Edinburgh",
    country: "Scotland",
  },
  {
    ticketId: "demo-league-two",
    name: "The Peninsula Stadium",
    city: "Salford",
    country: "England",
  },
  {
    ticketId: "demo-national",
    name: "The LNER Community Stadium",
    city: "York",
    country: "England",
  },
];

/** Demo Mode tier picker — tier label → sample ticket id. */
export const DEMO_TIERS: Array<{ label: string; sublabel: string; ticketId: string }> = [
  { label: "Premier League", sublabel: "Hill Dickinson Stadium", ticketId: "demo-pl" },
  { label: "Championship", sublabel: "Hillsborough Stadium", ticketId: "demo-championship" },
  { label: "Scottish Premiership", sublabel: "Tynecastle Park", ticketId: "demo-scottish" },
  { label: "League Two", sublabel: "The Peninsula Stadium", ticketId: "demo-league-two" },
  { label: "Non-League", sublabel: "National League · York", ticketId: "demo-national" },
];

export function demoTicketById(ticketId: string): DemoTicket | undefined {
  return demoTickets.find((ticket) => ticket.id === ticketId);
}
