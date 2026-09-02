import { PixelRatio } from "react-native";

// High-resolution A-series portrait master shared by Photo, PDF and Print.
// Pixel target stays 2480 x 3508. The React Native layout itself is divided
// by the device Retina scale so iOS does not allocate a gigantic point-sized view.
export const FRAME_EXPORT_PIXEL_WIDTH = 2480;
export const FRAME_EXPORT_PIXEL_HEIGHT = 3508;
export const FRAME_EXPORT_DEVICE_SCALE = PixelRatio.get();
export const FRAME_EXPORT_WIDTH =
  FRAME_EXPORT_PIXEL_WIDTH / FRAME_EXPORT_DEVICE_SCALE;
export const FRAME_EXPORT_HEIGHT =
  FRAME_EXPORT_PIXEL_HEIGHT / FRAME_EXPORT_DEVICE_SCALE;
export const FRAME_EXPORT_BASE_WIDTH = 1179;
export const FRAME_EXPORT_SCALE = FRAME_EXPORT_WIDTH / FRAME_EXPORT_BASE_WIDTH;
