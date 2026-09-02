import BarcodeScanner, {
  BarcodeFormat,
} from "@react-native-ml-kit/barcode-scanning";
import QRCode from "qrcode";

import { currentTicketUri } from "@/lib/ticketFiles";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jpegJs = require("jpeg-js") as {
  encode: (
    imageData: { data: Uint8Array | Buffer; width: number; height: number },
    quality?: number,
  ) => { data: Uint8Array | Buffer; width: number; height: number };
};

const ticketQrCache = new Map<string, string | null>();
const ticketQrInflight = new Map<string, Promise<string | null>>();

export async function extractTicketQrDataUri(
  uri: string,
): Promise<string | null> {
  if (uri in ticketQrCache) return ticketQrCache.get(uri) ?? null;
  const inflight = ticketQrInflight.get(uri);
  if (inflight) return inflight;
  const job = (async (): Promise<string | null> => {
    try {
      const liveUri = currentTicketUri(uri) ?? uri;
      const barcodes = await BarcodeScanner.scan(liveUri);
      const qr = barcodes.find(
        (barcode) =>
          barcode.format === BarcodeFormat.QR_CODE ||
          (!barcode.value && barcode.format === BarcodeFormat.UNKNOWN),
      );
      const value = qr?.value;
      if (!value) return null;
      const created = QRCode.create(value, { errorCorrectionLevel: "M" });
      const size = created.modules.size;
      const bits = created.modules.data;
      const quiet = 4;
      const scale = Math.max(4, Math.floor(220 / (size + quiet * 2)));
      const dim = (size + quiet * 2) * scale;
      const rgba = Buffer.alloc(dim * dim * 4, 255);
      for (let my = 0; my < size; my++) {
        for (let mx = 0; mx < size; mx++) {
          if (!bits[my * size + mx]) continue;
          const px = (mx + quiet) * scale;
          const py = (my + quiet) * scale;
          for (let dy = 0; dy < scale; dy++) {
            const rowStart = ((py + dy) * dim + px) * 4;
            for (let dx = 0; dx < scale; dx++) {
              const idx = rowStart + dx * 4;
              rgba[idx] = 17;
              rgba[idx + 1] = 16;
              rgba[idx + 2] = 11;
              rgba[idx + 3] = 255;
            }
          }
        }
      }
      const encoded = jpegJs.encode({ data: rgba, width: dim, height: dim }, 90);
      const base64 = Buffer.from(encoded.data).toString("base64");
      const dataUri = `data:image/png;base64,${base64}`;
      ticketQrCache.set(liveUri, dataUri);
      return dataUri;
    } catch (qrError) {
      console.warn("[match-ticket] qr extraction failed", qrError);
      ticketQrCache.set(uri, null);
      return null;
    } finally {
      ticketQrInflight.delete(uri);
    }
  })();
  ticketQrInflight.set(uri, job);
  return job;
}
