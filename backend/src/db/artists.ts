import prisma from "../lib/prisma";
import type { ArtistSearchResult } from "../types/ticketmaster";

export async function searchArtistNamesByKeyword(keyword: string): Promise<string[]> {
  const artists = await prisma.artist.findMany({
    where: { name: { contains: keyword, mode: "insensitive" } },
    select: { name: true },
    take: 7,
  });
  return artists.map((a) => a.name);
}

export async function getAllArtistNames(): Promise<string[]> {
  const artists = await prisma.artist.findMany({ select: { name: true } });
  return artists.map((a) => a.name);
}

export async function upsertArtist(artist: ArtistSearchResult): Promise<void> {
  await prisma.artist.upsert({
    where: { id: artist.id },
    update: {
      name: artist.name,
      url: artist.url,
      imageUrl: artist.imageUrl,
      genre: artist.genre,
      subGenre: artist.subGenre,
    },
    create: {
      id: artist.id,
      name: artist.name,
      url: artist.url,
      imageUrl: artist.imageUrl,
      genre: artist.genre,
      subGenre: artist.subGenre,
    },
  });
}
