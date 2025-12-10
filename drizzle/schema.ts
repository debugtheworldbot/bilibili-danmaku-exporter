import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Danmaku export history table (optional, for analytics)
 * Tracks video exports for statistics and optimization
 */
export const exportHistory = mysqlTable("exportHistory", {
  id: int("id").autoincrement().primaryKey(),
  videoId: varchar("videoId", { length: 32 }).notNull(), // BV or AV number
  videoTitle: text("videoTitle"),
  danmakuCount: int("danmakuCount").default(0).notNull(),
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
});

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;
