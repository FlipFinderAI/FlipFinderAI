import { useEffect, useState } from "react";
import { Alert, Switch, Text, View } from "react-native";
import { communityRequest } from "@/lib/community/api";
import type { Preferences } from "@/lib/community/model";
import { Action, styles } from "./Controls";

type Props = {
  preferences: Preferences; disabled: boolean; accountKey: string;
  onChange(patch: Partial<Preferences>): Promise<void>;
  run(task: () => Promise<void>): Promise<void>;
};
export default function PrivacySettings({ preferences: p, disabled, accountKey, onChange, run }: Props) {
  const [marketing, setMarketing] = useState<boolean | null>(null);
  const [marketingError, setMarketingError] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    setMarketing(null); setMarketingError(false);
    communityRequest<{ emailSmsMarketing: boolean }>("/auth/marketing")
      .then(result => { if (live) setMarketing(result.emailSmsMarketing); })
      .catch(() => { if (live) setMarketingError(true); });
    return () => { live = false; };
  }, [accountKey, reload]);
  async function saveMarketing(value: boolean) {
    const result = await communityRequest<{ emailSmsMarketing: boolean }>("/auth/marketing", { emailSmsMarketing: value });
    setMarketing(result.emailSmsMarketing);
  }
  function confirmMarketing() {
    Alert.alert("Email & SMS Marketing", "I agree to receive Ticket Frame marketing by email and SMS. This is optional and I can withdraw consent here at any time.", [
      { text: "Not now", style: "cancel" },
      { text: "I agree", onPress: () => void run(() => saveMarketing(true)) },
    ]);
  }
  const rows: { key: keyof Preferences; label: string }[] = [
    { key: "enabled", label: "Join Community" },
    { key: "shareTicket", label: "Share My Matchday Ticket" },
    { key: "shareGrounds", label: "Share Grounds Visited" },
    { key: "locationVisible", label: "Allow Matchday Location Features" },
    { key: "alwaysLocation", label: "Always Show My Location When Community ON" },
    { key: "photoSharing", label: "Allow Eligible Matchday Photo Sharing" },
  ];
  return <View style={{ gap: 12 }}>
    <Text style={styles.heading}>Accept All Community Settings</Text>
    <Text style={styles.copy}>Enable Community sharing, including approximate location. Marketing asks for separate consent. Your confirmed age eligibility stays unchanged.</Text>
    <Switch accessibilityLabel="Accept All Community Settings" disabled={disabled}
      value={rows.every(row => Boolean(p[row.key]))}
      onValueChange={value => void run(async () => {
        await onChange({ enabled: value, shareTicket: value, shareGrounds: value, locationVisible: value, alwaysLocation: value, photoSharing: value });
        if (value && marketing !== true) confirmMarketing();
      })} />
    {rows.map((row, index) => <View key={row.key} style={{ gap: 8 }}>
      {index === 2 && <>
        <Text>Email & SMS Marketing</Text>
        <Switch accessibilityLabel="Email & SMS Marketing" value={marketing === true}
          disabled={disabled || marketing === null}
          onValueChange={value => value ? confirmMarketing() : void run(() => saveMarketing(false))} />
        {marketing === null && <Text style={styles.copy}>{marketingError ? "Marketing preference could not be loaded." : "Loading marketing preference…"}</Text>}
        {marketingError && <Action title="Retry marketing preference" disabled={disabled} onPress={() => setReload(n => n + 1)} />}
      </>}
      <Text>{row.label}</Text>
      <Switch accessibilityLabel={row.label} value={Boolean(p[row.key])}
        disabled={disabled || (row.key !== "enabled" && !p.enabled)}
        onValueChange={value => void run(() => onChange({ [row.key]: value }))} />
      {row.key === "shareTicket" && <Text style={styles.copy}>Shares your active match and stadium with friends on the map. Never your ticket image, barcode, QR code, seat or entry credentials.</Text>}
      {row.key === "alwaysLocation" && <Text style={styles.copy}>Shares an approximate area with accepted friends while Community is open and device location permission is granted, including non-matchdays. Background updates are not enabled. Turn this off to stop automatic sharing.</Text>}
      {row.key === "locationVisible" && <Text style={styles.copy}>Allows location features. Sharing for Matchday Mode still needs separate acceptance for each session.</Text>}
    </View>)}
  </View>;
}
