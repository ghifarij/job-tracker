import express from "express";

// Vercel finds this file (src/app.ts) and serves the default export as one
// serverless function. Local development starts it from src/dev.ts instead.
const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
