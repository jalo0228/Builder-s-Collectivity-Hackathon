import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

// Helper function to get embeddings
async function getEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.profiles.list.path, async (req, res) => {
    const profiles = await storage.getProfiles();
    res.json(profiles);
  });

  app.get(api.profiles.search.path, async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) {
        const profiles = await storage.getProfiles();
        return res.json(profiles);
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key missing" });
      }

      const embedding = await getEmbedding(q);
      const profiles = await storage.searchProfiles(embedding);
      res.json(profiles);
    } catch (err) {
      console.error("Search error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.profiles.create.path, async (req, res) => {
    try {
      const input = api.profiles.create.input.parse(req.body);
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key missing" });
      }

      // Generate embedding for the profile based on service type and description
      const textToEmbed = `${input.serviceType} - ${input.description}`;
      const embedding = await getEmbedding(textToEmbed);
      
      const profile = await storage.createProfile(input, embedding);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Create profile error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed database
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getProfiles();
  if (existing.length === 0 && process.env.OPENAI_API_KEY) {
    const seedProfiles = [
      {
        name: "Alice's Alterations",
        serviceType: "Tailor",
        description: "Expert tailor with 10 years of experience. Can fix prom dresses, hem pants, and create custom clothing.",
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
      },
      {
        name: "Carol's Cleaning",
        serviceType: "House Cleaning",
        description: "Thorough deep cleaning for apartments and houses. Eco-friendly products used.",
        location: "789 Pine St, Queens, NY",
        lat: "40.7282",
        lng: "-73.7949"
      }
    ];

    for (const p of seedProfiles) {
      const textToEmbed = `${p.serviceType} - ${p.description}`;
      try {
        const embedding = await getEmbedding(textToEmbed);
        await storage.createProfile(p, embedding);
      } catch (err) {
        console.error("Failed to seed profile", p.name, err);
      }
    }
  }
}