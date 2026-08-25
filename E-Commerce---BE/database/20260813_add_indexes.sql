-- Indexes cho bảng orders
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_shipper_id ON orders(shipper_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_cod_remittance_id ON orders(cod_remittance_id);

-- Indexes cho bảng cod_remittances
CREATE INDEX IF NOT EXISTS idx_cod_remittances_shipper_status ON cod_remittances(shipper_id, status);
CREATE INDEX IF NOT EXISTS idx_cod_remittances_created_at ON cod_remittances(created_at);

-- Indexes cho bảng delivery_logs
CREATE INDEX IF NOT EXISTS idx_delivery_logs_order_id ON delivery_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_shipper_id ON delivery_logs(shipper_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_created_at ON delivery_logs(created_at);
