import prisma from "../lib/prisma";
import type { NormalizedVenue } from "../types/ticketmaster";

export async function upsertVenue(id: string, venue: NormalizedVenue): Promise<void> {
  await prisma.venue.upsert({
    where: { id },
    update: {
      name: venue.name,
      city: venue.city,
      state: venue.state,
      country: venue.country,
      address: venue.address,
      lat: venue.location?.lat ?? null,
      lng: venue.location?.lng ?? null,
    },
    create: {
      id,
      name: venue.name,
      city: venue.city,
      state: venue.state,
      country: venue.country,
      address: venue.address,
      lat: venue.location?.lat ?? null,
      lng: venue.location?.lng ?? null,
    },
  });
}
