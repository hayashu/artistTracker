import express from "express";
import cors from "cors";
import { config } from "./config";
import artistsRouter from "./routes/artists";
import eventsRouter from "./routes/events";
import timezoneRouter from "./routes/timezone";
import session from "express-session";                                                                                                               
import {RedisStore} from "connect-redis";
import { redis } from "./utils/redis-client"; 

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        config.allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ["GET"],
  })
);
app.use(session({                                                                                                                                    
  store: new RedisStore({ client: redis }),
  secret: config.sessionSecret,                                                                                                                      
  resave: false,               
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 },
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/ipTest", (req,res)=>{
  res.json(req.ip);
})

app.use("/api/artists", artistsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/timezone", timezoneRouter);

app.listen(config.port, '0.0.0.0',() => {
  console.log(`Backend server running on http://localhost:${config.port}`);
});
