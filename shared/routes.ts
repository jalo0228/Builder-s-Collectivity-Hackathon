import { z } from 'zod';
import { insertProfileSchema, profiles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  profiles: {
    list: {
      method: 'GET' as const,
      path: '/api/profiles' as const,
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect>()),
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/profiles/search' as const,
      input: z.object({
        q: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles' as const,
      input: insertProfileSchema,
      responses: {
        201: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ProfileResponse = z.infer<typeof api.profiles.list.responses[200]>[0];
