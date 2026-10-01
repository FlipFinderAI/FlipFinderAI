import type { ClubOption } from "./clubCatalog";
import { currentTicketUri } from "./ticketFiles";
import { clubNamesMatch, normaliseFixtureText } from "./ticketText";
import type { SeasonTicket } from "./ticketTypes";
import type { SeasonTicketProfile } from "./seasonTicketProfiles";

export function ticketCollectionClubName(
  tickets: SeasonTicket[],
  seasonTicketProfiles: SeasonTicketProfile[],
) {
  const counts = new Map<string, { name: string; count: number }>();
  const add = (value: string | null | undefined, weight = 1) => {
    const name = value?.trim();
    if (!name) return;
    const key = normaliseFixtureText(name);
    const current = counts.get(key);
    counts.set(key, {
      name: current?.name ?? name,
      count: (current?.count ?? 0) + weight,
    });
  };

  for (const profile of seasonTicketProfiles) add(profile.club, 10);
  for (const ticket of tickets) {
    if (ticket.clubName) add(ticket.clubName, 5);
    else {
      add(ticket.homeTeam);
      add(ticket.awayTeam);
    }
  }

  return (
    [...counts.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    )[0]?.name ?? null
  );
}

export function ticketClubOption({
  ticket,
  collectionClubName,
  seasonTicketProfiles,
  clubs,
  favouriteClub,
}: {
  ticket?: SeasonTicket;
  collectionClubName: string | null;
  seasonTicketProfiles: SeasonTicketProfile[];
  clubs: ClubOption[];
  favouriteClub: ClubOption;
}): ClubOption {
  const ticketUri = currentTicketUri(ticket?.uri);
  const exactProfile =
    ticket?.ticketType === "Season Ticket"
      ? seasonTicketProfiles.find(
          (profile) =>
            ticketUri &&
            currentTicketUri(profile.imageUri ?? undefined) === ticketUri,
        )
      : undefined;
  const name =
    ticket?.clubName?.trim() ||
    exactProfile?.club.trim() ||
    collectionClubName ||
    favouriteClub.name;

  return clubs.find((club) => clubNamesMatch(club.name, name)) ?? {
    ...favouriteClub,
    id: `ticket-club-${normaliseFixtureText(name)}`,
    name,
  };
}
