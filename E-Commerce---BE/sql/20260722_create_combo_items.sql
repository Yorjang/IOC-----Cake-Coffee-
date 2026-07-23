CREATE TABLE IF NOT EXISTS combo_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    child_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    child_variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    is_optional boolean NOT NULL DEFAULT false,
    sort_order smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_combo_not_self CHECK (combo_product_id <> child_product_id)
);

ALTER TABLE combo_items ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE combo_items ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_combo_items_combo_sort ON combo_items(combo_product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_combo_items_child ON combo_items(child_product_id);
