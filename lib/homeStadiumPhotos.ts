import type { ImageSourcePropType } from "react-native";

/**
 * Approved stadium photographs indexed by verified TFD Stadium ID.
 *
 * Only add images with appropriate usage rights.
 * Metro requires literal require() paths.
 */
const STADIUM_PHOTOS: Record<string, ImageSourcePropType> = {
  "emirates": require("../assets/stadiums/optimised/emirates.webp"),
  "villa-park": require("../assets/stadiums/optimised/villa-park.webp"),
  "gtech": require("../assets/stadiums/optimised/gtech.webp"),
  "amex": require("../assets/stadiums/optimised/amex.webp"),
  "stamford-bridge": require("../assets/stadiums/optimised/stamford-bridge.webp"),
  "hill-dickinson": require("../assets/stadiums/optimised/hill-dickinson.webp"),
  "craven-cottage": require("../assets/stadiums/optimised/craven-cottage.webp"),
  "mkm-stadium": require("../assets/stadiums/optimised/mkm-stadium.webp"),
  "portman-road": require("../assets/stadiums/optimised/portman-road.webp"),
  "anfield": require("../assets/stadiums/optimised/anfield.webp"),
  "etihad": require("../assets/stadiums/optimised/etihad.webp"),
  "old-trafford": require("../assets/stadiums/optimised/old-trafford.webp"),
  "st-james-park": require("../assets/stadiums/optimised/st-james-park.webp"),
  "city-ground": require("../assets/stadiums/optimised/city-ground.webp"),
  "stadium-of-light": require("../assets/stadiums/optimised/stadium-of-light.webp"),
  "spurs-stadium": require("../assets/stadiums/optimised/spurs-stadium.webp"),
  "selhurst-park": require("../assets/stadiums/optimised/selhurst-park.webp"),
  "cbs-arena": require("../assets/stadiums/optimised/cbs-arena.webp"),
  "vitality": require("../assets/stadiums/optimised/vitality.webp"),

  "elland-road": require("../assets/stadiums/elland-road.jpg"),
  "het-kuipje": require("../assets/stadiums/het-kuipje.webp"),
  "abe-lenstra-stadion": require("../assets/stadiums/abe-lenstra-stadion.webp"),
  "stadium:achter-de-kazerne-mechelen": require("../assets/stadiums/achter-de-kazerne.webp"),
  "current-aesseal-new-york-stadium": require("../assets/stadiums/aesseal-new-york-stadium.webp"),
  "stadium:afas-stadion": require("../assets/stadiums/afas-stadion-az.webp"),
};

export function stadiumPhotoForId(
  stadiumId: string | null | undefined,
): ImageSourcePropType | null {
  if (!stadiumId) return null;
  return STADIUM_PHOTOS[stadiumId] ?? null;
}
