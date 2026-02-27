import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { InsertProfile, Profile } from "@shared/schema";

// We use z.any() wrapper just to capture the parsed result 
// according to the schema defined in routes.ts
const parseWithLogging = <T>(schema: z.ZodSchema<T>, data: unknown, label: string): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
};

export function useSearchProfiles(query?: string) {
  return useQuery({
    queryKey: [api.profiles.search.path, query],
    queryFn: async () => {
      const url = new URL(api.profiles.search.path, window.location.origin);
      if (query) {
        url.searchParams.set("q", query);
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to search profiles");
      
      const data = await res.json();
      return parseWithLogging(api.profiles.search.responses[200], data, "profiles.search");
    },
    // Don't refetch on every window focus since it might be an expensive AI call
    refetchOnWindowFocus: false,
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: [api.profiles.list.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profiles");
      
      const data = await res.json();
      return parseWithLogging(api.profiles.list.responses[200], data, "profiles.list");
    },
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profile: InsertProfile) => {
      const res = await fetch(api.profiles.create.path, {
        method: api.profiles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create profile");
      }
      
      const data = await res.json();
      return parseWithLogging(api.profiles.create.responses[201], data, "profiles.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.profiles.search.path] });
    },
  });
}
