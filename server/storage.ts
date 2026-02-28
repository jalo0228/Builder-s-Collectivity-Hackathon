import { db } from "./db";
import { profiles, type Profile, type InsertProfile } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getProfiles(): Promise<Profile[]>;
  searchProfiles(queryEmbedding: number[]): Promise<Profile[]>;
  createProfile(profile: InsertProfile, embedding: number[]): Promise<Profile>;
}

export class DatabaseStorage implements IStorage {
  async getProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles);
  }

  async searchProfiles(queryEmbedding: number[]): Promise<Profile[]> {
    const allProfiles = await db.select().from(profiles);

    // Compute cosine similarity
    const dotProduct = (a: number[], b: number[]) =>
      a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitude = (a: number[]) =>
      Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const cosineSimilarity = (a: number[], b: number[]) => {
      const magA = magnitude(a);
      const magB = magnitude(b);
      if (magA === 0 || magB === 0) return 0;
      return dotProduct(a, b) / (magA * magB);
    };

    const scored = allProfiles.map((p) => {
      let score = 0;
      if (p.embedding && p.embedding.length === queryEmbedding.length) {
        score = cosineSimilarity(p.embedding, queryEmbedding);
      }
      return { profile: p, score };
    });

    // Sort by descending score
    scored.sort((a, b) => b.score - a.score);

    // Return reasonable matches (or just top results)
    return scored
      .filter((s) => s.score > 0.6)
      .map((s) => s.profile)
      .slice(0, 10);
  }

  async createProfile(
    profile: InsertProfile,
    embedding: number[],
  ): Promise<Profile> {
    const [created] = await db
      .insert(profiles)
      .values({
        ...profile,
        embedding,
      })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
