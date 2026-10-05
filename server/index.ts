import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { createServer as createViteServer } from "vite";
import { pool, query } from "./db.ts";
import apiRouter from "./routes/api.ts";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware.ts";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, "..");
const app = express();
const httpServer = createHttpServer(app);
const port = Number(process.env.PORT ?? 5000);

if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
  throw new Error("Clerk is not configured. Configure authentication before starting the app.");
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// This must precede body parsing so Clerk proxy requests remain byte-for-byte intact.
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "8kb" }));

app.get("/api/health", async (_req, res) => {
  await query("SELECT 1");
  res.json({ ok: true, service: "codiva-api" });
});

app.use(
  "/api",
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
  apiRouter,
);

let vite;
if (process.env.NODE_ENV === "production") {
  const distDir = path.join(projectRoot, "dist");
  app.use(express.static(distDir, { index: false, maxAge: "1h" }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  vite = await createViteServer({
    configFile: path.join(projectRoot, "vite.config.js"),
    server: {
      middlewareMode: true,
      ws: { server: httpServer },
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.use((error, _req, res, _next) => {
  console.error("Request failed:", error?.message ?? "Unknown error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Não foi possível concluir essa solicitação. Tente novamente." });
});

const shutdown = async () => {
  httpServer.close(() => {});
  await vite?.close();
  await pool.end();
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

httpServer.listen(port, "0.0.0.0", async () => {
  try {
    await query("SELECT 1");
    console.log(`Codiva server listening on port ${port}`);
  } catch (error) {
    console.error("PostgreSQL connection failed:", error?.message ?? "Unknown error");
    process.exitCode = 1;
    httpServer.close();
  }
});
