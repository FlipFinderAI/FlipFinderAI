export function ticketGridShape(ticketCount: number) {
  const columns =
    ticketCount <= 2 ? 1 : ticketCount <= 4 ? 2 : ticketCount <= 9 ? 3 : 4;
  const rows = Math.max(1, Math.ceil(ticketCount / columns));
  return { columns, rows };
}

export function ticketGridPercentSize(ticketCount: number, gapPercent = 0.7) {
  const { columns, rows } = ticketGridShape(ticketCount);
  return {
    columns,
    rows,
    tileWidth: `${100 / columns - gapPercent}%` as `${number}%`,
    tileHeight: `${100 / rows - gapPercent}%` as `${number}%`,
  };
}
