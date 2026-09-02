import * as FileSystem from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { Image } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jpegJs = require("jpeg-js") as {
  decode: (
    data: Uint8Array,
    opts?: { useImageData?: boolean; maxMemoryUsageInMB?: number },
  ) => { data: Uint8ClampedArray | Buffer; width: number; height: number };
};

export type CropBox = { x: number; y: number; w: number; h: number };

export async function decodeImagePixels(
  uri: string,
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  try {
    let target = uri;
    if (!uri.toLowerCase().includes(".jpg") && !uri.toLowerCase().includes(".jpeg")) {
      const context = ImageManipulator.manipulate(uri);
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 1,
        format: SaveFormat.JPEG,
      });
      target = saved.uri;
    }
    const base64 = await FileSystem.readAsStringAsync(target, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length < 8) return null;
    const decoded = jpegJs.decode(buffer, { maxMemoryUsageInMB: 512 });
    return {
      data: new Uint8Array(decoded.data),
      width: decoded.width,
      height: decoded.height,
    };
  } catch (decodeError) {
    console.warn("[ticket-import] pixel decode failed", decodeError);
    return null;
  }
}

export function detectContentBounds(
  pixels: { data: Uint8Array; width: number; height: number },
): CropBox | null {
  const { data, width, height } = pixels;
  const strideX = Math.max(1, Math.floor(width / 240));
  const strideY = Math.max(1, Math.floor(height / 400));
  const sampleAt = (px: number, py: number) => {
    const idx = (py * width + px) * 4;
    return [data[idx], data[idx + 1], data[idx + 2]] as const;
  };
  const corners = [
    sampleAt(2, 2),
    sampleAt(width - 3, 2),
    sampleAt(2, height - 3),
    sampleAt(width - 3, height - 3),
  ];
  const bg = [0, 1, 2].map((c) =>
    corners.reduce((sum, corner) => sum + corner[c], 0) / 4,
  );
  const tolerance = 26;
  const isContent = (px: number, py: number) => {
    const [r, g, b] = sampleAt(px, py);
    return (
      Math.abs(r - bg[0]) > tolerance ||
      Math.abs(g - bg[1]) > tolerance ||
      Math.abs(b - bg[2]) > tolerance
    );
  };
  const rowHits: number[] = [];
  for (let py = 0; py < height; py += strideY) {
    let hits = 0;
    for (let px = 0; px < width; px += strideX)
      if (isContent(px, py)) hits++;
    rowHits.push(hits);
  }
  const minRowHits = Math.max(3, Math.floor((width / strideX) * 0.02));
  type Block = { start: number; end: number };
  const blocks: Block[] = [];
  let runStart: number | null = null;
  rowHits.forEach((hits, i) => {
    if (hits >= minRowHits && runStart === null) runStart = i;
    if ((hits < minRowHits || i === rowHits.length - 1) && runStart !== null) {
      blocks.push({ start: runStart, end: i });
      runStart = null;
    }
  });
  if (!blocks.length) return null;
  const bestBlock = blocks.reduce((a, b) =>
    b.end - b.start > a.end - a.start ? b : a,
  );
  const topPx = bestBlock.start * strideY;
  const bottomPx = Math.min(height, (bestBlock.end + 1) * strideY);
  let left = width;
  let right = 0;
  for (let py = topPx; py < bottomPx; py += strideY) {
    for (let px = 0; px < width; px += strideX) {
      if (isContent(px, py)) {
        if (px < left) left = px;
        break;
      }
    }
    for (let px = width - 1; px >= 0; px -= strideX) {
      if (isContent(px, py)) {
        if (px > right) right = px;
        break;
      }
    }
  }
  if (right <= left) return null;
  const box = { x: left, y: topPx, w: right - left, h: bottomPx - topPx };
  if (box.w > width * 0.97 && box.h > height * 0.97) return null;
  if (box.w < width * 0.15 || box.h < height * 0.15) return null;
  return box;
}

export function boundsToBox(bounds: unknown): CropBox | null {
  const b = bounds as
    | { left?: number; top?: number; x?: number; y?: number; width?: number; height?: number; right?: number; bottom?: number }
    | null
    | undefined;
  if (!b) return null;
  const x = Number(b.left ?? b.x ?? 0);
  const y = Number(b.top ?? b.y ?? 0);
  const w = Number(b.width ?? (b.right != null ? b.right - x : 0));
  const h = Number(b.height ?? (b.bottom != null ? b.bottom - y : 0));
  if (!Number.isFinite(x) || !Number.isFinite(y) || w <= 0 || h <= 0)
    return null;
  return { x, y, w, h };
}

export async function autoCropTicketScreenshot(
  uri: string,
): Promise<{ uri: string; cropRect?: CropBox }> {
  const dims = await new Promise<{ w: number; h: number }>((resolve) => {
    Image.getSize(uri, (w, h) => resolve({ w, h }), () => resolve({ w: 0, h: 0 }));
  });
  if (!dims.w || !dims.h) return { uri };

  const pixels = await decodeImagePixels(uri);
  if (pixels) {
    const detected = detectContentBounds(pixels);
    // A suggested crop must retain a substantial part of the source. A small
    // detected text/logo island is not safe enough to treat as the ticket.
    if (
      detected &&
      detected.w >= dims.w * 0.45 &&
      detected.h >= dims.h * 0.3
    ) {
      const padPx = Math.round(Math.max(detected.w, detected.h) * 0.015);
      // Keep extra space above the detected ticket edge. Ticket designs often
      // have a half-moon/notch crossing that edge, which should remain fully
      // visible in the suggested crop instead of sitting on the crop line.
      const topPadPx = Math.round(
        Math.max(detected.w, detected.h) * 0.045,
      );
      const pixelOriginX = Math.max(0, detected.x - padPx);
      const pixelOriginY = Math.max(0, detected.y - topPadPx);
      const pixelWidth = Math.min(dims.w - pixelOriginX, detected.w + padPx * 2);
      const pixelHeight = Math.min(
        dims.h - pixelOriginY,
        detected.h + topPadPx + padPx,
      );
      console.log(
        `[ticket-import] pixel-crop ${dims.w}x${dims.h} -> ${pixelWidth}x${pixelHeight} at (${pixelOriginX}, ${pixelOriginY})`,
      );
      return {
        uri,
        cropRect: {
          x: pixelOriginX,
          y: pixelOriginY,
          w: pixelWidth,
          h: pixelHeight,
        },
      };
    }
  }

  const recognition = await TextRecognition.recognize(uri).catch(() => null);
  const boxes: CropBox[] = [];
  for (const block of recognition?.blocks ?? []) {
    const lineSource =
      ((block as { lines?: unknown[] }).lines as
        | Array<{ bounds?: unknown }>
        | undefined) ?? [block];
    for (const entry of lineSource) {
      const box = boundsToBox(
        (entry as { frame?: unknown }).frame ??
          (entry as { bounds?: unknown }).bounds ??
          (entry as { boundingBox?: unknown }).boundingBox,
      );
      if (box) boxes.push(box);
    }
  }
  if (boxes.length < 4) return { uri };

  boxes.sort((a, b) => a.y - b.y);
  const gapLimit = dims.h * 0.06;
  const clusters: CropBox[][] = [];
  let cluster: CropBox[] = [boxes[0]];
  let clusterBottom = boxes[0].y + boxes[0].h;
  for (const box of boxes.slice(1)) {
    if (box.y - clusterBottom <= gapLimit) {
      cluster.push(box);
    } else {
      clusters.push(cluster);
      cluster = [box];
    }
    clusterBottom = Math.max(clusterBottom, box.y + box.h);
  }
  clusters.push(cluster);

  let best: CropBox[] | null = null;
  let bestArea = 0;
  for (const candidate of clusters) {
    const area = candidate.reduce((sum, box) => sum + box.w * box.h, 0);
    if (area > bestArea) {
      best = candidate;
      bestArea = area;
    }
  }
  if (!best) return { uri };

  const absorbGap = dims.h * 0.15;
  const groups: CropBox[][] = [best];
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; !changed && i < groups.length; i++) {
      for (let j = i + 1; !changed && j < groups.length; j++) {
        const aTop = Math.min(...groups[i].map((b) => b.y));
        const aBottom = Math.max(...groups[i].map((b) => b.y + b.h));
        const bTop = Math.min(...groups[j].map((b) => b.y));
        const bBottom = Math.max(...groups[j].map((b) => b.y + b.h));
        const gap =
          bTop > aBottom
            ? bTop - aBottom
            : aTop > bBottom
              ? aTop - bBottom
              : 0;
        if (gap <= absorbGap) {
          groups[i] = [...groups[i], ...groups[j]];
          groups.splice(j, 1);
          changed = true;
        }
      }
    }
  }
  const region = groups.flat();

  const left = Math.min(...region.map((b) => b.x));
  const right = Math.max(...region.map((b) => b.x + b.w));
  const regionTop = Math.min(...region.map((b) => b.y));
  const regionBottom = Math.max(...region.map((b) => b.y + b.h));

  const padX = (right - left) * 0.08;
  const emptyMargin = dims.h * 0.18;
  const originX = Math.max(0, Math.floor(left - padX));
  const originY =
    regionTop > emptyMargin
      ? Math.max(0, Math.floor(regionTop - dims.h * 0.04))
      : 0;
  const bottomY =
    dims.h - regionBottom > emptyMargin
      ? Math.min(dims.h, Math.ceil(regionBottom + dims.h * 0.1))
      : dims.h;
  const width = Math.min(dims.w - originX, Math.ceil(right + padX) - originX);
  const height = bottomY - originY;

  if (
    width < dims.w * 0.45 ||
    height < dims.h * 0.3 ||
    (width >= dims.w * 0.995 && height >= dims.h * 0.995)
  )
    return { uri };

  console.log(
    `[ticket-import] auto-crop ${dims.w}x${dims.h} -> ${width}x${height} at (${originX}, ${originY})`,
  );
  return { uri, cropRect: { x: originX, y: originY, w: width, h: height } };
}
