import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import { createServer } from "http";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { Server } from "socket.io";

const PORT = Number(process.env.PORT || 3001);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");
const databasePath = resolve(process.env.DATABASE_PATH || "./data/nexus.db");
mkdirSync(dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, board TEXT NOT NULL, idea TEXT NOT NULL DEFAULT '', data_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, action TEXT NOT NULL, details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions (code TEXT PRIMARY KEY, host_user_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  createdAt: u.created_at,
});
const tokenFor = (u) =>
  jwt.sign({ sub: u.id, name: u.name, email: u.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
const auth = (req, res, next) => {
  const token =
    req.cookies.nexus_session ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
      .get(payload.sub);
    if (!user) throw new Error("missing user");
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Authentication required" });
  }
};
const serialize = (p) => ({
  id: p.id,
  name: p.name,
  board: p.board,
  idea: p.idea,
  data: JSON.parse(p.data_json),
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});
const normalize = (body = {}) => ({
  name: String(body.name || body.project_name || "").trim(),
  board: String(body.board || "ESP32"),
  idea: String(body.idea || ""),
  data: body.data || body,
});
const ownedProject = (req) =>
  db
    .prepare("SELECT * FROM projects WHERE id = ? AND owner_id = ?")
    .get(req.params.id, req.user.id);
const history = (userId, projectId, action, details) =>
  db
    .prepare(
      "INSERT INTO history (user_id, project_id, action, details_json) VALUES (?, ?, ?, ?)",
    )
    .run(userId, projectId || null, action, JSON.stringify(details || {}));

app.get("/health", (_req, res) =>
  res.json({ ok: true, sessions: sessions.size }),
);
app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6)
    return res.status(400).json({
      error: "Enter a valid name, email, and password of at least 6 characters",
    });
  try {
    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      )
      .run(name, email, await bcrypt.hash(password, 12));
    const user = db
      .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
      .get(result.lastInsertRowid);
    res.cookie("nexus_session", tokenFor(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    res
      .status(error.code === "SQLITE_CONSTRAINT_UNIQUE" ? 409 : 500)
      .json({ error: "Unable to create account with those details" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(
    String(req.body.email || "")
      .trim()
      .toLowerCase(),
  );
  if (
    !user ||
    !(await bcrypt.compare(String(req.body.password || ""), user.password_hash))
  )
    return res.status(401).json({ error: "Invalid email or password" });
  res.cookie("nexus_session", tokenFor(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: publicUser(user) });
});
app.get("/api/auth/me", auth, (req, res) =>
  res.json({ user: publicUser(req.user) }),
);
app.post("/api/auth/logout", auth, (_req, res) => {
  res.clearCookie("nexus_session");
  res.status(204).end();
});

app.get("/api/projects", auth, (req, res) =>
  res.json({
    projects: db
      .prepare(
        "SELECT * FROM projects WHERE owner_id = ? ORDER BY updated_at DESC",
      )
      .all(req.user.id)
      .map(serialize),
  }),
);
app.post("/api/projects", auth, (req, res) => {
  const p = normalize(req.body);
  if (!p.name)
    return res.status(400).json({ error: "Project name is required" });
  const result = db
    .prepare(
      "INSERT INTO projects (owner_id, name, board, idea, data_json) VALUES (?, ?, ?, ?, ?)",
    )
    .run(req.user.id, p.name, p.board, p.idea, JSON.stringify(p.data));
  history(req.user.id, result.lastInsertRowid, "project.created", {
    name: p.name,
  });
  res.status(201).json({
    project: serialize(
      db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(result.lastInsertRowid),
    ),
  });
});
app.get("/api/projects/:id", auth, (req, res) => {
  const p = ownedProject(req);
  p
    ? res.json({ project: serialize(p) })
    : res.status(404).json({ error: "Project not found" });
});
app.put("/api/projects/:id", auth, (req, res) => {
  const existing = ownedProject(req);
  if (!existing) return res.status(404).json({ error: "Project not found" });
  const p = normalize({ ...serialize(existing), ...req.body });
  db.prepare(
    "UPDATE projects SET name = ?, board = ?, idea = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).run(p.name, p.board, p.idea, JSON.stringify(p.data), existing.id);
  history(req.user.id, existing.id, "project.updated", { name: p.name });
  res.json({
    project: serialize(
      db.prepare("SELECT * FROM projects WHERE id = ?").get(existing.id),
    ),
  });
});
app.delete("/api/projects/:id", auth, (req, res) => {
  const p = ownedProject(req);
  if (!p) return res.status(404).json({ error: "Project not found" });
  db.prepare("DELETE FROM projects WHERE id = ?").run(p.id);
  history(req.user.id, null, "project.deleted", { name: p.name });
  res.status(204).end();
});
app.get("/api/history", auth, (req, res) =>
  res.json({
    history: db
      .prepare(
        "SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
      )
      .all(req.user.id),
  }),
);

app.post("/api/ai/chat", auth, async (req, res) => {
  if (!process.env.GROQ_API_KEY)
    return res.status(503).json({ error: "AI service is not configured" });
  const messages = Array.isArray(req.body.messages)
    ? req.body.messages.slice(-20)
    : [];
  if (!messages.length)
    return res.status(400).json({ error: "A conversation is required" });
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          max_tokens: Math.min(
            Math.max(Number(req.body.maxTokens) || 1000, 512),
            1500,
          ),
          temperature: 0.65,
          messages,
          ...(req.body.responseFormat
            ? { response_format: req.body.responseFormat }
            : {}),
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 || response.status === 403)
        return res.status(503).json({
          error:
            "Groq API key is invalid or revoked. Update GROQ_API_KEY in .env and restart the server.",
        });
      if (response.status === 429)
        return res.status(429).json({
          error: "Groq rate limit reached. Please try again shortly.",
        });
      if (response.status === 404)
        return res.status(503).json({
          error:
            "The configured Groq model is unavailable. Update GROQ_MODEL in .env or remove it to use the default model.",
        });
      return res
        .status(502)
        .json({ error: "Groq AI service is temporarily unavailable" });
    }
    res.json({
      reply:
        data.choices?.[0]?.message?.content || "No response was generated.",
    });
  } catch {
    res.status(502).json({ error: "Could not connect to the Groq AI service" });
  }
});

const sessions = new Map();
const colors = [
  "#2563eb",
  "#0891b2",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#db2777",
];
const getSession = (code) => {
  if (!sessions.has(code))
    sessions.set(code, {
      code,
      host: null,
      users: new Map(),
      chat: [],
      project: null,
      simState: {},
    });
  return sessions.get(code);
};
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
  transports: ["websocket", "polling"],
});
io.use((socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie?.match(
      /(?:^|;\s*)nexus_session=([^;]+)/,
    )?.[1];
    socket.user = jwt.verify(
      cookie || socket.handshake.auth?.token,
      JWT_SECRET,
    );
    next();
  } catch {
    next(new Error("Authentication required"));
  }
});
io.on("connection", (socket) => {
  let current;
  let user;
  socket.on("session:join", ({ code, userName }) => {
    const normalized = String(code || "")
      .trim()
      .toUpperCase()
      .slice(0, 12);
    if (!normalized) return;
    current = getSession(normalized);
    user = {
      id: socket.user.sub,
      name: userName || socket.user.name,
      color: colors[current.users.size % colors.length],
      avatar: (userName || socket.user.name).slice(0, 2).toUpperCase(),
      status: "online",
    };
    if (!current.host) current.host = socket.id;
    current.users.set(socket.id, user);
    socket.join(normalized);
    socket.emit("session:joined", {
      code: normalized,
      user,
      isHost: current.host === socket.id,
      users: [...current.users.values()],
      chatHistory: current.chat.slice(-50),
      project: current.project,
      simState: current.simState,
    });
    socket.to(normalized).emit("session:user-joined", {
      user,
      users: [...current.users.values()],
    });
  });
  socket.on("chat:message", ({ text }) => {
    if (!current || !user || !String(text || "").trim()) return;
    const message = {
      id: `${Date.now()}-${socket.id}`,
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      text: String(text).trim().slice(0, 2000),
      ts: Date.now(),
    };
    current.chat = [...current.chat, message].slice(-200);
    io.to(current.code).emit("chat:message", message);
  });
  socket.on("chat:ai-response", (message) => {
    if (!current || !message?.text) return;
    current.chat = [...current.chat, message].slice(-200);
    socket.to(current.code).emit("chat:ai-response", message);
  });
  socket.on("project:update", (project) => {
    if (current) {
      current.project = project;
      socket
        .to(current.code)
        .emit("project:update", { project, updatedBy: user });
    }
  });
  socket.on("sim:update", (simState) => {
    if (current) {
      current.simState = simState;
      socket.to(current.code).emit("sim:update", { simState, updatedBy: user });
    }
  });
  socket.on("sim:sensor-tick", (data) => {
    if (current) io.to(current.code).emit("sim:sensor-tick", data);
  });
  socket.on("disconnect", () => {
    if (!current) return;
    current.users.delete(socket.id);
    if (current.host === socket.id)
      current.host = [...current.users.keys()][0] || null;
    io.to(current.code).emit("session:user-left", {
      userId: socket.id,
      users: [...current.users.values()],
    });
    if (!current.users.size) sessions.delete(current.code);
  });
});
httpServer.listen(PORT, "0.0.0.0", () =>
  console.log(`Nexus-IoT API and collaboration server listening on ${PORT}`),
);
