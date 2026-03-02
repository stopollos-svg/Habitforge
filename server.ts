import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("habitforge.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT DEFAULT 'User',
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    forge_points INTEGER DEFAULT 0,
    streak_shields INTEGER DEFAULT 0,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    frequency TEXT DEFAULT 'daily',
    streak INTEGER DEFAULT 0,
    shield_active INTEGER DEFAULT 0,
    last_completed TEXT,
    lifespan_days INTEGER DEFAULT 30,
    expiry_date TEXT,
    reminder_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    reward_xp INTEGER,
    reward_fp INTEGER,
    completed INTEGER DEFAULT 0,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS guilds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    member_count INTEGER DEFAULT 0,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS guild_members (
    guild_id INTEGER,
    user_id INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guild_id, user_id),
    FOREIGN KEY(guild_id) REFERENCES guilds(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER,
    date TEXT,
    FOREIGN KEY(habit_id) REFERENCES habits(id)
  );
`);

// Seed initial user if not exists
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, level, xp, forge_points) VALUES (?, ?, ?, ?)").run("Stephen", 1, 0, 100);
}

// Seed initial guilds if not exists
const guildCount = db.prepare("SELECT COUNT(*) as count FROM guilds").get() as { count: number };
if (guildCount.count === 0) {
  const initialGuilds = [
    { name: "Iron Forgers", description: "For those who never break a streak.", icon: "⚔️" },
    { name: "Zen Gardeners", description: "Focus on mindfulness and peace.", icon: "🌿" },
    { name: "Code Warriors", description: "Habits for peak performance in tech.", icon: "💻" }
  ];
  initialGuilds.forEach(g => {
    db.prepare("INSERT INTO guilds (name, description, icon) VALUES (?, ?, ?)").run(g.name, g.description, g.icon);
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.get("/api/guilds", (req, res) => {
    const guilds = db.prepare("SELECT * FROM guilds").all();
    res.json(guilds);
  });

  app.get("/api/user/guild", (req, res) => {
    const user = db.prepare("SELECT id FROM users LIMIT 1").get() as any;
    const guild = db.prepare(`
      SELECT g.* FROM guilds g
      JOIN guild_members gm ON g.id = gm.guild_id
      WHERE gm.user_id = ?
    `).get(user.id);
    res.json(guild || null);
  });

  app.post("/api/guilds/:id/join", (req, res) => {
    const { id } = req.params;
    const user = db.prepare("SELECT id FROM users LIMIT 1").get() as any;
    
    try {
      const transaction = db.transaction(() => {
        // Remove from current guild first (simple 1-guild limit for now)
        db.prepare("DELETE FROM guild_members WHERE user_id = ?").run(user.id);
        // Join new guild
        db.prepare("INSERT INTO guild_members (guild_id, user_id) VALUES (?, ?)").run(id, user.id);
        // Update member counts
        db.prepare("UPDATE guilds SET member_count = (SELECT COUNT(*) FROM guild_members WHERE guild_id = id)").run();
      });
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to join guild" });
    }
  });

  app.get("/api/leaderboard", (req, res) => {
    const leaderboard = db.prepare("SELECT username, forge_points, level FROM users ORDER BY forge_points DESC LIMIT 10").all();
    res.json(leaderboard);
  });

  app.get("/api/user", (req, res) => {
    const user = db.prepare("SELECT * FROM users LIMIT 1").get();
    res.json(user);
  });

  app.get("/api/quests", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    let quests = db.prepare("SELECT * FROM quests WHERE date = ?").all(today);
    
    if (quests.length === 0) {
      // Generate daily quests
      const dailyQuests = [
        { title: "The Morning Forge", description: "Complete 1 habit before 10 AM", xp: 50, fp: 20 },
        { title: "Consistency King", description: "Complete 3 habits today", xp: 100, fp: 50 },
        { title: "Social Butterfly", description: "Check the Global Guild leaderboard", xp: 20, fp: 10 }
      ];
      
      dailyQuests.forEach(q => {
        db.prepare("INSERT INTO quests (title, description, reward_xp, reward_fp, date) VALUES (?, ?, ?, ?, ?)").run(q.title, q.description, q.xp, q.fp, today);
      });
      quests = db.prepare("SELECT * FROM quests WHERE date = ?").all(today);
    }
    res.json(quests);
  });

  app.post("/api/quests/:id/complete", (req, res) => {
    const { id } = req.params;
    const quest = db.prepare("SELECT * FROM quests WHERE id = ?").get(id) as any;
    if (quest && !quest.completed) {
      db.prepare("UPDATE quests SET completed = 1 WHERE id = ?").run(id);
      db.prepare("UPDATE users SET xp = xp + ?, forge_points = forge_points + ?").run(quest.reward_xp, quest.reward_fp);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Quest already completed or not found" });
    }
  });

  app.post("/api/users/buy-shield", (req, res) => {
    const user = db.prepare("SELECT * FROM users LIMIT 1").get() as any;
    if (user.forge_points >= 50) {
      db.prepare("UPDATE users SET forge_points = forge_points - 50, streak_shields = streak_shields + 1").run();
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Not enough Forge Points" });
    }
  });

  app.post("/api/habits/:id/shield", (req, res) => {
    const { id } = req.params;
    const user = db.prepare("SELECT * FROM users LIMIT 1").get() as any;
    if (user.streak_shields > 0) {
      db.prepare("UPDATE habits SET shield_active = 1 WHERE id = ?").run(id);
      db.prepare("UPDATE users SET streak_shields = streak_shields - 1").run();
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "No shields available" });
    }
  });

  app.get("/api/habits", (req, res) => {
    const habits = db.prepare("SELECT * FROM habits").all();
    res.json(habits);
  });

  app.post("/api/habits", (req, res) => {
    const { name, category, frequency, lifespan_days, reminder_time } = req.body;
    const days = lifespan_days || 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    const expiry_date = expiry.toISOString();
    
    const result = db.prepare("INSERT INTO habits (name, category, frequency, lifespan_days, expiry_date, reminder_time) VALUES (?, ?, ?, ?, ?, ?)").run(name, category, frequency, days, expiry_date, reminder_time);
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/habits/:id/complete", (req, res) => {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already completed today
    const existing = db.prepare("SELECT * FROM completions WHERE habit_id = ? AND date = ?").get(id, today);
    if (existing) {
      return res.status(400).json({ error: "Already completed today" });
    }

    db.prepare("INSERT INTO completions (habit_id, date) VALUES (?, ?)").run(id, today);
    
    // Update streak and XP
    db.prepare("UPDATE habits SET streak = streak + 1, last_completed = ? WHERE id = ?").run(today, id);
    db.prepare("UPDATE users SET xp = xp + 10, forge_points = forge_points + 5").run();
    
    // Level up logic (simple)
    const user = db.prepare("SELECT * FROM users LIMIT 1").get() as any;
    if (user.xp >= user.level * 100) {
      db.prepare("UPDATE users SET level = level + 1, xp = 0").run();
    }

    res.json({ success: true });
  });

  app.get("/api/habits/:id/history", (req, res) => {
    const { id } = req.params;
    const history = db.prepare("SELECT date FROM completions WHERE habit_id = ? ORDER BY date ASC").all(id);
    res.json(history);
  });

  app.post("/api/habits/:id/lifespan", (req, res) => {
    const { id } = req.params;
    const { lifespan_days } = req.body;
    
    // Get original created_at to recalculate expiry
    const habit = db.prepare("SELECT created_at FROM habits WHERE id = ?").get(id);
    if (!habit) return res.status(404).json({ error: "Habit not found" });
    
    const createdAt = new Date(habit.created_at);
    const expiry = new Date(createdAt);
    expiry.setDate(expiry.getDate() + parseInt(lifespan_days));
    const expiry_date = expiry.toISOString();
    
    db.prepare("UPDATE habits SET lifespan_days = ?, expiry_date = ? WHERE id = ?").run(lifespan_days, expiry_date, id);
    res.json({ success: true, expiry_date });
  });

  app.post("/api/habits/:id/reminder", (req, res) => {
    const { id } = req.params;
    const { reminder_time } = req.body;
    db.prepare("UPDATE habits SET reminder_time = ? WHERE id = ?").run(reminder_time, id);
    res.json({ success: true });
  });

  app.post("/api/habits/:id/update", (req, res) => {
    const { id } = req.params;
    const { name, category, lifespan_days, reminder_time } = req.body;
    
    const habit = db.prepare("SELECT created_at FROM habits WHERE id = ?").get(id) as any;
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    let expiry_date = null;
    if (lifespan_days) {
      const createdAt = new Date(habit.created_at);
      const expiry = new Date(createdAt);
      expiry.setDate(expiry.getDate() + parseInt(lifespan_days));
      expiry_date = expiry.toISOString();
    }

    const updates = [];
    const params = [];
    if (name) { updates.push("name = ?"); params.push(name); }
    if (category) { updates.push("category = ?"); params.push(category); }
    if (lifespan_days) { 
      updates.push("lifespan_days = ?"); params.push(lifespan_days);
      updates.push("expiry_date = ?"); params.push(expiry_date);
    }
    if (reminder_time !== undefined) { updates.push("reminder_time = ?"); params.push(reminder_time); }

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE habits SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }

    res.json({ success: true });
  });

  app.delete("/api/habits/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM habits WHERE id = ?").run(id);
    db.prepare("DELETE FROM completions WHERE habit_id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
