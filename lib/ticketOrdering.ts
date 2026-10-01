export type TicketOrderingItem = {
  id: string;
  matchDate?: string | null;
  ticketType?: string | null;
  order?: number;
};

type TicketIdentityItem = TicketOrderingItem & {
  fingerprint?: string | null;
  confirmedMatch?: boolean;
  homeTeam?: string | null;
  awayTeam?: string | null;
  competition?: string | null;
  seasonKey?: string | null;
  uri?: string | null;
};

function ticketCompleteness(ticket: TicketIdentityItem): number {
  return (
    (ticket.confirmedMatch ? 20 : 0) +
    (ticket.homeTeam?.trim() ? 4 : 0) +
    (ticket.awayTeam?.trim() ? 4 : 0) +
    (ticket.matchDate?.trim() ? 4 : 0) +
    (ticket.competition?.trim() ? 2 : 0) +
    (ticket.seasonKey?.trim() ? 2 : 0) +
    (ticket.uri?.trim() ? 1 : 0)
  );
}

/**
 * Repairs legacy/bulk-import duplicates without removing two genuinely
 * different ticket scans. Fingerprint is the scan identity; id is the safe
 * fallback for older records. The most complete copy wins.
 */
function deduplicateTicketCollection<T extends TicketIdentityItem>(items: T[]): T[] {
  const unique = new Map<string, { item: T; index: number }>();
  items.forEach((item, index) => {
    const identity = item.fingerprint?.trim() || item.id;
    const previous = unique.get(identity);
    if (!previous || ticketCompleteness(item) > ticketCompleteness(previous.item))
      unique.set(identity, { item, index: previous?.index ?? index });
  });
  return [...unique.values()]
    .sort((a, b) => a.index - b.index)
    .map(({ item }) => item);
}

function byMatchDateOldestFirst(a: TicketOrderingItem, b: TicketOrderingItem) {
  const sortableDate = (ticket: TicketOrderingItem) =>
    /^\d{4}-\d{2}-\d{2}$/.test(ticket.matchDate?.trim() ?? "")
      ? ticket.matchDate!.trim()
      : "9999-12-31";
  const aKey = sortableDate(a);
  const bKey = sortableDate(b);
  return aKey.localeCompare(bKey);
}

// Collection order (V3.6): season passes first, then match tickets oldest to
// newest by recognised match date. Never import order, filename or image name.
function byCollectionOrder(a: TicketOrderingItem, b: TicketOrderingItem) {
  const rank = (ticket: TicketOrderingItem) =>
    /season\s*ticket/i.test(ticket.ticketType ?? "")
      ? 0
      : /car\s*park|parking/i.test(ticket.ticketType ?? "")
        ? 1
        : 2;
  const rankDifference = rank(a) - rank(b);
  if (rankDifference !== 0) return rankDifference;
  const dateDifference = byMatchDateOldestFirst(a, b);
  if (dateDifference !== 0) return dateDifference;
  // Make undated/equal-date items deterministic instead of falling back to
  // the changing import-array order.
  return (a.order ?? Number.MAX_SAFE_INTEGER) -
    (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id);
}


export type TicketStyle = "e-ticket" | "old-school";

function effectiveTicketStyle(
  ticket: {
    displayStyle?: TicketStyle;
  },
  fallback?: TicketStyle,
): TicketStyle {
  return ticket.displayStyle ?? fallback ?? "e-ticket";
}


export {
  byMatchDateOldestFirst,
  byCollectionOrder,
  deduplicateTicketCollection,
  effectiveTicketStyle,
};
