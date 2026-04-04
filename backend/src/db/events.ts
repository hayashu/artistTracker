import prisma from "../lib/prisma";
import type { NormalizedEvent } from "../types/ticketmaster";
import { EventStatus } from "../generated/prisma/enums";

function toEventStatus(status: string): EventStatus {
  // Ticketmaster APIは "cancelled"（l×2）を返すことがある
  const normalized = status === "cancelled" ? "canceled" : status;
  if (Object.values(EventStatus).includes(normalized as EventStatus)) {
    return normalized as EventStatus;
  }
  return EventStatus.unknown;
}

export async function upsertEvent(event: NormalizedEvent): Promise<void> {
  const eventStatus = toEventStatus(event.status);
  await prisma.event.upsert({
    where: { id: event.id},
    update: {
      venueId: event.venue?.id,
      artistId: event.artistId,
      name: event.name,
      url: event.url,
      imageUrl: event.imageUrl ?? "",
      date: event.date,
      time: event.time,
      dateTime: event.dateTime,
      dateTBD: event.dateTBD,
      timeTBA: event.timeTBA,
      status: eventStatus,
      priceCurrency: event.priceRange?.currency,
      priceMin: event.priceRange?.min,
      priceMax: event.priceRange?.max
    },
    create: {
      id: event.id,
      venueId: event.venue?.id,
      artistId: event.artistId,
      name: event.name,
      url: event.url,
      imageUrl: event.imageUrl ?? "",
      date: event.date,
      time: event.time,
      dateTime: event.dateTime,
      dateTBD: event.dateTBD,
      timeTBA: event.timeTBA,
      status: eventStatus,
      priceCurrency: event.priceRange?.currency,
      priceMin: event.priceRange?.min,
      priceMax: event.priceRange?.max
    }
  })
}
