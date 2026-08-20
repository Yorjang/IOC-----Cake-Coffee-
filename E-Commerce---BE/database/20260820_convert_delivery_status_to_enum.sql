-- orders.delivery_status is currently a plain varchar; convert it to a proper
-- enum type, matching how order_status is already set up (so it renders as a
-- dropdown in Supabase's table editor instead of a free-text box).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
    CREATE TYPE delivery_status AS ENUM (
      'assigned', 'picking_up', 'picked_up', 'delivering', 'delivered', 'failed', 'cancelled'
    );
  END IF;
END $$;

-- Normalize any values outside that domain (e.g. a stray 'pending') to NULL,
-- which is what "no delivery in progress yet" means in the app.
UPDATE public.orders
SET delivery_status = NULL
WHERE delivery_status IS NOT NULL
  AND delivery_status NOT IN (
    'assigned', 'picking_up', 'picked_up', 'delivering', 'delivered', 'failed', 'cancelled'
  );

ALTER TABLE public.orders
  ALTER COLUMN delivery_status TYPE delivery_status
  USING delivery_status::delivery_status;
