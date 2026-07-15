CREATE TABLE IF NOT EXISTS product_toppings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name varchar(120) NOT NULL,
    price numeric(12, 0) NOT NULL DEFAULT 0 CHECK (price >= 0),
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_toppings_product_name UNIQUE (product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_toppings_product_id
    ON product_toppings(product_id);

INSERT INTO product_toppings (product_id, name, price, is_active, sort_order)
SELECT product.id, topping.name, topping.price, true, topping.sort_order
FROM products product
CROSS JOIN (VALUES
    ('Trân châu trắng', 8000, 0),
    ('Thạch sương sáo', 5000, 1),
    ('Kem phô mai', 10000, 2)
) AS topping(name, price, sort_order)
WHERE product.product_type IN ('coffee', 'drink')
ON CONFLICT (product_id, name) DO NOTHING;
