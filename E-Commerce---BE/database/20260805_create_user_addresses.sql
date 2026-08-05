CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name varchar(150) NOT NULL,
  phone varchar(20) NOT NULL,
  address text NOT NULL,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  label varchar(50),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reconcile installations that already had the legacy street/ward/district/province schema.
ALTER TABLE public.user_addresses
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_addresses' AND column_name = 'street'
  ) THEN
    ALTER TABLE public.user_addresses ALTER COLUMN street DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_addresses' AND column_name = 'province'
  ) THEN
    ALTER TABLE public.user_addresses ALTER COLUMN province DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.user_addresses
  ALTER COLUMN address SET NOT NULL,
  ALTER COLUMN latitude SET NOT NULL,
  ALTER COLUMN longitude SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_default ON public.user_addresses(user_id, is_default);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_addresses_one_default ON public.user_addresses(user_id) WHERE is_default = true;
