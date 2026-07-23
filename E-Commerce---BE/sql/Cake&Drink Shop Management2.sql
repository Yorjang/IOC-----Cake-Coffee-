DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE "user_role" AS ENUM (
  'guest',
  'customer',
  'staff',
  'cashier',
  'store_manager',
  'admin'
);

CREATE TYPE "product_type" AS ENUM (
  'cake',
  'coffee',
  'drink',
  'combo'
);

CREATE TYPE "variant_status" AS ENUM (
  'active',
  'inactive',
  'out_of_stock'
);

CREATE TYPE "order_status" AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'shipping',
  'completed',
  'cancelled'
);

CREATE TYPE "payment_method" AS ENUM (
  'cod',
  'momo',
  'vnpay',
  'zalopay',
  'bank_transfer',
  'cash'
);

CREATE TYPE "payment_status" AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

CREATE TYPE "payment_gateway" AS ENUM (
  'momo',
  'vnpay',
  'zalopay',
  'bank_transfer',
  'cash'
);

CREATE TYPE "discount_type" AS ENUM (
  'percent',
  'fixed'
);

CREATE TYPE "coupon_scope" AS ENUM (
  'order',
  'product',
  'category',
  'variant',
  'branch'
);

CREATE TYPE "coupon_target_type" AS ENUM (
  'product',
  'category',
  'variant',
  'branch'
);

CREATE TYPE "coupon_status" AS ENUM (
  'active',
  'expired',
  'disabled'
);

CREATE TYPE "branch_status" AS ENUM (
  'active',
  'inactive',
  'temporarily_closed'
);

CREATE TYPE "day_of_week" AS ENUM (
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

CREATE TYPE "notification_type" AS ENUM (
  'order_update',
  'promotion',
  'stock_alert',
  'system'
);

CREATE TYPE "custom_order_status" AS ENUM (
  'pending',
  'confirmed',
  'in_production',
  'ready',
  'delivered',
  'cancelled'
);

CREATE TYPE "order_type" AS ENUM (
  'online',
  'pos'
);

CREATE TYPE "fulfillment_type" AS ENUM (
  'delivery',
  'pickup'
);

CREATE TYPE "invoice_status" AS ENUM (
  'draft',
  'completed',
  'cancelled',
  'refunded'
);

CREATE TYPE "transaction_type" AS ENUM (
  'import',
  'export',
  'adjustment',
  'waste'
);

CREATE TYPE "stock_reference_type" AS ENUM (
  'order',
  'sales_invoice',
  'custom_order',
  'manual',
  'adjustment'
);

CREATE TYPE "activity_entity" AS ENUM (
  'user',
  'product',
  'product_variant',
  'order',
  'sales_invoice',
  'custom_order',
  'coupon',
  'branch',
  'inventory',
  'category'
);

CREATE TYPE "coupon_reference_type" AS ENUM (
  'order',
  'sales_invoice'
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "full_name" VARCHAR(150) NOT NULL,
  "email" VARCHAR(255) UNIQUE,
  "phone" VARCHAR(20) UNIQUE,
  "avatar_url" TEXT,
  "password_hash" VARCHAR(255) NOT NULL,
  "role" user_role NOT NULL DEFAULT 'customer',
  "branch_id" UUID,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "email_verified_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  CONSTRAINT "chk_users_contact" CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE "user_addresses" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "user_id" UUID NOT NULL,
  "label" VARCHAR(100),
  "recipient_name" VARCHAR(150) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "street" VARCHAR(255) NOT NULL,
  "ward" VARCHAR(100),
  "district" VARCHAR(100),
  "province" VARCHAR(100) NOT NULL,
  "latitude" NUMERIC(10,7),
  "longitude" NUMERIC(10,7),
  "is_default" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "branches" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "name" VARCHAR(200) NOT NULL,
  "address" TEXT NOT NULL,
  "phone" VARCHAR(20),
  "email" VARCHAR(255),
  "latitude" NUMERIC(10,7) NOT NULL,
  "longitude" NUMERIC(10,7) NOT NULL,
  "status" branch_status NOT NULL DEFAULT 'active',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "user_branch_roles" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "user_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "role" user_role NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "branch_opening_hours" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "branch_id" UUID NOT NULL,
  "day_of_week" day_of_week NOT NULL,
  "opening_time" TIME,
  "closing_time" TIME,
  "is_closed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "chk_opening_hours" CHECK (is_closed = TRUE OR (opening_time IS NOT NULL AND closing_time IS NOT NULL))
);

CREATE TABLE "branch_images" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "branch_id" UUID NOT NULL,
  "image_url" TEXT NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" SMALLINT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "categories" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "parent_id" UUID,
  "name" VARCHAR(200) UNIQUE NOT NULL,
  "slug" VARCHAR(200) UNIQUE NOT NULL,
  "description" TEXT,
  "image_url" TEXT,
  "sort_order" SMALLINT NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "products" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "category_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) UNIQUE NOT NULL,
  "description" TEXT,
  "ingredients_info" TEXT,
  "image_url" TEXT,
  "product_type" product_type NOT NULL,
  "requires_note" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "product_images" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "product_id" UUID NOT NULL,
  "image_url" TEXT NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE "product_variants" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "product_id" UUID NOT NULL,
  "sku" VARCHAR(100) UNIQUE NOT NULL,
  "variant_name" VARCHAR(255) NOT NULL,
  "size" VARCHAR(50),
  "flavor" VARCHAR(100),
  "topping" VARCHAR(100),
  "price" NUMERIC(12,0) NOT NULL CHECK (price >= 0),
  "status" variant_status NOT NULL DEFAULT 'active',
  "image_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "product_tags" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "name" VARCHAR(100) UNIQUE NOT NULL,
  "slug" VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE "product_tag_map" (
  "product_id" UUID NOT NULL,
  "tag_id" UUID NOT NULL,
  PRIMARY KEY ("product_id", "tag_id")
);

CREATE TABLE "combo_items" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "combo_product_id" UUID NOT NULL,
  "child_product_id" UUID NOT NULL,
  "child_variant_id" UUID,
  "quantity" INT NOT NULL CHECK (quantity > 0) DEFAULT 1,
  "is_optional" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT "chk_combo_not_self" CHECK (combo_product_id != child_product_id)
);

CREATE TABLE "branch_variant_stocks" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "branch_id" UUID NOT NULL,
  "variant_id" UUID NOT NULL,
  "quantity" INT NOT NULL CHECK (quantity >= 0) DEFAULT 0,
  "reserved_quantity" INT NOT NULL CHECK (reserved_quantity >= 0) DEFAULT 0,
  "min_quantity" INT NOT NULL CHECK (min_quantity >= 0) DEFAULT 0,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  CONSTRAINT "chk_variant_stock_reserved" CHECK (reserved_quantity <= quantity)
);

CREATE TABLE "ingredients" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "name" VARCHAR(200) UNIQUE NOT NULL,
  "unit" VARCHAR(50) NOT NULL,
  "cost_per_unit" NUMERIC(12,0) NOT NULL CHECK (cost_per_unit >= 0) DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "branch_ingredient_stocks" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "branch_id" UUID NOT NULL,
  "ingredient_id" UUID NOT NULL,
  "current_stock" NUMERIC(12,3) NOT NULL CHECK (current_stock >= 0) DEFAULT 0,
  "min_stock_level" NUMERIC(12,3) NOT NULL CHECK (min_stock_level >= 0) DEFAULT 0,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "variant_ingredients" (
  "variant_id" UUID NOT NULL,
  "ingredient_id" UUID NOT NULL,
  "quantity_needed" NUMERIC(12,3) NOT NULL CHECK (quantity_needed > 0),
  "unit" VARCHAR(50),
  PRIMARY KEY ("variant_id", "ingredient_id")
);

CREATE TABLE "stock_batches" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "branch_id" UUID NOT NULL,
  "ingredient_id" UUID,
  "variant_id" UUID,
  "batch_code" VARCHAR(100),
  "quantity_imported" NUMERIC(12,3) NOT NULL CHECK (quantity_imported > 0),
  "remaining_quantity" NUMERIC(12,3) NOT NULL CHECK (remaining_quantity >= 0),
  "cost_per_unit" NUMERIC(12,0) NOT NULL CHECK (cost_per_unit >= 0) DEFAULT 0,
  "supplier" VARCHAR(200),
  "manufactured_date" DATE,
  "expiry_date" DATE,
  "imported_by" UUID,
  "imported_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  "note" TEXT,
  CONSTRAINT "chk_batch_target" CHECK ((ingredient_id IS NOT NULL AND variant_id IS NULL) OR
        (ingredient_id IS NULL AND variant_id IS NOT NULL)),
  CONSTRAINT "chk_batch_quantity" CHECK (remaining_quantity <= quantity_imported),
  CONSTRAINT "chk_batch_expiry" CHECK (expiry_date IS NULL OR manufactured_date IS NULL OR expiry_date > manufactured_date)
);

CREATE TABLE "inventory_transactions" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "branch_id" UUID NOT NULL,
  "ingredient_id" UUID,
  "variant_id" UUID,
  "stock_batch_id" UUID,
  "transaction_type" transaction_type NOT NULL,
  "quantity" NUMERIC(12,3) NOT NULL,
  "reference_type" stock_reference_type,
  "reference_id" UUID,
  "performed_by" UUID,
  "note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  CONSTRAINT "chk_inv_txn_target" CHECK ((ingredient_id IS NOT NULL AND variant_id IS NULL) OR
        (ingredient_id IS NULL AND variant_id IS NOT NULL))
);

CREATE TABLE "coupons" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "code" VARCHAR(100) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "discount_type" discount_type NOT NULL,
  "discount_value" NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  "coupon_scope" coupon_scope NOT NULL DEFAULT 'order',
  "min_order_value" NUMERIC(12,0) NOT NULL CHECK (min_order_value >= 0) DEFAULT 0,
  "min_quantity" INT NOT NULL CHECK (min_quantity > 0) DEFAULT 1,
  "max_discount" NUMERIC(12,0) CHECK (max_discount IS NULL OR max_discount >= 0),
  "usage_limit" INT CHECK (usage_limit IS NULL OR usage_limit > 0),
  "per_customer_limit" INT NOT NULL CHECK (per_customer_limit > 0) DEFAULT 1,
  "used_count" INT NOT NULL CHECK (used_count >= 0) DEFAULT 0,
  "status" coupon_status NOT NULL DEFAULT 'active',
  "starts_at" TIMESTAMPTZ NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  CONSTRAINT "chk_coupon_dates" CHECK (expires_at > starts_at)
);

CREATE TABLE "coupon_targets" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "coupon_id" UUID NOT NULL,
  "target_type" coupon_target_type NOT NULL,
  "target_id" UUID NOT NULL
);

CREATE TABLE "coupon_usages" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "coupon_id" UUID NOT NULL,
  "user_id" UUID,
  "reference_type" coupon_reference_type NOT NULL DEFAULT 'order',
  "reference_id" UUID NOT NULL,
  "discount_amount" NUMERIC(12,0) NOT NULL CHECK (discount_amount >= 0),
  "used_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "carts" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "user_id" UUID,
  "session_id" UUID,
  "branch_id" UUID,
  "fulfillment_type" fulfillment_type DEFAULT 'delivery',
  "expires_at" TIMESTAMPTZ NOT NULL DEFAULT (now()+INTERVAL'7 days'),
  CONSTRAINT "chk_cart_owner" CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE "cart_items" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "cart_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "variant_id" UUID NOT NULL,
  "quantity" INT NOT NULL CHECK (quantity > 0) DEFAULT 1,
  "note" TEXT
);

CREATE TABLE "orders" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "order_code" VARCHAR(50) UNIQUE NOT NULL,
  "user_id" UUID NOT NULL,
  "address_id" UUID,
  "branch_id" UUID NOT NULL,
  "subtotal" NUMERIC(12,0) NOT NULL CHECK (subtotal >= 0) DEFAULT 0,
  "discount_amount" NUMERIC(12,0) NOT NULL CHECK (discount_amount >= 0) DEFAULT 0,
  "shipping_fee" NUMERIC(12,0) NOT NULL CHECK (shipping_fee >= 0) DEFAULT 0,
  "total_amount" NUMERIC(12,0) NOT NULL CHECK (total_amount >= 0) DEFAULT 0,
  "payment_method" payment_method NOT NULL,
  "payment_status" payment_status NOT NULL DEFAULT 'pending',
  "order_status" order_status NOT NULL DEFAULT 'pending',
  "order_type" order_type NOT NULL DEFAULT 'online',
  "fulfillment_type" fulfillment_type NOT NULL DEFAULT 'delivery',
  "shipping_address_street" VARCHAR(255),
  "shipping_address_ward" VARCHAR(100),
  "shipping_address_district" VARCHAR(100),
  "shipping_address_province" VARCHAR(100),
  "shipping_address_phone" VARCHAR(20),
  "shipping_recipient_name" VARCHAR(150),
  "shipping_latitude" NUMERIC(10,7),
  "shipping_longitude" NUMERIC(10,7),
  "pickup_at" TIMESTAMPTZ,
  "delivery_at" TIMESTAMPTZ,
  "note" TEXT,
  "paid_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "order_items" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "order_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "variant_id" UUID NOT NULL,
  "product_name" VARCHAR(255) NOT NULL,
  "variant_name" VARCHAR(255) NOT NULL,
  "quantity" INT NOT NULL CHECK (quantity > 0),
  "unit_price" NUMERIC(12,0) NOT NULL CHECK (unit_price >= 0),
  "discount_amount" NUMERIC(12,0) NOT NULL CHECK (discount_amount >= 0) DEFAULT 0,
  "total_price" NUMERIC(12,0) NOT NULL CHECK (total_price >= 0)
);

CREATE TABLE "payments" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "order_id" UUID NOT NULL,
  "transaction_id" VARCHAR(255) UNIQUE,
  "gateway" payment_gateway NOT NULL,
  "amount" NUMERIC(12,0) NOT NULL CHECK (amount >= 0),
  "status" payment_status NOT NULL DEFAULT 'pending',
  "gateway_response" JSONB,
  "paid_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "order_status_history" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "order_id" UUID NOT NULL,
  "from_status" order_status,
  "to_status" order_status NOT NULL,
  "changed_by" UUID,
  "note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "custom_orders" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "order_code" VARCHAR(50) UNIQUE NOT NULL,
  "user_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "product_id" UUID,
  "variant_id" UUID,
  "size" VARCHAR(50),
  "flavor" VARCHAR(100),
  "message_on_cake" TEXT,
  "design_note" TEXT,
  "quantity" INT NOT NULL CHECK (quantity > 0) DEFAULT 1,
  "estimated_price" NUMERIC(12,0) CHECK (estimated_price IS NULL OR estimated_price >= 0),
  "final_price" NUMERIC(12,0) CHECK (final_price IS NULL OR final_price >= 0),
  "deposit_amount" NUMERIC(12,0) NOT NULL CHECK (deposit_amount >= 0) DEFAULT 0,
  "remaining_amount" NUMERIC(12,0),
  "payment_status" payment_status NOT NULL DEFAULT 'pending',
  "pickup_at" TIMESTAMPTZ NOT NULL,
  "status" custom_order_status NOT NULL DEFAULT 'pending',
  "staff_note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "sales_invoices" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "invoice_code" VARCHAR(50) UNIQUE NOT NULL,
  "branch_id" UUID NOT NULL,
  "cashier_id" UUID NOT NULL,
  "coupon_id" UUID,
  "subtotal" NUMERIC(12,0) NOT NULL CHECK (subtotal >= 0) DEFAULT 0,
  "discount_amount" NUMERIC(12,0) NOT NULL CHECK (discount_amount >= 0) DEFAULT 0,
  "total_amount" NUMERIC(12,0) NOT NULL CHECK (total_amount >= 0) DEFAULT 0,
  "payment_method" payment_method NOT NULL,
  "payment_status" payment_status NOT NULL DEFAULT 'pending',
  "invoice_status" invoice_status NOT NULL DEFAULT 'completed',
  "note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "sales_invoice_items" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "invoice_id" UUID NOT NULL,
  "variant_id" UUID NOT NULL,
  "product_name" VARCHAR(255) NOT NULL,
  "variant_name" VARCHAR(255) NOT NULL,
  "quantity" INT NOT NULL CHECK (quantity > 0),
  "unit_price" NUMERIC(12,0) NOT NULL CHECK (unit_price >= 0),
  "discount_amount" NUMERIC(12,0) NOT NULL CHECK (discount_amount >= 0) DEFAULT 0,
  "total_price" NUMERIC(12,0) NOT NULL CHECK (total_price >= 0)
);

CREATE TABLE "reviews" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "product_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "order_item_id" UUID,
  "rating" SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  "comment" TEXT,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "is_visible" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "review_images" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "review_id" UUID NOT NULL,
  "image_url" TEXT NOT NULL
);

CREATE TABLE "wishlists" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "user_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "activity_logs" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "user_id" UUID,
  "entity_type" activity_entity NOT NULL,
  "entity_id" UUID NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "old_value" JSONB,
  "new_value" JSONB,
  "ip_address" INET,
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE TABLE "banners" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "title" VARCHAR(255) NOT NULL,
  "image_url" TEXT NOT NULL,
  "link_url" TEXT,
  "sort_order" SMALLINT NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "starts_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now()),
  CONSTRAINT "chk_banner_dates" CHECK (starts_at IS NULL OR expires_at IS NULL OR expires_at > starts_at)
);

CREATE TABLE "notifications" (
  "id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "user_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" notification_type NOT NULL DEFAULT 'system',
  "related_id" UUID,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now())
);

CREATE INDEX "idx_users_email" ON "users" ("email");

CREATE INDEX "idx_users_phone" ON "users" ("phone");

CREATE INDEX "idx_users_branch_id" ON "users" ("branch_id");

CREATE INDEX "idx_users_role" ON "users" ("role");

CREATE INDEX "idx_user_addresses_user" ON "user_addresses" ("user_id");

CREATE INDEX "idx_branches_ll" ON "branches" USING GIST (ll_to_earth(latitude::float8, longitude::float8));

CREATE INDEX "idx_branches_status" ON "branches" ("status");

CREATE UNIQUE INDEX ON "user_branch_roles" ("user_id", "branch_id", "role");

CREATE INDEX "idx_user_branch_roles_user" ON "user_branch_roles" ("user_id");

CREATE INDEX "idx_user_branch_roles_branch" ON "user_branch_roles" ("branch_id");

CREATE UNIQUE INDEX ON "branch_opening_hours" ("branch_id", "day_of_week");

CREATE INDEX "idx_branch_opening_hours_branch" ON "branch_opening_hours" ("branch_id");

CREATE INDEX "idx_branch_images_branch" ON "branch_images" ("branch_id");

CREATE INDEX "idx_products_category" ON "products" ("category_id");

CREATE INDEX "idx_products_type" ON "products" ("product_type");

CREATE INDEX "idx_products_slug" ON "products" ("slug");

CREATE INDEX "idx_products_name_trgm" ON "products" USING GIN ("name" gin_trgm_ops);

CREATE INDEX "idx_products_active" ON "products" ("is_active");

CREATE INDEX "idx_product_images_product" ON "product_images" ("product_id");

CREATE INDEX "idx_variants_product" ON "product_variants" ("product_id");

CREATE INDEX "idx_variants_status" ON "product_variants" ("status");

CREATE INDEX "idx_variants_sku" ON "product_variants" ("sku");

CREATE INDEX "idx_product_tag_map_tag" ON "product_tag_map" ("tag_id");

CREATE UNIQUE INDEX ON "combo_items" ("combo_product_id", "child_product_id", "child_variant_id");

CREATE INDEX "idx_combo_items_combo" ON "combo_items" ("combo_product_id");

CREATE INDEX "idx_combo_items_child" ON "combo_items" ("child_product_id");

CREATE INDEX "idx_combo_items_child_variant" ON "combo_items" ("child_variant_id");

CREATE UNIQUE INDEX ON "branch_variant_stocks" ("branch_id", "variant_id");

CREATE INDEX "idx_stock_branch" ON "branch_variant_stocks" ("branch_id");

CREATE INDEX "idx_stock_variant" ON "branch_variant_stocks" ("variant_id");

CREATE INDEX "idx_stock_low" ON "branch_variant_stocks" ("branch_id", "variant_id");

CREATE UNIQUE INDEX ON "branch_ingredient_stocks" ("branch_id", "ingredient_id");

CREATE INDEX "idx_ingredient_stock_branch" ON "branch_ingredient_stocks" ("branch_id");

CREATE INDEX "idx_ingredient_stock_ingr" ON "branch_ingredient_stocks" ("ingredient_id");

CREATE INDEX "idx_ingredient_stock_low" ON "branch_ingredient_stocks" ("branch_id", "ingredient_id");

CREATE INDEX "idx_variant_ingr_variant" ON "variant_ingredients" ("variant_id");

CREATE INDEX "idx_variant_ingr_ingr" ON "variant_ingredients" ("ingredient_id");

CREATE INDEX "idx_stock_batches_branch" ON "stock_batches" ("branch_id");

CREATE INDEX "idx_stock_batches_ingr" ON "stock_batches" ("ingredient_id");

CREATE INDEX "idx_stock_batches_variant" ON "stock_batches" ("variant_id");

CREATE INDEX "idx_stock_batches_expiry" ON "stock_batches" ("expiry_date");

CREATE INDEX "idx_inv_txn_branch" ON "inventory_transactions" ("branch_id");

CREATE INDEX "idx_inv_txn_ingredient" ON "inventory_transactions" ("ingredient_id");

CREATE INDEX "idx_inv_txn_variant" ON "inventory_transactions" ("variant_id");

CREATE INDEX "idx_inv_txn_batch" ON "inventory_transactions" ("stock_batch_id");

CREATE INDEX "idx_inv_txn_ref" ON "inventory_transactions" ("reference_type", "reference_id");

CREATE INDEX "idx_inv_txn_created" ON "inventory_transactions" ("created_at");

CREATE INDEX "idx_coupons_code" ON "coupons" ("code");

CREATE INDEX "idx_coupons_status" ON "coupons" ("status");

CREATE INDEX "idx_coupons_scope" ON "coupons" ("coupon_scope");

CREATE INDEX "idx_coupons_dates" ON "coupons" ("starts_at", "expires_at");

CREATE UNIQUE INDEX ON "coupon_targets" ("coupon_id", "target_type", "target_id");

CREATE INDEX "idx_coupon_targets_coupon" ON "coupon_targets" ("coupon_id");

CREATE INDEX "idx_coupon_targets_lookup" ON "coupon_targets" ("target_type", "target_id");

CREATE INDEX "idx_coupon_usages_user" ON "coupon_usages" ("user_id");

CREATE INDEX "idx_coupon_usages_ref" ON "coupon_usages" ("reference_type", "reference_id");

CREATE INDEX "idx_carts_user" ON "carts" ("user_id");

CREATE INDEX "idx_carts_session" ON "carts" ("session_id");

CREATE INDEX "idx_carts_branch" ON "carts" ("branch_id");

CREATE UNIQUE INDEX ON "cart_items" ("cart_id", "variant_id");

CREATE INDEX "idx_cart_items_cart" ON "cart_items" ("cart_id");

CREATE INDEX "idx_cart_items_variant" ON "cart_items" ("variant_id");

CREATE INDEX "idx_orders_user" ON "orders" ("user_id");

CREATE INDEX "idx_orders_branch" ON "orders" ("branch_id");

CREATE INDEX "idx_orders_status" ON "orders" ("order_status");

CREATE INDEX "idx_orders_created" ON "orders" ("created_at");

CREATE INDEX "idx_orders_code" ON "orders" ("order_code");

CREATE INDEX "idx_orders_type" ON "orders" ("order_type");

CREATE INDEX "idx_orders_fulfillment" ON "orders" ("fulfillment_type");

CREATE INDEX "idx_order_items_order" ON "order_items" ("order_id");

CREATE INDEX "idx_order_items_variant" ON "order_items" ("variant_id");

CREATE INDEX "idx_payments_order" ON "payments" ("order_id");

CREATE INDEX "idx_payments_status" ON "payments" ("status");

CREATE INDEX "idx_order_status_history_order" ON "order_status_history" ("order_id");

CREATE INDEX "idx_order_status_history_created" ON "order_status_history" ("created_at");

CREATE INDEX "idx_custom_orders_branch" ON "custom_orders" ("branch_id");

CREATE INDEX "idx_custom_orders_user" ON "custom_orders" ("user_id");

CREATE INDEX "idx_custom_orders_pickup" ON "custom_orders" ("pickup_at");

CREATE INDEX "idx_custom_orders_variant" ON "custom_orders" ("variant_id");

CREATE INDEX "idx_invoices_branch" ON "sales_invoices" ("branch_id");

CREATE INDEX "idx_invoices_cashier" ON "sales_invoices" ("cashier_id");

CREATE INDEX "idx_invoices_created" ON "sales_invoices" ("created_at");

CREATE INDEX "idx_invoices_status" ON "sales_invoices" ("invoice_status");

CREATE INDEX "idx_sales_invoice_items_invoice" ON "sales_invoice_items" ("invoice_id");

CREATE INDEX "idx_sales_invoice_items_variant" ON "sales_invoice_items" ("variant_id");

CREATE UNIQUE INDEX ON "reviews" ("user_id", "order_item_id");

CREATE INDEX "idx_reviews_product" ON "reviews" ("product_id");

CREATE INDEX "idx_reviews_user" ON "reviews" ("user_id");

CREATE UNIQUE INDEX ON "wishlists" ("user_id", "product_id");

CREATE INDEX "idx_wishlists_user" ON "wishlists" ("user_id");

CREATE INDEX "idx_activity_logs_user" ON "activity_logs" ("user_id");

CREATE INDEX "idx_activity_logs_entity" ON "activity_logs" ("entity_type", "entity_id");

CREATE INDEX "idx_activity_logs_created" ON "activity_logs" ("created_at");

CREATE INDEX "idx_banners_active" ON "banners" ("is_active");

CREATE INDEX "idx_notif_user_unread" ON "notifications" ("user_id");

COMMENT ON TABLE "users" IS 'Tài khoản người dùng: customer, staff, cashier, manager, admin';

COMMENT ON TABLE "branches" IS 'Chi nhánh cửa hàng với tọa độ GPS cho Map';

COMMENT ON TABLE "user_branch_roles" IS 'Phân quyền nhân viên/quản lý theo nhiều chi nhánh';

COMMENT ON TABLE "branch_opening_hours" IS 'Giờ mở cửa linh hoạt từng ngày trong tuần';

COMMENT ON TABLE "products" IS 'Sản phẩm cha, không lưu giá/tồn kho trực tiếp';

COMMENT ON TABLE "product_variants" IS 'Biến thể sản phẩm - đơn vị bán thực tế, có giá và SKU';

COMMENT ON TABLE "combo_items" IS 'Danh sách sản phẩm con trong một combo';

COMMENT ON TABLE "branch_variant_stocks" IS 'Tồn kho tổng theo từng chi nhánh và biến thể';

COMMENT ON TABLE "ingredients" IS 'Danh mục nguyên liệu master, không lưu stock toàn hệ thống';

COMMENT ON TABLE "branch_ingredient_stocks" IS 'Tồn kho tổng nguyên liệu theo từng chi nhánh';

COMMENT ON TABLE "variant_ingredients" IS 'Công thức nguyên liệu cần thiết để làm ra một đơn vị variant';

COMMENT ON TABLE "stock_batches" IS 'Lô nguyên liệu hoặc thành phẩm theo chi nhánh, phục vụ hạn sử dụng';

COMMENT ON TABLE "inventory_transactions" IS 'Lịch sử xuất/nhập/điều chỉnh kho nguyên liệu và variant';

COMMENT ON TABLE "coupons" IS 'Coupon/voucher hỗ trợ nhiều cấp: order/product/category/variant/branch';

COMMENT ON TABLE "coupon_targets" IS 'Target cụ thể của coupon';

COMMENT ON TABLE "coupon_usages" IS 'Lịch sử sử dụng coupon cho order hoặc sales invoice';

COMMENT ON TABLE "orders" IS 'Đơn hàng online/pickup/delivery';

COMMENT ON TABLE "order_status_history" IS 'Lịch sử thay đổi trạng thái đơn hàng';

COMMENT ON TABLE "custom_orders" IS 'Đơn đặt bánh sinh nhật/sự kiện theo yêu cầu';

COMMENT ON TABLE "sales_invoices" IS 'Hóa đơn bán hàng tại quầy POS';

COMMENT ON TABLE "activity_logs" IS 'Audit log toàn hệ thống';

ALTER TABLE "user_addresses" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "users" ADD CONSTRAINT "fk_users_branch" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_branch_roles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_branch_roles" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "branch_opening_hours" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "branch_images" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "categories" ADD FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "products" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_images" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_variants" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_tag_map" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_tag_map" ADD FOREIGN KEY ("tag_id") REFERENCES "product_tags" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "combo_items" ADD FOREIGN KEY ("combo_product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "combo_items" ADD FOREIGN KEY ("child_product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "combo_items" ADD FOREIGN KEY ("child_variant_id") REFERENCES "product_variants" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "branch_variant_stocks" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "branch_variant_stocks" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "branch_ingredient_stocks" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "branch_ingredient_stocks" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "variant_ingredients" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "variant_ingredients" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_batches" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_batches" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_batches" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_batches" ADD FOREIGN KEY ("imported_by") REFERENCES "users" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory_transactions" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory_transactions" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory_transactions" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory_transactions" ADD FOREIGN KEY ("stock_batch_id") REFERENCES "stock_batches" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory_transactions" ADD FOREIGN KEY ("performed_by") REFERENCES "users" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "coupon_targets" ADD FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "coupon_usages" ADD FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "coupon_usages" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "carts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "carts" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cart_items" ADD FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cart_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cart_items" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD FOREIGN KEY ("address_id") REFERENCES "user_addresses" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_items" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payments" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_status_history" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_status_history" ADD FOREIGN KEY ("changed_by") REFERENCES "users" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "custom_orders" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "custom_orders" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "custom_orders" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "custom_orders" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sales_invoices" ADD FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sales_invoices" ADD FOREIGN KEY ("cashier_id") REFERENCES "users" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sales_invoices" ADD FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sales_invoice_items" ADD FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sales_invoice_items" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("order_item_id") REFERENCES "order_items" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "review_images" ADD FOREIGN KEY ("review_id") REFERENCES "reviews" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "wishlists" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "wishlists" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "activity_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
