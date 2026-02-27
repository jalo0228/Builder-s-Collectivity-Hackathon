import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Helper function to get embeddings using Gemini
async function getEmbedding(text: string): Promise<number[]> {
  const result = await model.embedContent(text);
  return result.embedding.values; 
}

// THIS IS THE PART THAT WAS MISSING - IT CONNECTS TO INDEX.TS
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Route to list all profiles
  app.get(api.profiles.list.path, async (req, res) => {
    const profiles = await storage.getProfiles();
    res.json(profiles);
  });

  // Route to search profiles using AI
  app.get(api.profiles.search.path, async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) {
        const profiles = await storage.getProfiles();
        return res.json(profiles);
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: "Gemini API key missing" });
      }

      const embedding = await getEmbedding(q);
      const profiles = await storage.searchProfiles(embedding);
      res.json(profiles);
    } catch (err) {
      console.error("Search error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Run the seed function automatically on startup
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getProfiles();

  if (existing.length === 0 && process.env.GEMINI_API_KEY) {
    console.log("Database empty. Seeding with Gemini...");

    const seedProfiles = [
      {
        name: "Alice's Alterations",
        service_type: "Tailor", 
        description: "Expert tailor with 10 years of experience. Can fix prom dresses and hem pants.",
        location: "123 Main St, New York, NY",
        lat: "40.7128",
        lng: "-74.0060"
      },
      {
        name: "Bob's Plumbing",
        service_type: "Plumber",
        description: "24/7 emergency plumbing services. Leaks, clogs, and pipe installation.",
        location: "456 Oak St, Brooklyn, NY",
        lat: "40.6782",
        lng: "-73.9442"
      }
    ];

    for (const p of seedProfiles) {
      const textToEmbed = `${p.service_type} - ${p.description}`;
      try {
        const embedding = await getEmbedding(textToEmbed);
        await storage.createProfile({
          ...p,
          embedding: JSON.stringify(embedding) 
        });
        console.log(`Seeded: ${p.name}`);
      } catch (err) {
        console.error(`Failed to seed ${p.name}:`, err);
      }
    }
  }
}