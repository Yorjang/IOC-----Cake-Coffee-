CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cod_remittances_status_enum') THEN
    CREATE TYPE cod_remittances_status_enum AS ENUM ('pending', 'completed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_logs_status_enum') THEN
    CREATE TYPE delivery_logs_status_enum AS ENUM (
      'assigned', 'picking_up', 'picked_up', 'delivering', 'delivered', 'failed', 'cancelled'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cod_remittances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id uuid NOT NULL REFERENCES public.users(id),
  cashier_id uuid NULL REFERENCES public.users(id),
  total_expected numeric(12,0) NOT NULL DEFAULT 0,
  total_actual numeric(12,0) NULL,
  discrepancy numeric(12,0) NOT NULL DEFAULT 0,
  status cod_remittances_status_enum NOT NULL DEFAULT 'pending',
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- orders.cod_remittance_id (added by 20260813_add_cod_remittance_id.sql) references this table;
-- that migration must run after this one on a fresh database.

CREATE TABLE IF NOT EXISTS public.delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shipper_id uuid NULL REFERENCES public.users(id),
  status delivery_logs_status_enum NULL,
  reason text NULL,
  image_url text NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for both tables are created separately by 20260813_add_indexes.sql.
