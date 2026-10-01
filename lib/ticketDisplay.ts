export function fitTicketDisplaySize(
  aspectRatio: number | undefined,
  viewW: number,
  viewH: number,
): { width: number; height: number } {
  if (!viewW || !viewH) return { width: 0, height: 0 };
  const ratio =
    aspectRatio && Number.isFinite(aspectRatio) && aspectRatio > 0
      ? aspectRatio
      : 0;
  if (!ratio) return { width: viewW, height: viewH };
  let width = viewW;
  let height = width / ratio;
  if (height > viewH) {
    height = viewH;
    width = height * ratio;
  }
  return { width, height };
}
