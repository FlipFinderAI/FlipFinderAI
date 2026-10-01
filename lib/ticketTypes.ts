import type { TicketSeatDetails } from "@/lib/ticketText";

export type TicketStyle = "e-ticket" | "old-school";

export const TICKET_STYLE_OPTIONS: Array<{
  value: TicketStyle;
  label: string;
}> = [
  { value: "e-ticket", label: "E-Ticket" },
  { value: "old-school", label: "Old School" },
];

export type SeasonTicket = {
  id: string;
  fingerprint: string;
  name: string;
  uri?: string;
  aspectRatio?: number;
  cropWidth?: number;
  cropHeight?: number;
  matchDate?: string | null;
  kickoffTime?: string | null;
  competition?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  /** Club this ticket belongs to. Independent from the user's Favourite Club. */
  clubName?: string | null;
  ground?: string | null;
  ticketType?: string | null;
  seasonKey: string;
  scale: number;
  boxScale: number;
  offsetX: number;
  offsetY: number;
  order?: number;
  displayStyle?: TicketStyle;
  details?: TicketSeatDetails;
  /** User accepted the recognised/selected fixture; background OCR must not
   * replace these match details on a later launch. */
  confirmedMatch?: boolean;
};
