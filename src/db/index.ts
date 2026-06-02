import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL || "file:app.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url: dbUrl,
  ...(authToken ? { authToken } : {}),
});

export const db = drizzle(client, { schema });

export async function initDatabase() {
  await client.execute("PRAGMA journal_mode = WAL");

  // Migration: Add new columns to reels table if they don't exist
  try {
    await client.execute(`ALTER TABLE reels ADD COLUMN music TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    await client.execute(`ALTER TABLE reels ADD COLUMN hashtags TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    await client.execute(`ALTER TABLE reels ADD COLUMN likes_count INTEGER NOT NULL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    await client.execute(`ALTER TABLE reels ADD COLUMN comments_count INTEGER NOT NULL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    await client.execute(`ALTER TABLE reels ADD COLUMN shares_count INTEGER NOT NULL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'User',
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      age INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      music TEXT,
      hashtags TEXT,
      views INTEGER NOT NULL DEFAULT 0,
      likes_count INTEGER NOT NULL DEFAULT 0,
      comments_count INTEGER NOT NULL DEFAULT 0,
      shares_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reel_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, reel_id)
    );

    CREATE TABLE IF NOT EXISTS reel_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(follower_id, following_id)
    );

    CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_reel ON likes(reel_id);
    CREATE INDEX IF NOT EXISTS idx_reel_comments_reel ON reel_comments(reel_id);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
  `);

  const existing = await client.execute(
    "SELECT COUNT(*) as c FROM reels",
  );
  const count = Number((existing.rows[0] as any).c);
  if (count === 0) {
    const demoUsers = await client.execute(`
      INSERT INTO users (name, email, password, active, created_at) VALUES
        ('Alex Rivers', 'alex@demo.com', 'demo', 1, datetime('now')),
        ('Luna Park', 'luna@demo.com', 'demo', 1, datetime('now')),
        ('Kai Nova', 'kai@demo.com', 'demo', 1, datetime('now'))
      ON CONFLICT(email) DO NOTHING
    `);
    const userRows = await client.execute("SELECT id FROM users ORDER BY id LIMIT 3");
    if (userRows.rows.length >= 3) {
      const u1 = (userRows.rows[0] as any).id;
      const u2 = (userRows.rows[1] as any).id;
      const u3 = (userRows.rows[2] as any).id;
      await client.execute({
        sql: `INSERT INTO reels (user_id, title, description, video_url, thumbnail_url, music, hashtags, views, likes_count, comments_count, shares_count, created_at) VALUES
          (?, 'Sunset vibes', 'Golden hour magic', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '', 'Chill Wave', '#sunset #nature', 1234, 89, 12, 5, datetime('now')),
          (?, 'City lights', 'Night in the city', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', '', 'Lo-fi Beats', '#city #night', 5678, 234, 45, 18, datetime('now')),
          (?, 'Ocean waves', 'Peaceful sounds', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', '', 'Ocean Mix', '#ocean #relax', 3421, 156, 23, 9, datetime('now')),
          (?, 'Mountain peak', 'Top of the world', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', '', 'Epic Anthem', '#mountain #adventure', 8921, 567, 89, 34, datetime('now')),
          (?, 'Street dance', 'Freestyle session', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', '', 'Hip Hop Beat', '#dance #street', 15432, 1023, 156, 78, datetime('now')),
          (?, 'Coffee time', 'Morning ritual', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '', 'Jazz Cafe', '#coffee #morning', 2341, 145, 34, 12, datetime('now'))`,
        args: [u1, u2, u3, u1, u2, u3],
      });
      console.log("Seeded demo reels");
    }
  }

  console.log("Database tables initialized");
}

export { client };
export type DB = typeof db;
