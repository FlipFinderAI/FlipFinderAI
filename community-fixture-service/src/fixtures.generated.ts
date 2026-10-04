export type CommunityVerifiedFixture = {
  id: string;
  clubIds: string[];
  kickoff: string;
  stadium: string;
  latitude: number;
  longitude: number;
  homeClubId?: string;
  awayClubId?: string;
  competition?: string;
};

export const FIXTURES: CommunityVerifiedFixture[] = [
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:burnley"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:burnley:2022-07-29",
    "kickoff": "2022-07-29T19:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:coventry",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:coventry"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:coventry:2022-07-31",
    "kickoff": "2022-07-31T11:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:wolves:2022-08-06",
    "kickoff": "2022-08-06T14:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:manchester city:2022-08-07",
    "kickoff": "2022-08-07T15:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:stoke city:2022-08-13",
    "kickoff": "2022-08-13T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:qpr:2022-08-13",
    "kickoff": "2022-08-13T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:bournemouth:2022-08-13",
    "kickoff": "2022-08-13T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:leeds-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:leeds:2022-08-13",
    "kickoff": "2022-08-13T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:chelsea:2022-08-21",
    "kickoff": "2022-08-21T13:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:brighton:2022-08-21",
    "kickoff": "2022-08-21T13:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:norwich:2022-08-27",
    "kickoff": "2022-08-27T11:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:manchester united:2022-08-27",
    "kickoff": "2022-08-27T11:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:west brom:2022-08-27",
    "kickoff": "2022-08-27T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:crystal palace:2022-08-27",
    "kickoff": "2022-08-27T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:chelsea:2022-08-30",
    "kickoff": "2022-08-30T18:45:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:everton:2022-08-30",
    "kickoff": "2022-08-30T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:nottingham forest:2022-08-31",
    "kickoff": "2022-08-31T18:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:rotherham",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:rotherham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:rotherham:2022-08-31",
    "kickoff": "2022-08-31T18:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:tottenham",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:tottenham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:tottenham:2022-08-31",
    "kickoff": "2022-08-31T18:45:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:blackpool",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:blackpool"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:blackpool:2022-09-04",
    "kickoff": "2022-09-04T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:wigan",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:wigan"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:wigan:2022-09-13",
    "kickoff": "2022-09-13T18:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:cardiff:2022-09-17",
    "kickoff": "2022-09-17T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:preston:2022-10-01",
    "kickoff": "2022-10-01T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:everton:2022-10-01",
    "kickoff": "2022-10-01T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:wolves:2022-10-01",
    "kickoff": "2022-10-01T16:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:manchester united:2022-10-02",
    "kickoff": "2022-10-02T13:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:aston villa:2022-10-02",
    "kickoff": "2022-10-02T15:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:blackpool",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:blackpool"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:blackpool:2022-10-04",
    "kickoff": "2022-10-04T18:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:southampton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:southampton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:southampton:2022-10-08",
    "kickoff": "2022-10-08T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:hull-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:hull city:2022-10-09",
    "kickoff": "2022-10-09T11:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:fulham:2022-10-09",
    "kickoff": "2022-10-09T13:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:wigan",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:wigan"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:wigan:2022-10-15",
    "kickoff": "2022-10-15T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:arsenal:2022-10-16",
    "kickoff": "2022-10-16T13:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:west-ham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:west ham:2022-10-16",
    "kickoff": "2022-10-16T13:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:preston:2022-10-18",
    "kickoff": "2022-10-18T18:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:burnley"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:burnley:2022-10-22",
    "kickoff": "2022-10-22T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:brighton:2022-10-22",
    "kickoff": "2022-10-22T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:fulham:2022-10-23",
    "kickoff": "2022-10-23T13:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:arsenal:2022-10-23",
    "kickoff": "2022-10-23T13:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:bournemouth:2022-10-24",
    "kickoff": "2022-10-24T19:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:millwall:2022-10-29",
    "kickoff": "2022-10-29T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:sunderland"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:sunderland:2022-11-02",
    "kickoff": "2022-11-02T19:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:cardiff:2022-11-05",
    "kickoff": "2022-11-05T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:bournemouth:2022-11-05",
    "kickoff": "2022-11-05T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:fulham:2022-11-05",
    "kickoff": "2022-11-05T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:newcastle:2022-11-06",
    "kickoff": "2022-11-06T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:crystal palace:2022-11-06",
    "kickoff": "2022-11-06T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:brentford:2022-11-12",
    "kickoff": "2022-11-12T12:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:swansea:2022-11-12",
    "kickoff": "2022-11-12T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:leicester"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:leicester:2022-11-12",
    "kickoff": "2022-11-12T15:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:millwall:2022-12-03",
    "kickoff": "2022-12-03T12:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:west brom:2022-12-12",
    "kickoff": "2022-12-12T20:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:watford:2022-12-17",
    "kickoff": "2022-12-17T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:blackburn:2022-12-26",
    "kickoff": "2022-12-26T12:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:brighton:2022-12-26",
    "kickoff": "2022-12-26T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:manchester city:2022-12-28",
    "kickoff": "2022-12-28T20:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:rotherham",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:rotherham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:rotherham:2022-12-29",
    "kickoff": "2022-12-29T19:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:brentford:2022-12-30",
    "kickoff": "2022-12-30T19:45:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:everton:2022-12-31",
    "kickoff": "2022-12-31T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:luton",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:luton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:luton:2023-01-01",
    "kickoff": "2023-01-01T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:nottingham forest:2023-01-04",
    "kickoff": "2023-01-04T19:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:west-ham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:west ham:2023-01-04",
    "kickoff": "2023-01-04T19:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:swansea:2023-01-14",
    "kickoff": "2023-01-14T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:tottenham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:tottenham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:tottenham:2023-01-19",
    "kickoff": "2023-01-19T20:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:aston villa:2023-01-21",
    "kickoff": "2023-01-21T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:everton:2023-01-21",
    "kickoff": "2023-01-21T15:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:middlesbrough:2023-01-22",
    "kickoff": "2023-01-22T12:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:brentford:2023-01-22",
    "kickoff": "2023-01-22T14:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:wolves:2023-01-22",
    "kickoff": "2023-01-22T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:qpr:2023-02-04",
    "kickoff": "2023-02-04T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:chelsea:2023-02-11",
    "kickoff": "2023-02-11T12:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:reading",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:reading"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:reading:2023-02-11",
    "kickoff": "2023-02-11T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:wolves:2023-02-11",
    "kickoff": "2023-02-11T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:manchester united:2023-02-12",
    "kickoff": "2023-02-12T14:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:aston villa:2023-02-12",
    "kickoff": "2023-02-12T16:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:birmingham-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:birmingham:2023-02-18",
    "kickoff": "2023-02-18T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:bristol city:2023-02-18",
    "kickoff": "2023-02-18T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:southampton",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:southampton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:southampton:2023-02-25",
    "kickoff": "2023-02-25T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:nottingham forest:2023-02-25",
    "kickoff": "2023-02-25T15:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:newcastle:2023-03-04",
    "kickoff": "2023-03-04T12:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:coventry",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:coventry"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:coventry:2023-03-04",
    "kickoff": "2023-03-04T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:stoke city:2023-03-04",
    "kickoff": "2023-03-04T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:leicester"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:leicester:2023-03-04",
    "kickoff": "2023-03-04T17:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:bristol city:2023-03-07",
    "kickoff": "2023-03-07T19:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:brighton:2023-03-11",
    "kickoff": "2023-03-11T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:aston villa:2023-03-12",
    "kickoff": "2023-03-12T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:brentford:2023-03-15",
    "kickoff": "2023-03-15T19:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:norwich:2023-03-15",
    "kickoff": "2023-03-15T19:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-united",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:sheffield-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:sheffield utd:2023-03-15",
    "kickoff": "2023-03-15T20:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:luton",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:luton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:luton:2023-03-18",
    "kickoff": "2023-03-18T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:tottenham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:tottenham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:tottenham:2023-03-18",
    "kickoff": "2023-03-18T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:liverpool:2023-04-01",
    "kickoff": "2023-04-01T11:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:middlesbrough:2023-04-01",
    "kickoff": "2023-04-01T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:southampton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:southampton:2023-04-02",
    "kickoff": "2023-04-02T13:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:nottingham forest:2023-04-04",
    "kickoff": "2023-04-04T18:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:newcastle:2023-04-05",
    "kickoff": "2023-04-05T19:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:hull-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:hull city:2023-04-07",
    "kickoff": "2023-04-07T16:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:manchester city:2023-04-08",
    "kickoff": "2023-04-08T16:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:crystal palace:2023-04-09",
    "kickoff": "2023-04-09T13:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:blackburn:2023-04-10",
    "kickoff": "2023-04-10T11:30:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:birmingham-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:birmingham:2023-04-15",
    "kickoff": "2023-04-15T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:crystal palace:2023-04-15",
    "kickoff": "2023-04-15T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:leicester"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:leicester:2023-04-15",
    "kickoff": "2023-04-15T16:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:arsenal:2023-04-16",
    "kickoff": "2023-04-16T13:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:liverpool:2023-04-17",
    "kickoff": "2023-04-17T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:huddersfield",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:huddersfield"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:huddersfield:2023-04-18",
    "kickoff": "2023-04-18T18:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:leicester"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:leicester:2023-04-25",
    "kickoff": "2023-04-25T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:liverpool:2023-04-26",
    "kickoff": "2023-04-26T18:45:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:arsenal:2023-04-26",
    "kickoff": "2023-04-26T19:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:bournemouth:2023-04-27",
    "kickoff": "2023-04-27T18:45:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:watford:2023-04-29",
    "kickoff": "2023-04-29T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:west-ham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:west ham:2023-05-03",
    "kickoff": "2023-05-03T19:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-united",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:sheffield-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:sheffield utd:2023-05-04",
    "kickoff": "2023-05-04T18:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:leeds-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:leeds:2023-05-06",
    "kickoff": "2023-05-06T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:manchester united:2023-05-07",
    "kickoff": "2023-05-07T18:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:reading",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:reading"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2022-2023:championship:huddersfield:reading:2023-05-08",
    "kickoff": "2023-05-08T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:newcastle:2023-05-13",
    "kickoff": "2023-05-13T11:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:fulham:2023-05-13",
    "kickoff": "2023-05-13T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:luton",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:luton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2022-2023:championship:sunderland:luton:2023-05-13",
    "kickoff": "2023-05-13T16:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:leeds-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2022-2023:premier-league:west ham:leeds:2023-05-21",
    "kickoff": "2023-05-21T12:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2022-2023:premier-league:manchester city:chelsea:2023-05-21",
    "kickoff": "2023-05-21T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:tottenham",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:tottenham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2022-2023:premier-league:leeds:tottenham:2023-05-28",
    "kickoff": "2023-05-28T15:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2022-2023:premier-league:southampton:liverpool:2023-05-28",
    "kickoff": "2023-05-28T15:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:cardiff:2023-08-06",
    "kickoff": "2023-08-06T13:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:ipswich-town"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:ipswich:2023-08-06",
    "kickoff": "2023-08-06T16:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:middlesbrough"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:league-cup:huddersfield:middlesbrough:2023-08-08",
    "kickoff": "2023-08-08T18:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:crewe",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:crewe"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:league-cup:sunderland:crewe:2023-08-08",
    "kickoff": "2023-08-08T18:45:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:shrewsbury",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:shrewsbury"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:league-cup:leeds:shrewsbury:2023-08-09",
    "kickoff": "2023-08-09T18:45:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:leicester"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:leicester:2023-08-12",
    "kickoff": "2023-08-12T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:norwich:2023-08-12",
    "kickoff": "2023-08-12T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:west brom:2023-08-18",
    "kickoff": "2023-08-18T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:rotherham",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:rotherham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:rotherham:2023-08-19",
    "kickoff": "2023-08-19T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:newcastle:2023-08-19",
    "kickoff": "2023-08-19T19:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:chelsea:2023-08-20",
    "kickoff": "2023-08-20T15:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:norwich:2023-08-26",
    "kickoff": "2023-08-26T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:qpr:2023-08-26",
    "kickoff": "2023-08-26T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:southampton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:southampton:2023-09-02",
    "kickoff": "2023-09-02T11:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:sheffield-wednesday",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:sheffield-wednesday"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:sheffield wednesday:2023-09-02",
    "kickoff": "2023-09-02T14:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:fulham:2023-09-02",
    "kickoff": "2023-09-02T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:leicester"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:leicester:2023-09-15",
    "kickoff": "2023-09-15T19:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:rotherham",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:rotherham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:rotherham:2023-09-16",
    "kickoff": "2023-09-16T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:manchester city:2023-09-16",
    "kickoff": "2023-09-16T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:ipswich-town"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:ipswich:2023-09-19",
    "kickoff": "2023-09-19T18:45:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:stoke city:2023-09-20",
    "kickoff": "2023-09-20T18:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:watford:2023-09-23",
    "kickoff": "2023-09-23T14:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:nottingham forest:2023-09-23",
    "kickoff": "2023-09-23T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:cardiff:2023-09-24",
    "kickoff": "2023-09-24T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:leeds-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:leeds:2023-09-30",
    "kickoff": "2023-09-30T11:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:ipswich-town"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:ipswich:2023-09-30",
    "kickoff": "2023-09-30T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-united",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:sheffield-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:sheffield utd:2023-09-30",
    "kickoff": "2023-09-30T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:qpr:2023-10-04",
    "kickoff": "2023-10-04T18:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:watford:2023-10-04",
    "kickoff": "2023-10-04T18:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:middlesbrough:2023-10-07",
    "kickoff": "2023-10-07T11:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:bristol city:2023-10-07",
    "kickoff": "2023-10-07T14:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:rotherham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:rotherham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:rotherham:2023-10-07",
    "kickoff": "2023-10-07T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:newcastle:2023-10-08",
    "kickoff": "2023-10-08T13:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:qpr:2023-10-21",
    "kickoff": "2023-10-21T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:brighton:2023-10-21",
    "kickoff": "2023-10-21T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:cardiff:2023-10-24",
    "kickoff": "2023-10-24T18:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:huddersfield",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:huddersfield"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:huddersfield:2023-10-28",
    "kickoff": "2023-10-28T11:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:birmingham-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:birmingham:2023-10-28",
    "kickoff": "2023-10-28T11:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:norwich:2023-10-28",
    "kickoff": "2023-10-28T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:everton:2023-10-29",
    "kickoff": "2023-10-29T13:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:arsenal"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:league-cup:west ham:arsenal:2023-11-01",
    "kickoff": "2023-11-01T19:30:00.000Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:watford:2023-11-04",
    "kickoff": "2023-11-04T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:bournemouth:2023-11-04",
    "kickoff": "2023-11-04T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:birmingham-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:birmingham:2023-11-11",
    "kickoff": "2023-11-11T12:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:plymouth",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:plymouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:plymouth:2023-11-11",
    "kickoff": "2023-11-11T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:west brom:2023-11-11",
    "kickoff": "2023-11-11T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:nottingham forest:2023-11-12",
    "kickoff": "2023-11-12T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:liverpool:2023-11-25",
    "kickoff": "2023-11-25T12:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:southampton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:southampton:2023-11-25",
    "kickoff": "2023-11-25T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:swansea:2023-11-29",
    "kickoff": "2023-11-29T19:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:bristol city:2023-11-29",
    "kickoff": "2023-11-29T19:45:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:huddersfield",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:huddersfield"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:huddersfield:2023-11-29",
    "kickoff": "2023-11-29T19:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:middlesbrough:2023-12-02",
    "kickoff": "2023-12-02T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:cardiff:2023-12-02",
    "kickoff": "2023-12-02T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:crystal palace:2023-12-03",
    "kickoff": "2023-12-03T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:tottenham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:tottenham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:tottenham:2023-12-03",
    "kickoff": "2023-12-03T16:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:west brom:2023-12-09",
    "kickoff": "2023-12-09T12:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:bristol city:2023-12-09",
    "kickoff": "2023-12-09T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:preston:2023-12-12",
    "kickoff": "2023-12-12T19:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:leeds-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:leeds:2023-12-12",
    "kickoff": "2023-12-12T20:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:coventry",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:coventry"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:coventry:2023-12-16",
    "kickoff": "2023-12-16T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:blackburn:2023-12-16",
    "kickoff": "2023-12-16T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:crystal palace:2023-12-16",
    "kickoff": "2023-12-16T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:wolves:2023-12-17",
    "kickoff": "2023-12-17T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:ipswich-town"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:ipswich:2023-12-23",
    "kickoff": "2023-12-23T12:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:manchester united:2023-12-23",
    "kickoff": "2023-12-23T12:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:coventry",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:coventry"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:coventry:2023-12-23",
    "kickoff": "2023-12-23T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:blackburn:2023-12-26",
    "kickoff": "2023-12-26T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:swansea:2023-12-26",
    "kickoff": "2023-12-26T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:plymouth",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:plymouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:plymouth:2023-12-29",
    "kickoff": "2023-12-29T18:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:middlesbrough:2023-12-29",
    "kickoff": "2023-12-29T19:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-united",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:sheffield-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:sheffield utd:2023-12-30",
    "kickoff": "2023-12-30T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:preston:2024-01-01",
    "kickoff": "2024-01-01T12:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:birmingham-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:birmingham:2024-01-01",
    "kickoff": "2024-01-01T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:brighton:2024-01-02",
    "kickoff": "2024-01-02T19:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:newcastle"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:fa-cup:sunderland:newcastle united:2024-01-06",
    "kickoff": "2024-01-06T12:45:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:walsall",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:walsall"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:fa-cup:southampton:walsall:2024-01-06",
    "kickoff": "2024-01-06T15:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:bristol-city"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:fa-cup:west ham:bristol city:2024-01-07",
    "kickoff": "2024-01-07T14:00:00.000Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:plymouth",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:plymouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:plymouth:2024-01-13",
    "kickoff": "2024-01-13T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-wednesday",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:sheffield-wednesday"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:sheffield wednesday:2024-01-13",
    "kickoff": "2024-01-13T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:hull-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:hull city:2024-01-19",
    "kickoff": "2024-01-19T20:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:preston:2024-01-21",
    "kickoff": "2024-01-21T12:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:norwich:2024-01-24",
    "kickoff": "2024-01-24T19:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:stoke city:2024-01-27",
    "kickoff": "2024-01-27T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:plymouth",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:plymouth"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:fa-cup:leeds:plymouth:2024-01-27",
    "kickoff": "2024-01-27T15:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:burnley"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:burnley:2024-01-31",
    "kickoff": "2024-01-31T19:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:bournemouth:2024-02-01",
    "kickoff": "2024-02-01T19:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-wednesday",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:sheffield-wednesday"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:sheffield wednesday:2024-02-03",
    "kickoff": "2024-02-03T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:watford"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:fa-cup:southampton:watford:2024-02-06",
    "kickoff": "2024-02-06T19:45:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:everton:2024-02-10",
    "kickoff": "2024-02-10T12:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:rotherham",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:rotherham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:rotherham:2024-02-10",
    "kickoff": "2024-02-10T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:huddersfield",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:huddersfield"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:huddersfield:2024-02-10",
    "kickoff": "2024-02-10T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:plymouth",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:plymouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:plymouth:2024-02-10",
    "kickoff": "2024-02-10T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:arsenal:2024-02-11",
    "kickoff": "2024-02-11T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:sunderland"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:sunderland:2024-02-14",
    "kickoff": "2024-02-14T19:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:hull-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:hull city:2024-02-17",
    "kickoff": "2024-02-17T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:chelsea:2024-02-17",
    "kickoff": "2024-02-17T17:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:brentford:2024-02-20",
    "kickoff": "2024-02-20T19:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:hull-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:hull city:2024-02-20",
    "kickoff": "2024-02-20T19:45:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:leicester"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:leicester:2024-02-23",
    "kickoff": "2024-02-23T20:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:millwall:2024-02-24",
    "kickoff": "2024-02-24T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:swansea:2024-02-24",
    "kickoff": "2024-02-24T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:brentford:2024-02-26",
    "kickoff": "2024-02-26T20:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:leeds-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:leeds:2024-03-02",
    "kickoff": "2024-03-02T12:30:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:manchester united:2024-03-03",
    "kickoff": "2024-03-03T15:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:stoke city:2024-03-05",
    "kickoff": "2024-03-05T19:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:leicester"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:leicester:2024-03-05",
    "kickoff": "2024-03-05T19:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:sunderland"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:sunderland:2024-03-09",
    "kickoff": "2024-03-09T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:west brom:2024-03-10",
    "kickoff": "2024-03-10T12:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:burnley"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:burnley:2024-03-10",
    "kickoff": "2024-03-10T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:qpr:2024-03-16",
    "kickoff": "2024-03-16T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:aston villa:2024-03-17",
    "kickoff": "2024-03-17T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:millwall:2024-03-17",
    "kickoff": "2024-03-17T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:coventry",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:coventry"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:coventry:2024-03-29",
    "kickoff": "2024-03-29T15:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:middlesbrough:2024-03-29",
    "kickoff": "2024-03-29T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:arsenal:2024-03-31",
    "kickoff": "2024-03-31T15:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:blackburn:2024-04-01",
    "kickoff": "2024-04-01T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:hull-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:hull city:2024-04-01",
    "kickoff": "2024-04-01T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:tottenham",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:tottenham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:tottenham:2024-04-02",
    "kickoff": "2024-04-02T19:15:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:aston villa:2024-04-03",
    "kickoff": "2024-04-03T19:15:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:millwall:2024-04-06",
    "kickoff": "2024-04-06T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:bristol city:2024-04-06",
    "kickoff": "2024-04-06T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:coventry",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:coventry"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:coventry:2024-04-09",
    "kickoff": "2024-04-09T18:45:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:sunderland"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:sunderland:2024-04-09",
    "kickoff": "2024-04-09T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:blackburn:2024-04-13",
    "kickoff": "2024-04-13T11:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:watford:2024-04-13",
    "kickoff": "2024-04-13T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:luton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:luton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:luton:2024-04-13",
    "kickoff": "2024-04-13T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:fulham:2024-04-14",
    "kickoff": "2024-04-14T13:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:preston:2024-04-16",
    "kickoff": "2024-04-16T19:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:swansea:2024-04-20",
    "kickoff": "2024-04-20T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:millwall:2024-04-20",
    "kickoff": "2024-04-20T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:liverpool:2024-04-27",
    "kickoff": "2024-04-27T11:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:birmingham-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2023-2024:championship:huddersfield:birmingham:2024-04-27",
    "kickoff": "2024-04-27T14:00:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:stoke city:2024-04-27",
    "kickoff": "2024-04-27T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:southampton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:southampton:2024-05-04",
    "kickoff": "2024-05-04T11:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:sheffield-wednesday",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:sheffield-wednesday"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2023-2024:championship:sunderland:sheffield wednesday:2024-05-04",
    "kickoff": "2024-05-04T11:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:wolves:2024-05-04",
    "kickoff": "2024-05-04T16:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:luton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:luton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2023-2024:premier-league:west ham:luton:2024-05-11",
    "kickoff": "2024-05-11T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2023-2024:championship:leeds:norwich:2024-05-16",
    "kickoff": "2024-05-16T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2023-2024:championship:southampton:west brom:2024-05-17",
    "kickoff": "2024-05-17T19:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:west-ham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2023-2024:premier-league:manchester city:west ham:2024-05-19",
    "kickoff": "2024-05-19T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:celje",
    "clubIds": [
      "tfdclub:flora-tallinn",
      "tfdclub:celje"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:flora-tallinn",
    "id": "tfmatch:2024-2025:uefa-champions-league:flora tallinn:celje:2024-07-10",
    "kickoff": "2024-07-10T16:00:00+00:00",
    "latitude": 59.421292,
    "longitude": 24.73205,
    "stadium": "A. Le Coq Arena"
  },
  {
    "awayClubId": "tfdclub:iauliai",
    "clubIds": [
      "tfdclub:levadia-tallinn",
      "tfdclub:iauliai"
    ],
    "competition": "UEFA Conference League",
    "homeClubId": "tfdclub:levadia-tallinn",
    "id": "tfmatch:2024-2025:uefa-conference-league:levadia tallinn:iauliai:2024-07-18",
    "kickoff": "2024-07-18T16:00:00+00:00",
    "latitude": 59.421292,
    "longitude": 24.73205,
    "stadium": "A. Le Coq Arena"
  },
  {
    "awayClubId": "tfdclub:virtus",
    "clubIds": [
      "tfdclub:flora-tallinn",
      "tfdclub:virtus"
    ],
    "competition": "UEFA Conference League",
    "homeClubId": "tfdclub:flora-tallinn",
    "id": "tfmatch:2024-2025:uefa-conference-league:flora tallinn:virtus:2024-07-30",
    "kickoff": "2024-07-30T16:00:00+00:00",
    "latitude": 59.421292,
    "longitude": 24.73205,
    "stadium": "A. Le Coq Arena"
  },
  {
    "awayClubId": "tfdclub:nk-osijek",
    "clubIds": [
      "tfdclub:levadia-tallinn",
      "tfdclub:nk-osijek"
    ],
    "competition": "UEFA Conference League",
    "homeClubId": "tfdclub:levadia-tallinn",
    "id": "tfmatch:2024-2025:uefa-conference-league:levadia tallinn:nk osijek:2024-08-01",
    "kickoff": "2024-08-01T16:00:00+00:00",
    "latitude": 59.421292,
    "longitude": 24.73205,
    "stadium": "A. Le Coq Arena"
  },
  {
    "awayClubId": "tfdclub:portsmouth",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:portsmouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:portsmouth:2024-08-10",
    "kickoff": "2024-08-10T11:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:bk-hacken",
    "clubIds": [
      "tfdclub:paide",
      "tfdclub:bk-hacken"
    ],
    "competition": "UEFA Conference League",
    "homeClubId": "tfdclub:paide",
    "id": "tfmatch:2024-2025:uefa-conference-league:paide:bk hacken:2024-08-13",
    "kickoff": "2024-08-13T16:30:00+00:00",
    "latitude": 59.421292,
    "longitude": 24.73205,
    "stadium": "A. Le Coq Arena"
  },
  {
    "awayClubId": "tfdclub:morecambe",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:morecambe"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-cup:huddersfield:morecambe:2024-08-13",
    "kickoff": "2024-08-13T18:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:middlesbrough"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:league-cup:leeds:middlesbrough:2024-08-14",
    "kickoff": "2024-08-14T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:vikingur-reykjavik",
    "clubIds": [
      "tfdclub:flora-tallinn",
      "tfdclub:vikingur-reykjavik"
    ],
    "competition": "UEFA Conference League",
    "homeClubId": "tfdclub:flora-tallinn",
    "id": "tfmatch:2024-2025:uefa-conference-league:flora tallinn:vikingur reykjavik:2024-08-15",
    "kickoff": "2024-08-15T16:00:00+00:00",
    "latitude": 59.421292,
    "longitude": 24.73205,
    "stadium": "A. Le Coq Arena"
  },
  {
    "awayClubId": "tfdclub:stevenage",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:stevenage"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:stevenage:2024-08-17",
    "kickoff": "2024-08-17T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:aston villa:2024-08-17",
    "kickoff": "2024-08-17T16:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-wednesday",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:sheffield-wednesday"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:sheffield wednesday:2024-08-18",
    "kickoff": "2024-08-18T11:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:burnley"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:burnley:2024-08-24",
    "kickoff": "2024-08-24T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:ipswich-town"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:ipswich:2024-08-24",
    "kickoff": "2024-08-24T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:nottingham forest:2024-08-24",
    "kickoff": "2024-08-24T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:shrewsbury",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:shrewsbury"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:shrewsbury:2024-08-24",
    "kickoff": "2024-08-24T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:bournemouth"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:league-cup:west ham:bournemouth:2024-08-28",
    "kickoff": "2024-08-28T18:45:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:hull-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:hull city:2024-08-31",
    "kickoff": "2024-08-31T14:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:manchester city:2024-08-31",
    "kickoff": "2024-08-31T16:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:burnley"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:burnley:2024-09-14",
    "kickoff": "2024-09-14T11:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:manchester united:2024-09-14",
    "kickoff": "2024-09-14T11:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:brentford:2024-09-14",
    "kickoff": "2024-09-14T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:inter",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:inter"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:uefa-champions-league:manchester city:inter:2024-09-18",
    "kickoff": "2024-09-18T19:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:middlesbrough:2024-09-21",
    "kickoff": "2024-09-21T11:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:chelsea:2024-09-21",
    "kickoff": "2024-09-21T11:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:ipswich-town"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:ipswich:2024-09-21",
    "kickoff": "2024-09-21T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:northampton",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:northampton"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:northampton:2024-09-21",
    "kickoff": "2024-09-21T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:arsenal:2024-09-22",
    "kickoff": "2024-09-22T15:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:watford"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:league-cup:manchester city:watford:2024-09-24",
    "kickoff": "2024-09-24T18:45:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:blackpool",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:blackpool"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:blackpool:2024-09-24",
    "kickoff": "2024-09-24T18:45:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:coventry",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:coventry"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:coventry:2024-09-28",
    "kickoff": "2024-09-28T14:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:boston-united",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:boston-united",
    "id": "tfmatch:2024-2025:league-cup:boston united:leeds united u21:2024-10-01",
    "kickoff": "2024-10-01T00:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:derby-county",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:derby-county"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:derby:2024-10-01",
    "kickoff": "2024-10-01T18:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:leeds-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:leeds:2024-10-04",
    "kickoff": "2024-10-04T19:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:barnsley",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:barnsley"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:barnsley:2024-10-05",
    "kickoff": "2024-10-05T11:30:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:fulham:2024-10-05",
    "kickoff": "2024-10-05T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:ipswich-town"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:ipswich:2024-10-05",
    "kickoff": "2024-10-05T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:barnsley",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:barnsley"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:efl-trophy:huddersfield:barnsley:2024-10-08",
    "kickoff": "2024-10-08T18:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-united",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:sheffield-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:sheffield utd:2024-10-18",
    "kickoff": "2024-10-18T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:leicester"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:leicester:2024-10-19",
    "kickoff": "2024-10-19T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-rovers",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:bristol-rovers"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:bristol rovers:2024-10-19",
    "kickoff": "2024-10-19T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:watford:2024-10-22",
    "kickoff": "2024-10-22T18:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:sparta-praha",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:sparta-praha"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:uefa-champions-league:manchester city:sparta praha:2024-10-23",
    "kickoff": "2024-10-23T19:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:oxford-united",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:oxford-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:oxford united:2024-10-26",
    "kickoff": "2024-10-26T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:southampton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:southampton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:southampton:2024-10-26",
    "kickoff": "2024-10-26T14:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:exeter-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:exeter-city"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:exeter city:2024-10-26",
    "kickoff": "2024-10-26T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:manchester united:2024-10-27",
    "kickoff": "2024-10-27T13:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:stoke-city"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:league-cup:southampton:stoke city:2024-10-29",
    "kickoff": "2024-10-29T19:45:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:plymouth",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:plymouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:plymouth:2024-11-02",
    "kickoff": "2024-11-02T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:everton:2024-11-02",
    "kickoff": "2024-11-02T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton-u21",
    "clubIds": [
      "tfdclub:woking",
      "tfdclub:southampton-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:woking",
    "id": "tfmatch:2024-2025:league-cup:woking:southampton u21:2024-11-05",
    "kickoff": "2024-11-05T19:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland-u21",
    "clubIds": [
      "tfdclub:boston-united",
      "tfdclub:sunderland-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:boston-united",
    "id": "tfmatch:2024-2025:league-cup:boston united:sunderland u21:2024-11-05",
    "kickoff": "2024-11-05T19:30:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:gateshead",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:gateshead",
    "id": "tfmatch:2024-2025:league-cup:gateshead:leeds united u21:2024-11-06",
    "kickoff": "2024-11-06T19:30:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:qpr:2024-11-09",
    "kickoff": "2024-11-09T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:coventry",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:coventry"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:coventry:2024-11-09",
    "kickoff": "2024-11-09T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:everton:2024-11-09",
    "kickoff": "2024-11-09T15:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton-u21",
    "clubIds": [
      "tfdclub:wealdstone",
      "tfdclub:southampton-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:wealdstone",
    "id": "tfmatch:2024-2025:league-cup:wealdstone:southampton u21:2024-11-12",
    "kickoff": "2024-11-12T19:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united-u21",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:manchester-united-u21"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:efl-trophy:huddersfield:manchester united u21:2024-11-12",
    "kickoff": "2024-11-12T19:45:00+00:00",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland-u21",
    "clubIds": [
      "tfdclub:tamworth",
      "tfdclub:sunderland-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:tamworth",
    "id": "tfmatch:2024-2025:league-cup:tamworth:sunderland u21:2024-11-19",
    "kickoff": "2024-11-19T19:45:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:charlton-athletic",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:charlton-athletic"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:charlton:2024-11-23",
    "kickoff": "2024-11-23T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:tottenham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:tottenham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:tottenham:2024-11-23",
    "kickoff": "2024-11-23T17:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:liverpool:2024-11-24",
    "kickoff": "2024-11-24T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:west brom:2024-11-26",
    "kickoff": "2024-11-26T20:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:feyenoord",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:feyenoord"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:uefa-champions-league:manchester city:feyenoord:2024-11-26",
    "kickoff": "2024-11-26T20:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:luton",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:luton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:luton:2024-11-27",
    "kickoff": "2024-11-27T19:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:arsenal:2024-11-30",
    "kickoff": "2024-11-30T17:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton-u21",
    "clubIds": [
      "tfdclub:aldershot-town",
      "tfdclub:southampton-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:aldershot-town",
    "id": "tfmatch:2024-2025:league-cup:aldershot town:southampton u21:2024-12-03",
    "kickoff": "2024-12-03T19:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:halifax-town",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:halifax-town",
    "id": "tfmatch:2024-2025:league-cup:halifax town:leeds united u21:2024-12-03",
    "kickoff": "2024-12-03T19:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:wigan",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:wigan"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:wigan:2024-12-03",
    "kickoff": "2024-12-03T20:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:nottingham forest:2024-12-04",
    "kickoff": "2024-12-04T19:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:chelsea:2024-12-04",
    "kickoff": "2024-12-04T19:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland-u21",
    "clubIds": [
      "tfdclub:gateshead",
      "tfdclub:sunderland-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:gateshead",
    "id": "tfmatch:2024-2025:league-cup:gateshead:sunderland u21:2024-12-04",
    "kickoff": "2024-12-04T19:30:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:derby-county",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:derby-county"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:derby:2024-12-07",
    "kickoff": "2024-12-07T12:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:stoke city:2024-12-07",
    "kickoff": "2024-12-07T12:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:wolves:2024-12-09",
    "kickoff": "2024-12-09T20:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:bristol city:2024-12-10",
    "kickoff": "2024-12-10T19:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:middlesbrough:2024-12-10",
    "kickoff": "2024-12-10T20:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:lincoln-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:lincoln-city"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:lincoln:2024-12-14",
    "kickoff": "2024-12-14T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:manchester united:2024-12-15",
    "kickoff": "2024-12-15T16:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:tottenham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:tottenham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:tottenham:2024-12-15",
    "kickoff": "2024-12-15T19:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:liverpool"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:league-cup:southampton:liverpool:2024-12-18",
    "kickoff": "2024-12-18T20:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:oxford-united",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:oxford-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:oxford united:2024-12-21",
    "kickoff": "2024-12-21T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:norwich:2024-12-21",
    "kickoff": "2024-12-21T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:brighton:2024-12-21",
    "kickoff": "2024-12-21T15:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:everton:2024-12-26",
    "kickoff": "2024-12-26T12:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:west-ham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:west ham:2024-12-26",
    "kickoff": "2024-12-26T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:stockport-county",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:stockport-county"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:stockport county:2024-12-26",
    "kickoff": "2024-12-26T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:burton-albion",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:burton-albion"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:burton albion:2024-12-29",
    "kickoff": "2024-12-29T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:liverpool:2024-12-29",
    "kickoff": "2024-12-29T17:15:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:blackburn:2025-01-01",
    "kickoff": "2025-01-01T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:sheffield-united",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:sheffield-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:sheffield utd:2025-01-01",
    "kickoff": "2025-01-01T20:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:west-ham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:west ham:2025-01-04",
    "kickoff": "2025-01-04T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:brentford:2025-01-04",
    "kickoff": "2025-01-04T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:rotherham",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:rotherham"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:rotherham:2025-01-04",
    "kickoff": "2025-01-04T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:portsmouth",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:portsmouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:portsmouth:2025-01-05",
    "kickoff": "2025-01-05T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:stoke-city"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:fa-cup:sunderland:stoke city:2025-01-11",
    "kickoff": "2025-01-11T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:harrogate-town",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:harrogate-town"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:fa-cup:leeds:harrogate town:2025-01-11",
    "kickoff": "2025-01-11T17:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:salford-city",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:salford-city"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:fa-cup:manchester city:salford city:2025-01-11",
    "kickoff": "2025-01-11T17:45:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:swansea-city"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:fa-cup:southampton:swansea:2025-01-12",
    "kickoff": "2025-01-12T16:30:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:fulham:2025-01-14",
    "kickoff": "2025-01-14T19:30:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:crystal palace:2025-01-18",
    "kickoff": "2025-01-18T15:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-wednesday",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:sheffield-wednesday"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:sheffield wednesday:2025-01-19",
    "kickoff": "2025-01-19T12:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:tamworth",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:tamworth",
    "id": "tfmatch:2024-2025:league-cup:tamworth:leeds united u21:2025-01-21",
    "kickoff": "2025-01-21T19:45:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:norwich:2025-01-22",
    "kickoff": "2025-01-22T19:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:bolton",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:bolton"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:bolton:2025-01-25",
    "kickoff": "2025-01-25T12:30:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:plymouth",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:plymouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:plymouth:2025-01-25",
    "kickoff": "2025-01-25T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:newcastle:2025-01-25",
    "kickoff": "2025-01-25T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:chelsea:2025-01-25",
    "kickoff": "2025-01-25T17:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland-u21",
    "clubIds": [
      "tfdclub:halifax-town",
      "tfdclub:sunderland-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:halifax-town",
    "id": "tfmatch:2024-2025:league-cup:halifax town:sunderland u21:2025-01-28",
    "kickoff": "2025-01-28T19:00:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:birmingham-city"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:birmingham:2025-01-28",
    "kickoff": "2025-01-28T20:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:club-brugge-kv",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:club-brugge-kv"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:uefa-champions-league:manchester city:club brugge kv:2025-01-29",
    "kickoff": "2025-01-29T20:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:cardiff:2025-02-01",
    "kickoff": "2025-02-01T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:millwall"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:fa-cup:leeds:millwall:2025-02-08",
    "kickoff": "2025-02-08T12:15:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:watford:2025-02-08",
    "kickoff": "2025-02-08T12:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:burnley"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:fa-cup:southampton:burnley:2025-02-08",
    "kickoff": "2025-02-08T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:reading",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:reading"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:reading:2025-02-08",
    "kickoff": "2025-02-08T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton-u21",
    "clubIds": [
      "tfdclub:maidenhead",
      "tfdclub:southampton-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:maidenhead",
    "id": "tfmatch:2024-2025:league-cup:maidenhead:southampton u21:2025-02-11",
    "kickoff": "2025-02-11T19:45:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:real-madrid",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:real-madrid"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:uefa-champions-league:manchester city:real madrid:2025-02-11",
    "kickoff": "2025-02-11T20:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:luton",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:luton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:luton:2025-02-12",
    "kickoff": "2025-02-12T19:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:newcastle:2025-02-15",
    "kickoff": "2025-02-15T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:bournemouth:2025-02-15",
    "kickoff": "2025-02-15T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:brentford:2025-02-15",
    "kickoff": "2025-02-15T15:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:sunderland"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:sunderland:2025-02-17",
    "kickoff": "2025-02-17T20:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:hull-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:hull city:2025-02-22",
    "kickoff": "2025-02-22T12:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:brighton:2025-02-22",
    "kickoff": "2025-02-22T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:peterborough",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:peterborough"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:peterborough:2025-02-22",
    "kickoff": "2025-02-22T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:liverpool:2025-02-23",
    "kickoff": "2025-02-23T16:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:leicester"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:leicester:2025-02-27",
    "kickoff": "2025-02-27T20:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:west brom:2025-03-01",
    "kickoff": "2025-03-01T12:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:plymouth",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:plymouth"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:fa-cup:manchester city:plymouth:2025-03-01",
    "kickoff": "2025-03-01T17:45:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:wrexham",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:wrexham"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:wrexham:2025-03-04",
    "kickoff": "2025-03-04T19:45:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:cardiff:2025-03-08",
    "kickoff": "2025-03-08T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:newcastle:2025-03-10",
    "kickoff": "2025-03-10T20:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:aldershot-town",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:aldershot-town",
    "id": "tfmatch:2024-2025:league-cup:aldershot town:leeds united u21:2025-03-11",
    "kickoff": "2025-03-11T19:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:preston:2025-03-11",
    "kickoff": "2025-03-11T19:45:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:millwall:2025-03-12",
    "kickoff": "2025-03-12T19:45:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:pafos",
    "clubIds": [
      "tfdclub:djurgardens-if",
      "tfdclub:pafos"
    ],
    "competition": "UEFA Conference League",
    "homeClubId": "tfdclub:djurgardens-if",
    "id": "tfmatch:2024-2025:uefa-conference-league:djurgardens if:pafos:2025-03-13",
    "kickoff": "2025-03-13T17:45:00+00:00",
    "latitude": 59.29138889,
    "longitude": 18.08527778,
    "stadium": "3Arena"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:brighton:2025-03-15",
    "kickoff": "2025-03-15T15:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:wolves:2025-03-15",
    "kickoff": "2025-03-15T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:crawley-town",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:crawley-town"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:crawley town:2025-03-15",
    "kickoff": "2025-03-15T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:swansea:2025-03-29",
    "kickoff": "2025-03-29T15:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:millwall:2025-03-29",
    "kickoff": "2025-03-29T15:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:altrincham",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:altrincham",
    "id": "tfmatch:2024-2025:league-cup:altrincham:leeds united u21:2025-04-01",
    "kickoff": "2025-04-01T18:30:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:leicester"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:leicester:2025-04-02",
    "kickoff": "2025-04-02T18:45:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:crystal palace:2025-04-02",
    "kickoff": "2025-04-02T18:45:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:bournemouth:2025-04-05",
    "kickoff": "2025-04-05T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:mansfield-town",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:mansfield-town"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:mansfield town:2025-04-05",
    "kickoff": "2025-04-05T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:wycombe",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:wycombe"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:wycombe:2025-04-08",
    "kickoff": "2025-04-08T18:45:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:rapid-vienna",
    "clubIds": [
      "tfdclub:djurgardens-if",
      "tfdclub:rapid-vienna"
    ],
    "competition": "UEFA Conference League",
    "homeClubId": "tfdclub:djurgardens-if",
    "id": "tfmatch:2024-2025:uefa-conference-league:djurgardens if:rapid vienna:2025-04-10",
    "kickoff": "2025-04-10T19:00:00+00:00",
    "latitude": 59.29138889,
    "longitude": 18.08527778,
    "stadium": "3Arena"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:preston:2025-04-12",
    "kickoff": "2025-04-12T11:30:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:crystal palace:2025-04-12",
    "kickoff": "2025-04-12T11:30:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:swansea:2025-04-12",
    "kickoff": "2025-04-12T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:aston villa:2025-04-12",
    "kickoff": "2025-04-12T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:cambridge-united",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:cambridge-united"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:cambridge united:2025-04-18",
    "kickoff": "2025-04-18T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:southampton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:southampton:2025-04-19",
    "kickoff": "2025-04-19T14:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:stoke city:2025-04-21",
    "kickoff": "2025-04-21T14:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:blackburn:2025-04-21",
    "kickoff": "2025-04-21T14:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:aston villa:2025-04-22",
    "kickoff": "2025-04-22T19:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:fulham:2025-04-26",
    "kickoff": "2025-04-26T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2024-2025:championship:leeds:bristol city:2025-04-28",
    "kickoff": "2025-04-28T19:00:00+00:00",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:sutton-united",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:sutton-united",
    "id": "tfmatch:2024-2025:league-cup:sutton united:leeds united u21:2025-04-29",
    "kickoff": "2025-04-29T18:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:djurgardens-if",
      "tfdclub:chelsea"
    ],
    "competition": "UEFA Conference League",
    "homeClubId": "tfdclub:djurgardens-if",
    "id": "tfmatch:2024-2025:uefa-conference-league:djurgardens if:chelsea:2025-05-01",
    "kickoff": "2025-05-01T19:00:00+00:00",
    "latitude": 59.29138889,
    "longitude": 18.08527778,
    "stadium": "3Arena"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:wolves:2025-05-02",
    "kickoff": "2025-05-02T19:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:qpr:2025-05-03",
    "kickoff": "2025-05-03T11:30:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leyton-orient",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:leyton-orient"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2024-2025:league-one:huddersfield:leyton orient:2025-05-03",
    "kickoff": "2025-05-03T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:tottenham",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:tottenham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:tottenham:2025-05-04",
    "kickoff": "2025-05-04T13:00:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:manchester city:2025-05-10",
    "kickoff": "2025-05-10T14:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:coventry",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:coventry"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2024-2025:championship:sunderland:coventry:2025-05-13",
    "kickoff": "2025-05-13T19:00:00+00:00",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2024-2025:premier-league:west ham:nottingham forest:2025-05-18",
    "kickoff": "2025-05-18T13:15:00+00:00",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2024-2025:premier-league:manchester city:bournemouth:2025-05-20",
    "kickoff": "2025-05-20T19:00:00+00:00",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2024-2025:premier-league:southampton:arsenal:2025-05-25",
    "kickoff": "2025-05-25T15:00:00+00:00",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:wrexham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:wrexham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:wrexham:2025-08-09",
    "kickoff": "2025-08-09T11:30:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:boston-united",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:boston-united",
    "id": "tfmatch:2025-2026:league-cup:boston united:leeds united u21:2025-08-12",
    "kickoff": "2025-08-12T18:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:sunderland-u21",
    "clubIds": [
      "tfdclub:scunthorpe",
      "tfdclub:sunderland-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:scunthorpe",
    "id": "tfmatch:2025-2026:league-cup:scunthorpe:sunderland u21:2025-08-12",
    "kickoff": "2025-08-12T18:00:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:southampton-u21",
    "clubIds": [
      "tfdclub:truro-city",
      "tfdclub:southampton-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:truro-city",
    "id": "tfmatch:2025-2026:league-cup:truro city:southampton u21:2025-08-13",
    "kickoff": "2025-08-13T18:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:leicester"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2025-2026:league-cup:huddersfield:leicester:2025-08-13",
    "kickoff": "2025-08-13T18:45:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:west-ham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:west ham united:2025-08-16",
    "kickoff": "2025-08-16T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:everton:2025-08-18",
    "kickoff": "2025-08-18T19:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:chelsea:2025-08-22",
    "kickoff": "2025-08-22T19:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:tottenham-hotspur",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:tottenham-hotspur"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:tottenham hotspur:2025-08-23",
    "kickoff": "2025-08-23T11:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:stoke city:2025-08-23",
    "kickoff": "2025-08-23T14:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-city-u21",
    "clubIds": [
      "tfdclub:oldham",
      "tfdclub:manchester-city-u21"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:oldham",
    "id": "tfmatch:2025-2026:efl-trophy:oldham:manchester city u21:2025-08-26",
    "kickoff": "2025-08-26T18:00:00.000Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:huddersfield",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:huddersfield"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:league-cup:sunderland:huddersfield:2025-08-26",
    "kickoff": "2025-08-26T18:45:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:brentford:2025-08-30",
    "kickoff": "2025-08-30T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:newcastle united:2025-08-30",
    "kickoff": "2025-08-30T16:30:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:port-vale",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:port-vale",
    "id": "tfmatch:2025-2026:efl-trophy:port vale:leeds united u21:2025-09-02",
    "kickoff": "2025-09-02T18:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:tottenham-hotspur",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:tottenham-hotspur"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:tottenham hotspur:2025-09-13",
    "kickoff": "2025-09-13T16:30:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:portsmouth",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:portsmouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:portsmouth:2025-09-14",
    "kickoff": "2025-09-14T11:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:manchester united:2025-09-14",
    "kickoff": "2025-09-14T15:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland-u21",
    "clubIds": [
      "tfdclub:boston-united",
      "tfdclub:sunderland-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:boston-united",
    "id": "tfmatch:2025-2026:league-cup:boston united:sunderland u21:2025-09-16",
    "kickoff": "2025-09-16T18:00:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:scunthorpe",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:scunthorpe",
    "id": "tfmatch:2025-2026:league-cup:scunthorpe:leeds united u21:2025-09-16",
    "kickoff": "2025-09-16T18:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:southampton-u21",
    "clubIds": [
      "tfdclub:woking",
      "tfdclub:southampton-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:woking",
    "id": "tfmatch:2025-2026:league-cup:woking:southampton u21:2025-09-16",
    "kickoff": "2025-09-16T18:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:ssc-napoli",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:ssc-napoli"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:uefa-champions-league:manchester city:ssc napoli:2025-09-18",
    "kickoff": "2025-09-18T19:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:crystal palace:2025-09-20",
    "kickoff": "2025-09-20T14:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:aston villa:2025-09-21",
    "kickoff": "2025-09-21T13:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:manchester-city-u21",
    "clubIds": [
      "tfdclub:bolton",
      "tfdclub:manchester-city-u21"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:bolton",
    "id": "tfmatch:2025-2026:efl-trophy:bolton:manchester city u21:2025-09-23",
    "kickoff": "2025-09-23T18:00:00.000Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:manchester-city"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2025-2026:league-cup:huddersfield:manchester city:2025-09-24",
    "kickoff": "2025-09-24T18:45:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:middlesbrough:2025-09-27",
    "kickoff": "2025-09-27T14:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:bournemouth:2025-09-27",
    "kickoff": "2025-09-27T14:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:burnley"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:burnley:2025-09-27",
    "kickoff": "2025-09-27T14:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:tottenham-hotspur",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:tottenham-hotspur"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:tottenham hotspur:2025-10-04",
    "kickoff": "2025-10-04T11:30:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:fleetwood-town",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:fleetwood-town",
    "id": "tfmatch:2025-2026:efl-trophy:fleetwood town:leeds united u21:2025-10-07",
    "kickoff": "2025-10-07T18:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:swansea city:2025-10-18",
    "kickoff": "2025-10-18T11:30:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:everton:2025-10-18",
    "kickoff": "2025-10-18T14:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:wolverhampton wanderers:2025-10-18",
    "kickoff": "2025-10-18T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:brentford:2025-10-20",
    "kickoff": "2025-10-20T19:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton-u21",
    "clubIds": [
      "tfdclub:aldershot-town",
      "tfdclub:southampton-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:aldershot-town",
    "id": "tfmatch:2025-2026:league-cup:aldershot town:southampton u21:2025-10-21",
    "kickoff": "2025-10-21T18:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:halifax-town",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:halifax-town",
    "id": "tfmatch:2025-2026:league-cup:halifax town:leeds united u21:2025-10-21",
    "kickoff": "2025-10-21T18:00:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:sunderland-u21",
    "clubIds": [
      "tfdclub:gateshead",
      "tfdclub:sunderland-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:gateshead",
    "id": "tfmatch:2025-2026:league-cup:gateshead:sunderland u21:2025-10-21",
    "kickoff": "2025-10-21T18:30:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:west-ham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:west ham united:2025-10-24",
    "kickoff": "2025-10-24T19:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:manchester-city-u21",
    "clubIds": [
      "tfdclub:rotherham",
      "tfdclub:manchester-city-u21"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:rotherham",
    "id": "tfmatch:2025-2026:efl-trophy:rotherham united:manchester city u21:2025-10-28",
    "kickoff": "2025-10-28T19:00:00.000Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:preston north end:2025-11-01",
    "kickoff": "2025-11-01T15:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:newcastle united:2025-11-02",
    "kickoff": "2025-11-02T14:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:bournemouth:2025-11-02",
    "kickoff": "2025-11-02T16:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:everton:2025-11-03",
    "kickoff": "2025-11-03T20:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:mansfield-town",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:mansfield-town"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2025-2026:efl-trophy:huddersfield:mansfield town:2025-11-04",
    "kickoff": "2025-11-04T19:45:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:borussia-dortmund",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:borussia-dortmund"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:uefa-champions-league:manchester city:borussia dortmund:2025-11-05",
    "kickoff": "2025-11-05T20:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-wednesday",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:sheffield-wednesday"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:sheffield wednesday:2025-11-08",
    "kickoff": "2025-11-08T15:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:burnley"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:burnley:2025-11-08",
    "kickoff": "2025-11-08T15:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:arsenal:2025-11-08",
    "kickoff": "2025-11-08T17:30:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:liverpool:2025-11-09",
    "kickoff": "2025-11-09T16:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:accrington-st",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:accrington-st",
    "id": "tfmatch:2025-2026:efl-trophy:accrington st:leeds united u21:2025-11-11",
    "kickoff": "2025-11-11T19:45:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:aston villa:2025-11-23",
    "kickoff": "2025-11-23T14:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:sunderland-u21",
    "clubIds": [
      "tfdclub:halifax-town",
      "tfdclub:sunderland-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:halifax-town",
    "id": "tfmatch:2025-2026:league-cup:halifax town:sunderland u21:2025-11-25",
    "kickoff": "2025-11-25T19:00:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:southampton-u21",
    "clubIds": [
      "tfdclub:sutton-united",
      "tfdclub:southampton-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:sutton-united",
    "id": "tfmatch:2025-2026:league-cup:sutton united:southampton u21:2025-11-25",
    "kickoff": "2025-11-25T19:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leicester-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:leicester-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:leicester city:2025-11-25",
    "kickoff": "2025-11-25T20:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:bayer-04-leverkusen",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:bayer-04-leverkusen"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:uefa-champions-league:manchester city:bayer 04 leverkusen:2025-11-25",
    "kickoff": "2025-11-25T20:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united-u21",
    "clubIds": [
      "tfdclub:gateshead",
      "tfdclub:leeds-united-u21"
    ],
    "competition": "National League Cup",
    "homeClubId": "tfdclub:gateshead",
    "id": "tfmatch:2025-2026:league-cup:gateshead:leeds united u21:2025-11-26",
    "kickoff": "2025-11-26T19:30:00.000Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:leeds-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:leeds united:2025-11-29",
    "kickoff": "2025-11-29T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:bournemouth:2025-11-29",
    "kickoff": "2025-11-29T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:liverpool:2025-11-30",
    "kickoff": "2025-11-30T14:05:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:chelsea:2025-12-03",
    "kickoff": "2025-12-03T20:15:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:birmingham-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:birmingham city:2025-12-06",
    "kickoff": "2025-12-06T15:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:sunderland"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:sunderland:2025-12-06",
    "kickoff": "2025-12-06T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:liverpool:2025-12-06",
    "kickoff": "2025-12-06T17:30:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:west bromwich albion:2025-12-09",
    "kickoff": "2025-12-09T19:45:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:newcastle united:2025-12-14",
    "kickoff": "2025-12-14T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:aston villa:2025-12-14",
    "kickoff": "2025-12-14T14:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:coventry-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:coventry-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:coventry city:2025-12-20",
    "kickoff": "2025-12-20T12:30:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:west-ham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:west ham united:2025-12-20",
    "kickoff": "2025-12-20T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:crystal palace:2025-12-20",
    "kickoff": "2025-12-20T20:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:fulham:2025-12-27",
    "kickoff": "2025-12-27T15:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:leeds-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:leeds united:2025-12-28",
    "kickoff": "2025-12-28T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:brighton hove albion:2025-12-30",
    "kickoff": "2025-12-30T19:30:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:millwall:2026-01-01",
    "kickoff": "2026-01-01T15:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:manchester city:2026-01-01",
    "kickoff": "2026-01-01T20:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:manchester united:2026-01-04",
    "kickoff": "2026-01-04T12:30:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:chelsea:2026-01-04",
    "kickoff": "2026-01-04T17:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:nottingham forest:2026-01-06",
    "kickoff": "2026-01-06T20:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:brighton hove albion:2026-01-07",
    "kickoff": "2026-01-07T19:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:qpr"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:fa-cup:west ham:qpr:2026-01-11",
    "kickoff": "2026-01-11T14:30:00.000Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:rotherham",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:rotherham"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2025-2026:efl-trophy:huddersfield:rotherham united:2026-01-13",
    "kickoff": "2026-01-13T19:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:hull-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:hull city:2026-01-17",
    "kickoff": "2026-01-17T15:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:fulham:2026-01-17",
    "kickoff": "2026-01-17T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:crystal palace:2026-01-17",
    "kickoff": "2026-01-17T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:sheffield-united",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:sheffield-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:sheffield united:2026-01-21",
    "kickoff": "2026-01-21T19:45:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:sunderland"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:sunderland:2026-01-24",
    "kickoff": "2026-01-24T12:30:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:wolverhampton wanderers:2026-01-24",
    "kickoff": "2026-01-24T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:arsenal:2026-01-31",
    "kickoff": "2026-01-31T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:burnley"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:burnley:2026-02-02",
    "kickoff": "2026-02-02T20:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:nottingham forest:2026-02-06",
    "kickoff": "2026-02-06T20:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:watford:2026-02-07",
    "kickoff": "2026-02-07T12:31:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:doncaster",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:doncaster"
    ],
    "competition": "EFL Trophy",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2025-2026:efl-trophy:huddersfield:doncaster:2026-02-10",
    "kickoff": "2026-02-10T19:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:manchester united:2026-02-10",
    "kickoff": "2026-02-10T20:15:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:fulham:2026-02-11",
    "kickoff": "2026-02-11T19:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:liverpool:2026-02-11",
    "kickoff": "2026-02-11T20:15:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:leicester"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:fa-cup:southampton:leicester:2026-02-14",
    "kickoff": "2026-02-14T15:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:charlton-athletic",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:charlton-athletic"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:charlton athletic:2026-02-21",
    "kickoff": "2026-02-21T15:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:bournemouth:2026-02-21",
    "kickoff": "2026-02-21T17:30:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:newcastle united:2026-02-21",
    "kickoff": "2026-02-21T20:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:fulham:2026-02-22",
    "kickoff": "2026-02-22T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:queens park rangers:2026-02-24",
    "kickoff": "2026-02-24T20:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:manchester city:2026-02-28",
    "kickoff": "2026-02-28T17:30:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:sunderland"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:sunderland:2026-03-03",
    "kickoff": "2026-03-03T19:30:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:nottingham forest:2026-03-04",
    "kickoff": "2026-03-04T19:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:brentford"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:fa-cup:west ham:brentford:2026-03-09",
    "kickoff": "2026-03-09T19:30:00.000Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:brighton hove albion:2026-03-14",
    "kickoff": "2026-03-14T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:manchester city:2026-03-14",
    "kickoff": "2026-03-14T20:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:real-madrid-cf",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:real-madrid-cf"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:uefa-champions-league:manchester city:real madrid cf:2026-03-17",
    "kickoff": "2026-03-17T20:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:norwich city:2026-03-18",
    "kickoff": "2026-03-18T19:45:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:oxford-united",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:oxford-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:oxford united:2026-03-21",
    "kickoff": "2026-03-21T15:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:brentford:2026-03-21",
    "kickoff": "2026-03-21T20:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:arsenal"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:fa-cup:southampton:arsenal:2026-04-04",
    "kickoff": "2026-04-04T19:00:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:leeds-united"
    ],
    "competition": "FA Cup",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:fa-cup:west ham:leeds:2026-04-05",
    "kickoff": "2026-04-05T15:30:00.000Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:wolverhampton wanderers:2026-04-10",
    "kickoff": "2026-04-10T19:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:derby-county",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:derby-county"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:derby county:2026-04-11",
    "kickoff": "2026-04-11T14:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:tottenham-hotspur",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:tottenham-hotspur"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:tottenham hotspur:2026-04-12",
    "kickoff": "2026-04-12T13:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:blackburn rovers:2026-04-14",
    "kickoff": "2026-04-14T19:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:wolverhampton wanderers:2026-04-18",
    "kickoff": "2026-04-18T14:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:arsenal:2026-04-19",
    "kickoff": "2026-04-19T15:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:bristol city:2026-04-21",
    "kickoff": "2026-04-21T18:45:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:nottingham forest:2026-04-24",
    "kickoff": "2026-04-24T19:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:everton:2026-04-25",
    "kickoff": "2026-04-25T14:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:ipswich-town"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:ipswich town:2026-04-28",
    "kickoff": "2026-04-28T18:45:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:burnley"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:burnley:2026-05-01",
    "kickoff": "2026-05-01T19:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:manchester united:2026-05-09",
    "kickoff": "2026-05-09T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:brentford:2026-05-09",
    "kickoff": "2026-05-09T16:30:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:arsenal:2026-05-10",
    "kickoff": "2026-05-10T15:30:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2025-2026:championship:southampton:middlesbrough:2026-05-12",
    "kickoff": "2026-05-12T19:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:crystal palace:2026-05-13",
    "kickoff": "2026-05-13T19:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2025-2026:premier-league:leeds united:brighton hove albion:2026-05-17",
    "kickoff": "2026-05-17T14:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2025-2026:premier-league:manchester city:aston villa:2026-05-24",
    "kickoff": "2026-05-24T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2025-2026:premier-league:sunderland:chelsea:2026-05-24",
    "kickoff": "2026-05-24T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:leeds-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2025-2026:premier-league:west ham united:leeds united:2026-05-24",
    "kickoff": "2026-05-24T15:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:portsmouth",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:portsmouth"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:league-cup:west ham:portsmouth:2026-08-08",
    "kickoff": "2026-08-08T14:00:00.000Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:wimbledon",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:wimbledon"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:wimbledon:2026-08-15",
    "kickoff": "2026-08-15T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:stoke city:2026-08-22",
    "kickoff": "2026-08-22T14:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:charlton-athletic",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:charlton-athletic"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:charlton athletic:2026-08-22",
    "kickoff": "2026-08-22T14:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:bournemouth:2026-08-23",
    "kickoff": "2026-08-23T13:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:west-ham"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:league-cup:southampton:west ham:2026-08-25",
    "kickoff": "2026-08-25T18:45:00.000Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:millwall:2026-08-29",
    "kickoff": "2026-08-29T14:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:brentford:2026-08-30",
    "kickoff": "2026-08-30T13:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:fulham:2026-08-30",
    "kickoff": "2026-08-30T13:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:oxford-united",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:oxford-united"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:oxford united:2026-09-01",
    "kickoff": "2026-09-01T18:45:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:wolverhampton wanderers:2026-09-01",
    "kickoff": "2026-09-01T18:45:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:notts-county",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:notts-county"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:notts county:2026-09-05",
    "kickoff": "2026-09-05T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:derby-county",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:derby-county"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:derby county:2026-09-05",
    "kickoff": "2026-09-05T14:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:coventry-city",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:coventry-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:coventry city:2026-09-05",
    "kickoff": "2026-09-05T14:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:hull-city"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:league-cup:sunderland:hull city:2026-09-08",
    "kickoff": "2026-09-08T18:45:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:swansea city:2026-09-08",
    "kickoff": "2026-09-08T18:45:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:wrexham",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:wrexham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:wrexham:2026-09-11",
    "kickoff": "2026-09-11T19:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:bristol city:2026-09-12",
    "kickoff": "2026-09-12T14:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:arsenal:2026-09-12",
    "kickoff": "2026-09-12T19:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:newcastle united:2026-09-14",
    "kickoff": "2026-09-14T19:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:fulham"
    ],
    "competition": "League Cup",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:league-cup:west ham:fulham:2026-09-08",
    "kickoff": "2026-09-15T18:45:00.000Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:az-alkmaar",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:az-alkmaar"
    ],
    "competition": "UEFA Europa League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:uefa-europa-league:tfdclub:sunderland:tfdclub:az-alkmaar:2026-09-16",
    "kickoff": "2026-09-16T19:00:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:crystal palace:2026-09-19",
    "kickoff": "2026-09-19T14:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:sunderland"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:sunderland:2026-09-19",
    "kickoff": "2026-09-19T14:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:luton",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:luton"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:luton:2026-09-26",
    "kickoff": "2026-09-26T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:queens park rangers:2026-10-09",
    "kickoff": "2026-10-09T19:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-wednesday",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:sheffield-wednesday"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:sheffield wednesday:2026-10-10",
    "kickoff": "2026-10-10T14:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:brighton hove albion:2026-10-10",
    "kickoff": "2026-10-10T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:portsmouth",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:portsmouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:portsmouth:2026-10-11",
    "kickoff": "2026-10-11T11:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:paris-saint-germain",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:paris-saint-germain"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:uefa-champions-league:tfdclub:manchester-city:tfdclub:paris-saint-germain:2026-10-14",
    "kickoff": "2026-10-14T19:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:bolton",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:bolton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:bolton wanderers:2026-10-17",
    "kickoff": "2026-10-17T14:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:ipswich-town"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:ipswich town:2026-10-17",
    "kickoff": "2026-10-17T14:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:manchester united:2026-10-18",
    "kickoff": "2026-10-18T13:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:peterborough",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:peterborough"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:peterborough:2026-10-20",
    "kickoff": "2026-10-20T18:45:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:wigan",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:wigan"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:wigan:2026-10-24",
    "kickoff": "2026-10-24T11:30:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:southampton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:southampton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:southampton:2026-10-24",
    "kickoff": "2026-10-24T14:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:leeds-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:leeds united:2026-10-25",
    "kickoff": "2026-10-25T16:30:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:qpr",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:qpr"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:queens park rangers:2026-10-31",
    "kickoff": "2026-10-31T15:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:west bromwich albion:2026-10-31",
    "kickoff": "2026-10-31T15:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:brighton hove albion:2026-10-31",
    "kickoff": "2026-10-31T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:tottenham-hotspur",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:tottenham-hotspur"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:tottenham hotspur:2026-11-07",
    "kickoff": "2026-11-07T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:chelsea:2026-11-07",
    "kickoff": "2026-11-07T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:derby-county",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:derby-county"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:derby county:2026-11-21",
    "kickoff": "2026-11-21T12:30:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leicester",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:leicester"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:leicester:2026-11-21",
    "kickoff": "2026-11-21T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:preston north end:2026-11-21",
    "kickoff": "2026-11-21T15:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:fulham:2026-11-21",
    "kickoff": "2026-11-21T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:ssc-napoli",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:ssc-napoli"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:uefa-champions-league:tfdclub:manchester-city:tfdclub:ssc-napoli:2026-11-24",
    "kickoff": "2026-11-24T20:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:jagiellonia",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:jagiellonia"
    ],
    "competition": "UEFA Europa League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:uefa-europa-league:tfdclub:sunderland:tfdclub:jagiellonia:2026-11-26",
    "kickoff": "2026-11-26T20:00:00.000Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:middlesbrough:2026-11-27",
    "kickoff": "2026-11-27T20:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:stoke-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:stoke-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:stoke city:2026-11-28",
    "kickoff": "2026-11-28T15:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:coventry-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:coventry-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:coventry city:2026-11-28",
    "kickoff": "2026-11-28T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:tottenham-hotspur",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:tottenham-hotspur"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:tottenham hotspur:2026-11-28",
    "kickoff": "2026-11-28T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:stevenage",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:stevenage"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:stevenage:2026-12-01",
    "kickoff": "2026-12-01T19:45:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:leeds-united",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:leeds-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:leeds united:2026-12-02",
    "kickoff": "2026-12-02T20:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:ipswich-town"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:ipswich town:2026-12-05",
    "kickoff": "2026-12-05T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:middlesbrough",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:middlesbrough"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:middlesbrough:2026-12-08",
    "kickoff": "2026-12-08T20:45:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:burnley"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:burnley:2026-12-09",
    "kickoff": "2026-12-09T20:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:leyton-orient",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:leyton-orient"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:leyton orient:2026-12-12",
    "kickoff": "2026-12-12T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:bristol-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:bristol-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:bristol city:2026-12-12",
    "kickoff": "2026-12-12T15:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:chelsea:2026-12-12",
    "kickoff": "2026-12-12T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:nottingham forest:2026-12-12",
    "kickoff": "2026-12-12T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:blackburn rovers:2026-12-19",
    "kickoff": "2026-12-19T15:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:fulham",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:fulham"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:fulham:2026-12-19",
    "kickoff": "2026-12-19T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:hull-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:hull city:2026-12-19",
    "kickoff": "2026-12-19T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:crystal palace:2026-12-19",
    "kickoff": "2026-12-19T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:blackpool",
    "clubIds": [
      "tfdclub:huddersfield",
      "tfdclub:blackpool"
    ],
    "competition": "League One",
    "homeClubId": "tfdclub:huddersfield",
    "id": "tfmatch:2026-2027:league-one:huddersfield:blackpool:2026-12-26",
    "kickoff": "2026-12-26T15:00:00.000Z",
    "latitude": 53.654166666667,
    "longitude": -1.7683333333333,
    "stadium": "John Smith's Stadium"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:norwich city:2026-12-26",
    "kickoff": "2026-12-26T15:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:west-ham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:west-ham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:west ham united:2026-12-29",
    "kickoff": "2026-12-29T20:15:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:cardiff city:2027-01-01",
    "kickoff": "2027-01-01T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:everton:2027-01-02",
    "kickoff": "2027-01-02T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:tottenham-hotspur",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:tottenham-hotspur"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:tottenham hotspur:2027-01-02",
    "kickoff": "2027-01-02T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:hull-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:hull city:2027-01-02",
    "kickoff": "2027-01-02T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:manchester city:2027-01-06",
    "kickoff": "2027-01-06T20:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:liverpool:2027-01-06",
    "kickoff": "2027-01-06T20:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:swansea-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:swansea-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:swansea city:2027-01-16",
    "kickoff": "2027-01-16T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:nottingham forest:2027-01-16",
    "kickoff": "2027-01-16T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:chelsea",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:chelsea"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:chelsea:2027-01-23",
    "kickoff": "2027-01-23T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:coventry-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:coventry-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:coventry city:2027-01-23",
    "kickoff": "2027-01-23T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:west-brom",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:west-brom"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:west bromwich albion:2027-01-26",
    "kickoff": "2027-01-26T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:cardiff-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:cardiff-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:cardiff city:2027-01-27",
    "kickoff": "2027-01-27T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:sporting-clube-de-portugal",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:sporting-clube-de-portugal"
    ],
    "competition": "UEFA Champions League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:uefa-champions-league:tfdclub:manchester-city:tfdclub:sporting-clube-de-portugal:2027-01-27",
    "kickoff": "2027-01-27T20:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:preston",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:preston"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:preston north end:2027-01-30",
    "kickoff": "2027-01-30T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:blackburn",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:blackburn"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:blackburn rovers:2027-01-30",
    "kickoff": "2027-01-30T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:arsenal:2027-01-30",
    "kickoff": "2027-01-30T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:bournemouth:2027-02-06",
    "kickoff": "2027-02-06T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:aston villa:2027-02-06",
    "kickoff": "2027-02-06T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:lincoln-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:lincoln-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:lincoln city:2027-02-16",
    "kickoff": "2027-02-16T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:norwich",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:norwich"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:norwich city:2027-02-17",
    "kickoff": "2027-02-17T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:wrexham",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:wrexham"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:wrexham:2027-02-20",
    "kickoff": "2027-02-20T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:millwall",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:millwall"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:millwall:2027-02-20",
    "kickoff": "2027-02-20T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:aston villa:2027-02-20",
    "kickoff": "2027-02-20T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:newcastle united:2027-02-20",
    "kickoff": "2027-02-20T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:everton:2027-02-20",
    "kickoff": "2027-02-20T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:hull-city",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:hull-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:hull city:2027-03-03",
    "kickoff": "2027-03-03T20:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:everton",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:everton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:everton:2027-03-03",
    "kickoff": "2027-03-03T20:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:manchester united:2027-03-03",
    "kickoff": "2027-03-03T20:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:watford:2027-03-06",
    "kickoff": "2027-03-06T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:burnley",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:burnley"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:burnley:2027-03-06",
    "kickoff": "2027-03-06T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:brighton",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:brighton"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:brighton hove albion:2027-03-13",
    "kickoff": "2027-03-13T15:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:brentford:2027-03-13",
    "kickoff": "2027-03-13T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:wolverhampton-wanderers",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:wolverhampton-wanderers"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:wolverhampton wanderers:2027-03-16",
    "kickoff": "2027-03-16T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:sheffield-united",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:sheffield-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:sheffield united:2027-03-17",
    "kickoff": "2027-03-17T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:charlton-athletic",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:charlton-athletic"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:charlton athletic:2027-03-20",
    "kickoff": "2027-03-20T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-united",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:manchester-united"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:manchester united:2027-03-20",
    "kickoff": "2027-03-20T15:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:birmingham-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:birmingham city:2027-04-03",
    "kickoff": "2027-04-03T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:bolton",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:bolton"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:bolton wanderers:2027-04-06",
    "kickoff": "2027-04-06T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:lincoln-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:lincoln-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:lincoln city:2027-04-10",
    "kickoff": "2027-04-10T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:nottingham-forest",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:nottingham-forest"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:nottingham forest:2027-04-10",
    "kickoff": "2027-04-10T14:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:ipswich-town",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:ipswich-town"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:ipswich town:2027-04-10",
    "kickoff": "2027-04-10T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:watford",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:watford"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:watford:2027-04-17",
    "kickoff": "2027-04-17T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:crystal-palace",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:crystal-palace"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:crystal palace:2027-04-17",
    "kickoff": "2027-04-17T14:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:birmingham-city",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:birmingham-city"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:birmingham city:2027-04-20",
    "kickoff": "2027-04-20T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:liverpool:2027-04-24",
    "kickoff": "2027-04-24T14:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:sheffield-united",
    "clubIds": [
      "tfdclub:southampton",
      "tfdclub:sheffield-united"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:southampton",
    "id": "tfmatch:2026-2027:championship:southampton:sheffield united:2027-05-01",
    "kickoff": "2027-05-01T00:00:00Z",
    "latitude": 50.9058305556,
    "longitude": -1.3911111111,
    "stadium": "St. Mary's Stadium"
  },
  {
    "awayClubId": "tfdclub:portsmouth",
    "clubIds": [
      "tfdclub:west-ham",
      "tfdclub:portsmouth"
    ],
    "competition": "Championship",
    "homeClubId": "tfdclub:west-ham",
    "id": "tfmatch:2026-2027:championship:west ham united:portsmouth:2027-05-01",
    "kickoff": "2027-05-01T00:00:00Z",
    "latitude": 51.5386111111,
    "longitude": -0.0163888889,
    "stadium": "London Stadium"
  },
  {
    "awayClubId": "tfdclub:brentford",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:brentford"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:brentford:2027-05-01",
    "kickoff": "2027-05-01T14:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:newcastle",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:newcastle"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:newcastle united:2027-05-01",
    "kickoff": "2027-05-01T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:arsenal",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:arsenal"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:arsenal:2027-05-08",
    "kickoff": "2027-05-08T14:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:liverpool",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:liverpool"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:liverpool:2027-05-08",
    "kickoff": "2027-05-08T14:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:bournemouth",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:bournemouth"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:bournemouth:2027-05-15",
    "kickoff": "2027-05-15T14:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  },
  {
    "awayClubId": "tfdclub:sunderland",
    "clubIds": [
      "tfdclub:leeds-united",
      "tfdclub:sunderland"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:leeds-united",
    "id": "tfmatch:2026-2027:premier-league:leeds united:sunderland:2027-05-23",
    "kickoff": "2027-05-23T14:00:00Z",
    "latitude": 53.7777777778,
    "longitude": -1.5722222222,
    "stadium": "Elland Road"
  },
  {
    "awayClubId": "tfdclub:aston-villa",
    "clubIds": [
      "tfdclub:manchester-city",
      "tfdclub:aston-villa"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:manchester-city",
    "id": "tfmatch:2026-2027:premier-league:manchester city:aston villa:2027-05-23",
    "kickoff": "2027-05-23T14:00:00Z",
    "latitude": 53.4830555556,
    "longitude": -2.2002777778,
    "stadium": "Etihad Stadium"
  },
  {
    "awayClubId": "tfdclub:manchester-city",
    "clubIds": [
      "tfdclub:sunderland",
      "tfdclub:manchester-city"
    ],
    "competition": "Premier League",
    "homeClubId": "tfdclub:sunderland",
    "id": "tfmatch:2026-2027:premier-league:sunderland:manchester city:2027-05-30",
    "kickoff": "2027-05-30T15:00:00Z",
    "latitude": 54.9144290694,
    "longitude": -1.3881729694,
    "stadium": "Stadium of Light"
  }
];
