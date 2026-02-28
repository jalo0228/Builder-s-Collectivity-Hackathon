import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertProfileSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Helper function to get embeddings using Gemini
async function getEmbedding(text: string): Promise<number[]> {
  const result = await model.embedContent(text);
  return result.embedding.values; 
}

function keywordSearch(
  profiles: Awaited<ReturnType<typeof storage.getProfiles>>,
  q: string,
) {
  const TOP_K = 3;

  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, "").trim())
    .filter(Boolean);

  if (tokens.length === 0) return profiles.slice(0, TOP_K);

  const scored = profiles
    .map((p) => {
      const haystack = `${p.name} ${p.serviceType} ${p.description} ${p.location}`.toLowerCase();
      let matched = 0;

      for (const token of tokens) {
        const variants = [token];
        if (token.endsWith("s") && token.length > 3) {
          variants.push(token.slice(0, -1));
        }
        if (variants.some((v) => haystack.includes(v))) {
          matched += 1;
        }
      }

      return { profile: p, matched };
    })
    .filter((s) => s.matched > 0);

  scored.sort((a, b) => b.matched - a.matched);
  return scored.slice(0, TOP_K).map((s) => s.profile);
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
      const TOP_K = 3;
      const q = req.query.q as string;
      if (!q) {
        const profiles = await storage.getProfiles();
        return res.json(profiles.slice(0, TOP_K));
      }

      // Always have a reliable non-AI fallback.
      if (!process.env.GEMINI_API_KEY) {
        const profiles = await storage.getProfiles();
        const keyword = keywordSearch(profiles, q);
        if (keyword.length > 0) {
          return res.json(keyword);
        }
        return res.json(profiles.slice(0, TOP_K));
      }

      // Semantic search first, then fallback if embeddings are missing/empty.
      try {
        const embedding = await getEmbedding(q);
        const semantic = await storage.searchProfiles(embedding);
        if (semantic.length > 0) {
          return res.json(semantic.slice(0, TOP_K));
        }
      } catch (err) {
        console.warn("Semantic search failed; falling back to keyword search:", err);
      }

      const profiles = await storage.getProfiles();
      const keyword = keywordSearch(profiles, q);
      if (keyword.length > 0) {
        return res.json(keyword);
      }

      // If nothing matches, return a small fallback list rather than an empty UI.
      return res.json(profiles.slice(0, TOP_K));
    } catch (err) {
      console.error("Search error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Route to create a profile
  app.post(api.profiles.create.path, async (req, res) => {
    const parsed = insertProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        message: firstIssue?.message ?? "Invalid request",
        field: firstIssue?.path?.[0]?.toString(),
      });
    }

    try {
      const profile = parsed.data;
      const textToEmbed = `${profile.serviceType} - ${profile.description}`;

      const embedding = process.env.GEMINI_API_KEY
        ? await getEmbedding(textToEmbed)
        : [];

      const created = await storage.createProfile(profile, embedding);
      return res.status(201).json(created);
    } catch (err) {
      console.error("Create profile error:", err);
      return res.status(500).json({ message: "Internal server error" });
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
        serviceType: "Tailor",
        description: "Expert tailor with 10 years of experience. Can fix prom dresses and hem pants.",
        location: "123 Main St, New York, NY",
        lat: "40.7128",
        lng: "-74.0060"
      },
      {
        name: "Bob's Plumbing",
        serviceType: "Plumber",
        description: "24/7 emergency plumbing services. Leaks, clogs, and pipe installation.",
        location: "456 Oak St, Brooklyn, NY",
        lat: "40.6782",
        lng: "-73.9442"
      }
    ];

    for (const p of seedProfiles) {
      const textToEmbed = `${p.serviceType} - ${p.description}`;
      try {
        const embedding = await getEmbedding(textToEmbed);
        await storage.createProfile(p, embedding);
        console.log(`Seeded: ${p.name}`);
      } catch (err) {
        console.error(`Failed to seed ${p.name}:`, err);
      }
    }
  }
}