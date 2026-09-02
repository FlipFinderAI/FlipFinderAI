# OpenFootball data

Ticket Frame uses selected build-time fixture/result files from
`openfootball/football.json`.

- Source: https://github.com/openfootball/football.json
- Licence: CC0 1.0 / public domain dedication
- Imported fields: competition, round-derived schedule order, date, kickoff,
  teams and available full-time score
- Not supplied: goal scorers, attendance or stadium data

The cache records its generation time and unavailable league-season files.
Incomplete upstream results remain missing rather than being inferred.
Football-Data.org remains the preferred bundled source for the Premier League
and Championship; OpenFootball is used only when that preferred cache has no
data for the requested league and season.
