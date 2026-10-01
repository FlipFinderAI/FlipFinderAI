export type TicketEditResult = {
  uri: string;
  width: number;
  height: number;
};

let resolver: ((result: TicketEditResult | null) => void) | null = null;

export function beginTicketEdit(): Promise<TicketEditResult | null> {
  return new Promise((resolve) => {
    resolver = resolve;
  });
}

export function completeTicketEdit(result: TicketEditResult | null) {
  const pending = resolver;
  resolver = null;
  pending?.(result);
}
