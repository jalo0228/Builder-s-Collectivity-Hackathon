import { pgTable, text, serial, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  lat: text("lat"),
  lng: text("lng"),
  embedding: json("embedding").$type<number[]>(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ 
  id: true,
  embedding: true 
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

export type CreateProfileRequest = InsertProfile;
