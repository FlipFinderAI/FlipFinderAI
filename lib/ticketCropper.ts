import { Alert, Image } from "react-native";
import ImageCropPicker from "react-native-image-crop-picker";

import type { CropBox } from "@/lib/ticketCropAnalysis";

let nativeCropperActive = false;

export async function openNativeCropper(
  uri: string,
  initialCropRect?: CropBox,
): Promise<{ uri: string; width: number; height: number } | null> {
  while (nativeCropperActive)
    await new Promise((resolve) => setTimeout(resolve, 150));
  nativeCropperActive = true;
  const dims = await new Promise<{ w: number; h: number }>((resolve) => {
    Image.getSize(
      uri,
      (w, h) => resolve({ w, h }),
      () => resolve({ w: 0, h: 0 }),
    );
  });
  try {
    // Let any preceding alert/photo-picker dismissal complete before asking
    // iOS to present another full-screen native controller.
    await new Promise((resolve) => setTimeout(resolve, 450));
    const cropperOptions = {
      path: uri,
      mediaType: "photo" as const,
      width: dims.w || undefined,
      height: dims.h || undefined,
      freeStyleCropEnabled: true,
      compressImageQuality: 1,
      cropperChooseText: "Done",
      cropperCancelText: "Cancel",
      cropperToolbarTitle: "Crop Ticket",
      initialCropRect: initialCropRect
        ? {
            x: initialCropRect.x,
            y: initialCropRect.y,
            width: initialCropRect.w,
            height: initialCropRect.h,
          }
        : undefined,
    };
    const result = await ImageCropPicker.openCropper(cropperOptions);
    const cropped = result.path.startsWith("file://")
      ? result.path
      : `file://${result.path}`;
    return { uri: cropped, width: result.width, height: result.height };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      (error as { code?: string }).code === "E_PICKER_CANCELLED_CODE"
    )
      return null;
    console.warn("[ticket-import] native cropper failed", error);
    Alert.alert(
      "Cropper failed",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  } finally {
    // Done/Cancel animations are asynchronous on iOS. Do not allow the next
    // cropper to present until the previous controller is fully gone.
    await new Promise((resolve) => setTimeout(resolve, 600));
    nativeCropperActive = false;
  }
}
