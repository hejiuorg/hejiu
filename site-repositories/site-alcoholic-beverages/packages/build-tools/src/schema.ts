import { z } from 'zod';

const idSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9_-]*$/, 'expected namespace:stable-key');
const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, 'expected a lowercase URL slug');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const dateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?$/,
    'expected an ISO date or date-time',
  );
const urlSchema = z.string().regex(/^https?:\/\//, 'expected an http(s) URL');
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, 'expected a lowercase SHA256');

const relationSchema = z
  .object({
    relation: z.string().regex(/^[a-z0-9-]+$/),
    target_id: idSchema,
  })
  .strict();

const referenceSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9-]+$/),
    target_id: idSchema,
    note: z.string().min(1).optional(),
  })
  .strict();

const sourceSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    url: urlSchema.optional(),
    publisher: z.string().min(1).optional(),
    published: z.string().min(1).optional(),
    accessed: dateSchema.optional(),
    note: z.string().min(1).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.url || value.publisher || value.note), {
    message: 'a source needs a url, publisher or note',
  });

const rightsSchema = z
  .object({
    status: z.enum(['unverified', 'allowed', 'restricted']),
    basis: z.string().min(1).optional(),
    license: z.string().min(1).optional(),
    note: z.string().min(1).optional(),
  })
  .strict()
  .refine((value) => value.status !== 'allowed' || Boolean(value.basis || value.license), {
    message: 'allowed rights need a basis or license',
  });

const abvSchema = z
  .object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
    unit: z.literal('percent-vol'),
  })
  .strict()
  .refine((value) => value.max >= value.min, { message: 'abv.max must be >= abv.min' });

const coordinateFields = {
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
};

function hasBothOrNeither(value: { latitude?: number | null; longitude?: number | null }): boolean {
  const hasLat = value.latitude !== undefined && value.latitude !== null;
  const hasLon = value.longitude !== undefined && value.longitude !== null;
  return hasLat === hasLon;
}

const recipeIngredientSchema = z
  .object({
    item_ref: idSchema.optional(),
    ingredient_key: z
      .string()
      .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/)
      .optional(),
    name: z.string().min(1),
    amount: z.number().nonnegative().optional(),
    unit: z.string().min(1).optional(),
    note: z.string().min(1).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.item_ref) !== Boolean(value.ingredient_key), {
    message: 'an ingredient needs exactly one of item_ref or ingredient_key',
  })
  .refine((value) => value.amount === undefined || Boolean(value.unit), {
    message: 'an ingredient amount needs a unit',
  });

const recipeYieldSchema = z
  .object({
    amount: z.number().positive(),
    unit: z.string().min(1),
    serves: z.number().int().positive().optional(),
  })
  .strict();

const stopSchema = z
  .object({
    place_id: idSchema,
    order: z.number().int().positive(),
    note: z.string().min(1).optional(),
  })
  .strict();

const commonSchema = z
  .object({
    schema_version: z.literal(1),
    id: idSchema,
    type: z.string().regex(/^[a-z0-9-]+$/),
    lang: z.enum(['zh', 'en']),
    slug: slugSchema,
    title: z.string().min(1).max(200),
    summary: z.string().min(1).max(600),
    status: z.enum(['draft', 'needs-review', 'reviewed']),
    revision: z.number().int().positive(),
    legacy_refs: z.array(z.string().min(1)).default([]),
    aliases: z.array(z.string().min(1)).default([]),
    tags: z.array(z.string().min(1)).default([]),
    related: z.array(relationSchema).default([]),
    references: z.array(referenceSchema).default([]),
    sources: z.array(sourceSchema).default([]),
    rights: rightsSchema,
    translation_of: idSchema.optional(),
    source_lang: z.enum(['zh', 'en']).optional(),
    source_revision: z.string().min(1).optional(),
    source_sha256: sha256Schema.optional(),
    translation_status: z.enum(['draft', 'needs-review', 'reviewed', 'outdated']).optional(),
    verification_scope: z.enum(['source-verified', 'archive-record']).optional(),
  })
  .strict();

type TypeSchema = ReturnType<typeof commonSchema.extend>;

function entry(
  type: string,
  fields: Record<string, z.ZodTypeAny> = {},
  check?: (value: Record<string, unknown>) => string | null,
): TypeSchema {
  const schema = commonSchema.extend({ type: z.literal(type), ...fields }).strict();
  if (!check) return schema;
  return schema.superRefine((value, ctx) => {
    const message = check(value as Record<string, unknown>);
    if (message) ctx.addIssue({ code: 'custom', message });
  });
}

const schemas: TypeSchema[] = [
  entry('drink-style', {
    parent_style_id: idSchema.optional(),
    aroma_family: z.string().min(1).optional(),
  }),
  entry('drink', {
    style_refs: z.array(idSchema).default([]),
    brand_refs: z.array(idSchema).default([]),
    producer_refs: z.array(idSchema).default([]),
    region_refs: z.array(idSchema).default([]),
    ingredient_refs: z.array(idSchema).default([]),
    process_refs: z.array(idSchema).default([]),
    abv: abvSchema.optional(),
    vintage: z.string().min(1).optional(),
  }),
  entry('brand', {
    producer_refs: z.array(idSchema).default([]),
    region_refs: z.array(idSchema).default([]),
    official_url: urlSchema.nullable().optional(),
    founded_year: z.number().int().nullable().optional(),
  }),
  entry('producer', {
    region_refs: z.array(idSchema).default([]),
    official_url: urlSchema.nullable().optional(),
    founded_year: z.number().int().nullable().optional(),
    organization_type: z.string().min(1).optional(),
  }),
  entry('ingredient', {
    kind: z.string().min(1).optional(),
    region_refs: z.array(idSchema).default([]),
  }),
  entry('variety', {
    species: z.string().min(1).optional(),
    region_refs: z.array(idSchema).default([]),
  }),
  entry(
    'region',
    {
      level: z.enum(['country', 'province', 'city', 'other']),
      parent_id: idSchema.optional(),
      country_code: z.string().regex(/^[A-Z]{2}$/).optional(),
      ...coordinateFields,
    },
    (value) => (hasBothOrNeither(value) ? null : 'a region needs both latitude and longitude, or neither'),
  ),
  entry('process', {
    applies_to_refs: z.array(idSchema).default([]),
  }),
  entry('term', {
    also_known_as: z.array(z.string().min(1)).default([]),
  }),
  entry('standard', {
    issuer: z.string().min(1),
    standard_code: z.string().min(1),
    effective_date: z.string().min(1).optional(),
    scope: z.string().min(1).optional(),
  }),
  entry('cocktail', {
    style: z.string().min(1).optional(),
    ingredient_refs: z.array(idSchema).default([]),
    origin_place: z.string().min(1).optional(),
  }),
  entry('guide', {
    about_refs: z.array(idSchema).default([]),
    audience: z.string().min(1).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }),
  entry('technique', {
    applies_to_refs: z.array(idSchema).default([]),
    about_refs: z.array(idSchema).default([]),
  }),
  entry(
    'recipe',
    {
      product_id: idSchema,
      source_version: z.string().min(1).optional(),
      method: z.enum(['stir', 'shake', 'build', 'blend', 'muddle', 'other']),
      yield: recipeYieldSchema,
      ingredients: z.array(recipeIngredientSchema).min(1),
      steps: z.array(z.string().min(1)).min(1),
      vessel_refs: z.array(idSchema).default([]),
      tool_refs: z.array(idSchema).default([]),
      technique_refs: z.array(idSchema).default([]),
      garnish: z.string().min(1).optional(),
    },
    (value) => {
      const steps = value.steps as string[];
      if (steps.length === 0) return 'a recipe needs at least one step';
      return null;
    },
  ),
  entry('vessel', {
    materials: z.array(z.string().min(1)).default([]),
    capacity_ml: z.number().positive().nullable().optional(),
    uses_for: z.string().min(1).optional(),
  }),
  entry('tool', {
    materials: z.array(z.string().min(1)).default([]),
    purpose: z.string().min(1).optional(),
  }),
  entry('pairing', {
    food: z.string().min(1),
    drink_refs: z.array(idSchema).default([]),
    about_refs: z.array(idSchema).default([]),
  }),
  entry('article', {
    about_refs: z.array(idSchema).default([]),
    topics: z.array(z.string().min(1)).default([]),
    period: z.string().min(1).optional(),
  }),
  entry('person', {
    birth_year: z.number().int().nullable().optional(),
    death_year: z.number().int().nullable().optional(),
    roles: z.array(z.string().min(1)).default([]),
    region_refs: z.array(idSchema).default([]),
  }),
  entry('book', {
    author_names: z.array(z.string().min(1)).default([]),
    author_refs: z.array(idSchema).default([]),
    publication: z.string().min(1).optional(),
    isbn: z.string().min(1).optional(),
  }),
  entry('custom', {
    region_refs: z.array(idSchema).default([]),
    period: z.string().min(1).optional(),
  }),
  entry('historical-event', {
    date_text: z.string().min(1).optional(),
    year_start: z.number().int().nullable().optional(),
    year_end: z.number().int().nullable().optional(),
    calendar: z.string().min(1).optional(),
    place_refs: z.array(idSchema).default([]),
  }),
  entry('artwork', {
    creator_refs: z.array(idSchema).default([]),
    medium: z.string().min(1).optional(),
    collection: z.string().min(1).optional(),
  }),
  entry('poem', {
    author_name: z.string().min(1).optional(),
    source_title: z.string().min(1).optional(),
    dynasty: z.string().min(1).optional(),
    text_variant: z.string().min(1).optional(),
    about_refs: z.array(idSchema).default([]),
  }),
  entry('organization', {
    region_refs: z.array(idSchema).default([]),
    founded_year: z.number().int().nullable().optional(),
    official_url: urlSchema.optional(),
  }),
  entry(
    'place',
    {
      subtype: z.enum([
        'pub',
        'bar',
        'winery-visitor',
        'distillery-visitor',
        'brewery-visitor',
        'museum',
      ]),
      address: z.string().min(1),
      address_en: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
      ...coordinateFields,
      official_url: urlSchema.optional(),
      producer_refs: z.array(idSchema).default([]),
      region_refs: z.array(idSchema).default([]),
      operating_status: z.enum(['unknown', 'verified', 'closed']),
      verified_at: dateSchema.optional(),
      founded_year: z.number().int().nullable().optional(),
    },
    (value) => {
      if (!hasBothOrNeither(value)) return 'a place needs both latitude and longitude, or neither';
      if (value.operating_status === 'verified' && !value.verified_at) {
        return 'a verified operating status needs verified_at';
      }
      return null;
    },
  ),
  entry(
    'route',
    {
      stop_ids: z.array(stopSchema).min(2),
      mode: z.string().min(1).optional(),
      updated_at: dateSchema.optional(),
    },
    (value) => {
      const stops = value.stop_ids as Array<{ order: number; place_id: string }>;
      const orders = new Set(stops.map((stop) => stop.order));
      if (orders.size !== stops.length) return 'route stop orders must be unique';
      const sorted = [...stops].sort((a, b) => a.order - b.order);
      if (sorted[0]?.order !== 1) return 'route stop orders must start at 1';
      const ids = new Set(stops.map((stop) => stop.place_id));
      if (ids.size !== stops.length) return 'a route cannot stop at the same place twice';
      return null;
    },
  ),
  entry('event', {
    start: dateTimeSchema,
    end: dateTimeSchema,
    timezone: z.string().min(1),
    place_refs: z.array(idSchema).min(1),
    organizer_refs: z.array(idSchema).default([]),
    official_url: urlSchema.optional(),
    event_status: z.enum(['upcoming', 'past', 'cancelled', 'unknown']),
  }),
];

export const contentSchema = z
  .discriminatedUnion(
    'type',
    schemas as unknown as [TypeSchema, ...TypeSchema[]],
  )
  .superRefine((value, ctx) => {
    const checked = value as unknown as {
      lang: 'zh' | 'en';
      id: string;
      translation_of?: string;
      source_lang?: string;
      source_revision?: string;
      source_sha256?: string;
      translation_status?: string;
      status: string;
      rights: { status: string };
      sources: unknown[];
      verification_scope?: 'source-verified' | 'archive-record';
    };
    if (checked.lang === 'en') {
      if (checked.translation_of !== checked.id) {
        ctx.addIssue({
          code: 'custom',
          path: ['translation_of'],
          message: 'English content must declare translation_of equal to its entity id',
        });
      }
      if (checked.source_lang !== 'zh') {
        ctx.addIssue({
          code: 'custom',
          path: ['source_lang'],
          message: 'English content must declare source_lang: zh',
        });
      }
      if (!checked.source_revision || !checked.source_sha256 || !checked.translation_status) {
        ctx.addIssue({
          code: 'custom',
          path: ['translation_status'],
          message:
            'English content requires source_revision, source_sha256 and translation_status',
        });
      }
    } else {
      if (checked.translation_of || checked.source_lang || checked.source_sha256) {
        ctx.addIssue({
          code: 'custom',
          path: ['translation_of'],
          message: 'Chinese source content must not carry translation provenance fields',
        });
      }
    }

    if (checked.verification_scope === 'archive-record' && checked.status !== 'reviewed') {
      ctx.addIssue({
        code: 'custom',
        path: ['verification_scope'],
        message: 'archive-record content must have status reviewed',
      });
    }

    if (checked.status === 'reviewed') {
      if (checked.rights.status !== 'allowed') {
        ctx.addIssue({
          code: 'custom',
          path: ['rights', 'status'],
          message: 'reviewed content requires rights.status allowed',
        });
      }
      if (checked.sources.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['sources'],
          message: 'reviewed content requires at least one source',
        });
      }
      if (checked.lang === 'en' && checked.translation_status !== 'reviewed') {
        ctx.addIssue({
          code: 'custom',
          path: ['translation_status'],
          message: 'reviewed English content requires translation_status reviewed',
        });
      }
    }
  });

export type ParsedFrontmatter = z.infer<typeof contentSchema>;
export { idSchema, slugSchema, sha256Schema };
