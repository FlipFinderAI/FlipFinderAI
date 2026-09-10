import { NativeModules } from "react-native";
import { strFromU8, unzipSync } from "fflate";

type WalletNativePass = {
  name: string;
  base64: string;
};

export type WalletPassEvidence = {
  fileName: string;
  description: string | null;
  organizationName: string | null;
  relevantDate: string | null;
  expirationDate: string | null;
  fieldText: string[];
  locations: Array<{
    latitude: number;
    longitude: number;
    relevantText: string | null;
  }>;
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

const fieldText = (pass: any): string[] => {
  const groups = [
    pass?.eventTicket?.headerFields,
    pass?.eventTicket?.primaryFields,
    pass?.eventTicket?.secondaryFields,
    pass?.eventTicket?.auxiliaryFields,
    pass?.eventTicket?.backFields,
    pass?.generic?.headerFields,
    pass?.generic?.primaryFields,
    pass?.generic?.secondaryFields,
    pass?.generic?.auxiliaryFields,
    pass?.generic?.backFields,
  ];

  const values: string[] = [];

  for (const group of groups) {
    if (!Array.isArray(group)) continue;

    for (const field of group) {
      if (!field || typeof field !== "object") continue;

      const label =
        typeof field.label === "string" ? field.label.trim() : "";
      const value =
        typeof field.value === "string" || typeof field.value === "number"
          ? String(field.value).trim()
          : "";

      if (label && value) {
        values.push(`${label}: ${value}`);
      } else if (value) {
        values.push(value);
      }
    }
  }

  return [...new Set(values.filter(Boolean))];
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

export function walletPassEvidenceToRecognitionText(
  evidence: WalletPassEvidence,
): string {
  const lines = [
    evidence.description,
    evidence.organizationName,
    ...formatWalletRelevantDate(evidence.relevantDate),
    ...evidence.fieldText,
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
      typeof pass?.description === "string" ? pass.description : null,
    organizationName:
      typeof pass?.organizationName === "string"
        ? pass.organizationName
        : null,
    relevantDate:
      typeof pass?.relevantDate === "string" ? pass.relevantDate : null,
    expirationDate:
      typeof pass?.expirationDate === "string" ? pass.expirationDate : null,
    fieldText: fieldText(pass),
    locations,
  };
}

export async function removePendingWalletPass(
  fileName: string,
): Promise<void> {
  if (!walletModule?.removePendingPass) return;
  await walletModule.removePendingPass(fileName);
}
