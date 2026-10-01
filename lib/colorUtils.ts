export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function saturationOf(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function colourLuminance(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0;

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableTextColour(background: string) {
  return colourLuminance(background) > 0.62 ? "#111111" : "#ffffff";
}

export function visibleInkOnCream(colour: string) {
  return colourLuminance(colour) > 0.62 ? "#111111" : colour;
}
