BEGIN;

WITH parent_categories(name, slug, sort_order) AS (
  VALUES
    ('Bánh ngọt', 'banh-ngot', 1),
    ('Bánh sinh nhật', 'banh-sinh-nhat', 2),
    ('Pastry & bánh ăn nhẹ', 'pastry-banh-an-nhe', 3),
    ('Bánh mặn', 'banh-man', 4),
    ('Cà phê', 'ca-phe', 5),
    ('Trà & đồ uống', 'tra-do-uong', 6),
    ('Combo', 'combo', 7),
    ('Hộp quà', 'hop-qua', 8)
)
INSERT INTO categories (id, parent_id, name, slug, sort_order, is_active)
SELECT uuid_generate_v4(), NULL, name, slug, sort_order, true
FROM parent_categories
ON CONFLICT (name) DO UPDATE
SET parent_id = NULL,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

WITH child_categories(parent_name, name, slug, sort_order) AS (
  VALUES
    ('Bánh ngọt', 'Bánh mousse', 'banh-mousse', 1),
    ('Bánh ngọt', 'Cheesecake', 'cheesecake', 2),
    ('Bánh ngọt', 'Tiramisu', 'tiramisu', 3),
    ('Bánh ngọt', 'Bánh cuộn và bông lan', 'banh-cuon-va-bong-lan', 4),
    ('Bánh sinh nhật', 'Bánh kem sinh nhật', 'banh-kem-sinh-nhat', 1),
    ('Bánh sinh nhật', 'Bánh đặt theo yêu cầu', 'banh-dat-theo-yeu-cau', 2),
    ('Pastry & bánh ăn nhẹ', 'Croissant', 'croissant', 1),
    ('Pastry & bánh ăn nhẹ', 'Donut', 'donut', 2),
    ('Pastry & bánh ăn nhẹ', 'Muffin', 'muffin', 3),
    ('Pastry & bánh ăn nhẹ', 'Cookies', 'cookies', 4),
    ('Pastry & bánh ăn nhẹ', 'Macaron', 'macaron', 5),
    ('Bánh mặn', 'Bánh mì mặn', 'banh-mi-man', 1),
    ('Bánh mặn', 'Croissant mặn', 'croissant-man', 2),
    ('Bánh mặn', 'Quiche', 'quiche', 3),
    ('Cà phê', 'Espresso', 'espresso', 1),
    ('Cà phê', 'Cà phê Việt Nam', 'ca-phe-viet-nam', 2),
    ('Trà & đồ uống', 'Trà trái cây', 'tra-trai-cay', 1),
    ('Trà & đồ uống', 'Trà sữa', 'tra-sua', 2),
    ('Trà & đồ uống', 'Matcha', 'matcha', 3),
    ('Trà & đồ uống', 'Chocolate', 'chocolate', 4),
    ('Trà & đồ uống', 'Soda', 'soda', 5),
    ('Trà & đồ uống', 'Đá xay', 'da-xay', 6),
    ('Combo', 'Combo bánh và cà phê', 'combo-banh-va-ca-phe', 1),
    ('Combo', 'Combo nhóm', 'combo-nhom', 2),
    ('Hộp quà', 'Hộp bánh', 'hop-banh', 1),
    ('Hộp quà', 'Sweet Box', 'sweet-box', 2),
    ('Hộp quà', 'Set quà', 'set-qua', 3)
),
resolved_children AS (
  SELECT
    parent.id AS parent_id,
    child.name,
    child.slug,
    child.sort_order
  FROM child_categories child
  JOIN categories parent ON parent.name = child.parent_name
)
INSERT INTO categories (id, parent_id, name, slug, sort_order, is_active)
SELECT uuid_generate_v4(), parent_id, name, slug, sort_order, true
FROM resolved_children
ON CONFLICT (name) DO UPDATE
SET parent_id = EXCLUDED.parent_id,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

COMMIT;
