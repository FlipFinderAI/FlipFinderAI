
## V4.0.80d
Prepared the working app for an iPhone-only App Store release. Aligned the app
version at 1.1.1, added the photo-save permission text, removed iPad targeting,
and confirmed a clean Release simulator build. TypeScript and Expo lint pass
with zero warnings; the user confirmed the app works on a physical device.

## V4.0.80c
Reworked ticket-import confirmation so complete reads and manual fixture picks
share one final editable confirmation. Added movable ticket preview, fixture-level
duplicate blocking and home-stadium geo anchoring. TypeScript and Expo lint pass
with zero warnings.

## V4.0.80b
Extracted Ground Tracker visit and list derivation. TypeScript and Expo lint
pass with zero warnings. `app/index.tsx` is 12,605 lines and 459,741 bytes;
visit counts, distance sorting, league filtering and search are unchanged.

## V4.0.80a
Extracted the Fixtures list/table content switcher. TypeScript and Expo lint
pass with zero warnings. `app/index.tsx` is 12,637 lines and 460,996 bytes;
loading, lists, headers and empty states are unchanged.

## V4.0.79z
Extracted Fixtures error/empty states and the league-table header. TypeScript
and Expo lint pass with zero warnings. `app/index.tsx` is 12,668 lines and
462,271 bytes; status behavior, wording and table alignment are unchanged.

## V4.0.79y
Extracted the Fixtures header and mode controls. TypeScript and Expo lint pass
with zero warnings. `app/index.tsx` is 12,727 lines and 464,495 bytes; header
typography, refresh and mode-switch behaviour are unchanged.

## V4.0.79x
Extracted fixture-list and league-table row renderers. TypeScript and Expo lint
pass with zero warnings. `app/index.tsx` is 12,812 lines and 466,982 bytes;
row content, highlighting and formatting are unchanged.

## V4.0.79w
Extracted the Football History competition selector and source labels.
TypeScript and Expo lint pass with zero warnings. `app/index.tsx` is 12,978
lines and 472,000 bytes; filtering interaction and wording are unchanged.

## V4.0.79v
Extracted Football History archive filtering and result counts. TypeScript and
Expo lint pass with zero warnings. `app/index.tsx` is 13,011 lines and 473,534
bytes; filtering, ordering and W/D/L totals are unchanged.

## V4.0.79u
Extracted Football History stadium aggregation. TypeScript and Expo lint pass
with zero warnings. `app/index.tsx` is 13,042 lines and 474,407 bytes; visit
counts, club labels, Wembley treatment and ordering are unchanged.

## V4.0.79t
Extracted Football History fixture matching. TypeScript and Expo lint pass with
zero warnings. `app/index.tsx` is 13,076 lines and 475,630 bytes; hydrated-cache
precedence and bundled-TFD fallback are unchanged.

## V4.0.79s
Extracted shared ticket-grid layout calculations. TypeScript and Expo lint pass
with zero warnings. `app/index.tsx` is 13,146 lines and 478,226 bytes; grid
thresholds and sizing formulas are unchanged.

## V4.0.79r
Extracted Football History score and result resolution. TypeScript and Expo lint
pass with zero warnings. `app/index.tsx` is 13,173 lines and 478,971 bytes;
provider precedence and home/away result calculation are unchanged.

## V4.0.79q
Extracted shared Football History controls and the match-photo viewer. TypeScript
and Expo lint pass with zero warnings. `app/index.tsx` is 13,193 lines and
480,045 bytes; presentation and interaction are unchanged.

## V4.0.79p
Extracted ticket-collection club ownership resolution. TypeScript and Expo lint
pass with zero warnings. `app/index.tsx` is 13,222 lines and 480,985 bytes;
profile weighting and fallback behaviour are unchanged.

## V4.0.79o
Extracted the off-screen OldSchoolCaptureHost. TypeScript and Expo lint pass
with zero warnings. `app/index.tsx` is 13,244 lines and 481,912 bytes; capture
dimensions and rendering are unchanged.

## V4.0.79n
Extracted the hidden high-resolution SeasonFrameExport renderer. TypeScript and
Expo lint pass with zero warnings. `app/index.tsx` is 13,263 lines and 482,228
bytes; export dimensions and artwork are unchanged.

## V4.0.79m
Extracted the shared bottom navigation and Back to Home presentation. TypeScript
and Expo lint pass with zero warnings. `app/index.tsx` is 13,342 lines and
484,716 bytes; navigation behaviour is unchanged.

## V4.0.79l
Extracted the complete ExportTicketGrid component. TypeScript and Expo lint pass
with zero warnings. `app/index.tsx` is 13,443 lines; export layout and rendering
behaviour are unchanged.

## V4.0.79k
Extracted the complete OldSchoolCard component. TypeScript and Expo lint pass
with zero warnings. `app/index.tsx` is 13,536 lines and 490,153 bytes.

## V4.0.79j
Extracted the English club theme and 92-club catalogue. TypeScript and Expo
lint pass with zero warnings. `app/index.tsx` is 13,783 lines and 499,052 bytes;
Babel's 500 KB warning is gone.

## V4.0.79i
Extracted the complete MatchConfirmationOverlay and its dedicated stylesheet.
TypeScript and Expo lint pass with zero warnings. `app/index.tsx` is 14,017
lines and 506,062 bytes.

## V4.0.79h
Extracted the complete TicketViewer component. TypeScript and Expo lint pass
with zero warnings. `app/index.tsx` is 15,141 lines and 545,666 bytes.

## V4.0.79g
Decoupled `TicketViewer` from the root stylesheet. TypeScript and Expo lint pass
with zero warnings; appearance and behavior are unchanged.

## V4.0.79f
Centralized the two unchanged Matchday geofence thresholds in
`lib/matchdayConfig.ts`. TypeScript and Expo lint pass with zero warnings.

## V4.0.79e
Moved only `BACKUP_REMINDER_TICKET_COUNT` into `lib/localBackup.ts`.
TypeScript and Expo lint pass with zero warnings. `app/index.tsx` remains
15,439 lines and is 554,298 bytes.

## V4.0.79d
Starting point: verified V4.0.79c checkpoint.

Moved only `TICKET_STYLE_OPTIONS` beside its shared type in
`lib/ticketTypes.ts`. No style selection or rendering behavior changed.

Verification on 2026-08-31:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,439 lines and 554,306 bytes.

## V4.0.79c
Starting point: verified V4.0.79b checkpoint.

Extracted only the global notification presentation handler into
`lib/notificationSetup.ts`. No notification behavior changed.

Verification on 2026-08-31:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,440 lines and 554,445 bytes.

## V4.0.79b
Starting point: verified V4.0.79a checkpoint.

Extracted only the frame-export sizing constants and calculations into
`lib/frameExportSizing.ts`. No export dimensions or behavior changed.

Verification on 2026-08-31:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,447 lines and 554,605 bytes.

## V4.0.79a
Starting point: verified V4.0.78z checkpoint.

Extracted only the extended Scottish and National League club catalogue into
`lib/clubCatalog.ts`. No club construction or runtime behavior changed.

Verification on 2026-08-31:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,456 lines and 555,157 bytes.

## V4.0.78z
Starting point: verified V4.0.78y checkpoint.

Extracted only the extended club-colour lookup into `lib/clubCatalog.ts`. No
club name, colour pair or runtime behavior changed.

Verification on 2026-08-31:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,541 lines and 558,106 bytes.

## V4.0.78y
Starting point: verified V4.0.78x checkpoint.

Extracted only the Matchday Experience data contracts into
`lib/matchdayTypes.ts`. No runtime or persisted-data behavior changed.

Verification on 2026-08-31:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,599 lines and 560,253 bytes.

## V4.0.78x
Starting point: verified V4.0.78w checkpoint.

Extracted only the typed native-module bindings for parking/place search and
Siri shortcuts into `lib/nativeIntegrations.ts`. No native behavior changed.

Verification on 2026-08-31:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,650 lines and 561,559 bytes.

## V4.0.78w
Starting point: verified V4.0.78v checkpoint.

Extracted only the ticket-viewer constants and stylesheet into
`components/tickets/ticketViewerStyles.ts`. No viewer behavior changed.

Verification on 2026-08-31:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,694 lines and 562,746 bytes.

## V4.0.78v
Starting point: verified V4.0.78u checkpoint.

Extracted only `HomeTicketImage` and `WalletTicketImage` plus their existing
three presentation styles into `components/tickets/TicketImages.tsx`.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,759 lines and 564,131 bytes.

## V4.0.78u
Starting point: verified V4.0.78t checkpoint.

Extracted only the shared ticket-domain types into `lib/ticketTypes.ts`. No
ticket data shape or runtime behavior changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,849 lines and 566,143 bytes.

## V4.0.78t
Starting point: verified V4.0.78s checkpoint.

Established `lib/clubCatalog.ts` with only the shared club type, placeholder
and league options. No club or onboarding behavior changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,880 lines and 566,948 bytes.

## V4.0.78s
Starting point: verified V4.0.78r checkpoint.

Extracted only the root AsyncStorage key constants into `lib/storageKeys.ts`.
No key value or persistence behavior changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,918 lines and 567,869 bytes.

## V4.0.78r
Starting point: verified V4.0.78q checkpoint.

Extracted only the static frame colour/highlight/accent maps and style list into
`lib/frameFinishes.ts`. No palette value or behavior changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 15,920 lines and 568,718 bytes.

## V4.0.78q
Starting point: verified V4.0.78p checkpoint.

Extracted only the native ticket cropper lock and presentation helper into
`lib/ticketCropper.ts`. No cropper options or behavior changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,014 lines and 571,365 bytes.

## V4.0.78p
Starting point: verified V4.0.78o checkpoint.

Extracted only `removeDuplicateMatchPhotoReferences` into the existing
`lib/matchMediaLibrary.ts` module. No deduplication behavior changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,080 lines and 573,527 bytes.

## V4.0.78o
Starting point: verified V4.0.78n checkpoint.

Extracted only the state-free match-media classification functions and shared
reference type into `lib/matchMediaLibrary.ts`. No matching behavior changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,110 lines and 574,446 bytes.

## V4.0.78n
Starting point: verified V4.0.78m checkpoint.

Extracted only `footballGroundForName` into the existing
`lib/clubGroundMatching.ts` module. No aliases or matching rules changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,243 lines and 578,789 bytes.

## V4.0.78m
Starting point: verified V4.0.78l checkpoint.

Extracted only the match-day Photos query/cache layer into
`lib/matchMediaLibrary.ts`. No media matching or persistence behaviour changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,257 lines, down 72 lines from V4.0.78l.

## V4.0.78l
Starting point: verified V4.0.78j index checkpoint, with the separate V4.0.78k
TFD live-refresh work preserved.

Extracted only the ticket QR scan-and-regenerate helper and its two caches into
`lib/ticketQr.ts`. No QR calculation or ticket rendering behaviour changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,329 lines, down 71 lines from V4.0.78j.

## V4.0.78h
Starting point: verified V4.0.78g checkpoint.

Extracted only the pure shared miles-distance calculation into
`lib/geoDistance.ts`. No geofence radii or location behaviour changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,595 lines, down 11 lines from V4.0.78g.

## V4.0.78g
Starting point: verified V4.0.78f checkpoint.

Extracted only the pure scale-aware old-ticket stylesheet builder into
`components/tickets/oldSchoolTicketStyles.ts`. The complete style object is unchanged.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,606 lines, down 285 lines from V4.0.78f.

## V4.0.78f
Starting point: verified V4.0.78e checkpoint.

Extracted only the two pure old-ticket date/time formatters into the existing
`lib/matchDisplayFormatting.ts` module. Their implementations remain unchanged.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,891 lines, down 23 lines from V4.0.78e.

## V4.0.78e
Starting point: verified V4.0.78d checkpoint.

Extracted only the pure club-to-ground matching block into
`lib/clubGroundMatching.ts`. All aliases and matching rules remain unchanged.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,914 lines, down 56 lines from V4.0.78d.

## V4.0.78d
Starting point: verified V4.0.78c checkpoint.

Extracted only the cohesive ticket-file helper block into `lib/ticketFiles.ts`.
The existing app-owned directory and every helper implementation remain unchanged.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 16,970 lines, down 71 lines from V4.0.78c.

## V4.0.78c
Starting point: verified V4.0.78b checkpoint.

Extracted only the ticket colour-palette analyser, its type and its in-memory
caches into `lib/ticketPalette.ts`. No palette calculations or UI behaviour changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 17,041 lines, down 94 lines from V4.0.78b.

## V4.0.78b
Starting point: verified V4.0.78a checkpoint.

Extracted only `autoCropTicketScreenshot` into the existing
`lib/ticketCropAnalysis.ts` module. Native cropper behavior remains unchanged.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 17,135 lines, down 153 lines from V4.0.78a.

## V4.0.78a
Starting point: verified V4.0.77 checkpoint.

Extracted only the state-free `decodeImagePixels`, `detectContentBounds` and
`boundsToBox` helpers plus the `CropBox` type into
`lib/ticketCropAnalysis.ts`.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- `app/index.tsx`: 17,288 lines, down 117 lines from V4.0.77.

## V4.0.77
Starting point: verified V4.0.76j checkpoint.

Activated the existing geotag-aware photo/video matcher for automatic and
manual Match Memory scans, corrected automatic stadium naming, added GPS-aware
Pub/Restaurant/Train station folder moves, and moved location deletion into an
X on the Media Locations row.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- Connected-device iOS debug build and install: pass.
- Existing media reference persistence and app-owned video handling preserved.

## V4.0.76j
Starting point: verified V4.0.76i checkpoint.

Extracted only the state-free MatchWeather type and fetch/description logic into
`lib/matchWeather.ts`. No API or provider behavior changed.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,361 lines, down 84 lines from V4.0.76i.

## V4.0.76i
Starting point: verified V4.0.76h checkpoint.

Extracted only the memoized draggable frame-grid tile gesture component and its
`TileRect` type into `components/frames/DraggableGridTile.tsx`. The existing
root grid style is passed into the component unchanged.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,445 lines, down 122 lines from V4.0.76h.

## V4.0.76h
Starting point: verified V4.0.76g checkpoint.

Extracted only `normaliseSeasonEntry`, `lastFiveSeasonOptions` and
`seasonTicketYearOptions` into the existing `lib/seasons.ts` module.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,567 lines, down 26 lines from V4.0.76g.

## V4.0.76g
Starting point: verified V4.0.76f checkpoint.

Extracted only the pure `fitTicketDisplaySize` helper into
`lib/ticketDisplay.ts`.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,593 lines, down 19 lines from V4.0.76f.

## V4.0.76f
Starting point: verified V4.0.76e checkpoint.

Extracted only the pure `clubInitials` helper into `lib/clubDisplay.ts` and kept
both existing call sites unchanged.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,612 lines, down 12 lines from V4.0.76e.

## V4.0.76e
Starting point: verified V4.0.76d checkpoint.

Extracted only `rgbToHex`, `saturationOf`, `readableTextColour` and
`visibleInkOnCream` into `lib/colorUtils.ts`.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,624 lines, down 25 lines from V4.0.76d.

## V4.0.76d
Starting point: verified V4.0.76c checkpoint.

Extracted only `formatFixtureDay`, `formatKickoffTime` and `formatLastUpdated`
plus their fixed label arrays into `lib/matchDisplayFormatting.ts`.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,649 lines, down 37 lines from V4.0.76c.

## V4.0.76c
Starting point: verified V4.0.76b checkpoint.

Extracted only the pure `splitFixtureName`, `formatTicketDate` and
`formatHistoryDate` helpers into `lib/matchDisplayFormatting.ts`.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,686 lines, down 52 lines from V4.0.76b.

## V4.0.76b
Starting point: verified V4.0.76a checkpoint.

Extracted only the Favourite Club Badge display from `app/index.tsx` into
`components/club/FavouriteClubBadge.tsx`. Shared helper behavior and state
ownership remain in the root.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,738 lines, down 33 lines from V4.0.76a.

## V4.0.76a
Starting point: live V4.0.75 WIP safety state.

Extracted only `MatchMemoryVideoPlayer` from `app/index.tsx` into
`components/matchMemory/MatchMemoryVideoPlayer.tsx`. The component implementation
and call site behavior are unchanged. No data, persistence, navigation or native
integration was modified.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: pass with only the documented pre-existing unused
  `matchGeotaggedMatchdayMedia` warning.
- `app/index.tsx`: 17,771 lines, down 66 lines.

## V4.0.73
Starting point: verified V4.0.72 only.

Implemented the phone-QA Matchday Experience, mutually exclusive stadium and
live-location panels, Apple Maps pub/restaurant autocomplete, three-result live
parking, timed capture closure and the redesigned Match Memory location-folder
workflow. Confident GPS matches assign automatically; uncertain pub/restaurant
moves offer nearby suggestions or manual naming. Media remains movable without
altering the original Apple Photos asset, and existing app-owned video behavior
is preserved.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- Connected-device iOS debug build/install: pass.
- Native Apple Maps place-search bridge compiled successfully.

## V4.0.72
Starting point: verified V4.0.71 only.

Added App Store-safe match-day pub and restaurant discovery to the Home Next
Match card. OpenStreetMap provides three nearest named venues around the actual
home/away stadium, Google Maps provides navigation, and Ticket Frame displays
the required attribution. Added private structured pub-visit reports with
Home/Away/Mixed/Unsure choices and an optional on-demand proximity check that
does not retain raw user coordinates.

Final QA repairs:
- location and Photos switches reflect the permission actually granted;
- backup restore has rollback recovery;
- lint reduced from 24 warnings to zero;
- image accessibility descriptions added;
- stale effect closures removed;
- iOS app and Share Extension build numbers advanced to 6.

Verification on 2026-08-30:
- TypeScript: pass.
- Expo lint: zero errors and zero warnings.
- Full unsigned iOS Release build: pass, including 1,693-module Metro bundle
  and Hermes compilation.
- iOS plists, privacy manifest and Xcode project: pass `plutil -lint`.
- Live OpenStreetMap test: 31 named pubs returned around the test stadium.
- TFD unchanged: schema 2, four providers, 17 competitions and 13,760 unique
  fixtures with no duplicate IDs.
- Provider secrets remain outside the app and source control.

## V4.0.71
Starting point: verified V4.0.70 only.

Added priority-controlled Highlightly cup/history backfill, explicit half-time
and full-time TFD fields, a current-provider race, and the missing current
Premier League table. Lower English and Scottish coverage is protected before
Premier League racing or history can use Highlightly capacity.

Verification on 2026-08-29:
- Real BASIC Premier League standings: 20 rows; Highlightly is TFD table source.
- Nine current tables refresh lower English and Scottish leagues first and the
  Premier League last.
- 2025/26 FA Cup: nine pages consumed, 836 unique fixtures cached from 873
  provider rows; resumable state marked complete.
- 2025/26 Scottish Cup: 100/127 cached; next page remains queued.
- Stored API-Football payloads added 7,825 half-time breakdowns without calls.
- TFD contains 13,760 unique matches from all four preserved providers.
- Final live rebuild contains 7,850 half-time and 9,227 full-time score breakdowns.
- Highlightly stopped at two remaining calls as instructed by the one-off
  safety reserve; automatic daily work uses a protected 35-call reserve.
- Provider race and daily LaunchAgent definitions pass `plutil -lint`.
- All new Node scripts pass syntax checks and TypeScript passes.

## V4.0.70
Starting point: verified V4.0.69 only.

Added Highlightly BASIC as a supplemental TFD provider for current-season
English and Scottish lower-league fixtures, results and faster standings.
Preserved football-data.org, API-Football and OpenFootball fallbacks and kept
all provider authentication outside the iOS app and source control.

Live BASIC verification on 2026-08-29:
- Championship: 288 fixtures, 24 table rows.
- League One: 264 fixtures, 24 table rows.
- League Two: 264 fixtures, 24 table rows.
- National League: 300 fixtures, 24 table rows.
- Scottish Premiership: 126 fixtures, 12 table rows.
- Scottish Championship: 100 fixtures, 10 table rows.
- Scottish League One: 100 fixtures, 10 table rows.
- Scottish League Two: 95 fixtures, 10 table rows.
- Full sync: 25 requests; provider explicitly reported BASIC.
- Standings-only sync: eight requests; fixture counts preserved.
- TFD rebuild: 12,824 unique matches from four approved providers.
- Highlightly selected as table source for all eight target competitions.
- `npx tsc --noEmit` passed.

## V4.0.49 — TFD live score and live table funnel
- Connected API-Football live/current-day updates directly into the TFD provider cache.
- Removed the old permanent 20-call reserve; daily ceiling is now 100 calls.
- Added adaptive live polling with TFD-controlled request timing.
- Finished results are prioritised and cached.
- Live/provisional league tables are recalculated in the same score-update cycle with no extra standings API call.
- TFD rebuilds automatically after matched live/result updates.
- Added persistent daily API request counting and request-purpose logging.
- Added 04:00 Europe/London football-day rollover for late-match verification.
- Installed macOS LaunchAgent com.ticketframe.tfd-live to run the funnel automatically.

## V4.0.50 — TFD generic club-name matching
- Fixed generic API-Football to TFD club-name matching for AFC/FC suffixes.
- Handles names such as "Wrexham AFC" versus "Wrexham" without club-specific hardcoding.
- Preserves the V4.0.49 live-score/table funnel.

## V4.0.51
Strengthened Ticket Frame Data provider reconciliation with a shared TFD club identity layer.

Verified 2026-08-28 live funnel:
- Crystal Palace FC 1–4 Manchester City FC — FINISHED
- Wrexham AFC 1–2 Birmingham City FC — FINISHED
- Both matches merged into their existing permanent TFD identities.
- API-Football became authoritative for current score/status.
- Two affected league tables refreshed.
- No club-specific Birmingham/Wrexham hardcoding added.

## V4.0.52
Starting point: verified V4.0.51 plus the already-verified API-Football table
priority of 135. The existing TFD score/status priorities and identity resolver
were preserved.

Changed the fixture initial-load path and Match Memory persistence pipeline.
Media matching remains generic: fixture date plus resolved home ground/stadium
coordinates, with no Birmingham, Hull or Sheffield fixture special cases.

Verification: `npx tsc --noEmit` passed on 2026-08-29.

## V4.0.53
Starting point: verified V4.0.52.

Unified My Home Fixtures with the Recent Matches media/detail path, added the
video indicator and generic video labels, and made video rendering fixture-keyed.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).
- Real bundled data contains Birmingham City fixture rows and the generic
  Birmingham City → St Andrew's ground coordinates.
- TFD priorities remain score/status 140 and table 135.

## V4.0.54
Starting point: verified V4.0.53.

Removed repeated synchronous-style diagnostic work from the Home interaction
path and fixed the cache-hit branch that skipped league-table hydration.

Verification on 2026-08-29: `npx tsc --noEmit` passed.

## V4.0.55
Starting point: verified V4.0.54.

Added explicit Match Memory video loading, playback and error lifecycle handling.
Failed media cleanup remains keyed to the current match and exact asset.

Verification on 2026-08-29: `npx tsc --noEmit` passed.

## V4.0.56
Starting point: verified V4.0.55.

Added the selected frame treatment to the Home collection and moved all gallery
zooming into the existing separate full-frame screen. Pinch-in now returns Home.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).

## V4.0.57
Starting point: verified V4.0.56.

Separated full-frame ticket taps from hold-to-rearrange, added complete drag
release cleanup, and connected Home frame pinch-out to the isolated frame screen.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).

## V4.0.58
Starting point: verified V4.0.57.

Hardened Match Memory player teardown after a real-device development log
showed Expo could dispose the native player immediately before React cleanup.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).

## V4.0.59
Starting point: verified V4.0.58.

Replaced the Home-to-controls jump with an animated focused overlay over the
actual Home screen, hardened full-frame drag release, and removed automatic
media deletion from native video playback errors.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).
- The connected iPhone received the updated Metro bundle without a new runtime
  error in the launch log.

## V4.0.60
Starting point: verified V4.0.59.

Corrected the separate Full Season Frame shrink behaviour, added its zoom-focus
background, expanded generic video matching using photo-location anchors, and
removed repeated startup OCR plus repeated full-library no-result scans.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).
- Ground data resolves Birmingham City to St Andrew's generically.

## V4.0.61
Starting point: verified V4.0.60.

Improved perceived and actual response time for the app's shared navigation and
highest-frequency buttons by acknowledging touch-down immediately and adding
instant tactile visual feedback.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).

## V4.0.62
Starting point: verified V4.0.61.

Removed the Full Season Frame zoom clipping and gesture contention, and added
safe long-press removal for History photos and videos.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).

## V4.0.63
Starting point: verified V4.0.62.

Unified Full Season Frame focus behaviour with Home and unified Image, PDF and
Print output around the already-correct captured frame master. Removed the print
cancellation fallback and the obsolete alternative season PDF renderer.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).

## V4.0.64
Starting point: verified V4.0.63.

Centralised Home navigation into an explicit main-screen reset so the shared
Home control never remains in Settings or another nested view.

Verification on 2026-08-29:
- `npx tsc --noEmit` passed.
- `npx expo lint --no-cache` passed with zero errors (23 pre-existing warnings).

## V4.0.65 — Full Season Frame, high-resolution export and Match Memory video repair

- View Full Season Frame now opens the normal Full Season page first.
- One-finger vertical scrolling remains available over the frame.
- Two-finger pinch-out opens the clean focused Full Season Frame presentation.
- Returning the frame to base scale exits focused mode cleanly without reopening a stale ticket.
- Home main-screen reset behaviour from V4.0.64 is preserved.
- Photo, PDF and Print use the new high-resolution frame-only PNG master.
- Proven export master is approximately 2481 × 3509 pixels with A-series portrait proportions.
- Match Memory video playback repaired for Apple Photos protected media paths.
- Videos that cannot be played directly from Apple PhotoData are copied into Ticket Frame app-owned Match Memory storage and played from the accessible copy.
- Existing Match Memory video references remain usable without re-adding the video.
- Match Memory video player diagnostics added for native playback failures.
- TypeScript verification passed.
- Expo lint verification passed with 0 errors and 24 existing warnings.

## V4.0.66 — 2026-08-29
- Synchronized the iOS parent app version with Ticket Frame 1.1.1 / build 5.
- Confirmed successful iPhone Debug build/install after resolving the Xcode DerivedData/build-database issue.
- Improved focused frame pinch zoom on both Home and Full Season Frame.
- Added stable pinch-start scale/translation/focal shared values.
- Zoom translation now follows the pinch focal point while scaling.
- Restricted focused-frame pan to one pointer so it does not fight the two-finger pinch.
- Existing frame exit, ticket tap, navigation and export behaviour retained.
- User tested the updated gesture on device and confirmed it seems OK.

## V4.0.67
- Changed `preferredIntervalMinutes()` so overlapping live kick-off blocks no longer increase polling to 4/6/8 minutes.
- Updated active-match detection to retain fixtures whose TFD status is in `LIVE_STATUSES`.
- Preserved the existing `budgetInterval` protection and 100-call daily API ceiling.
- Verified scheduler selected `live scores + TFD tables`; current budget-safe interval was 3 minutes with 63 calls remaining.

## V4.0.68
Home Wallet View completed and phone-verified.

Changes:
- Added Home Frame View / Wallet View selector.
- Added chronological Wallet ticket ordering using the active Home season filter.
- Added dedicated full-width Wallet ticket renderer.
- Preserved complete ticket artwork so words, badges and ticket edges are not cropped.
- Normalised Wallet ticket width and fixed stacked spacing.
- Added individual ticket opening and immediate open-ticket switching.
- Added drag-down return-to-stack behaviour.
- Added Frame View-equivalent long-press actions to Wallet tickets, including the currently opened pass.
- Existing Home Frame View behaviour was preserved.

Verification:
- TypeScript passed with `npx tsc --noEmit`.
- Final Wallet behaviour visually tested and approved on the connected iPhone.
- Ticket size, stack spacing, artwork visibility and hold actions confirmed correct.

## V4.0.69
True A2 Season Frame PDF and Print completed.

Changes:
- Corrected Season Frame PDF sizing so captured image pixels are no longer incorrectly treated as PDF points.
- Season Frame PDF page is now true ISO A2 portrait: 420 × 594 mm.
- Print uses the corrected A2 PDF.
- Preserved the proven 2480 × 3508 high-resolution Season Frame master.
- Photo export remains unchanged.
- Added sub-point artwork tolerance to eliminate the blank second PDF/print page caused by pagination rounding.
- Individual ticket PDF/Print functionality remains separate and unchanged.

Verification:
- TypeScript passed with `npx tsc --noEmit`.
- Generated A2 PDF was inspected during testing.
- Initial two-page output identified and corrected.
- Corrected PDF/Print output visually tested and approved.

## V4.0.74
- Compact Settings UI.
- Independent expandable Settings sections.

## V4.0.78i-index-local-backup
- Structural refactor only.
- Moved local backup/restore implementation from app/index.tsx to lib/localBackup.ts.
- Removed obsolete TICKET_DIRECTORY import from app/index.tsx.
- TypeScript: PASS.
- Expo lint: PASS.
- Behaviour changed: NO.

## V4.0.78j-index-ticket-ordering
- Structural refactor only.
- Moved byMatchDateOldestFirst, byCollectionOrder and effectiveTicketStyle from app/index.tsx to lib/ticketOrdering.ts.
- TypeScript: PASS.
- Expo lint: PASS.
- Behaviour changed: NO.

## V4.0.78k-tfd-live-refresh
- TFD live-provider scheduling improvement.
- API-Football post-match catch-up: 15 minutes -> 5 minutes.
- API-Football final verification capped at 3 attempts, 30 minutes apart.
- Highlightly race interval: 15 minutes -> 5 minutes.
- Highlightly protected reserve: 35 -> 10.
- API-Football live interval remains approximately 2 minutes.
- Verified live provider race: Highlightly PASS, API-Football PASS.
- Verified 5 finished TFD fixtures matched.
- Verified 2 affected competition/season tables rebuilt.
- TFD rebuild: PASS.
- Behaviour changed: YES — faster live/final result refresh and more efficient provider-budget usage.

## V4.0.78l — TFD canonical identity reconciliation

Completed the central TFD identity layer so multiple football-data providers feed one permanent TFD representation before Ticket Frame consumes the data.

Changes:
- Added permanent TFD club registry and provider-team cross references.
- Added conservative historic identity seeding.
- Made registry attachment transactional so failed provider-ID validation cannot partially mutate identity state.
- Added collision-safe fallback identities when a canonical-name candidate conflicts with a provider-native team ID.
- Added safe fixture-orientation reconciliation for same-date provider discrepancies.
- Preserved permanent TFD match IDs/provider references during reconciliation.
- Changed API-Football mapping to preserve API-Football native team IDs.
- Rebuilt league tables from reconciled TFD results.
- Removed the Premier League duplicate identity that caused 381 fixtures and stale standings without club-specific hardcoding.

Final verification:
- TFD matches: 14,665.
- Unresolved match club IDs: 0.
- Duplicate provider refs: 0.
- Duplicate permanent match IDs: 0.
- Four approved providers present.
- PL 2026-27: 380 fixtures / 20 clubs / 20 table rows / 38 fixtures per club.
- Table source: tfd-reconciled-fixtures.
- TypeScript and Expo lint clean.

## V4.0.80e — In-App Guided Demo Foundation
- Removed unfinished browser/private demo from active Ticket Frame UI.
- Preserved existing isolated DemoMode.
- Added expo-speech.
- Removed now-unused React Native Share import.
- TypeScript and Expo lint passed cleanly.

## 2026-09-02 — Pre-2000 historical fixture selection
- Added a dedicated manual-history fixture suggestion path for pre-2000 seasons.
- Pre-2000 TFD fixtures with known season/teams/result but unknown exact date can now appear in manual Add Match suggestions.
- Normal fixture caching, automatic photo/date matching and attendance matching remain date-authoritative.
- 2000 onward behaviour is unchanged.
- Unknown historical dates are never invented.

## 2026-09-02 — Pre-2000 undated fixture picker wired
- Manual Add Match now uses the dedicated historical fixture suggestion loader.
- Pre-2000 date-unknown TFD fixtures can appear in manual fixture suggestions.
- 2000 onward continues to use the existing dated fixture cache.
- Automatic photo/GPS and normal attendance matching remain unchanged.

## 2026-09-02 — Pre-2000 historical date confirmation cache
- Undated pre-2000 TFD fixture selections retain their exact TFD fixture ID.
- Selecting a historical fixture pre-fills known opponent, competition and score.
- Date-unknown fixtures clearly request a date from the user's ticket, photo or records.
- User-confirmed dates are validated against the selected season.
- Confirmed dates are cached locally by exact TFD fixture ID and reused in future manual suggestions.
- Attendance History retains fixture ID and date provenance.
- User-confirmed dates do not alter the licensed TFD match database.
- 2000 onward and automatic photo/GPS matching remain unchanged.

## 2026-09-02 — Pre-2000 historical date confirmation
- Undated historical fixture selections retain their exact TFD fixture ID.
- Known opponent, home/away, competition and score are pre-filled.
- Unknown fixture dates must be supplied from the user's ticket, photo or records.
- User-entered dates are checked against the selected season.
- Confirmed dates are cached locally against the exact TFD fixture ID.
- Attendance History retains fixture ID and date provenance.
- User-confirmed dates never modify the licensed TFD database.
- 2000 onward and automatic photo/GPS matching remain unchanged.

## 2026-09-02 — Pre-2000 photo/GPS confirmation
- Pre-2000 GPS evidence without an exact TFD date is never auto-confirmed.
- Ticket Frame offers possible historical fixtures using photo date, season and ground GPS.
- User must explicitly choose Accept, Another Match or Dismiss.
- Accepted matches cache the photo date against the exact TFD fixture ID.
- Accepted dates retain user-confirmed-photo-gps provenance.
- Dismiss creates no attendance and no date cache.
- 2000 onward and all date-known matching remain unchanged.
- TFD is never modified by a user's historical confirmation.

## 2026-09-02 — Complete 164,365-match TFD bundled
- Synced the completed TFD database into Ticket Frame.
- Bundled database now contains 164,365 matches.
- All 149,676 validated English historical fixtures are included.
- Pre-2000 manual and photo/GPS historical confirmation flows are included.
- 2000 onward matching remains date-authoritative.
- engsoccerdata is absent from production.
- TypeScript verification completed using an increased Node heap for the enlarged bundled database.

## 2026-09-02 — Historical background loading finalized
- Synchronous TFD startup contains 2007/08 onward only.
- Photo/media indexing and GPS processing have priority over older history.
- Historical preparation begins only after successful photo/media processing.
- Persistent background order is 2000/01–2006/07, 1990/91–1999/00, 1980/81–1989/90, then older decade batches.
- Completed history packs remain in SQLite and are skipped on subsequent launches unless the TFD source version changes.
- An older season requested before its background batch is ready loads its required pack on demand.
- All 164,365 TFD matches remain accounted for.

## 2026-09-02 — Historical loading priority completed
- 2007/08 onward remains the synchronous startup data.
- Photos/media processing retains priority.
- Historical background loading starts only after successful Auto Add photo/media processing.
- Historical order: 2000/01–2006/07, 1990s, 1980s, then older data.
- Completed historical packs remain persisted in SQLite.

## 2026-09-02 — Current-season Season Ticket fixture refresh
- My Home Fixtures no longer treats a small partial current-season cache as complete.
- Cached fixtures may display immediately for speed.
- Current-season Season Tickets then refresh from the fixture pipeline and replace the partial cache with the complete available fixture set.
- Past-season Season Ticket cache behaviour remains unchanged.
- Auto Add was not changed.

## 2026-09-02 — Current-season Season Ticket fixture refresh
- My Home Fixtures no longer treats a partial current-season fixture cache as complete.
- Cached fixtures can still display immediately for speed.
- The current season now refreshes to obtain the complete available home-fixture set.
- Past-season behaviour remains cache-first.
- Auto Add was not changed.

## 2026-09-02 — Current-season Season Ticket next match only
- Changed the live Season Ticket profile screen so a current-season profile displays only its next upcoming unplayed home fixture.
- Removed the previous current-season behaviour that displayed all previous home matches plus the next fixture.
- Past-season home-fixture lists remain unchanged.
- Existing attendance, photos, videos and Match Memory actions remain intact.
- Auto Add was not changed.
- TypeScript passed with increased Node heap.
- Existing unrelated lint errors remain outside this change.

## V4.0.83 — Season Ticket carousel
Starting point: V4.0.82 current-season next-match-only checkpoint.
- More than five Season Ticket profiles now display in horizontally swipeable pages.
- Each page contains four compact Season Ticket selectors.
- Five or fewer profiles retain the existing presentation.
- Existing Season Ticket OPEN behaviour is preserved.
- Current-season next-match-only behaviour from V4.0.82 is preserved.
- Auto Add was verified byte-for-byte unchanged at function level.
- TypeScript passed with increased Node heap.

## V4.0.84 — Manual Add Match sequential fixture selection
Starting point: V4.0.83 Season Ticket carousel checkpoint.
- Replaced Manual Add Match free-text fixture selection with sequential Picker wheels.
- Flow: Season → Division/League/Cup → Home Team → Away Team → Day/Month.
- Selection is based on real TFD fixtures.
- Added full-season historical fixture access for 1948/49–2006/07.
- Blank/unknown match dates are now valid and stored as null.
- No guessed, current or fallback date is inserted.
- Auto Add was verified unchanged against V4.0.83.
- TypeScript passed with increased Node heap.

## V4.0.85
- Source: verified V4.0.84 checkpoint.
- Fixed duplicate fixture FlatList keys in `components/fixtures/FixturesContent.tsx`.
- Changed fixture key extraction from the raw fixture ID/fallback to a unique rendered-row key.
- No fixture records were removed or modified.
- Verification:
  - Device check passed.
  - `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit` passed with exit code 0.

## V4.0.86

Verified on device after performance and interaction-priority work.

History is now cache-first for its foreground summary/render path and no longer rebuilds every represented season merely because History was opened. This removed the delayed second render that could interfere with the first tap.

Foreground actions including History interaction and explicit media/Auto Add work take priority over invisible background processing. Persistent media-index progress is retained for later resumption.

Wallet automatic positioning remains enabled when opening lower tickets and full ticket images/graphics remain visible.

Historical/manual fixture picker improvements, generic season parsing fix, hosted fixture merge work, current-season home fixture display changes, and the React Native Picker patch are included.

Temporary TFD performance logging and obsolete imports were removed after successful phone testing.

TypeScript verification: PASS.
Phone verification: PASS.

## V4.0.87
- Added foreground-priority coordination for the persistent Match Media/Photos index.
- Added persisted resolved-fixture tracking to avoid repeated dedicated Photos scans for completed fixtures.
- Changed background Photos indexing to continue in controlled 1,000-asset logical blocks with yielding between blocks.
- Added delayed background-index resume after leaving a History fixture.
- Removed automatic full-video resolution/copying when Match Memory opens.
- Added explicit on-demand video resolution: Apple Photos/iCloud is accessed for the selected video only when Play is tapped.
- Persisted the resulting app-owned video file for cache-only future playback.
- Added duplicate video-resolution protection.
- Physical-device verification passed: fast fixture opening, cached video listing, single-video on-demand loading, successful playback, and immediate cached replay.

## V4.0.88
- Fixed Football History failing to consume persisted fixture-cache data.
- Added cache-only History fixture hydration after stored attendance history becomes available.
- Fixed malformed fixture-cache season conversion.
- No foreground TFD scan was reintroduced.
- Physical iPhone verification passed: missing 2025/26 scores restored and History remains fast.
