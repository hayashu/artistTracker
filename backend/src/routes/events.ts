import { Router, Request, Response } from "express";
import { getEventsByArtist, ApiError } from "../services/ticketmaster";
import { upsertVenue } from "../db/venues";
import { upsertEvent } from "../db/events";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const attractionId = req.query.attractionId as string | undefined;

  if (!attractionId) {
    res.status(400).json({ error: "attractionId query parameter is required" });
    return;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(attractionId)) {
    res.status(400).json({ error: "Invalid attractionId format" });
    return;
  }

  try {
    const events = await getEventsByArtist(attractionId);

    await Promise.all(                          
      events.map(async (event) => {                                                                                                                      
        if (event.venue.id) await upsertVenue(event.venue.id, event.venue);
        await upsertEvent(event);                                                                                                                        
      })                                                                                                                                                 
    );                 
    const mappable = events.filter((e) => e.venue.location !== null).length;
    res.json({ events, total: events.length, mappable });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("Event fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
