# MIGRATION NOTES — Storage Foundation

## V3.9 — Football History foundation (current)
- `STORAGE_VERSION.currentVersion = 2`; `history[]` documents v1 + v2
- Registered real migration `v1 → v2` in `MIGRATIONS[]`:
  - `apply()` is a no-op — the new namespace
    (`ticket-frame.attendance-history.v1`) is additive and created lazily on
    first write; nothing existing is transformed
  - `verify(before, { snapshotBefore })` additionally asserts raw equality of
    saved-frame.v1, ground-visits.v1, ticket-style.v1, onboarding flag and
    rebuildable fixture-cache keys against the pre-migration snapshot (on top of the
    framework's count/ID/URI checks). Any drift ⇒ backup restore + old schema.
- New module `lib/attendanceHistory.ts`: AttendanceRecord model,
  duplicate-safe identity matching (club+opponent+date required;
  competition/ground only when both sides know them), ticket-link upserts,
  manual entry, corrupt-safe load/save, confirmed-only counts
- Tickets remain untouched: saving a ticket LINKS to attendance via optional
  `ticketId`; deleting a ticket never deletes history; ticket IDs are never
  reused as attendance IDs (`att-*`)
- Home-screen "MY CLUB NEXT MATCH" card restored (fixture-engine driven)

## V3.8 — original foundation
## What was built
`lib/storageMigrations.ts` + startup wiring in `app/index.tsx`
(load effect calls `ensureStorageSchema()` **before** any user data is read).

## STORAGE_VERSION (as of V3.8)
- `STORAGE_VERSION.currentVersion = 1` (baseline; matches all existing data)
- `STORAGE_VERSION.history[]` documents each version
- `MIGRATIONS: Migration[]` registry — future steps append here

## Migration lifecycle (every step, automatically)
1. Snapshot ALL user-data + cache keys (`readCoreSnapshot`)
2. Persist backup → `ticket-frame.backup.pre-migration.v<from>-to-v<to>.<ts>`
3. Log `[STORAGE-MIGRATION]` with fromVersion/toVersion/ticketCountBefore/
   seasonCountBefore/groundVisitCountBefore/backupCreated
4. Run `migration.apply()`
5. Verify:
   - ticketCountAfter >= ticketCountBefore
   - every pre-existing ticket ID still present (no ID changes)
   - every stored image URI byte-identical (references cannot break)
   - migration-specific `verify(before, { snapshotBefore })` hook
6. Log `[STORAGE-MIGRATION-COMPLETE]` with after-counts +
   `verificationPassed: true`; stamp new version
7. On ANY failure: restore full snapshot from backup, log
   `[STORAGE-MIGRATION-FAILED]`, halt migrations, continue loading original
   data on the old schema — the app never blocks or loses data

## Edge behaviours
- First launch after V3.8 upgrade: no version key ⇒ stamped `v1`, no transform
- App downgrade (stored version > supported): data left untouched, warning logged
- Version bump without registered steps: stamped through safely

## Registering a future migration (example v2→v3)
```ts
MIGRATIONS.push({
  fromVersion: 2,
  toVersion: 3,
  description: "…",
  apply: async () => { /* additive writes only; never truncate */ },
  verify: async (before, { snapshotBefore }) => { /* throw on regression */ },
});
STORAGE_VERSION.currentVersion = 3;
```
Rules for authors: additive transforms only; keep `saved-frame.v1` and
ticket IDs stable; never touch files in the ticket image directory.

## Preservation guarantees verified this release
- No existing key renamed/removed/reshaped (inventory diff clean)
- Ticket IDs, images, Old School flags, frames, seasons, seat details,
  favourite club, ground visits, onboarding state untouched by load path
- Demo Mode isolation unchanged (bundle-only namespaces; zero demo keys)

## Test evidence (V3.9)
- `npx tsc --noEmit` — clean
- `npm run lint` — 0 errors / 9 pre-existing warnings
- Device: Release build V3.9.0 installed over existing collection
  (install-over preserves data) and launched via devicectl; startup log shows
  `[STORAGE-MIGRATION]` v1→v2 path completing with verification passed

## Checkpoint contents
- `snapshot/` — full project at current release
- `STORAGE-INVENTORY.md` — canonical key inventory (also live in `docs/`)
- `MIGRATION-NOTES.md` — this file
- `STORAGE-CHANGES.md` — per-release storage deltas (V3.9 onward)

## V3.9.5 — Ticket types and recognition improvement

Two NEW additive AsyncStorage namespaces, no schema version bump, no
migration:

- `ticket-frame.season-ticket-profiles.v1` (Season Ticket Profiles; the
  season card itself stays in saved-frame.v1 — the profile only carries
  seat details for attendance)
- `ticket-frame.car-park-passes.v1` (Car Park Passes; the pass stays in
  saved-frame.v1 too and is never counted as attendance)

V3.9.6 correction: tickets are possessions — season tickets, car park
passes and match tickets ALL remain in the ticket archive. Season/carpark
selection no longer removes the scanned ticket; it tags its ticketType
(kept out of match derivation) and stores the side record.

Also additive: `AttendanceSource` gained `"season-ticket"` (records created
from MY HOME FIXTURES confirmations), and `addManualAttendance` accepts an
optional `{ source }` option (default `"manual"`). Existing stored records
and all migration verify paths are untouched.

## V3.9.7 — season fixture season, date-required matching, car park details

NO storage changes at all: no new keys, no schema change, no migration.
Pure behaviour corrections on top of the V3.9.6 ownership model:

- MY HOME FIXTURES now loads fixtures for the profile's OWN saved seasonKey
  (cache-first via `fixture-cache.v4`), never the active/current season.
- Season-ticket attendance matching now REQUIRES the actual fixture date
  (`isSeasonFixtureAttended` in `lib/attendanceHistory.ts`); dateless
  fixtures/records never match.
- Car park passes KEEP their recognised details on the ticket (tag
  `ticketType:"Car Park Pass"` alone excludes them from derivation), and the
  linked fixture is stored as a proper club/opponent split
  (`splitLinkedFixture` in `lib/ticketEdits.ts`).
- Carpark classification is two-tier: only `car park`/`parking` wording can
  skip the TYPE step; weaker hints merely preselect the dropdown. Bare
  "permit" no longer classifies anything, so match tickets are never
  misclassified.
- My Tickets grid count wording: "SAVED ITEMS" (the collection holds match
  tickets, season tickets and car park passes).
