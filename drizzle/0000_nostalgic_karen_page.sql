CREATE TYPE "public"."ai_generation_status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TYPE "public"."article_draft_status" AS ENUM('draft', 'ready', 'published');--> statement-breakpoint
CREATE TYPE "public"."fetch_log_status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TYPE "public"."news_source_type" AS ENUM('rss', 'api');--> statement-breakpoint
CREATE TYPE "public"."raw_news_status" AS ENUM('new', 'ignored', 'draft_created', 'published');--> statement-breakpoint
CREATE TABLE "ai_generation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_news_item_id" uuid,
	"status" "ai_generation_status" NOT NULL,
	"prompt" text NOT NULL,
	"response_text" text,
	"error_message" text,
	"tokens_used" integer,
	"model_used" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_news_item_id" uuid,
	"source_id" uuid,
	"ai_prompt" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"seo_title" text NOT NULL,
	"seo_description" text NOT NULL,
	"featured_image_url" text,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"status" "article_draft_status" DEFAULT 'draft' NOT NULL,
	"ai_model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "article_drafts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fetch_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"status" "fetch_log_status" NOT NULL,
	"error_message" text,
	"items_fetched" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "news_source_type" NOT NULL,
	"url" text NOT NULL,
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"default_prompt" text,
	"fetch_interval_minutes" integer DEFAULT 60 NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"last_fetch_status" "fetch_log_status",
	"last_fetch_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"seo_title" text NOT NULL,
	"seo_description" text NOT NULL,
	"featured_image_url" text,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "published_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "raw_news_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text,
	"external_url" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" text,
	"image_url" text,
	"author" text,
	"published_at" timestamp with time zone,
	"raw_payload" jsonb,
	"content_hash" text NOT NULL,
	"status" "raw_news_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raw_news_items_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "ai_generation_logs_raw_news_item_id_raw_news_items_id_fk" FOREIGN KEY ("raw_news_item_id") REFERENCES "public"."raw_news_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_drafts" ADD CONSTRAINT "article_drafts_raw_news_item_id_raw_news_items_id_fk" FOREIGN KEY ("raw_news_item_id") REFERENCES "public"."raw_news_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_drafts" ADD CONSTRAINT "article_drafts_source_id_news_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."news_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fetch_logs" ADD CONSTRAINT "fetch_logs_source_id_news_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."news_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_articles" ADD CONSTRAINT "published_articles_draft_id_article_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."article_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_news_items" ADD CONSTRAINT "raw_news_items_source_id_news_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."news_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_generation_logs_raw_news_item_id" ON "ai_generation_logs" USING btree ("raw_news_item_id");--> statement-breakpoint
CREATE INDEX "idx_ai_generation_logs_created_at" ON "ai_generation_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_article_drafts_status" ON "article_drafts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_article_drafts_slug_uidx" ON "article_drafts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_fetch_logs_source_id" ON "fetch_logs" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_fetch_logs_created_at" ON "fetch_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_published_articles_slug_uidx" ON "published_articles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_published_articles_draft_id_uidx" ON "published_articles" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "idx_published_articles_published_at" ON "published_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_published_articles_category" ON "published_articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_raw_news_items_status" ON "raw_news_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_raw_news_items_created_at" ON "raw_news_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_raw_news_items_external_url" ON "raw_news_items" USING btree ("external_url");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_raw_news_items_content_hash_uidx" ON "raw_news_items" USING btree ("content_hash");