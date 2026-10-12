import { TFD_CURRENT_GROUNDS } from "./tfdCurrentGrounds.generated";
import { findGroundForClub } from "./clubGroundMatching";

export function homeStadiumForClub(
  clubId: string | null | undefined,
  clubName: string,
) {

  // Prefer verified current grounds with locally approved stadium photographs.
  // This also avoids historical/alternative IDs such as Goodison Park.
  const photographedGroundIds = new Set([
    "st-andrews",
    "ewood-park",
    "university-of-bolton",
    "turf-moor",
    "cardiff-city-stadium",
    "the-valley",
    "pride-park",
    "riverside",
    "the-den",
    "carrow-road",
    "deepdale",
    "loftus-road",
    "hillsborough",
    "st-marys",
    "bet365",
    "the-hawthorns",
    "london-stadium",
    "molineux",

    "emirates", "villa-park", "gtech", "amex",
    "stamford-bridge", "hill-dickinson", "craven-cottage",
    "mkm-stadium", "portman-road", "anfield", "etihad",
    "old-trafford", "st-james-park", "city-ground",
    "stadium-of-light", "spurs-stadium", "selhurst-park",
    "cbs-arena", "vitality",
  ]);
  const photographedGround = findGroundForClub(clubName);
  if (photographedGround && photographedGroundIds.has(photographedGround.id)) {
    return photographedGround;
  }

  const id = clubId?.trim();

  if (id) {
    const matches = TFD_CURRENT_GROUNDS.filter(
      ground => ground.clubIds?.includes(id),
    );

    const stadiumIds = new Set(matches.map(ground => ground.id));

    if (stadiumIds.size === 1) {
      return matches[0];
    }

    // Conflicting verified stadium identities must not be guessed.
    if (stadiumIds.size > 1) {
      return null;
    }
  }

  // Resolve the verified current home stadium by club name when the
  // app's favourite-club ID differs from the TFD club identifier.
  const nameMatches = TFD_CURRENT_GROUNDS.filter(
    ground =>
      ground.club.trim().toLowerCase() ===
      clubName.trim().toLowerCase(),
  );

  const nameStadiumIds = new Set(
    nameMatches.map(ground => ground.id),
  );

  if (nameStadiumIds.size === 1) {
    return nameMatches[0];
  }

  // Never choose between conflicting verified stadium identities.
  if (nameStadiumIds.size > 1) {
    return null;
  }

  return findGroundForClub(clubName);
}
