export type DemoChapterId =
  | "welcome"
  | "tickets"
  | "home"
  | "history"
  | "club"
  | "stadiums"
  | "fixtures"
  | "season"
  | "memories"
  | "matchday"
  | "exports"
  | "finish";

export type DemoScene = {
  id: string;
  chapter: DemoChapterId;
  chapterLabel: string;
  title: string;
  caption: string;
  narration: string;
  durationMs: number;
  icon:
    | "play-circle-outline"
    | "ticket-outline"
    | "albums-outline"
    | "book-outline"
    | "football-outline"
    | "location-outline"
    | "calendar-outline"
    | "calendar-number-outline"
    | "images-outline"
    | "navigate-outline"
    | "share-outline"
    | "checkmark-circle-outline";
};

export const DEMO_OWNER_NAME = "David Batty";

export const DEMO_CHAPTERS: Array<{
  id: DemoChapterId;
  label: string;
}> = [
  { id: "welcome", label: "Introduction" },
  { id: "tickets", label: "Tickets" },
  { id: "home", label: "Home" },
  { id: "history", label: "History" },
  { id: "club", label: "My Club" },
  { id: "stadiums", label: "Stadiums" },
  { id: "fixtures", label: "Fixtures" },
  { id: "season", label: "Season Tickets" },
  { id: "memories", label: "Memories" },
  { id: "matchday", label: "Matchday" },
  { id: "exports", label: "Frames & Export" },
  { id: "finish", label: "Finish" },
];

export const DEMO_SCENES: DemoScene[] = [
  {
    id: "welcome-1",
    chapter: "welcome",
    chapterLabel: "Introduction",
    title: "Welcome to Ticket Frame",
    caption:
      "This guided demonstration is completely separate from your real Ticket Frame collection.",
    narration:
      "Welcome to Ticket Frame. This guided demonstration is completely separate from the real collection and cannot alter any personal data.",
    durationMs: 6500,
    icon: "play-circle-outline",
  },
  {
    id: "welcome-2",
    chapter: "welcome",
    chapterLabel: "Introduction",
    title: "Meet David Batty",
    caption:
      "For this demonstration the supporter is David Batty. All demo information is display-only.",
    narration:
      "For this demonstration, our supporter is David Batty. Everything you see in Demo Mode is display only.",
    durationMs: 6000,
    icon: "play-circle-outline",
  },
  {
    id: "tickets-1",
    chapter: "tickets",
    chapterLabel: "Tickets",
    title: "Add a ticket",
    caption:
      "Ticket Frame can read an electronic ticket, identify the match details and prepare them for confirmation.",
    narration:
      "Start by adding an electronic ticket. Ticket Frame reads the available details and prepares the likely match for confirmation.",
    durationMs: 7000,
    icon: "ticket-outline",
  },
  {
    id: "tickets-2",
    chapter: "tickets",
    chapterLabel: "Tickets",
    title: "Match recognised",
    caption:
      "The fixture is checked against Ticket Frame Data before it becomes part of the collection.",
    narration:
      "The recognised fixture is checked against Ticket Frame Data before it becomes part of the supporter collection.",
    durationMs: 7000,
    icon: "ticket-outline",
  },
  {
    id: "tickets-3",
    chapter: "tickets",
    chapterLabel: "Tickets",
    title: "Ticket framed",
    caption:
      "The confirmed ticket becomes a permanent framed match record with fixture and result information.",
    narration:
      "Once confirmed, the ticket becomes a permanent framed match record with its fixture information and result.",
    durationMs: 7000,
    icon: "ticket-outline",
  },
  {
    id: "home-1",
    chapter: "home",
    chapterLabel: "Home",
    title: "Home",
    caption:
      "Home brings together the ticket collection, recent matches, attendance totals and season-frame presentation.",
    narration:
      "The Home screen brings together the ticket collection, recent matches, attendance totals, and season frame presentation.",
    durationMs: 7500,
    icon: "albums-outline",
  },
  {
    id: "history-1",
    chapter: "history",
    chapterLabel: "History",
    title: "Football History",
    caption:
      "History turns saved tickets into a searchable record of matches, seasons and competitions.",
    narration:
      "Football History turns saved tickets into a searchable record of matches, seasons, and competitions.",
    durationMs: 7000,
    icon: "book-outline",
  },
  {
    id: "club-1",
    chapter: "club",
    chapterLabel: "My Club",
    title: "My Club",
    caption:
      "My Club gives the supporter a focused view of their club, including current football information supplied through TFD.",
    narration:
      "My Club gives the supporter a focused view of their club, with current football information supplied through Ticket Frame Data.",
    durationMs: 7000,
    icon: "football-outline",
  },
  {
    id: "stadiums-1",
    chapter: "stadiums",
    chapterLabel: "Stadiums",
    title: "Ground Tracker",
    caption:
      "Visited stadiums are built from real saved match history so each ground links back to the tickets from those visits.",
    narration:
      "Ground Tracker builds visited stadiums from saved match history, and each ground links back to the tickets from those visits.",
    durationMs: 7500,
    icon: "location-outline",
  },
  {
    id: "fixtures-1",
    chapter: "fixtures",
    chapterLabel: "Fixtures",
    title: "Fixtures and results",
    caption:
      "Fixtures, results and tables come through the Ticket Frame Data layer rather than being tied directly to one provider.",
    narration:
      "Fixtures, results, and tables come through the Ticket Frame Data layer rather than being tied directly to one football provider.",
    durationMs: 7500,
    icon: "calendar-outline",
  },
  {
    id: "season-1",
    chapter: "season",
    chapterLabel: "Season Tickets",
    title: "Season-ticket attendance",
    caption:
      "Home fixtures can hold attendance, match photos and memories behind the individual fixture.",
    narration:
      "Season ticket home fixtures can hold attendance, match photos, and memories behind each individual fixture.",
    durationMs: 7500,
    icon: "calendar-number-outline",
  },
  {
    id: "memories-1",
    chapter: "memories",
    chapterLabel: "Memories",
    title: "Match memories",
    caption:
      "Photos and videos can become part of the match record. This demo uses no personal media containing identifiable faces.",
    narration:
      "Photos and videos can become part of the match record. This demonstration uses no personal media containing identifiable faces.",
    durationMs: 7500,
    icon: "images-outline",
  },
  {
    id: "matchday-1",
    chapter: "matchday",
    chapterLabel: "Matchday",
    title: "Matchday Experience",
    caption:
      "Matchday tools can help with the stadium visit while keeping the permanent ticket and memory record together.",
    narration:
      "Matchday Experience provides useful tools around the stadium visit while keeping the permanent ticket and memory record together.",
    durationMs: 7500,
    icon: "navigate-outline",
  },
  {
    id: "exports-1",
    chapter: "exports",
    chapterLabel: "Frames & Export",
    title: "Keep and share the collection",
    caption:
      "Season frames and ticket presentations can be produced at high quality for photo, print and PDF output.",
    narration:
      "Season frames and ticket presentations can be produced at high quality for photo, print, and PDF output.",
    durationMs: 7500,
    icon: "share-outline",
  },
  {
    id: "finish-1",
    chapter: "finish",
    chapterLabel: "Finish",
    title: "Your football life, framed",
    caption:
      "Ticket Frame brings tickets, matches, memories, stadiums and football data together in one personal archive.",
    narration:
      "Ticket Frame brings tickets, matches, memories, stadiums, and football data together in one personal archive.",
    durationMs: 8000,
    icon: "checkmark-circle-outline",
  },
];
