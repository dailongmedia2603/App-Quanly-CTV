-- Step 1: Add a column to store the unique post ID from Facebook
ALTER TABLE "public"."Bao_cao_Facebook" ADD COLUMN IF NOT EXISTS "source_post_id" TEXT;
ALTER TABLE "public"."Bao_cao_tong_hop" ADD COLUMN IF NOT EXISTS "source_post_id" TEXT;

-- Step 2: Populate the new column for existing data by extracting the ID from the URL
UPDATE "public"."Bao_cao_Facebook"
SET "source_post_id" = COALESCE(
    substring("source_url" from '(?:posts|videos|story_fbid=|/|fbid=)([0-9]{10,})'),
    "source_url"
)
WHERE "source_post_id" IS NULL;

UPDATE "public"."Bao_cao_tong_hop"
SET "source_post_id" = COALESCE(
    substring("source_url" from '(?:posts|videos|story_fbid=|/|fbid=)([0-9]{10,})'),
    "source_url"
)
WHERE "source_type" = 'Facebook' AND "source_post_id" IS NULL;

-- Step 3: Delete duplicate entries, keeping the most recently scanned one
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER(PARTITION BY campaign_id, source_post_id ORDER BY scanned_at DESC) as rn
  FROM "public"."Bao_cao_Facebook"
  WHERE source_post_id IS NOT NULL
)
DELETE FROM "public"."Bao_cao_Facebook" WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

WITH duplicates_tong_hop AS (
  SELECT id, ROW_NUMBER() OVER(PARTITION BY campaign_id, source_post_id ORDER BY scanned_at DESC) as rn
  FROM "public"."Bao_cao_tong_hop"
  WHERE source_post_id IS NOT NULL AND source_type = 'Facebook'
)
DELETE FROM "public"."Bao_cao_tong_hop" WHERE id IN (SELECT id FROM duplicates_tong_hop WHERE rn > 1);

-- Step 4: Add a unique constraint to prevent future duplicates
ALTER TABLE "public"."Bao_cao_Facebook"
DROP CONSTRAINT IF EXISTS "bao_cao_facebook_campaign_id_source_post_id_key";

ALTER TABLE "public"."Bao_cao_Facebook"
ADD CONSTRAINT "bao_cao_facebook_campaign_id_source_post_id_key"
UNIQUE ("campaign_id", "source_post_id");

-- For the combined table, use a partial unique index to only enforce uniqueness for Facebook posts
DROP INDEX IF EXISTS "bao_cao_tong_hop_facebook_unique_idx";
CREATE UNIQUE INDEX "bao_cao_tong_hop_facebook_unique_idx"
ON "public"."Bao_cao_tong_hop" ("campaign_id", "source_post_id")
WHERE "source_type" = 'Facebook';