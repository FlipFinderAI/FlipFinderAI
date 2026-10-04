import type { FootballGround } from "./grounds";

/**
 * Verified physical stadiums that belong in Ticket Frame's Stadiums
 * directory but must not be represented as CURRENT_HOME relationships.
 *
 * These are independently verified neutral/final venues.
 * Keep CURRENT_HOME data in tfdCurrentGrounds.generated.ts untouched.
 */
export const VERIFIED_ADDITIONAL_GROUNDS: FootballGround[] = [
  {
    id: "stadium:aviva-stadium",
    stadium: "Aviva Stadium",
    club: "Neutral / Final venue",
    league: "Europe",
    address: "Lansdowne Road, Dublin 4, Ireland",
    latitude: 53.334961,
    longitude: -6.22825,
  },
  {
    id: "stadium:t-pra-stadyumu",
    stadium: "Tüpraş Stadyumu",
    club: "Beşiktaş",
    league: "Europe",
    address: "Beşiktaş, Istanbul, Türkiye",
    latitude: 41.03916666666667,
    longitude: 28.994166666666665,
  },
  {
    id: "stadium:stade-de-france",
    stadium: "Stade de France",
    club: "Neutral / Final venue",
    league: "Europe",
    address: "Saint-Denis, France",
    latitude: 48.9244726,
    longitude: 2.3601325,
  },
  {
    id: "stadium:ataturk-olympic-stadion",
    stadium: "Atatürk Olympic Stadium",
    club: "Neutral / Final venue",
    league: "Europe",
    address: "Başakşehir, Istanbul, Türkiye",
    latitude: 41.074444,
    longitude: 28.765833,
  },
  {
    id: "stadion-energa-gdansk",
    stadium: "Stadion Gdańsk",
    club: "Lechia Gdańsk",
    league: "Europe",
    address: "Pokoleń Lechii Gdańsk 1, 80-560 Gdańsk, Poland",
    latitude: 54.39,
    longitude: 18.640278,
  },
  {
    id: "stadium:arena-kombetare",
    stadium: "Arena Kombëtare",
    club: "Neutral / Final venue",
    league: "Europe",
    address: "Tirana, Albania",
    latitude: 41.31833,
    longitude: 19.82417,
  },
  {
    id: "stadium:puskas-arena",
    stadium: "Puskás Aréna",
    club: "Neutral / Final venue",
    league: "Europe",
    address: "Budapest, Hungary",
    latitude: 47.503109,
    longitude: 19.0980509,
  },
];
