import {
  canonicalClub,
  canonicalCompetition,
  normaliseIdentityText,
} from "./tfdIdentity.mjs";

const LEVEL_MARKERS =
  /\b(u(?:18|19|20|21|23)|under\s*(?:18|19|20|21|23)|ii|iii|reserves?|youth|academy|women|wfc|ladies)\b/i;

const GENERIC_WORDS = new Set([
  "afc",
  "fc",
  "football",
  "club",
  "city",
  "united",
  "town",
  "rovers",
  "wanderers",
  "athletic",
  "county",
  "albion",
  "rangers",
  "sports",
  "sporting",
]);

const providerTeamKey = (provider, providerId) => {
  if (
    providerId == null ||
    String(providerId).trim() === ""
  ) {
    return null;
  }

  return `${provider}|${String(providerId)}`;
};

const dateOnly = (value) =>
  String(value ?? "").slice(0, 10);

const teamLevel = (name) => {
  const normal = normaliseIdentityText(name);
  const match = normal.match(LEVEL_MARKERS);
  return match?.[0] ?? "senior";
};

const distinctiveTokens = (name) =>
  canonicalClub(name)
    .split(" ")
    .filter(
      (token) =>
        token.length > 1 &&
        !GENERIC_WORDS.has(token),
    );

const safeExactName = (left, right) => {
  const a = canonicalClub(left);
  const b = canonicalClub(right);

  if (!a || !b) return false;
  if (teamLevel(left) !== teamLevel(right)) return false;
  if (a !== b) return false;

  return distinctiveTokens(left).length > 0;
};

const fixtureScopeKey = (row) =>
  [
    canonicalCompetition(row.competition),
    String(row.season ?? ""),
    dateOnly(row.date ?? row.kickoff),
  ].join("|");

const slugFor = (name) =>
  canonicalClub(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "club";

export function buildTfdClubRegistry(
  providerFixtures,
  previousClubs = {},
  previousMatches = [],
) {
  const clubs = new Map();
  const providerRefs = new Map();
  const clubMembers = new Map();
  const entryIndexes = new WeakMap();
  providerFixtures.forEach((entry, index) => entryIndexes.set(entry, index));
  const persistedIds = new Set(
    Object.keys(previousClubs ?? {}),
  );

  let serial = 1;

  for (const [id, rawClub] of Object.entries(
    previousClubs ?? {},
  )) {
    const club = {
      id,
      displayName: rawClub.displayName ?? null,
      aliases: new Set(rawClub.aliases ?? []),
      providerRefs: new Map(),
    };

    clubs.set(id, club);

    for (const ref of rawClub.providerRefs ?? []) {
      const key = providerTeamKey(
        ref.provider,
        ref.providerId,
      );

      if (!key) continue;

      club.providerRefs.set(
        ref.provider,
        String(ref.providerId),
      );

      providerRefs.set(key, id);
    }
  }

  const createClub = (name) => {
    const base = `tfdclub:${slugFor(name)}`;
    let id = base;

    while (clubs.has(id)) {
      id = `${base}:${serial++}`;
    }

    clubs.set(id, {
      id,
      displayName: name ?? null,
      aliases: new Set(name ? [name] : []),
      providerRefs: new Map(),
    });

    return id;
  };

  const providerIdFor = (entry, side) =>
    entry.row[`${side}Id`] ?? null;

  const providerResolvedId = (entry, side) => {
    const key = providerTeamKey(
      entry.provider,
      providerIdFor(entry, side),
    );

    return key
      ? providerRefs.get(key) ?? null
      : null;
  };

  const attach = (entry, side, clubId) => {
    const club = clubs.get(clubId);
    if (!club) return false;

    const name = entry.row[`${side}Name`];

    /*
     * Validate everything before mutating either the
     * permanent registry or the provider fixture.
     */
    if (
      name &&
      club.displayName &&
      teamLevel(name) !==
        teamLevel(club.displayName)
    ) {
      return false;
    }

    const providerId =
      providerIdFor(entry, side);

    const key = providerTeamKey(
      entry.provider,
      providerId,
    );

    if (key) {
      const existing =
        providerRefs.get(key);

      if (
        existing &&
        existing !== clubId
      ) {
        return false;
      }

      const existingProviderId =
        club.providerRefs.get(
          entry.provider,
        );

      if (
        existingProviderId &&
        existingProviderId !==
          String(providerId)
      ) {
        return false;
      }
    }

    /*
     * All validation passed. Mutations are now safe.
     */
    if (name) {
      club.aliases.add(name);

      if (!club.displayName) {
        club.displayName = name;
      }
    }

    if (key) {
      providerRefs.set(
        key,
        clubId,
      );

      club.providerRefs.set(
        entry.provider,
        String(providerId),
      );
    }

    const assignmentKey = `${entryIndexes.get(entry)}|${side}`;
    const previousClubId = entry[`${side}ClubId`];
    if (previousClubId && previousClubId !== clubId) {
      clubMembers.get(previousClubId)?.delete(assignmentKey);
    }
    entry[`${side}ClubId`] = clubId;
    const members = clubMembers.get(clubId) ?? new Set();
    members.add(assignmentKey);
    clubMembers.set(clubId, members);

    return true;
  };

  const canMerge = (leftId, rightId) => {
    if (leftId === rightId) return true;

    const left = clubs.get(leftId);
    const right = clubs.get(rightId);

    if (!left || !right) return false;

    if (
      left.displayName &&
      right.displayName &&
      teamLevel(left.displayName) !==
        teamLevel(right.displayName)
    ) {
      return false;
    }

    for (const [
      provider,
      leftProviderId,
    ] of left.providerRefs.entries()) {
      const rightProviderId =
        right.providerRefs.get(provider);

      if (
        rightProviderId &&
        rightProviderId !== leftProviderId
      ) {
        return false;
      }
    }

    return true;
  };

  const preferredMergeId = (leftId, rightId) => {
    const leftPersisted = persistedIds.has(leftId);
    const rightPersisted = persistedIds.has(rightId);

    if (leftPersisted && !rightPersisted) {
      return [leftId, rightId];
    }

    if (rightPersisted && !leftPersisted) {
      return [rightId, leftId];
    }

    return leftId.localeCompare(rightId) <= 0
      ? [leftId, rightId]
      : [rightId, leftId];
  };

  const mergeClubs = (leftId, rightId) => {
    if (leftId === rightId) return leftId;
    if (!canMerge(leftId, rightId)) return null;

    const [keepId, removeId] =
      preferredMergeId(leftId, rightId);

    const keep = clubs.get(keepId);
    const remove = clubs.get(removeId);

    if (!keep || !remove) return null;

    for (const alias of remove.aliases) {
      keep.aliases.add(alias);
    }

    if (!keep.displayName && remove.displayName) {
      keep.displayName = remove.displayName;
    }

    for (const [
      provider,
      providerId,
    ] of remove.providerRefs.entries()) {
      keep.providerRefs.set(provider, providerId);

      const key = providerTeamKey(
        provider,
        providerId,
      );

      if (key) {
        providerRefs.set(key, keepId);
      }
    }

    const removeMembers = clubMembers.get(removeId) ?? new Set();
    const keepMembers = clubMembers.get(keepId) ?? new Set();
    for (const assignmentKey of removeMembers) {
      const [indexText, side] = assignmentKey.split("|");
      const entry = providerFixtures[Number(indexText)];
      if (entry?.[`${side}ClubId`] === removeId) {
        entry[`${side}ClubId`] = keepId;
      }
      keepMembers.add(assignmentKey);
    }
    clubMembers.set(keepId, keepMembers);
    clubMembers.delete(removeId);

    clubs.delete(removeId);

    return keepId;
  };

  /*
   * Historic TFD fixture relationships are trusted
   * bootstrap evidence.
   *
   * IMPORTANT:
   * Reuse one identity for the same exact canonical
   * club name across the entire previous TFD.
   * Do not create one temporary club per fixture.
   */
  const entriesByFixtureSource = new Map();
  const historicNameIndex = new Map();

  const historicNameKey = (name) => {
    if (!name) return null;

    return [
      teamLevel(name),
      canonicalClub(name),
    ].join("|");
  };

  /*
   * Seed the name index from any persisted club
   * registry first.
   */
  for (const club of clubs.values()) {
    if (!club.displayName) continue;

    const key = historicNameKey(
      club.displayName,
    );

    if (key) {
      historicNameIndex.set(key, club.id);
    }

    for (const alias of club.aliases) {
      const aliasKey = historicNameKey(alias);

      if (aliasKey) {
        historicNameIndex.set(
          aliasKey,
          club.id,
        );
      }
    }
  }

  for (const entry of providerFixtures) {
    const providerId = String(
      entry.row.providerId ??
        entry.row.id ??
        "",
    );

    if (!providerId) continue;

    entriesByFixtureSource.set(
      `${entry.provider}|${providerId}`,
      entry,
    );
  }

  for (const previousMatch of previousMatches ?? []) {
    const linkedEntries = [];

    for (const source of previousMatch.sources ?? []) {
      const entry = entriesByFixtureSource.get(
        `${source.provider}|${source.providerId}`,
      );

      if (entry) {
        linkedEntries.push(entry);
      }
    }

    if (linkedEntries.length === 0) {
      continue;
    }

    for (const side of ["home", "away"]) {
      const previousName =
        previousMatch[`${side}Name`] ??
        linkedEntries[0].row[`${side}Name`];

      if (!previousName) continue;

      const key =
        historicNameKey(previousName);

      let historicClubId =
        previousMatch[`${side}ClubId`] ??
        null;

      if (
        historicClubId &&
        !clubs.has(historicClubId)
      ) {
        historicClubId = null;
      }

      if (
        !historicClubId &&
        key &&
        historicNameIndex.has(key)
      ) {
        historicClubId =
          historicNameIndex.get(key);
      }

      if (!historicClubId) {
        historicClubId =
          createClub(previousName);

        if (key) {
          historicNameIndex.set(
            key,
            historicClubId,
          );
        }
      }

      for (const entry of linkedEntries) {
        const entryName =
          entry.row[`${side}Name`];

        if (
          entryName &&
          teamLevel(entryName) ===
            teamLevel(previousName)
        ) {
          attach(
            entry,
            side,
            historicClubId,
          );

          const entryKey =
            historicNameKey(entryName);

          if (
            entryKey &&
            !historicNameIndex.has(entryKey)
          ) {
            historicNameIndex.set(
              entryKey,
              historicClubId,
            );
          }
        }
      }
    }
  }

  /*
   * Pass 1:
   * Restore permanent provider references.
   */
  for (const entry of providerFixtures) {
    for (const side of ["home", "away"]) {
      const id = providerResolvedId(entry, side);

      if (id) {
        attach(entry, side, id);
      }
    }
  }

  /*
   * Pass 2:
   * Bootstrap exact canonical names only.
   *
   * No substring matching.
   * No stripping City/United/Town/etc.
   * No fuzzy similarity.
   */
  const exactNameIndex = new Map();

  for (const club of clubs.values()) {
    if (!club.displayName) continue;

    const key = [
      teamLevel(club.displayName),
      canonicalClub(club.displayName),
    ].join("|");

    exactNameIndex.set(key, club.id);
  }

  for (const entry of providerFixtures) {
    for (const side of ["home", "away"]) {
      if (entry[`${side}ClubId`]) continue;

      const name = entry.row[`${side}Name`];
      if (!name) continue;

      /*
       * A provider ID learned earlier in this pass is
       * stronger evidence than a canonical-name candidate.
       */
      const providerClubId =
        providerResolvedId(entry, side);

      if (
        providerClubId &&
        attach(entry, side, providerClubId)
      ) {
        continue;
      }

      const key = [
        teamLevel(name),
        canonicalClub(name),
      ].join("|");

      let clubId = exactNameIndex.get(key);

      if (clubId) {
        const club = clubs.get(clubId);

        if (
          !club?.displayName ||
          !safeExactName(club.displayName, name)
        ) {
          clubId = null;
        }
      }

      /*
       * Exact/canonical naming is only a candidate.
       * The provider-ID safety rules in attach() are
       * authoritative.
       *
       * Example class:
       *   Liverpool FC != AFC Liverpool
       *   AFC Bournemouth != Bournemouth FC
       *
       * No club names are hardcoded here.
       */
      if (
        clubId &&
        attach(entry, side, clubId)
      ) {
        continue;
      }

      /*
       * The canonical candidate was absent or unsafe.
       * Preserve this provider team as a distinct TFD
       * identity rather than leaving the fixture unresolved.
       */
      const distinctClubId = createClub(name);

      if (
        !attach(entry, side, distinctClubId)
      ) {
        throw new Error(
          `Unable to assign TFD club identity: ` +
          `${entry.provider} | ${name}`
        );
      }

      /*
       * Do not overwrite an existing canonical-name index
       * after a collision. Future rows with the same
       * provider ID resolve through providerResolvedId().
       */
      if (!exactNameIndex.has(key)) {
        exactNameIndex.set(
          key,
          distinctClubId,
        );
      }
    }
  }

  /*
   * Pass 3:
   * Cross-provider fixture evidence.
   *
   * If two providers describe a fixture on the same
   * competition + season + date and ONE side is already
   * the same permanent TFD club, the opposite identities
   * may be merged.
   *
   * Different provider IDs from the SAME provider block
   * the merge.
   */
  const scoped = new Map();

  for (const entry of providerFixtures) {
    const key = fixtureScopeKey(entry.row);
    const entries = scoped.get(key) ?? [];
    entries.push(entry);
    scoped.set(key, entries);
  }

  let changed = true;
  let passes = 0;

  while (changed && passes < 12) {
    changed = false;
    passes += 1;

    for (const entries of scoped.values()) {
      for (let i = 0; i < entries.length; i += 1) {
        for (
          let j = i + 1;
          j < entries.length;
          j += 1
        ) {
          const left = entries[i];
          const right = entries[j];

          if (left.provider === right.provider) {
            continue;
          }

          const sameHome =
            left.homeClubId &&
            right.homeClubId &&
            left.homeClubId === right.homeClubId;

          const sameAway =
            left.awayClubId &&
            right.awayClubId &&
            left.awayClubId === right.awayClubId;

          if (
            sameHome &&
            left.awayClubId &&
            right.awayClubId &&
            left.awayClubId !== right.awayClubId
          ) {
            const merged = mergeClubs(
              left.awayClubId,
              right.awayClubId,
            );

            if (merged) changed = true;
          }

          if (
            sameAway &&
            left.homeClubId &&
            right.homeClubId &&
            left.homeClubId !== right.homeClubId
          ) {
            const merged = mergeClubs(
              left.homeClubId,
              right.homeClubId,
            );

            if (merged) changed = true;
          }
        }
      }
    }
  }

  /*
   * Pass 4:
   * Re-attach every provider reference to the final
   * surviving permanent club identity.
   */
  for (const entry of providerFixtures) {
    for (const side of ["home", "away"]) {
      const id = entry[`${side}ClubId`];

      if (id) {
        attach(entry, side, id);
      }
    }
  }

  /*
   * Remove identities that no final provider fixture uses.
   * These can be created temporarily while evidence is
   * being reconciled but must not enter permanent TFD.
   */
  const usedClubIds = new Set();

  for (const entry of providerFixtures) {
    if (entry.homeClubId) {
      usedClubIds.add(entry.homeClubId);
    }

    if (entry.awayClubId) {
      usedClubIds.add(entry.awayClubId);
    }
  }

  const output = {};

  for (const club of clubs.values()) {
    if (!usedClubIds.has(club.id)) {
      continue;
    }
    output[club.id] = {
      id: club.id,
      displayName: club.displayName,
      aliases: [...club.aliases].sort(),
      providerRefs: [
        ...club.providerRefs.entries(),
      ]
        .map(([provider, providerId]) => ({
          provider,
          providerId,
        }))
        .sort((a, b) =>
          `${a.provider}|${a.providerId}`.localeCompare(
            `${b.provider}|${b.providerId}`,
          ),
        ),
    };
  }

  return {
    clubs: output,
    providerFixtures,
  };
}
