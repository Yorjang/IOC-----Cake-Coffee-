-- Thêm cột cod_remittance_id vào bảng orders
ALTER TABLE orders
ADD COLUMN cod_remittance_id UUID NULL;

-- Thêm khóa ngoại liên kết tới bảng cod_remittances
ALTER TABLE orders
ADD CONSTRAINT fk_order_cod_remittance
FOREIGN KEY (cod_remittance_id)
REFERENCES cod_remittances (id)
ON DELETE SET NULL;
