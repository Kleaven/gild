SET search_path = public;

-- Rename starter plan to hobby
ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_plan_check;

-- Migrate existing data before re-adding the constraint
UPDATE communities
  SET plan = 'hobby'
  WHERE plan = 'starter';

ALTER TABLE communities
  ADD CONSTRAINT communities_plan_check
  CHECK (plan IN ('hobby', 'pro'));

ALTER TABLE communities
  ALTER COLUMN plan SET DEFAULT 'hobby';
