import { pgTable, text, serial, integer, boolean, timestamp, json, pgVector } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Document table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  status: text("status").notNull(),
  ocrProcessed: boolean("ocr_processed").notNull().default(false),
  aiAnalyzed: boolean("ai_analyzed").notNull().default(false),
  content: text("content"),
  url: text("url"),
  thumbnailUrl: text("thumbnail_url"),
  driveId: text("drive_id"),
  embedding: pgVector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Analysis table
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Activity table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  documentId: integer("document_id").references(() => documents.id),
  documentName: text("document_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Service connection table
export const serviceConnections = pgTable("service_connections", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// API keys table
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  service: text("service").notNull().unique(),
  key: text("key").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Service tokens table
export const serviceTokens = pgTable("service_tokens", {
  id: serial("id").primaryKey(),
  service: text("service").notNull().unique(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  type: true,
  size: true,
  status: true,
  ocrProcessed: true,
  aiAnalyzed: true,
  content: true,
  url: true,
  thumbnailUrl: true,
  driveId: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  documentId: true,
  title: true,
  content: true,
  model: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  documentId: true,
  documentName: true,
});

export const insertServiceConnectionSchema = createInsertSchema(serviceConnections).pick({
  type: true,
  name: true,
  status: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type ServiceConnection = typeof serviceConnections.$inferSelect;
export type InsertServiceConnection = z.infer<typeof insertServiceConnectionSchema>;

// Additional type for stats
export interface Stats {
  documentsProcessed: number;
  ocrScans: number;
  aiAnalyses: number;
  storageUsed: number;
  storageLimit: number;
}
