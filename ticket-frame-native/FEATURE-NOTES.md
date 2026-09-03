
## V4.0.80d — iPhone App Store readiness
Completed the first three release-readiness actions without changing app
behaviour.

- Limited the main app and share extension to iPhone device family only.
- Removed the iPad-specific orientation declaration.
- Aligned `app.json`, `package.json` and `package-lock.json` at version 1.1.1.
- Added `NSPhotoLibraryAddUsageDescription` to both Expo configuration and the
  native iOS Info.plist.
- Confirmed the app configuration resolves with `supportsTablet: false`.
- The user confirmed the complete app works on a physical device.
- Unsigned iPhone Simulator Release build PASS using Xcode 26.6 / iOS 26 SDK.
- Native property lists and privacy/entitlement files PASS validation.
- TypeScript PASS.
- Expo lint PASS with zero warnings.

## V4.0.80c — Sequential ticket confirmation workflow
Refined the post-crop recognition and confirmation flow, including bulk imports.

- Complete reads containing home team, away team, date and competition open the
  final match confirmation directly, regardless of the confidence badge.
- Incomplete reads open Type of Item and fall back to Match Ticket fixture entry.
- Removed Other from Type of Item; Match Ticket, Season Ticket and Car Park Pass
  remain available.
- The ticket image can be dragged behind the option card to reveal obscured text.
- Match Ticket manual entry uses the selected Favourite Club and season to load
  that club's fixtures.
- Accept Game now returns to the same final confirmation used by automatic
  recognition instead of saving and closing immediately.
- The final confirmation always retains Edit, including after a fixture pick.
- Tickets are only marked completed after final confirmation.
- Different ticket images cannot be assigned to an already-saved same-date
  home/away fixture; the existing fingerprint duplicate check is also preserved.
- Match-photo geo anchoring now prefers the home team's stadium for automatic,
  chosen-fixture and manually edited match tickets.
- Bulk imports remain queued and are reviewed one ticket at a time.
- TypeScript PASS.
- Expo lint PASS with zero warnings.

## V4.0.80b — Index extraction: Ground Tracker derivation
Moved confirmed ground-visit counts and Ground Tracker distance/search list
preparation into `lib/groundTracker.ts`.

- Removed 32 lines from `app/index.tsx` (12,637 to 12,605).
- Confirmed-attendance counts, historical-ground exclusion, GPS ordering,
  alphabetical fallback, league top-five selection and search are unchanged.

## V4.0.80a — Index extraction: Fixtures content
Moved the Fixtures/Table FlatList wiring and loading/empty switching into
`components/fixtures/FixturesContent.tsx`.

- Removed 31 lines from `app/index.tsx` (12,668 to 12,637).
- Loading behavior, row keys, next-match header placement, list styling,
  table header placement and empty states are unchanged.

## V4.0.79z — Index extraction: Fixtures status and table header
Moved the Fixtures error/retry state, empty messages and league-table header
into `components/fixtures/FixturesStatus.tsx`.

- Removed 59 lines from `app/index.tsx` (12,727 to 12,668).
- Retry behavior, loading/empty wording, live/final table label, column widths
  and header alignment are unchanged.

## V4.0.79y — Index extraction: Fixtures header
Moved the Fixtures title, refresh control, season/update line and Fixtures/Table
mode controls into `components/fixtures/FixturesHeader.tsx`.

- Removed 85 lines from `app/index.tsx` (12,812 to 12,727).
- Georgia title typography, loading indicator, refresh callback, current-season
  label, mode selection, active styling and press feedback are unchanged.

## V4.0.79x — Index extraction: fixture and table rows
Moved the fixture-list row and league-table row renderers into
`components/fixtures/FixtureRows.tsx`.

- Removed 166 lines from `app/index.tsx` (12,978 to 12,812).
- Next-match highlighting, played opacity, home/away badges, dates, kickoffs,
  scores, competition labels and selected-team table styling are unchanged.

## V4.0.79w — Index extraction: History competition selector
Moved the reusable History competition menu into
`components/history/HistoryCompetitionSelector.tsx` and the fixed attendance
source labels into `lib/historyArchive.ts`.

- Removed 33 lines from `app/index.tsx` (13,011 to 12,978).
- Menu state, active styling, option ordering, filter selection and source
  wording are unchanged.

## V4.0.79v — Index extraction: History archive derivation
Moved confirmed-match sorting, competition options, archive filtering and W/D/L
count aggregation into `lib/historyArchive.ts`.

- Removed 31 lines from `app/index.tsx` (13,042 to 13,011).
- Confirmed-only filtering, date/creation ordering, home/away filters,
  competition ordering, sort direction and result totals are unchanged.

## V4.0.79u — Index extraction: History stadium aggregation
Moved stadium visit aggregation and unique-season stadium counting into
`lib/historyStadiums.ts`.

- Removed 34 lines from `app/index.tsx` (13,076 to 13,042).
- Confirmed-match filtering, repeat-visit counting, club lookup, Wembley label,
  visit ordering and normalized unique counts are unchanged.

## V4.0.79t — Index extraction: History fixture matching
Moved Football History fixture lookup and season-key normalization into
`lib/historyFixtureMatching.ts`.

- Removed 70 lines from `app/index.tsx` (13,146 to 13,076).
- Hydrated History fixtures remain first choice, bundled TFD remains the cup
  and European fallback, and competition-specific selection is unchanged.

## V4.0.79s — Index extraction: ticket-grid layout
Moved the repeated ticket-grid column, row and percentage sizing calculations
into `lib/ticketGridLayout.ts` and shared them with `ExportTicketGrid`.

- Removed 27 lines from `app/index.tsx` (13,173 to 13,146).
- The 1/2/3/4-column thresholds, minimum row count, 0.7% frame/export gutter
  and 0.25% Home width adjustment are unchanged.

## V4.0.79r — Index extraction: History result resolution
Moved provider-score precedence and attendance-result calculation into
`lib/historyDerivation.ts`.

- Removed 20 lines from `app/index.tsx` (13,193 to 13,173).
- Provider-linked scores remain authoritative, shootout winners remain
  authoritative and home/away win/loss interpretation is unchanged.

## V4.0.79q — Index extraction: Football History controls
Moved the reusable History back control and full-screen match-photo viewer into
`components/history/HistoryControls.tsx`.

- Removed 29 lines from `app/index.tsx` (13,222 to 13,193).
- Labels, press feedback, close control, overlay stacking and image sizing are
  unchanged.

## V4.0.79p — Index extraction: ticket club ownership
Moved ticket-collection club-name and per-ticket club-option resolution into
`lib/ticketClubOwnership.ts`.

- Removed 22 lines from `app/index.tsx` (13,244 to 13,222).
- Season-profile weighting, ticket-club weighting, exact profile image matching,
  Favourite Club fallback and generated club identity are unchanged.

## V4.0.79o — Index extraction: old-school capture host
Moved the off-screen old-school ticket capture host into
`components/tickets/OldSchoolCaptureHost.tsx`.

- Removed 19 lines from `app/index.tsx` (13,263 to 13,244).
- The 1200 × 480 capture surface, 3.53 render scale, capture ref and generated
  ticket artwork are unchanged.

## V4.0.79n — Index extraction: season-frame export renderer
Moved the hidden high-resolution frame capture renderer into
`components/frames/SeasonFrameExport.tsx`.

- Removed 79 lines from `app/index.tsx` (13,342 to 13,263).
- The 2480 × 3508 capture size, Retina scale, frame finish, title, match count
  and exported ticket artwork are unchanged.

## V4.0.79m — Index extraction: main navigation
Moved the shared bottom navigation and Back to Home control into
`components/navigation/MainNavigation.tsx`.

- Removed 101 lines from `app/index.tsx` (13,443 to 13,342).
- Active-tab colours, press feedback, tab switching and Home reset behaviour
  are unchanged.

## V4.0.79l — Index extraction: export ticket grid
Moved the complete export-only ticket grid into
`components/tickets/ExportTicketGrid.tsx`.

- Removed 93 lines from `app/index.tsx` (13,536 to 13,443).
- Column and row sizing, ticket transforms, old-school artwork, image loading
  callbacks and file-ticket fallback rendering are unchanged.

## V4.0.79k — Index extraction: old-school ticket card
Moved the complete old-school ticket renderer into
`components/tickets/OldSchoolCard.tsx`.

- Removed 247 lines from `app/index.tsx` (13,783 to 13,536).
- Palette, QR, OCR seat details, formatting and rendering are unchanged.

## V4.0.79j — Index extraction: English club catalogue
Moved the complete English 92-club theme and generated catalogue into
`lib/englishClubCatalog.ts`.

- Removed 234 lines from `app/index.tsx` (14,017 to 13,783).
- Club names, leagues, generated IDs, colours and ordering are unchanged.
- The index is now below 500 KB, removing Babel's large-file warning.

## V4.0.79i — Index extraction: match confirmation overlay
Moved the complete item-type, match, edit, season-ticket, car-park and document
confirmation overlay into `components/tickets/MatchConfirmationOverlay.tsx`.

- Removed 1,124 lines from `app/index.tsx` (15,141 to 14,017).
- All fields, steps, validation, fixture picking and callbacks are unchanged.

## V4.0.79h — Index extraction: ticket viewer
Moved the complete ticket viewer into `components/tickets/TicketViewer.tsx`.
All zoom, pan, tap, long-press, animation and fallback behavior is unchanged.

- Removed 300 lines from `app/index.tsx` (15,441 to 15,141).

## V4.0.79g — Ticket viewer style decoupling
Moved the unchanged failed-image placeholder rules into the viewer stylesheet,
removing the viewer's final dependency on the root stylesheet.

## V4.0.79f — Matchday geofence configuration
Moved the unchanged 0.12-mile stadium-core and 0.75-mile venue-outer thresholds
into `lib/matchdayConfig.ts`. Matching behavior is unchanged.

## V4.0.79e — Local-backup reminder configuration
Structural refactoring only. Moved the five-ticket backup reminder threshold
into `lib/localBackup.ts`; its value and behavior are unchanged.

## V4.0.79d — Index extraction: ticket-style options
Structural refactoring only. Moved the fixed ticket-style option list beside
the shared `TicketStyle` type in `lib/ticketTypes.ts`.

- Reduced `app/index.tsx` from 15,440 to 15,439 lines and by 139 bytes.
- E-Ticket/Old School values, labels and order are unchanged.
- Ticket rendering, selection and persistence remain unchanged.

## V4.0.79c — Index extraction: notification presentation setup
Structural refactoring only. Moved the global Expo notification handler into
`lib/notificationSetup.ts`.

- Removed 7 further lines from `app/index.tsx` (15,447 to 15,440).
- Banner, notification-list, sound and badge settings are unchanged.
- Scheduling, permissions, responses and match check-ins remain unchanged.

## V4.0.79b — Index extraction: frame-export sizing
Structural refactoring only. Moved the A-series export pixel targets and
Retina-aware layout calculations into `lib/frameExportSizing.ts`.

- Removed 9 further lines from `app/index.tsx` (15,456 to 15,447).
- The 2480×3508 target, 1179 base width and PixelRatio calculation are unchanged.
- Photo, PDF and print rendering behavior remain unchanged.

## V4.0.79a — Index extraction: extended club catalogue
Structural refactoring only. Moved the Scottish and National League club list
into the existing `lib/clubCatalog.ts` module beside its colour lookup.

- Removed 85 further lines from `app/index.tsx` (15,541 to 15,456).
- Club order, generated IDs, league labels and stadium placeholders are unchanged.
- Club selection, onboarding, themes and fallback colours remain unchanged.

## V4.0.78z — Index extraction: extended club colours
Structural refactoring only. Moved the National League and Scottish club-colour
lookup into the existing `lib/clubCatalog.ts` module.

- Removed 58 further lines from `app/index.tsx` (15,599 to 15,541).
- Every club name and primary/secondary colour pair is unchanged.
- Club construction, selection, theming and fallback colors remain unchanged.

## V4.0.78y — Index extraction: Matchday Experience types
Structural refactoring only. Moved Matchday Experience, venue, assignment,
custom-location and supporter-report types into `lib/matchdayTypes.ts`.

- Removed 51 further lines from `app/index.tsx` (15,650 to 15,599).
- Every field, union value and optional marker is unchanged.
- Matchday state, location behavior, storage and UI remain unchanged.

## V4.0.78x — Index extraction: native integration bindings
Structural refactoring only. Moved typed Parking Search and Siri Shortcuts
native-module bindings into `lib/nativeIntegrations.ts`.

- Removed 44 further lines from `app/index.tsx` (15,694 to 15,650).
- Native module names, methods, arguments and result types are unchanged.
- Two guarded local captures preserve the existing availability checks.

## V4.0.78w — Index extraction: ticket-viewer styling
Structural refactoring only. Moved the ticket viewer zoom constants, spring
configuration and stylesheet into `components/tickets/ticketViewerStyles.ts`.

- Removed 65 further lines from `app/index.tsx` (15,759 to 15,694).
- Zoom limits, double-tap scale, spring values and every style are unchanged.
- Viewer gestures, animation state and actions remain in the root unchanged.

## V4.0.78v — Index extraction: ticket-image components
Structural refactoring only. Moved the home-frame and wallet ticket-image
presentations into `components/tickets/TicketImages.tsx`.

- Removed 90 further lines from `app/index.tsx` (15,849 to 15,759).
- URI resolution, transforms, placeholders and error handling are unchanged.
- Ticket selection, editing, wallet layout and persistence remain unchanged.

## V4.0.78u — Index extraction: ticket-domain types
Structural refactoring only. Moved the shared `SeasonTicket` and `TicketStyle`
types into `lib/ticketTypes.ts`.

- Removed 31 further lines from `app/index.tsx` (15,880 to 15,849).
- Every field, optional marker and display-style value is unchanged.
- Ticket state, storage, recognition and rendering remain unchanged.

## V4.0.78t — Index extraction: club-catalog foundation
Structural refactoring only. Moved the shared club option type, onboarding
placeholder and league-option list into `lib/clubCatalog.ts`.

- Removed 38 further lines from `app/index.tsx` (15,918 to 15,880).
- Placeholder values, league labels and ordering are unchanged.
- Club selection, onboarding and persistence behavior remain unchanged.

## V4.0.78s — Index extraction: persistent-storage keys
Structural refactoring only. Moved all root persistent-storage key strings into
the shared `lib/storageKeys.ts` registry.

- Reduced `app/index.tsx` from 15,920 to 15,918 lines and by 849 bytes.
- Every key string and schema/version suffix is unchanged.
- Storage loading, writes, migrations and reset behavior remain unchanged.

## V4.0.78r — Index extraction: frame-finish palette
Structural refactoring only. Moved the three frame-finish colour maps and
derived style list into `lib/frameFinishes.ts`.

- Removed 94 further lines from `app/index.tsx` (16,014 to 15,920).
- Every finish name, colour value and selection order is unchanged.
- Frame rendering, export dimensions and selected-frame state remain unchanged.

## V4.0.78q — Index extraction: native ticket cropper
Structural refactoring only. Moved the serialized native cropper presentation
and option handling into `lib/ticketCropper.ts`.

- Removed 66 further lines from `app/index.tsx` (16,080 to 16,014).
- Crop dimensions, quality, initial rectangle and presentation delays are unchanged.
- Ticket import/edit state and automatic crop analysis remain unchanged.

## V4.0.78p — Index extraction: duplicate match-photo cleanup
Structural refactoring only. Moved stored match-photo reference deduplication
into the existing `lib/matchMediaLibrary.ts` module.

- Removed 30 further lines from `app/index.tsx` (16,110 to 16,080).
- URI hashing, SHA-256 comparison and unreadable-file fallback are unchanged.
- Stored photo references and Match Memory behavior remain unchanged.

## V4.0.78o — Index extraction: match-media classification
Structural refactoring only. Moved stadium-radius media matching and geotagged
matchday classification into the existing `lib/matchMediaLibrary.ts` module.

- Removed 133 further lines from `app/index.tsx` (16,243 to 16,110).
- The 0.5-mile stadium radius, batching and four-hour video rule are unchanged.
- Match Memory state, storage, durable copies and venue geofences are unchanged.

## V4.0.78n — Index extraction: stadium-name matching
Structural refactoring only. Moved stadium aliases and normalized stadium-name
resolution into the existing `lib/clubGroundMatching.ts` module.

- Removed 14 further lines from `app/index.tsx` (16,257 to 16,243).
- Every alias and exact/prefix matching rule is unchanged.
- Ground data, match-media behavior and all call sites remain unchanged.

## V4.0.78m — Index extraction: match-media library queries
Structural refactoring only. Moved the match-day Photos time window, paginated
asset query and shared query/info caches into `lib/matchMediaLibrary.ts`.

- Removed 72 further lines from `app/index.tsx` (16,329 to 16,257).
- The six-hour window, 2,000-asset limit, pagination and timeout are unchanged.
- Stadium radii, GPS matching, classification and saved media remain unchanged.

## V4.0.78l — Index extraction: ticket QR image generation
Structural refactoring only. Moved ticket QR scanning, regeneration and its
in-memory result/in-flight caches into `lib/ticketQr.ts`.

- Removed 71 further lines from `app/index.tsx` (16,400 to 16,329).
- Barcode selection, QR sizing, colours, JPEG encoding and caching are unchanged.
- Old-school ticket rendering and its existing call site remain unchanged.

## V4.0.78h — Index extraction: geographic distance
Structural refactoring only. Moved the shared great-circle miles calculation
into `lib/geoDistance.ts`.

- Removed 11 further lines from `app/index.tsx` (16,606 to 16,595).
- The formula and 3958.8-mile Earth-radius constant are unchanged.
- Every stadium and nearby-venue geofence threshold remains unchanged.

## V4.0.78g — Index extraction: old-ticket stylesheet builder
Structural refactoring only. Moved the complete scale-aware old-style ticket
stylesheet builder into `components/tickets/oldSchoolTicketStyles.ts`.

- Removed 285 further lines from `app/index.tsx` (16,891 to 16,606).
- Every style value, scaling calculation, colour and layout rule is unchanged.
- The old-ticket component, rendering logic, ticket data and QR handling remain unchanged.

## V4.0.78f — Index extraction: old-ticket date/time formatting
Structural refactoring only. Moved the old-ticket 12-hour kick-off and short-date
formatters into the existing `lib/matchDisplayFormatting.ts` module.

- Removed 23 further lines from `app/index.tsx` (16,914 to 16,891).
- Date parsing, locale, capitalisation and invalid-value handling are unchanged.
- Old-ticket rendering and all ticket data remain unchanged.

## V4.0.78e — Index extraction: club-ground matching
Structural refactoring only. Moved the club aliases, name normalisation and
football-ground lookup into `lib/clubGroundMatching.ts`.

- Removed 56 further lines from `app/index.tsx` (16,970 to 16,914).
- Alias values, historical-ground filtering and fuzzy matching are unchanged.
- Fixtures, club data, stadium selection and all saved behaviour are unchanged.

## V4.0.78d — Index extraction: ticket-file helpers
Structural refactoring only. Moved the cohesive ticket-file URI, permanent-copy,
logging, fingerprint, timing and image-dimension helpers into `lib/ticketFiles.ts`.

- Removed 71 further lines from `app/index.tsx` (17,041 to 16,970).
- The app-owned ticket directory, copy rules and print-dimension timeout are unchanged.
- Ticket imports, rendering, deletion, storage and native behaviour are unchanged.

## V4.0.78c — Index extraction: ticket colour palette
Structural refactoring only. Moved the ticket-image colour analyser and its
unchanged in-memory result/in-flight caches into `lib/ticketPalette.ts`.

- Removed 94 further lines from `app/index.tsx` (17,135 to 17,041).
- Image resize, JPEG decoding, colour ranking and fallback behaviour are unchanged.
- Ticket rendering, QR handling, saved data and native integrations remain unchanged.

## V4.0.78b — Index extraction: automatic crop suggestion
Structural refactoring only. Moved the complete state-free automatic ticket
crop suggestion algorithm into `lib/ticketCropAnalysis.ts` beside its pixel and
OCR-bound helpers.

- Removed 153 further lines from `app/index.tsx` (17,288 to 17,135).
- Crop thresholds, padding, OCR grouping and returned crop rectangles are unchanged.
- Native cropper presentation and ticket import state remain in the root.

## V4.0.78a — Index extraction: ticket crop analysis
Structural refactoring only. Moved pixel decoding, content-bound detection and
OCR-bound conversion from `app/index.tsx` to `lib/ticketCropAnalysis.ts`.

- Removed 117 lines from `app/index.tsx` (17,405 to 17,288).
- Native cropper presentation, serialization, suggested-crop logic and import
  workflow remain unchanged in the root.
- No crop calculations, image quality, storage or ticket behavior changed.

## V4.0.77 — Match Memory GPS location folders
Connected the existing geotag-aware match-day matcher to both automatic and
manual Match Memory scans. Same-day geotagged photos and videos can now be
classified beyond the stadium while retaining the existing durable media-copy
and deduplication path.

- Confident stadium matches use the actual stadium name.
- New folders offer Pub, Restaurant or Train station.
- Moving selected media uses its GPS for up to three Apple Maps suggestions
  within 0.08 miles, with manual naming when needed.
- Location deletion is now an X in each Media Locations row.
- The scan-completion marker advanced to v9 so existing matches receive one
  fresh geotag-aware pass without changing saved media or assignment schemas.

## V4.0.76j — Index extraction: match weather
Structural refactoring only. Moved the MatchWeather type, weather-code labels
and unchanged Open-Meteo request/parser into `lib/matchWeather.ts`.

- Removed 84 further lines from `app/index.tsx` (17,445 to 17,361).
- Request URL, date window, kick-off matching, icons and failure behavior are unchanged.
- Weather state ownership and UI rendering remain in the root.

## V4.0.76i — Index extraction: draggable frame-grid tile
Structural refactoring only. Moved the isolated draggable ticket-grid gesture
wrapper into `components/frames/DraggableGridTile.tsx`.

- Removed 122 further lines from `app/index.tsx` (17,567 to 17,445).
- Long-press timing, pan activation, animation values, tap handling and drop
  callbacks are unchanged.
- Frame state, layout records, ticket rendering and the original grid style
  remain owned by the root.

## V4.0.76h — Index extraction: season-entry helpers
Structural refactoring only. Moved season-entry normalisation and season option
generation from `app/index.tsx` into the existing `lib/seasons.ts` module.

- Removed 26 further lines from `app/index.tsx` (17,593 to 17,567).
- Existing season boundaries, 2020 lower limit and current-season behavior are unchanged.
- No Season Ticket state, storage schema, IDs or UI behavior changed.

## V4.0.76g — Index extraction: ticket display sizing
Structural refactoring only. Moved the pure ticket-viewer aspect-ratio sizing
calculation from `app/index.tsx` to `lib/ticketDisplay.ts`.

- Removed 19 further lines from `app/index.tsx` (17,612 to 17,593).
- Ticket viewer gestures, zoom, layout state and rendering remain in place.
- No dimensions, fallback behavior, UI, state or persistence changed.

## V4.0.76f — Index extraction: club initials
Structural refactoring only. Moved the pure shared `clubInitials` formatter from
`app/index.tsx` to `lib/clubDisplay.ts`.

- Removed 12 further lines from `app/index.tsx` (17,624 to 17,612).
- Favourite Club Badge and old-school ticket output are unchanged.
- No UI, club matching, state, storage or behavior changed.

## V4.0.76e — Index extraction: color helpers
Structural refactoring only. Moved four pure RGB, saturation and readable-color
helpers from `app/index.tsx` to `lib/colorUtils.ts`.

- Removed 25 further lines from `app/index.tsx` (17,649 to 17,624).
- Ticket palette analysis and all UI color call sites remain unchanged.
- No styling result, state, storage, image processing or behavior changed.

## V4.0.76d — Index extraction: fixture time formatting
Structural refactoring only. Moved the pure fixture-day, kick-off time and
last-updated label helpers into the existing `lib/matchDisplayFormatting.ts`.

- Removed 37 further lines from `app/index.tsx` (17,686 to 17,649).
- Date parsing, timezone handling, fallback labels and call sites are unchanged.
- No UI, state, persistence, fixture data, provider or TFD behavior changed.

## V4.0.76c — Index extraction: match display formatting
Structural refactoring only. Moved the pure fixture-name and ticket/history date
formatters from `app/index.tsx` to `lib/matchDisplayFormatting.ts`.

- Removed 52 further lines from `app/index.tsx` (17,738 to 17,686).
- Existing `normaliseFixtureText` behavior and every call site are unchanged.
- No React state, persistence, navigation, provider or TFD behavior changed.

## V4.0.76b — Index extraction: Favourite Club Badge
Structural refactoring only. Moved the Favourite Club Badge presentation and
its unchanged styles from `app/index.tsx` to
`components/club/FavouriteClubBadge.tsx`.

- Removed 33 further lines from `app/index.tsx` (17,771 to 17,738).
- Shared initials and readable-color calculations remain owned by the existing
  root helpers and are passed to the display component.
- Appearance, accessibility label and behavior are unchanged.

## V4.0.76a — Index extraction: Match Memory video player
Structural refactoring only. Moved the self-contained Match Memory Expo video
player from `app/index.tsx` to
`components/matchMemory/MatchMemoryVideoPlayer.tsx` and imported it back into
the existing Match Memory presentation.

- Removed 66 lines from `app/index.tsx` (17,837 to 17,771).
- Playback startup, native controls, loading/error UI, logging and unmount
  cleanup are unchanged.
- No state ownership, storage format, media reference, navigation, native code,
  provider or TFD behavior changed.

## V4.0.73 — Matchday Experience and location-based Match Memory media
Matchday Experience is now distinct from stadium information, supports Home or
Away fan setup, pausable capture, current-location check-ins, ratings and timed
post-match closure. Stadium and Matchday Experience result panels are mutually
exclusive. Apple Maps supplies live nearby place results: three car parks only
after Update Live Location, and five pubs or restaurants with typed search,
autocomplete, navigation and check-in.

Match Memory now deduplicates Photos-library and app-owned representations,
uses tighter stadium matching, and assigns confident GPS matches to the named
stadium or a known venue automatically. Media Locations supports Pub,
Restaurant and Other folders via the top-right plus control. Edit mode selects
photos and videos for moving into those folders; GPS-backed venue moves offer
nearby Apple Maps suggestions plus manual naming. Location rows are display-only
and show separate photo/video counts with place-type icons.

- Added safer in-context permission requests and Apple Maps privacy wording.
- Preserved app-owned video copying/playback, Siri, Wallet and frame/export paths.
- Expanded club-name matching and season/fixture parsing across supported leagues.
- iOS build number advanced from 6 to 7. App version remains 1.1.1.

## V4.0.72 — Match-day places, verified visits and final QA repairs
The Home Next Match card now offers number-free Nearby Car Parks, Nearby Pubs
and Nearby Restaurants controls. Pubs and restaurants come from attributed
OpenStreetMap place data around the correct home or away stadium; selecting a
place opens Google Maps navigation. Restaurant cuisine is shown when mapped.

- Nearby results are cached on-device and fail over to a Google Maps search.
- Pub cards include a private “Where did you go?” report for Home, Away, Mixed
  or Unsure. Reports are linked to the displayed match and remain unpublished
  until a future moderated community service exists.
- “Confirm I’m here” uses foreground location only on request, stores no raw
  coordinates and records only whether the supporter was within 0.15 miles and
  the calculated distance.
- OpenStreetMap attribution and ODbL link are displayed with place results.
- Permission switches now remain off when the required iOS access is denied.
- Backup restore keeps a rollback snapshot and restores live data after a copy
  failure instead of leaving a partial replacement.
- Removed all 24 existing lint warnings, including stale effect closures,
  unused code and missing image descriptions.
- iOS build number advanced from 5 to 6. App version remains 1.1.1.

## V4.0.71 — Cup backfill, score breakdowns and provider racing
Highlightly capacity is now allocated in a strict product-priority order:
Championship through National League, all four Scottish divisions, domestic
cups, missing half-time/full-time detail, historical lower-league results, and
only then Premier League history or live racing when the protected reserve is
still available.

- Premier League joined the fast standings refresh, after the eight protected
  lower/Scottish tables. Its verified 2026/27 table contains 20 clubs.
- The 2025/26 FA Cup is the first permanent cup backfill. The first daily pass
  cached all nine provider pages (836 unique matches from 873 paginated rows).
- The 2025/26 Scottish Cup started next and cached 100 of 127 matches; the
  durable cursor resumes at the daily reset without redownloading completed
  pages.
- Remaining 2025/26 domestic cups are queued before the currently published
  2026/27 League Cup, EFL Trophy, FA Trophy, Community Shield, National League
  Cup, Scottish League Cup and Scottish Challenge Cup feeds.
- API-Football's already-cached score payloads supplied more than 7,800 half-time results
  without spending another provider call. TFD now carries explicit half-time
  and full-time score fields while retaining the existing score fields.
- Highlightly detail enrichment uses timestamped goal events only when the
  half-time result is unambiguous; own-goal ambiguity fails closed.
- API-Football and Highlightly can race current matches server-side. The first
  valid completion rebuilds TFD immediately; API-Football's higher priority can
  later improve provisional Highlightly scores. Provenance remains attached.
- Highlightly racing is skipped when fewer than 37 estimated calls remain,
  preserving a 35-call lower-league/Scotland reserve, and is rate-gated to at
  most once per 15 minutes.
- Daily maintenance is scheduled for 04:15 Europe/London: refresh nine tables,
  reuse stored score breakdowns, then spend only capacity above the protected
  reserve on resumable cup/history work.

## V4.0.70 — Highlightly lower-league fixtures and fast tables
Highlightly BASIC is now a supplemental server-side TFD provider for the
2026/27 Championship, League One, League Two, National League, Scottish
Premiership, Scottish Championship, Scottish League One and Scottish League
Two. The iOS app still consumes only the bundled TFD database and contains no
provider key or direct Highlightly request path.

- Full sync caches every currently published fixture/result and all eight
  league tables; existing football-data.org, API-Football and OpenFootball
  provider caches remain enabled as fallbacks.
- `npm run highlightly:standings` refreshes all eight tables in eight calls and
  preserves the full cached fixture set.
- Highlightly tables have priority 145 for these competitions. API-Football
  remains the live score/status authority at priority 140; Highlightly scores
  supplement it at priority 130.
- Scottish divisions have distinct canonical competition identities and cannot
  collide with the identically named English divisions.
- The local `HIGHLIGHTLY_API_KEY` stays in ignored
  `.ticket-frame-api-secrets`; only an empty example field is versioned.

Verified against real BASIC-plan responses on 2026-08-29: all eight target
leagues returned current-season matches and standings. The first full cache
contained 1,537 published fixtures and 138 table rows, used 25 calls, rebuilt
TFD with four approved providers, and passed TypeScript. The standings-only
refresh used eight calls and preserved every cached fixture count.

## TFD live funnel — V4.0.49
TFD remains the single football-data source consumed by Ticket Frame. API-Football current-day data now updates TFD scores/statuses and recalculates affected league tables during the same cycle. Maximum API-Football usage is 100 calls per football day, with adaptive scheduling rather than a fixed 80-call live budget.

## TFD club-name normalisation — V4.0.50
TFD live matching now generically normalises AFC/FC suffixes before matching API-Football fixtures to TFD fixtures.

## V4.0.51 — Shared TFD Club Identity
- Added central shared TFD club identity resolver.
- Provider club names now reconcile through one identity layer rather than provider-specific matching.
- Supports safe FC/AFC/Football Club normalization.
- Supports shortened club-name matching only when the fixture match is unique.
- Ambiguous matches fail closed rather than being guessed.
- Youth teams such as Crystal Palace U21 and Manchester City U21 remain separate from senior clubs.
- API-Football live matcher now uses the shared TFD identity resolver.
- TFD builder now uses shared fixture identity matching when merging providers.
- API-Football live score and status priority increased to 140.
- Verified Crystal Palace FC 1–4 Manchester City FC as FINISHED.
- Verified Wrexham AFC 1–2 Birmingham City FC as FINISHED.
- API-Football correctly attached to both existing TFD matches.
- Two affected competition/season tables refreshed.

## V4.0.52 — Fixture loading and durable match media
- Fixtures now always run their cache-first initial hydration; a stale verified
  marker can no longer leave the screen empty until Refresh is pressed.
- Overlapping fixture requests are request-keyed so an older club response
  cannot replace the current club's fixtures.
- My Home Fixtures paints its saved cache immediately and refreshes only when
  needed, avoiding an unnecessary full rebuild on every open.
- Match photos and videos discovered or selected from Apple Photos are copied
  once into app-owned Match Memory storage and referenced there thereafter.
- Missing/deleted Photos assets are removed from app metadata without touching
  the user's Photos library. App-owned copies remain backup/restore compatible.
- Automatic discovery retries legacy scan markers that contain no media,
  falls back from an empty selected album to the authorised library, and reuses
  date-query and asset-metadata caches to reduce library scans and UI lag.

## V4.0.53 — Fixture-keyed media UI
- Match video playback is validated against the currently open fixture before
  rendering and the player is keyed by fixture plus URI, preventing a previous
  fixture's preview/player from flashing during navigation or async resolution.
- Videos are labelled `Video 1`, `Video 2`, and so on instead of exposing
  camera filenames.
- My Home Fixtures now shows both photo and video indicators from the same
  Match Memory metadata used by Recent Matches.
- Confirmed home fixtures include an `OPEN MATCH MEMORY` action and media icons
  open the standard Match Memory detail, including the correct photos/videos.

## V4.0.54 — Responsive Home and automatic league tables
- Removed development-only whole-gallery file checks and per-ticket render logs
  from the Home render path; these were repeatedly hitting storage and flooding
  Metro while the user was trying to tap or scroll.
- Removed high-frequency zoom worklet logging from the season frame gesture.
- Cache-first Fixtures loading now hydrates the bundled league table before it
  returns, so revisiting Fixtures does not require Refresh to populate Table.

## V4.0.55 — Reliable Match Memory video playback
- Tapping a fixture video now creates a fixture-keyed player, displays a loading
  indicator and starts playback as soon as the native player is ready.
- Closing or changing the video pauses its player, preventing hidden playback.
- Native playback errors remove only the failed asset reference from that Match
  Memory, so removed or corrupt videos no longer leave a permanently broken row.

## V4.0.56 — Framed Home collection and isolated zoom
- Home tickets now sit inside the selected physical frame, bevel and mount
  colours instead of appearing as an unframed grid.
- Removed in-place Home grid scaling that could overlap filters, buttons and the
  bottom navigation; zoom is now confined to the separate full-frame viewer.
- Pinching the full-frame viewer back to its minimum size closes it and returns
  to Home. The full-frame canvas clips zoomed content to its own viewing area.

## V4.0.57 — Pop-out frame and full-screen ticket interaction
- An outward pinch on the framed Home collection now pops it into the separate
  Full Season Frame screen instead of scaling across the Home controls.
- Pinching the separate frame back to its resting size returns it to its Home
  position.
- Tapping a ticket inside Full Season Frame opens the fully expandable ticket
  viewer; rearranging requires a deliberate hold followed by a drag.
- Drag completion and cancellation both restore the ticket's normal position,
  scale, shadow and collection highlighting.

## V4.0.58 — Safe native video-player cleanup
- Video cleanup now tolerates the native player already being disposed during
  fast refresh or rapid navigation, preventing a native shared-object error.

## V4.0.59 — Focused Home-frame zoom and non-destructive video errors
- Home-frame pinch zoom now enlarges the frame directly above its original Home
  screen while the background slowly fades away. Full Season Frame controls are
  not shown during this focused view.
- Pinching the focused frame smaller reverses the fade and returns it to Home.
- Video playback status now uses Expo's native event state, including events
  emitted before the previous listener was ready.
- A playback error never deletes the saved media reference. The row remains and
  can be tapped again to retry.
- Full-frame hold release now resets drag visuals from both the long-press and
  pan finalisation paths, including a hold where the ticket was not moved.

## V4.0.60 — Full-frame zoom, incremental video discovery and startup relief
- Shrinking zoom on the dedicated Full Season Frame now resets its zoom but
  remains on that page. Only the focused frame opened from Home returns Home.
- The dedicated frame page background fades from its gallery colour to the same
  dark focus treatment as the Home-frame zoom as magnification increases.
- Automatic Match Memory discovery no longer stops merely because photos were
  already attached; matches without video receive one versioned retry.
- Locationless videos can be linked generically when recorded within four hours
  of a geolocated stadium photo on the same match-day query. Birmingham is not
  special-cased; the rule applies to every resolved football ground.
- Completed no-result scans are remembered, metadata work is batched, and the
  automatic scan starts after an eight-second idle delay instead of during app
  opening.
- Legacy ticket OCR/date recovery now runs only for saved tickets with no date,
  removing repeated startup OCR and fixture work that made zero corrections.

## V4.0.61 — Immediate button acknowledgement
- Shared bottom navigation switches on touch-down rather than waiting for the
  finger to lift, while retaining the normal press action as a safety path.
- Bottom navigation, History back controls, Home/back controls, Fixtures/Table
  tabs and View Full Season Frame now show immediate pressed opacity and scale.
- Press delay is explicitly disabled on these high-frequency controls.

## V4.0.62 — True full-screen frame zoom and History media removal
- Full Season Frame no longer clips magnified content to its original page box;
  the frame can grow across the available display above the page chrome.
- Page scrolling, bounce and ticket rearrangement are disabled while zoomed so
  they do not compete with pinch/pan gestures, reducing zoom lag.
- The existing dark focus background continues behind the enlarged frame.
- Long-pressing a referenced History photo or video now offers a Remove action.
  Only Ticket Frame's Match Memory copy/reference is removed; Apple Photos is
  explicitly left untouched.

## V4.0.63 — One frame renderer for screen, image, PDF and print
- Full Season Frame zoom now enters the same focused, dark-background overlay
  used by the Home frame; surrounding selectors and export controls disappear
  while zoomed and return when the frame is pinched back.
- Print and PDF now use the exact same frame-only JPEG master as Save Image,
  eliminating the separate layout and its extra bottom border.
- Closing the iOS print sheet is treated as cancellation and no longer opens a
  PDF save/share sheet.
- Removed the obsolete large vector season-frame renderer so there is only one
  visual source of truth and less JavaScript to parse.

## V4.0.64 — Home always means main Home
- The shared Home button now closes Settings, frame menus, focused/full-frame
  presentation, My Home Fixtures and open detail state before selecting Home.
- Pressing Home while Home is already the underlying active tab still performs
  the reset, so it can never leave the user on Settings.

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

## V4.0.66 — Fluid Frame Pinch Zoom
- Improved pinch-to-zoom fluidity on the focused Home frame and focused Full Season Frame.
- Pinch scaling now remains anchored to the gesture focal point so the frame follows the user's fingers naturally.
- Active pinch scale and translation calculations remain on Reanimated shared values/UI thread.
- Prevented the one-finger pan gesture from competing with an active two-finger pinch.
- Preserved existing zoom limits, focused presentation, ticket interaction and zoom-out/exit behaviour.
- Preserved export, PDF, Print and Photo output behaviour.
- Includes iOS parent-app version synchronization at version 1.1.1 / build 5.
- Verified on device by user.
- TypeScript passed.
- Expo lint: 0 errors, 24 existing warnings.

## V4.0.67 — Faster live score refresh
- Live API-Football polling now prefers a 2-minute refresh regardless of overlapping kick-off blocks.
- A TFD fixture with a recognised live status remains in the live-refresh path even after the normal 120-minute estimated match window.
- Existing API-call budget protection remains active and may safely increase the interval above 2 minutes when required to preserve the 100-call daily limit.
- Finished matches continue to use the slower result/table catch-up path.

## V4.0.68 — Home Wallet View
- Added FRAME VIEW and WALLET VIEW controls alongside View Tickets on Home.
- Frame View remains the existing Home season-frame experience.
- Wallet View uses the same Home season filter and defaults back to Frame View normally.
- Wallet tickets are ordered chronologically by match date, with undated tickets falling to the end.
- Wallet passes render at a consistent full width with the complete ticket artwork visible.
- Wallet artwork uses its own renderer so Frame View rendering is not changed.
- Tickets are stacked at fixed, even intervals with no inconsistent flex/negative-margin spacing.
- Tapping a ticket opens that individual ticket.
- Tapping another ticket while one is already open immediately swaps the open ticket and returns the previous ticket to the stack.
- Dragging the open ticket downward returns it to the Wallet stack.
- Long-press on both stacked and opened Wallet tickets uses the same ticket action menu as Home Frame View.
- Wallet layout and interaction were verified on the physical iPhone.

## V4.0.69 — True A2 Season Frame PDF / Print
- Season Frame PDF export now uses a true ISO A2 portrait page.
- Physical page size is 420 × 594 mm.
- PDF page dimensions are approximately 1190.55 × 1683.78 points.
- The existing high-resolution 2480 × 3508 Season Frame capture master is preserved.
- Save/share Photo remains on the existing high-resolution PNG path.
- Season Frame Print uses the same true-A2 PDF output.
- Added a 0.5-point internal artwork tolerance to prevent WebKit/Expo Print pagination rounding from producing a blank second page.
- The physical PDF page itself remains true A2.
- Individual-ticket PDF and Print paths were not changed.
- PDF and Print were tested after the correction and visually approved.

## V4.0.74 - Compact Settings
- Reduced Settings card/button spacing.
- Added independent SEE MORE / SEE LESS controls for Check-in, Siri, Photo Memories and Backup.
- Preserved existing Settings functionality and Venue Privacy expansion.

## V4.0.78i — Index local backup extraction
- Extracted the local backup/restore engine from app/index.tsx into lib/localBackup.ts.
- Preserved existing AsyncStorage backup data and storage keys.
- Preserved ticket files, Match Memories and old-school ticket image backup/restore behaviour.
- Preserved rollback behaviour on failed restores.
- Backup reminder/count logic remains owned by the main screen.
- No app behaviour or UI changes.

## V4.0.78j — Index ticket ordering extraction
- Extracted ticket collection ordering helpers from app/index.tsx into lib/ticketOrdering.ts.
- Extracted effective ticket display-style resolution into the same helper module.
- Preserved season-ticket, car-park-pass and match-ticket collection ordering.
- Preserved oldest-first match-date ordering and deterministic fallback ordering.
- Preserved E-Ticket / Old School display-style behaviour.
- No UI or behaviour changes.

## V4.0.78k — TFD live score and final-result refresh
- Improved TFD matchday live/result refresh behaviour.
- API-Football live refresh remains at approximately 2-minute intervals while matches are active.
- Reduced API-Football post-match result/final-table catch-up from 15 minutes to 5 minutes.
- Limited final daily verification to a maximum of 3 attempts, 30 minutes apart, preventing the remaining daily allowance being consumed by repeated final checks.
- Reduced Highlightly live race interval from 15 minutes to 5 minutes.
- Reduced Highlightly protected reserve from 35 calls to 10 calls so more of the available matchday allowance can be used.
- Affected league tables continue to rebuild immediately from updated TFD results without an additional API request.
- Verified combined Highlightly + API-Football provider race successfully updated finished matches and rebuilt TFD.

## V4.0.78l — TFD canonical identity reconciliation

- Added a central permanent TFD club identity registry across all four approved football providers:
  - football-data.org
  - openfootball/football.json
  - api-football/api-sports
  - highlightly
- Provider-specific team IDs now cross-reference into permanent TFD club identities before fixture data reaches the app.
- Provider-native team IDs remain provider-native inside provider caches; TFD club identity is assigned centrally instead of overwriting provider IDs.
- Historic TFD fixture relationships are used as conservative bootstrap evidence while retaining permanent TFD match IDs and provider references.
- Club reconciliation uses exact identity and strong cross-provider fixture evidence rather than fuzzy/shared-word matching.
- Same-provider conflicting team IDs block unsafe merges.
- Senior, youth, reserve and women's identities remain separated.
- Canonical-name collisions now create distinct permanent TFD identities instead of leaving fixtures unresolved or incorrectly merging separate clubs.
- Provider fixture orientation discrepancies can be reconciled safely on the same date without treating reversed league return fixtures as duplicates.
- TFD tables are generated from reconciled TFD fixture results rather than blindly accepting a stale provider table.
- API-Football cache mapping now stores API-Football native team IDs rather than copying team IDs from an existing TFD match.
- All final provider fixture sides resolve to permanent TFD club identities.

Verification:
- 14,665 unique TFD matches.
- 0 unresolved club identities.
- 0 duplicate provider references across TFD clubs.
- 0 duplicate permanent TFD match IDs.
- All four approved providers present.
- Premier League 2026-27 reconciled to exactly 380 fixtures and 20 clubs.
- Every Premier League 2026-27 club has exactly 38 fixtures.
- Premier League table has 20 rows and is sourced from tfd-reconciled-fixtures.
- 30 August finished results are reflected in the rebuilt table.
- Canonical-name collision safety verified with separate permanent identities where provider IDs prove different clubs.
- TypeScript passed.
- Expo lint passed.

## V4.0.80e — In-App Guided Demo Foundation
- Preserved the isolated, read-only in-app Demo Mode.
- Retired the unfinished browser/private single-use demo from the active app.
- Removed its Settings UI, state and link-generation wiring.
- Retained lib/privateDemo.ts as reference only.
- Added Expo Speech for optional on-device guided-demo narration.
- Prepared the app for a comprehensive guided Ticket Frame demonstration.

## Current-season Season Tickets
- Current-season My Home Fixtures displays cached data immediately but refreshes the full season rather than accepting a partial cache such as two fixtures as complete.

## Current-season Season Tickets
- Current-season My Home Fixtures refreshes the full fixture set even when a partial cache already exists.

## 2026-09-02 — Current-season Season Ticket next match only
- Current-season Season Ticket profile now displays only the next upcoming unplayed home match.
- Previous current-season home fixtures are no longer displayed as a long list on this screen.
- Past-season Season Ticket profiles retain their existing full home-fixture history.
- Underlying fixture, attendance, photo, video and Match Memory data remains unchanged.
- Auto Add was not changed.
- TypeScript passed using the increased Node heap required by the enlarged TFD database.
- Expo lint retains 4 pre-existing errors outside this change.

## 2026-09-02 — Season Ticket carousel
- Five or fewer Season Ticket profiles retain the existing full-width presentation.
- More than five Season Ticket profiles now use a horizontal paged carousel.
- Four Season Ticket selectors are visible on each carousel page.
- Each selector retains the existing OPEN action.
- V4.0.82 current-season next-match-only behaviour is preserved.
- Auto Add was verified unchanged by direct function comparison with V4.0.82.
- TypeScript passed with the enlarged Node heap.
- Existing unrelated Expo lint errors remain outside this change.

## 2026-09-03 — Manual Add Match sequential fixture wheels
- Manual Add Match now uses sequential TFD-backed selectors:
  Season → Division/League/Cup → Home Team → Away Team → Day/Month.
- 2007/08 onward uses the bundled TFD database.
- 1948/49–2006/07 uses the historical TFD SQLite packs.
- Home and away team choices are narrowed by real fixtures.
- Known fixture dates pre-fill the date selectors.
- LEAVE DATE BLANK stores matchDate as null.
- Ticket Frame never invents a missing date.
- Existing score, result, ground and notes fields remain.
- Auto Add was not changed.
- TypeScript passed with increased Node heap.

## V4.0.85
- Fixed duplicate React list keys in the Fixtures screen.
- Fixture FlatList rendering now generates a unique key for every displayed fixture even when upstream fixture IDs are duplicated.
- Fixture data itself is unchanged.
- Verified on device: Fixtures screen operates normally without the duplicate-key error.
- TypeScript verification passed with increased Node heap.
