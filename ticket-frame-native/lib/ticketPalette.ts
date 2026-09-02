import { Buffer } from "buffer";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { rgbToHex, saturationOf } from "@/lib/colorUtils";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jpegJs = require("jpeg-js") as {
  decode: (
    data: Uint8Array,
    opts?: { useImageData?: boolean; maxMemoryUsageInMB?: number },
  ) => { data: Uint8ClampedArray | Buffer; width: number; height: number };
};

export type TicketPalette = { primary: string; secondary: string };

const ticketPaletteCache = new Map<string, TicketPalette>();
const ticketPaletteInflight = new Map<string, Promise<TicketPalette>>();

export async function extractTicketPalette(
  uri: string,
  fallbackPrimary: string,
  fallbackSecondary: string,
): Promise<TicketPalette> {
  const cached = ticketPaletteCache.get(uri);
  if (cached) return cached;
  const inflight = ticketPaletteInflight.get(uri);
  if (inflight) return inflight;
  const job = (async (): Promise<TicketPalette> => {
    try {
      const context = ImageManipulator.manipulate(uri);
      context.resize({ width: 48 });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 0.8,
        format: SaveFormat.JPEG,
        base64: true,
      });
      if (!saved.base64) throw new Error("no base64");
      const buffer = Buffer.from(saved.base64, "base64");
      const decoded = jpegJs.decode(buffer, { maxMemoryUsageInMB: 256 });
      const { data, width, height } = decoded;
      type Bucket = { count: number; r: number; g: number; b: number };
      const buckets = new Map<number, Bucket>();
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let total = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          sumR += r;
          sumG += g;
          sumB += b;
          total++;
          const sat = saturationOf(r, g, b);
          const lum = (r * 299 + g * 587 + b * 114) / 1000;
          if (sat < 0.2 || lum < 28 || lum > 235) continue;
          const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          const bucket = buckets.get(key);
          if (bucket) {
            bucket.count++;
            bucket.r += r;
            bucket.g += g;
            bucket.b += b;
          } else {
            buckets.set(key, { count: 1, r, g, b });
          }
        }
      }
      if (!total) throw new Error("empty");
      const ranked = [...buckets.values()].sort((a, b) => b.count - a.count);
      const first = ranked[0];
      if (!first) throw new Error("flat");
      const second = ranked.find((bucket) => {
        const r1 = bucket.r / bucket.count;
        const g1 = bucket.g / bucket.count;
        const b1 = bucket.b / bucket.count;
        const r0 = first.r / first.count;
        const g0 = first.g / first.count;
        const b0 = first.b / first.count;
        const dist = Math.abs(r1 - r0) + Math.abs(g1 - g0) + Math.abs(b1 - b0);
        return dist > 90;
      });
      const avg = rgbToHex(sumR / total, sumG / total, sumB / total);
      const palette: TicketPalette = {
        primary: rgbToHex(first.r / first.count, first.g / first.count, first.b / first.count),
        secondary: second
          ? rgbToHex(second.r / second.count, second.g / second.count, second.b / second.count)
          : avg,
      };
      ticketPaletteCache.set(uri, palette);
      return palette;
    } catch {
      return {
        primary: fallbackPrimary,
        secondary: fallbackSecondary,
      };
    } finally {
      ticketPaletteInflight.delete(uri);
    }
  })();
  ticketPaletteInflight.set(uri, job);
  return job;
}
