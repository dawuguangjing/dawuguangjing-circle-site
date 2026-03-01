import { defineCollection, z } from 'astro:content';

/** FANZA / DLsite のリンクペア（works・gallery 共用） */
const storeLinks = z.object({
  fanza:  z.string().url().optional(),
  dlsite: z.string().url().optional(),
});

const works = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    catch: z.string(),
    shortDescription: z.string(),
    releaseDate: z.date(),
    isR18: z.boolean(),
    platformLinks: storeLinks,
    trialLinks: storeLinks.optional(),
    environments: z.object({
      windows: z.boolean(),
      mac: z.boolean(),
      browserPc: z.boolean(),
      browserMobileBeta: z.boolean(),
      ios: z.boolean().default(false),
      android: z.boolean().default(false),
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
    }),
    videoUrl: z.string().url().optional(),
    sellingPoints: z.array(z.string()).optional()
  })
});

export const NEWS_CATEGORIES = ['release', 'update', 'sale', 'devlog'] as const;
export type NewsCategory = typeof NEWS_CATEGORIES[number];

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.enum(NEWS_CATEGORIES),
    eyecatch: z.string().optional(),
    relatedWorkSlugs: z.array(z.string()).optional()
  })
});

const gallery = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    releaseDate: z.date(),
    isR18: z.boolean(),
    cover: z.string(),
    images: z.array(z.string()),
    imageCount: z.number().int().nonnegative().optional(),
    relatedWorkSlugs: z.array(z.string()).optional(),
    platformLinks: storeLinks.optional(),
  })
});

const characters = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    nameReading: z.string(),
    workSlug: z.string(),
    cover: z.string(),
    color: z.string().default('#0068B7'),
    age: z.number().int().nonnegative().optional(),
    height: z.number().int().nonnegative().optional(),
    personality: z.string(),
  })
});

export const collections = { works, news, gallery, characters };
