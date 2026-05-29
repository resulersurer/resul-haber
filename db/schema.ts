import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, uniqueIndex, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const newsSourceTypeEnum = pgEnum('news_source_type', ['rss', 'api']);
export const rawNewsStatusEnum = pgEnum('raw_news_status', ['new', 'ignored', 'draft_created', 'published']);
export const articleDraftStatusEnum = pgEnum('article_draft_status', ['draft', 'ready', 'published']);
export const fetchLogStatusEnum = pgEnum('fetch_log_status', ['success', 'error']);
export const aiGenerationStatusEnum = pgEnum('ai_generation_status', ['success', 'error']);

// 1. News Sources Table
export const newsSources = pgTable('news_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: newsSourceTypeEnum('type').notNull(),
  url: text('url').notNull(),
  category: text('category').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  defaultPrompt: text('default_prompt'),
  fetchIntervalMinutes: integer('fetch_interval_minutes').default(60).notNull(),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  lastFetchStatus: fetchLogStatusEnum('last_fetch_status'),
  lastFetchError: text('last_fetch_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Raw News Items Table
export const rawNewsItems = pgTable('raw_news_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').references(() => newsSources.id, { onDelete: 'cascade' }).notNull(),
  externalId: text('external_id'),
  externalUrl: text('external_url').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  content: text('content'),
  imageUrl: text('image_url'),
  author: text('author'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  rawPayload: jsonb('raw_payload'),
  contentHash: text('content_hash').notNull().unique(),
  status: rawNewsStatusEnum('status').default('new').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index('idx_raw_news_items_status').on(table.status),
    createdAtIdx: index('idx_raw_news_items_created_at').on(table.createdAt),
    externalUrlIdx: index('idx_raw_news_items_external_url').on(table.externalUrl),
    contentHashUidx: uniqueIndex('idx_raw_news_items_content_hash_uidx').on(table.contentHash),
  };
});

// 3. Article Drafts Table
export const articleDrafts = pgTable('article_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  rawNewsItemId: uuid('raw_news_item_id').references(() => rawNewsItems.id, { onDelete: 'set null' }),
  sourceId: uuid('source_id').references(() => newsSources.id, { onDelete: 'set null' }),
  aiPrompt: text('ai_prompt').notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  tags: text('tags').array().default([]).notNull(),
  seoTitle: text('seo_title').notNull(),
  seoDescription: text('seo_description').notNull(),
  featuredImageUrl: text('featured_image_url'),
  sourceName: text('source_name').notNull(),
  sourceUrl: text('source_url').notNull(),
  status: articleDraftStatusEnum('status').default('draft').notNull(),
  aiModel: text('ai_model'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
}, (table) => {
  return {
    statusIdx: index('idx_article_drafts_status').on(table.status),
    slugUidx: uniqueIndex('idx_article_drafts_slug_uidx').on(table.slug),
  };
});

// 4. Published Articles Table (Unique Index on draftId)
export const publishedArticles = pgTable('published_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => articleDrafts.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  tags: text('tags').array().default([]).notNull(),
  seoTitle: text('seo_title').notNull(),
  seoDescription: text('seo_description').notNull(),
  featuredImageUrl: text('featured_image_url'),
  sourceName: text('source_name').notNull(),
  sourceUrl: text('source_url').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    slugUidx: uniqueIndex('idx_published_articles_slug_uidx').on(table.slug),
    draftIdUidx: uniqueIndex('idx_published_articles_draft_id_uidx').on(table.draftId),
    publishedAtIdx: index('idx_published_articles_published_at').on(table.publishedAt),
    categoryIdx: index('idx_published_articles_category').on(table.category),
  };
});

// 5. System Settings Table
export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Fetch Logs Table
export const fetchLogs = pgTable('fetch_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').references(() => newsSources.id, { onDelete: 'cascade' }).notNull(),
  status: fetchLogStatusEnum('status').notNull(),
  errorMessage: text('error_message'),
  itemsFetched: integer('items_fetched').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    sourceIdIdx: index('idx_fetch_logs_source_id').on(table.sourceId),
    createdAtIdx: index('idx_fetch_logs_created_at').on(table.createdAt),
  };
});

// 7. AI Generation Logs Table
export const aiGenerationLogs = pgTable('ai_generation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  rawNewsItemId: uuid('raw_news_item_id').references(() => rawNewsItems.id, { onDelete: 'set null' }),
  status: aiGenerationStatusEnum('status').notNull(),
  prompt: text('prompt').notNull(),
  responseText: text('response_text'),
  errorMessage: text('error_message'),
  tokensUsed: integer('tokens_used'),
  modelUsed: text('model_used'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    rawNewsItemIdIdx: index('idx_ai_generation_logs_raw_news_item_id').on(table.rawNewsItemId),
    createdAtIdx: index('idx_ai_generation_logs_created_at').on(table.createdAt),
  };
});

// Relationships
export const newsSourcesRelations = relations(newsSources, ({ many }) => ({
  rawNewsItems: many(rawNewsItems),
  articleDrafts: many(articleDrafts),
  fetchLogs: many(fetchLogs),
}));

export const rawNewsItemsRelations = relations(rawNewsItems, ({ one, many }) => ({
  source: one(newsSources, {
    fields: [rawNewsItems.sourceId],
    references: [newsSources.id],
  }),
  aiGenerationLogs: many(aiGenerationLogs),
}));

export const fetchLogsRelations = relations(fetchLogs, ({ one }) => ({
  source: one(newsSources, {
    fields: [fetchLogs.sourceId],
    references: [newsSources.id],
  }),
}));

export const aiGenerationLogsRelations = relations(aiGenerationLogs, ({ one }) => ({
  rawNewsItem: one(rawNewsItems, {
    fields: [aiGenerationLogs.rawNewsItemId],
    references: [rawNewsItems.id],
  }),
}));

export const articleDraftsRelations = relations(articleDrafts, ({ one }) => ({
  rawNewsItem: one(rawNewsItems, {
    fields: [articleDrafts.rawNewsItemId],
    references: [rawNewsItems.id],
  }),
  source: one(newsSources, {
    fields: [articleDrafts.sourceId],
    references: [newsSources.id],
  }),
}));
