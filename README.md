Problem what We wanted to Solve : 
Tech Stack

Frontend: React + TypeScript (Vite), TailwindCSS, shadcn/ui (Radix), TanStack React Query for API data fetching/caching.
Backend: Node.js + TypeScript + Express. Single dev server runs API + Vite (frontend) together in development.
Database: PostgreSQL with Drizzle ORM (drizzle-orm, drizzle-kit) for schema + migrations/push.
Maps: Leaflet / react-leaflet for rendering provider locations on the map.
Optional AI: Google Gemini embeddings via @google/generative-ai.
How AI Is Used (Search)

Purpose: turn a natural-language query (e.g., “tutor in State College for python”) into an embedding vector, then find the most semantically similar provider profiles.
Embeddings model: Gemini text-embedding-004.
When a profile is created, we embed: "<serviceType> - <description>".
When searching, we embed the user query and compute cosine similarity between the query vector and each stored profile vector.
Resilience / fallback:
If GEMINI_API_KEY is missing or embedding fails, the API falls back to keyword/token matching across name, serviceType, description, and location.
API always returns a small Top-K list (Top 3) and avoids returning an empty list where possible.

Database Structure (Postgres + Drizzle)
Single main table: profiles
Columns:
id (serial, primary key)
name (text, required)
service_type (text, required) — exposed in app code as serviceType
description (text, required)
location (text, required)
lat (text, optional)
lng (text, optional)
embedding (json, optional) — stored as number[] (vector) for semantic search
Insert behavior:
Client sends an InsertProfile without id and without embedding.
Server computes embedding (if AI enabled) and stores it along with the profile row.
