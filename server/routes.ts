import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Helper function to get embeddings using Gemini
async function getEmbedding(text: string): Promise<number[]> {
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// THIS IS THE PART THAT WAS MISSING - IT CONNECTS TO INDEX.TS
export async function registerRoutes(
  httpServer: Server,
  app: Express,
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

  // Route to create a profile
  app.post(api.profiles.create.path, async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: "Gemini API key missing" });
      }
      const body = api.profiles.create.input.parse(req.body);

      // Geocode the address
      let lat = null;
      let lng = null;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(body.location)}&format=json&limit=1`,
          {
            headers: { "User-Agent": "LocalServiceFinder/1.0" },
          },
        );
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          lat = geoData[0].lat;
          lng = geoData[0].lon;
        }
      } catch (geoErr) {
        console.warn(
          "Geocoding failed, continuing without coordinates:",
          geoErr,
        );
      }

      const textToEmbed = `${body.serviceType} - ${body.description}`;
      const embedding = await getEmbedding(textToEmbed);
      const profile = await storage.createProfile(
        { ...body, lat, lng },
        embedding,
      );
      res.status(201).json(profile);
    } catch (err) {
      console.error("Create profile error:", err);
      res.status(400).json({ message: "Failed to create profile" });
    }
  });

  return httpServer;
}
