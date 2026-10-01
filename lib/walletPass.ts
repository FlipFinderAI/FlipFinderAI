import { NativeModules } from "react-native";
import { strFromU8, unzipSync } from "fflate";

type WalletNativePass = {
  name: string;
  base64: string;
};

export type WalletEmbeddedImage = {
  fileName: string;
  mimeType: "image/png";
  base64: string;
};

export type WalletPassDisplayField = {
  key: string | null;
  label: string;
  value: string;
};

export type WalletPassAssets = {
  logo: WalletEmbeddedImage | null;
  icon: WalletEmbeddedImage | null;
  strip: WalletEmbeddedImage | null;
  thumbnail: WalletEmbeddedImage | null;
  background: WalletEmbeddedImage | null;
  footer: WalletEmbeddedImage | null;
};

export type WalletPassEvidence = {
  fileName: string;
  description: string | null;
  organizationName: string | null;
  logoText: string | null;
  relevantDate: string | null;
  expirationDate: string | null;
  serialNumber: string | null;
  passTypeIdentifier: string | null;
  teamIdentifier: string | null;

  backgroundColor: string | null;
  foregroundColor: string | null;
  labelColor: string | null;

  headerFields: WalletPassDisplayField[];
  primaryFields: WalletPassDisplayField[];
  secondaryFields: WalletPassDisplayField[];
  auxiliaryFields: WalletPassDisplayField[];

  barcodeMessage: string | null;
  barcodeFormat: string | null;
  barcodeAltText: string | null;

  fieldText: string[];
  barcodeText: string[];

  locations: Array<{
    latitude: number;
    longitude: number;
    relevantText: string | null;
  }>;

  assets: WalletPassAssets;
  embeddedImage: WalletEmbeddedImage | null;
};

const walletModule = NativeModules.WalletPassModule;

const decodeBase64 = (value: string): Uint8Array => {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  const clean = value.replace(/[^A-Za-z0-9+/=]/g, "");
  const output: number[] = [];

  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    if (char === "=") break;

    const index = alphabet.indexOf(char);
    if (index < 0) continue;

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(output);
};

const encodeBase64 = (bytes: Uint8Array): string => {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  let result = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const c = index + 2 < bytes.length ? bytes[index + 2] : 0;

    const triple = (a << 16) | (b << 8) | c;

    result += alphabet[(triple >> 18) & 63];
    result += alphabet[(triple >> 12) & 63];
    result +=
      index + 1 < bytes.length
        ? alphabet[(triple >> 6) & 63]
        : "=";
    result +=
      index + 2 < bytes.length
        ? alphabet[triple & 63]
        : "=";
  }

  return result;
};

const fieldText = (pass: any): string[] => {
  const passStyles = [
    pass?.eventTicket,
    pass?.generic,
    pass?.boardingPass,
    pass?.coupon,
    pass?.storeCard,
  ];

  const fieldNames = [
    "headerFields",
    "primaryFields",
    "secondaryFields",
    "auxiliaryFields",
    "backFields",
  ];

  const values: string[] = [];

  for (const style of passStyles) {
    if (!style || typeof style !== "object") continue;

    for (const fieldName of fieldNames) {
      const group = style[fieldName];

      if (!Array.isArray(group)) continue;

      for (const field of group) {
        if (!field || typeof field !== "object") continue;

        const label =
          typeof field.label === "string" ? field.label.trim() : "";

        const rawValue = field.value;

        const value =
          typeof rawValue === "string" ||
          typeof rawValue === "number" ||
          typeof rawValue === "boolean"
            ? String(rawValue).trim()
            : "";

        if (label && value) {
          values.push(`${label}: ${value}`);
        } else if (value) {
          values.push(value);
        }
      }
    }
  }

  return [...new Set(values.filter(Boolean))];
};

const walletDisplayFields = (
  pass: any,
  fieldName: string,
): WalletPassDisplayField[] => {
  const styles = [
    pass?.eventTicket,
    pass?.generic,
    pass?.boardingPass,
    pass?.coupon,
    pass?.storeCard,
  ];

  const result: WalletPassDisplayField[] = [];

  for (const style of styles) {
    const fields = style?.[fieldName];
    if (!Array.isArray(fields)) continue;

    for (const field of fields) {
      if (!field || typeof field !== "object") continue;

      const rawValue = field.value;
      const value =
        typeof rawValue === "string" ||
        typeof rawValue === "number" ||
        typeof rawValue === "boolean"
          ? String(rawValue).trim()
          : "";

      if (!value) continue;

      result.push({
        key:
          typeof field.key === "string" && field.key.trim()
            ? field.key.trim()
            : null,
        label:
          typeof field.label === "string"
            ? field.label.trim()
            : "",
        value,
      });
    }
  }

  return result;
};

const primaryBarcode = (pass: any): any | null => {
  if (Array.isArray(pass?.barcodes) && pass.barcodes.length) {
    return pass.barcodes[0];
  }

  if (pass?.barcode && typeof pass.barcode === "object") {
    return pass.barcode;
  }

  return null;
};

const barcodeText = (pass: any): string[] => {
  const barcodes = [
    ...(Array.isArray(pass?.barcodes) ? pass.barcodes : []),
    ...(pass?.barcode && typeof pass.barcode === "object"
      ? [pass.barcode]
      : []),
  ];

  const values: string[] = [];

  for (const barcode of barcodes) {
    if (!barcode || typeof barcode !== "object") continue;

    if (typeof barcode.altText === "string" && barcode.altText.trim()) {
      values.push(barcode.altText.trim());
    }

    if (typeof barcode.message === "string" && barcode.message.trim()) {
      values.push(barcode.message.trim());
    }
  }

  return [...new Set(values)];
};

const formatWalletRelevantDate = (value: string | null): string[] => {
  if (!value) return [];

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return [value];
  }

  const day = parsed.getDate();
  const month = parsed.toLocaleString("en-GB", { month: "long" });
  const year = parsed.getFullYear();
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return [
    `${day} ${month} ${year}`,
    `${hours}:${minutes}`,
  ];
};

const findWalletAsset = (
  archive: Record<string, Uint8Array>,
  baseName: string,
): WalletEmbeddedImage | null => {
  const names = Object.keys(archive);

  const priorities = [
    `${baseName}@3x.png`,
    `${baseName}@2x.png`,
    `${baseName}.png`,
  ];

  for (const wanted of priorities) {
    const exact = names.find(
      (name) => name.toLowerCase() === wanted.toLowerCase(),
    );

    const localized =
      exact ??
      names.find((name) =>
        name.toLowerCase().endsWith(`/${wanted.toLowerCase()}`),
      );

    if (!localized) continue;

    const bytes = archive[localized];
    if (!bytes?.length) continue;

    return {
      fileName: localized,
      mimeType: "image/png",
      base64: encodeBase64(bytes),
    };
  }

  return null;
};

const findBestEmbeddedImage = (
  archive: Record<string, Uint8Array>,
): WalletEmbeddedImage | null => {
  const names = Object.keys(archive);

  const priorities = [
    "strip@3x.png",
    "strip@2x.png",
    "strip.png",
    "thumbnail@3x.png",
    "thumbnail@2x.png",
    "thumbnail.png",
    "background@3x.png",
    "background@2x.png",
    "background.png",
    "footer@3x.png",
    "footer@2x.png",
    "footer.png",
  ];

  for (const wanted of priorities) {
    const exact = names.find(
      (name) => name.toLowerCase() === wanted.toLowerCase(),
    );

    const localized =
      exact ??
      names.find((name) =>
        name.toLowerCase().endsWith(`/${wanted.toLowerCase()}`),
      );

    if (!localized) continue;

    const bytes = archive[localized];

    if (!bytes?.length) continue;

    return {
      fileName: localized,
      mimeType: "image/png",
      base64: encodeBase64(bytes),
    };
  }

  return null;
};

export function walletPassEvidenceToRecognitionText(
  evidence: WalletPassEvidence,
): string {
  const lines = [
    evidence.description,
    evidence.organizationName,
    evidence.logoText,
    ...formatWalletRelevantDate(evidence.relevantDate),
    ...evidence.fieldText,
    ...evidence.barcodeText,
    ...evidence.locations
      .map((location) => location.relevantText)
      .filter((value): value is string => Boolean(value?.trim())),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return [...new Set(lines)].join("\n");
}

export async function listPendingWalletPasses(): Promise<
  Array<{ name: string; uri?: string; size?: number; modifiedAt?: number }>
> {
  if (!walletModule?.listPendingPasses) return [];
  return walletModule.listPendingPasses();
}

export async function readWalletPassEvidence(
  fileName: string,
): Promise<WalletPassEvidence> {
  if (!walletModule?.readPendingPass) {
    throw new Error("Wallet pass reader is unavailable.");
  }

  const nativePass = (await walletModule.readPendingPass(
    fileName,
  )) as WalletNativePass;

  const archive = unzipSync(decodeBase64(nativePass.base64));
  const passJson = archive["pass.json"];

  if (!passJson) {
    throw new Error("Wallet pass does not contain pass.json.");
  }

  const pass = JSON.parse(strFromU8(passJson));

  const locations = Array.isArray(pass?.locations)
    ? pass.locations
        .map((location: any) => ({
          latitude: Number(location?.latitude),
          longitude: Number(location?.longitude),
          relevantText:
            typeof location?.relevantText === "string"
              ? location.relevantText
              : null,
        }))
        .filter(
          (location: any) =>
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude),
        )
    : [];

  return {
    fileName: nativePass.name,

    description:
      typeof pass?.description === "string"
        ? pass.description
        : null,

    organizationName:
      typeof pass?.organizationName === "string"
        ? pass.organizationName
        : null,

    logoText:
      typeof pass?.logoText === "string"
        ? pass.logoText
        : null,

    relevantDate:
      typeof pass?.relevantDate === "string"
        ? pass.relevantDate
        : null,

    expirationDate:
      typeof pass?.expirationDate === "string"
        ? pass.expirationDate
        : null,

    serialNumber:
      typeof pass?.serialNumber === "string"
        ? pass.serialNumber
        : null,

    passTypeIdentifier:
      typeof pass?.passTypeIdentifier === "string"
        ? pass.passTypeIdentifier
        : null,

    teamIdentifier:
      typeof pass?.teamIdentifier === "string"
        ? pass.teamIdentifier
        : null,

    backgroundColor:
      typeof pass?.backgroundColor === "string"
        ? pass.backgroundColor
        : null,

    foregroundColor:
      typeof pass?.foregroundColor === "string"
        ? pass.foregroundColor
        : null,

    labelColor:
      typeof pass?.labelColor === "string"
        ? pass.labelColor
        : null,

    headerFields: walletDisplayFields(pass, "headerFields"),
    primaryFields: walletDisplayFields(pass, "primaryFields"),
    secondaryFields: walletDisplayFields(pass, "secondaryFields"),
    auxiliaryFields: walletDisplayFields(pass, "auxiliaryFields"),

    barcodeMessage:
      typeof primaryBarcode(pass)?.message === "string"
        ? primaryBarcode(pass).message
        : null,

    barcodeFormat:
      typeof primaryBarcode(pass)?.format === "string"
        ? primaryBarcode(pass).format
        : null,

    barcodeAltText:
      typeof primaryBarcode(pass)?.altText === "string"
        ? primaryBarcode(pass).altText
        : null,

    fieldText: fieldText(pass),
    barcodeText: barcodeText(pass),
    locations,

    assets: {
      logo: findWalletAsset(archive, "logo"),
      icon: findWalletAsset(archive, "icon"),
      strip: findWalletAsset(archive, "strip"),
      thumbnail: findWalletAsset(archive, "thumbnail"),
      background: findWalletAsset(archive, "background"),
      footer: findWalletAsset(archive, "footer"),
    },

    embeddedImage: findBestEmbeddedImage(archive),
  };
}

export async function removePendingWalletPass(
  fileName: string,
): Promise<void> {
  if (!walletModule?.removePendingPass) return;
  await walletModule.removePendingPass(fileName);
}

export type SharedTicketScreenshot = {
  name: string;
  uri: string;
  size?: number;
  modifiedAt?: number;
};

export async function listPendingTicketScreenshots(): Promise<
  SharedTicketScreenshot[]
> {
  if (!walletModule?.listPendingScreenshots) return [];
  return walletModule.listPendingScreenshots();
}

export async function readPendingTicketScreenshot(
  fileName: string,
): Promise<SharedTicketScreenshot & { base64: string }> {
  if (!walletModule?.readPendingScreenshot) {
    throw new Error("Shared ticket screenshot reader is unavailable.");
  }

  return walletModule.readPendingScreenshot(fileName);
}

export async function removePendingTicketScreenshot(
  fileName: string,
): Promise<void> {
  if (!walletModule?.removePendingScreenshot) return;
  await walletModule.removePendingScreenshot(fileName);
}



export type QueuedWalletScreenshotsResult = {
  queued: number;
  skipped: number;
};

export async function queueWalletScreenshotsSince(
  sinceMs: number,
): Promise<QueuedWalletScreenshotsResult> {
  if (!walletModule?.queueScreenshotsSince) {
    throw new Error(
      "Wallet screenshot session importer is unavailable.",
    );
  }

  return walletModule.queueScreenshotsSince(sinceMs);
}


export type WalletTicketCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  imageWidth?: number;
  imageHeight?: number;
};

export async function detectWalletTicketBounds(
  uri: string,
): Promise<WalletTicketCropRect | null> {
  if (!walletModule?.detectWalletTicketBounds) {
    return null;
  }

  return walletModule.detectWalletTicketBounds(uri);
}
