import React, { useMemo } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  type View as ViewType,
} from "react-native";

import type {
  WalletEmbeddedImage,
  WalletPassDisplayField,
  WalletPassEvidence,
} from "@/lib/walletPass";

const QRCode: any = require("qrcode");

type Props = {
  captureRef: React.RefObject<ViewType | null>;
  evidence: WalletPassEvidence | null;
  artworkUri?: string | null;
};

function assetUri(asset: WalletEmbeddedImage | null | undefined) {
  if (!asset?.base64) return null;
  return `data:${asset.mimeType};base64,${asset.base64}`;
}

function FieldRow({
  fields,
  foreground,
  labelColour,
  primary = false,
}: {
  fields: WalletPassDisplayField[];
  foreground: string;
  labelColour: string;
  primary?: boolean;
}) {
  if (!fields.length) return null;

  return (
    <View style={styles.fieldRow}>
      {fields.map((field, index) => (
        <View
          key={`${field.key ?? field.label}-${index}`}
          style={[
            styles.fieldCell,
            fields.length === 1 && styles.fieldCellFull,
          ]}
        >
          {!!field.label && (
            <Text
              style={[styles.fieldLabel, { color: labelColour }]}
              numberOfLines={1}
            >
              {field.label.toUpperCase()}
            </Text>
          )}

          <Text
            style={[
              primary ? styles.primaryValue : styles.fieldValue,
              { color: foreground },
            ]}
            numberOfLines={primary ? 2 : 3}
          >
            {field.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function WalletQr({
  value,
}: {
  value: string;
}) {
  const matrix = useMemo(() => {
    try {
      const qr = QRCode.create(value, {
        errorCorrectionLevel: "M",
      });

      const size = qr.modules.size;
      const data = qr.modules.data;

      return { size, data };
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) return null;

  const box = 300;
  const quiet = 4;
  const total = matrix.size + quiet * 2;
  const moduleSize = box / total;

  const modules: React.ReactNode[] = [];

  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      const index = row * matrix.size + column;

      if (!matrix.data[index]) continue;

      modules.push(
        <View
          key={`${row}-${column}`}
          style={{
            position: "absolute",
            backgroundColor: "#000000",
            left: (column + quiet) * moduleSize,
            top: (row + quiet) * moduleSize,
            width: Math.ceil(moduleSize),
            height: Math.ceil(moduleSize),
          }}
        />,
      );
    }
  }

  return (
    <View
      style={{
        width: box,
        height: box,
        backgroundColor: "#ffffff",
      }}
    >
      {modules}
    </View>
  );
}

export default function WalletPassCaptureHost({
  captureRef,
  evidence,
  artworkUri,
}: Props) {
  if (!evidence) return null;

  const background = evidence.backgroundColor || "#f2f2f2";
  const foreground = evidence.foregroundColor || "#111111";
  const labelColour = evidence.labelColor || "#767676";

  const logoUri = assetUri(evidence.assets?.logo);
  const stripUri =
    assetUri(evidence.assets?.strip) ||
    artworkUri ||
    assetUri(evidence.embeddedImage);

  const qrFormat =
    evidence.barcodeFormat?.toLowerCase().includes("qr") ?? false;

  const relevantDate = evidence.relevantDate
    ? new Date(evidence.relevantDate)
    : null;

  const validDate =
    relevantDate && !Number.isNaN(relevantDate.getTime())
      ? relevantDate
      : null;

  const dateTop = validDate
    ? validDate
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })
        .toUpperCase()
    : null;

  const timeTop = validDate
    ? validDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  const expired =
    evidence.expirationDate &&
    !Number.isNaN(new Date(evidence.expirationDate).getTime()) &&
    new Date(evidence.expirationDate).getTime() < Date.now();

  return (
    <View pointerEvents="none" style={styles.offscreen}>
      <View
        ref={captureRef}
        collapsable={false}
        style={[styles.pass, { backgroundColor: background }]}
      >
        <View style={styles.header}>
          <View style={styles.logoArea}>
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                resizeMode="contain"
                style={styles.logo}
              />
            ) : evidence.logoText ? (
              <Text style={[styles.logoText, { color: foreground }]}>
                {evidence.logoText}
              </Text>
            ) : null}
          </View>

          <View style={styles.dateArea}>
            {dateTop ? (
              <Text style={[styles.dateText, { color: foreground }]}>
                {dateTop}
              </Text>
            ) : null}

            {timeTop ? (
              <Text style={[styles.timeText, { color: foreground }]}>
                {timeTop}
              </Text>
            ) : null}
          </View>
        </View>

        {stripUri ? (
          <Image
            source={{ uri: stripUri }}
            resizeMode="cover"
            style={styles.strip}
          />
        ) : null}

        <View style={styles.details}>
          <FieldRow
            fields={evidence.primaryFields}
            foreground={foreground}
            labelColour={labelColour}
            primary
          />

          <FieldRow
            fields={evidence.secondaryFields}
            foreground={foreground}
            labelColour={labelColour}
          />

          <FieldRow
            fields={evidence.auxiliaryFields}
            foreground={foreground}
            labelColour={labelColour}
          />

          {evidence.barcodeMessage ? (
            <View style={styles.barcodeSection}>
              <View style={styles.barcodeWhite}>
                {qrFormat ? (
                  <WalletQr value={evidence.barcodeMessage} />
                ) : (
                  <Text style={styles.barcodeFallback}>
                    {evidence.barcodeAltText ||
                      evidence.barcodeMessage}
                  </Text>
                )}
              </View>

              {!!evidence.barcodeAltText && (
                <Text style={styles.barcodeAlt}>
                  {evidence.barcodeAltText}
                </Text>
              )}
            </View>
          ) : null}

          {expired ? (
            <View style={styles.expiredBox}>
              <Text style={styles.expiredText}>
                This pass has expired
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    left: -5000,
    top: 0,
    width: 900,
  },

  pass: {
    width: 900,
    overflow: "hidden",
    borderRadius: 42,
  },

  header: {
    minHeight: 164,
    paddingHorizontal: 42,
    paddingTop: 30,
    paddingBottom: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoArea: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logo: {
    width: 190,
    height: 96,
  },

  logoText: {
    fontSize: 34,
    fontWeight: "800",
  },

  dateArea: {
    minWidth: 180,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  dateText: {
    fontSize: 36,
    fontWeight: "600",
    letterSpacing: -0.6,
  },

  timeText: {
    marginTop: 4,
    fontSize: 31,
    fontWeight: "500",
  },

  strip: {
    width: 900,
    height: 430,
  },

  details: {
    paddingHorizontal: 42,
    paddingTop: 34,
    paddingBottom: 44,
  },

  fieldRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 34,
    columnGap: 32,
  },

  fieldCell: {
    flex: 1,
    minWidth: 0,
  },

  fieldCellFull: {
    flexBasis: "100%",
  },

  fieldLabel: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 7,
  },

  fieldValue: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "500",
    letterSpacing: -0.4,
  },

  primaryValue: {
    fontSize: 33,
    lineHeight: 39,
    fontWeight: "600",
    letterSpacing: -0.5,
  },

  barcodeSection: {
    alignItems: "center",
    marginTop: 18,
  },

  barcodeWhite: {
    padding: 24,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  barcodeFallback: {
    width: 360,
    minHeight: 150,
    color: "#000000",
    fontSize: 22,
    textAlign: "center",
    textAlignVertical: "center",
  },

  barcodeAlt: {
    marginTop: 12,
    color: "#333333",
    fontSize: 18,
    fontWeight: "500",
  },

  expiredBox: {
    marginTop: 34,
    paddingVertical: 23,
    paddingHorizontal: 30,
    borderRadius: 22,
    backgroundColor: "rgba(120,120,120,0.18)",
  },

  expiredText: {
    color: "#626262",
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
});
