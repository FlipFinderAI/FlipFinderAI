# TICKET FRAME — STORAGE INVENTORY (V3.8)

> Canonical data-layer reference. Update this file whenever a storage key
> is added or changed. The user's collection is the most valuable asset —
> nothing in this table may be deleted, reset or blindly rewritten.

## 1. User data keys (AsyncStorage)

### `ticket-frame.saved-frame.v1` — THE ticket store
| | |
|---|---|
| Purpose | Single source of truth for the collection |
| Data shape | `{ tickets: SeasonTicket[], frameStyle: string, favouriteClub: ClubOption \| null, activeSeason: "YYYY/YYYY" }` |
| Used by | Frames grid, season frames, export/print/share, season picker, stats counts, grounds matching |
| Written | Save-effect on `[tickets, frameStyle, favouriteClub, activeSeason, storageReady]` |
| Read | Startup load effect (V3.7.2 chain), after schema versioning |
| Migration required | **no** |

`SeasonTicket` (app/index.tsx:201): `id` (stable UUID — **never change**),
`fingerprint`, `name`, `uri?` (filename inside ticket dir; live path is
rebuilt via `currentTicketUri()`), `aspectRatio?/cropWidth?/cropHeight?`,
`matchDate?`, `kickoffTime?`, `competition?`, `homeTeam?/awayTeam?`,
`ground?`, `ticketType?`, `seasonKey` ("YYYY/YYYY"), layout fields
(`scale, boxScale, offsetX, offsetY, order?`), `displayStyle?
("e-ticket" \| "old-school")`, `details?` (`TicketSeatDetails`: stand,
entrance, block, row, seat, fanId, ticketType).

`ClubOption`: `id, name, league, stadium, stadiumLocation, primary,
secondary, badge?`.

### `ticket-frame.ground-visits.v1`
| | |
|---|---|
| Purpose | Visited-ground toggles |
| Shape | `Record<groundId, number>` (value always 1 today) |
| Used by | Grounds tab badges/counts, future Ground Challenge |
| Migration required | **no** |

### `ticket-frame.ticket-style.v1`
| | |
|---|---|
| Purpose | Global frame design preference |
| Shape | Plain string: `"e-ticket"` \| `"old-school"` |
| Quirk (preserved) | Loader resolves any stored value to `"e-ticket"` by design (V3.x behaviour); per-ticket Old School overrides ride on `SeasonTicket.displayStyle` where `undefined` = follow global/Old-School default |
| Migration required | **no** |

### `ticket-frame.onboarding-complete.v1`
| | |
|---|---|
| Purpose | V3.7 first-launch gate flag |
| Shape | String `"true"` when set |
| Semantics | Absent + no user data ⇒ onboarding; absent + user data ⇒ legacy migration writes `"true"` silently |
| Migration required | **no** |

### `ticket-frame.storage-version.v1` — NEW in V3.8
| | |
|---|---|
| Purpose | Schema version stamp for the migration framework |
| Shape | Integer as string (`"2"` from V3.9) |
| Absent | Pre-V3.8 install ⇒ stamped to current baseline, no transform |

### `ticket-frame.attendance-history.v1` — NEW in V3.9
| | |
|---|---|
| Purpose | Personal football history — "matches I attended", independent of tickets |
| Shape | `AttendanceRecord[]` (`lib/attendanceHistory.ts`): `{ id "att-*", club, opponent, matchDate?, season, competition?, ground?, homeAway, result?, homeScore?, awayScore?, ticketId?, source: ticket\|manual\|imported-history\|photo-discovery, confirmed, notes?, createdAt }` |
| Isolation | Fully separate array; never merged into `saved-frame.v1`; `ticketId?` is a soft link only — deleting a ticket never deletes history; ticket IDs are never reused |
| Deduping | Identity = club + opponent + date (competition/ground must agree only when both sides know them); dateless records are never auto-matched |
| Counts | UI shows exact counts of confirmed records only; fixtures are never proof of attendance |

### `ticket-frame.season-ticket-profiles.v1` — NEW in V3.9.5
| | |
|---|---|
| Purpose | Season Ticket Profiles. The season card STAYS in the ticket archive (ownership model); selecting "Season Ticket" after a scan stores a profile here with seat details. No individual fixture frames are created; attendance only via explicit confirmations (profile → MY HOME FIXTURES) |
| Shape | `SeasonTicketProfile[]` (`lib/seasonTicketProfiles.ts`): `{ id "stp-*", club, seasonKey, stand?, block?, row?, seat?, fanId?, ticketNumber?, holderName?, imageUri?, createdAt }` |
| Isolation | Own namespace; `saved-frame.v1` untouched; `imageUri` references the already-permanent scan image — never re-encoded |
| Deduping | Identity = club + season + row + seat; re-adding enriches the existing profile instead of duplicating |

### `ticket-frame.car-park-passes.v1` — NEW in V3.9.5
| | |
|---|---|
| Purpose | Car Park Passes — valid saved items that NEVER count as match attendance, stadium visits or season history. Optionally linked to a match date / ground / fixture |
| Shape | `CarParkPass[]` (`lib/carParkPasses.ts`): `{ id "cpp-*", title, ground?, matchDate?, linkedClub?, linkedOpponent?, linkedDate?, imageUri?, createdAt }` |
| Isolation | Own namespace; never written to attendance-history or saved-frame |
| Deduping | Identity = title + matchDate; re-adding merges link details |

## 2. Derived / cache keys (rebuildable, still backed up before migrations)

| Key | Shape | Purpose |
|---|---|---|
| `ticket-frame.fixture-cache.v4` | `Record<key, { fetchedAt, fixtures: CachedFixture[] }>` | Opponent fixture snapshots (TTL 6h) |

## 3. Filesystem (not AsyncStorage)

| Location | Contents |
|---|---|
| `FileSystem.documentDirectory + "ticket-frame-tickets/"` | Original cropped ticket images. Stored URIs reference filenames here via `currentTicketUri()`; migrations must never break these references |

## 4. Demo Mode separation

Demo data lives **only in the JS bundle** (`lib/demoTickets.ts`:
`demoTickets`, `demoMatches`, `demoGrounds`) and is consumed solely by
`components/demo/DemoMode.tsx`. **There are no demo storage keys.** Demo
tickets can never enter `saved-frame.v1`.

## 5. Future namespaces (planned only — NOT built yet)

`attendance-history.v1` shipped in V3.9 (see section 1). Still planned,
added alongside existing keys; `saved-frame.v1` and `SeasonTicket` stay
untouched:

| Feature | Planned namespace | Notes |
|---|---|---|
| Memories | `ticket-frame.memories.v1` | Notes/photos keyed by match reference (fingerprint or date+opponent+ground) |
| Statistics | derived at read time from confirmed records (+ optional derived cache key) | Never a second source of truth |
| Ground Challenge | derived from `ground-visits.v1` + grounds catalogue | No new user data required initially |

## 6. Backup keys (created automatically before any migration)

`ticket-frame.backup.pre-migration.v<from>-to-v<to>.<timestamp>` — full JSON
snapshot of every user-data + cache key present at migration time.
