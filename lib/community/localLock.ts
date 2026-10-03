import * as LocalAuthentication from "expo-local-authentication";

export type CommunityUnlockCapability = {
  available: boolean;
  label: "Face ID" | "Touch ID" | "Biometrics";
};

export async function communityUnlockCapability(): Promise<CommunityUnlockCapability> {
  try {
    const [hardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    const face = types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    );
    const fingerprint = types.includes(
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    );

    return {
      available: hardware && enrolled,
      label: face ? "Face ID" : fingerprint ? "Touch ID" : "Biometrics",
    };
  } catch {
    return { available: false, label: "Biometrics" };
  }
}

export async function unlockCommunityLocally(): Promise<boolean> {
  const capability = await communityUnlockCapability();
  if (!capability.available) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Community",
    cancelLabel: "Cancel",
    fallbackLabel: "Use iPhone Passcode",
    disableDeviceFallback: false,
  });

  return result.success === true;
}
