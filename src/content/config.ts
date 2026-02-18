import { defineCollection, z } from 'astro:content';

const works = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    catch: z.string(),
    shortDescription: z.string(),
    releaseDate: z.date(),
    isR18: z.boolean(),
    platformLinks: z.object({
      fanza: z.string().url().optional(),
      dlsite: z.string().url().optional()
    }),
    trialLinks: z
      .object({
        fanza: z.string().url().optional(),
        dlsite: z.string().url().optional()
      })
      .optional(),
    environments: z.object({
      windows: z.boolean(),
      browserPc: z.boolean(),
      browserMobileBeta: z.boolean()
    }),
    volume: z.object({
      playTimeMin: z.number().int().nonnegative(),
      cgCount: z.number().int().nonnegative(),
      hSceneCount: z.number().int().nonnegative(),
      branching: z.enum(['none', 'light', 'multi'])
    }),
    aiUsage: z.object({
      level: z.enum(['none', 'partial', 'major']),
      noteShort: z.string()
    }),
    images: z.object({
      cover: z.string(),
      screenshots: z.array(z.string())
    })
  })
});

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.enum(['release', 'update', 'sale', 'devlog']),
    relatedWorkSlugs: z.array(z.string()).optional()
  })
});

export const collections = { works, news };
