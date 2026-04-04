import { Router, Request, Response } from "express";
import { searchArtists, ApiError } from "../services/ticketmaster";
import { upsertArtist, getAllArtistNames, searchArtistNamesByKeyword } from "../db/artists";
import { SpellCorrector, levenshteinDistance } from "../utils/spell-corrector";

const router = Router();

const spellCorrector = new SpellCorrector();

getAllArtistNames()
  .then((names) => {
    spellCorrector.addWords(names);
    console.log(`[SpellCorrector] Loaded ${spellCorrector.size} artist names from DB`);
  })
  .catch((err) => console.warn("[SpellCorrector] Failed to load from DB:", err));

router.get("/suggestions", async (req: Request, res: Response) => {
  const keyword = req.query.keyword as string | undefined;
  if (!keyword || keyword.trim().length < 2) {
    res.json({ suggestions: [] });
    return;
  }
  try {
    const raw = await searchArtistNamesByKeyword(keyword.trim());
    const input = keyword.trim();
    const suggestions = raw
      .map((name) => {
        if (name.toLowerCase().startsWith(input.toLowerCase())) {
          return { name, similarity: 1 };
        }
        const distance = levenshteinDistance(input, name);
        const maxLen = Math.max(input.length, name.length);
        const similarity = 1 - distance / maxLen;
        return { name, similarity };
      })
      .filter(({ similarity }) => similarity >= 0.7)
      .sort((a, b) => b.similarity - a.similarity || a.name.length - b.name.length)
      .map(({ name }) => name);
    res.json({ suggestions });
  } catch {
    res.json({ suggestions: [] });
  }
});

router.get("/", async (req: Request, res: Response) => {
  const keyword = req.query.keyword as string | undefined;

  if (!keyword || keyword.trim().length < 2) {
    res.status(400).json({
      error: "keyword query parameter is required (minimum 2 characters)",
    });
    return;
  }

  try {
    const { corrected, wasCorrected } = spellCorrector.correct(keyword.trim());
    const artists = await searchArtists(corrected);

    await Promise.all(
      artists.map(async (artist) => {
        await upsertArtist(artist);
        spellCorrector.addWord(artist.name);
      })
    );
    res.json({ artists, correctedKeyword: wasCorrected ? corrected : undefined });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("Artist search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
