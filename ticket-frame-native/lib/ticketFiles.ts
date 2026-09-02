import { Image } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export const TICKET_DIRECTORY = `${FileSystem.documentDirectory}ticket-frame-tickets/`;

export function currentTicketUri(savedUri?: string) {
  if (!savedUri) return undefined;

  const filename = savedUri.split("/").pop();
  if (!filename) return savedUri;

  return `${TICKET_DIRECTORY}${filename}`;
}

export async function logTicketImage(
  label: string,
  uri: string,
  width?: number,
  height?: number,
) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    const bytes = info.exists ? info.size : 0;
    console.log(
      `[ticket-import] ${label}: ${width ?? "?"}x${height ?? "?"} | ${bytes} bytes (${(bytes / 1048576).toFixed(2)} MB) | ${uri}`,
    );
  } catch (logError) {
    console.log(`[ticket-import] ${label}: logging failed`, logError);
  }
}

export function makeVersionedFingerprint(fingerprint: string) {
  return `${fingerprint}-v${Date.now()}`;
}

export function nowMs() {
  return Date.now();
}

export async function permanentTicketUri(
  sourceUri: string,
  fingerprint: string,
  mime?: string | null,
) {
  await FileSystem.makeDirectoryAsync(TICKET_DIRECTORY, { intermediates: true });
  const extension = mime?.includes("png") ? "png" : "jpg";
  const destination = `${TICKET_DIRECTORY}${fingerprint}.${extension}`;
  const existing = await FileSystem.getInfoAsync(destination);
  if (!existing.exists) await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function resolvePrintDimensions(
  uri: string,
  fallbackWidth?: number,
  fallbackHeight?: number,
): Promise<{ width: number; height: number } | null> {
  if (fallbackWidth && fallbackHeight) {
    return { width: fallbackWidth, height: fallbackHeight };
  }
  try {
    return await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout")), 8000);
        Image.getSize(
          uri,
          (width, height) => {
            clearTimeout(timer);
            resolve({ width, height });
          },
          (error) => {
            clearTimeout(timer);
            reject(error);
          },
        );
      },
    );
  } catch {
    return null;
  }
}
