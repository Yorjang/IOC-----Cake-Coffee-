-- SEED DATA FOR CAKE & DRINK SHOP
-- Generated automatically via python

-- 1. Insert Categories
INSERT INTO "categories" ("id", "name", "slug", "description", "image_url", "sort_order", "is_active") 
VALUES ('eb62726c-2e68-47fb-939b-2234a5c3b222', 'Cafe', 'cafe', 'Thực đơn cà phê thơm ngon, đậm đà vị truyền thống và hiện đại.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=280&h=180&fit=crop&auto=format', 0, true)
ON CONFLICT ("name") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "categories" ("id", "name", "slug", "description", "image_url", "sort_order", "is_active") 
VALUES ('1b4ec1cb-41a3-4eaf-8ae0-1264828883ae', 'Trà', 'tra', 'Các loại trà thanh mát, giải nhiệt từ trà hoa quả tươi.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=280&h=180&fit=crop&auto=format', 0, true)
ON CONFLICT ("name") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "categories" ("id", "name", "slug", "description", "image_url", "sort_order", "is_active") 
VALUES ('3b6a8781-29f7-4a92-b7c1-60935fa2a43a', 'Bánh mousse', 'banh-mousse', 'Bánh mousse mềm mịn, ngọt thanh mát lạnh.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=280&h=180&fit=crop&auto=format', 0, true)
ON CONFLICT ("name") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "categories" ("id", "name", "slug", "description", "image_url", "sort_order", "is_active") 
VALUES ('ffb5758c-c6c5-4d6c-843b-11d64b687a2e', 'Bánh quy', 'banh-quy', 'Bánh quy giòn tan, béo ngậy vị bơ.', 'https://images.unsplash.com/photo-1590080875852-ba44f83ff2db?w=280&h=180&fit=crop&auto=format', 0, true)
ON CONFLICT ("name") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "categories" ("id", "name", "slug", "description", "image_url", "sort_order", "is_active") 
VALUES ('75186014-eca7-40f9-83eb-a97b6481d16a', 'Bánh sinh nhật', 'banh-sinh-nhat', 'Bánh sinh nhật trang trí lộng lẫy cho ngày đặc biệt.', 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=280&h=180&fit=crop&auto=format', 0, true)
ON CONFLICT ("name") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "categories" ("id", "name", "slug", "description", "image_url", "sort_order", "is_active") 
VALUES ('0758f406-2c79-40f1-aac1-d845e1e13f3b', 'Combo', 'combo', 'Các gói combo ưu đãi tiết kiệm giữa bánh và nước.', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=280&h=180&fit=crop&auto=format', 0, true)
ON CONFLICT ("name") DO UPDATE SET "image_url" = EXCLUDED."image_url";

-- 2. Insert Products
INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('3d1059c0-3cae-48a4-bb3c-14af47ef86fe', 'eb62726c-2e68-47fb-939b-2234a5c3b222', 'Cafe Đen Đá', 'cafe-den-da', 'Cà phê đen đá đậm đà hương vị Robusta Việt Nam.', 'Hạt Robusta xay nguyên chất', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&fit=crop', 'coffee'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('35018ec5-ea51-4377-aa56-27a98ee7ef96', 'eb62726c-2e68-47fb-939b-2234a5c3b222', 'Cafe Sữa Đá', 'cafe-sua-da', 'Cà phê sữa đá pha phin truyền thống thơm ngọt.', 'Hạt cà phê, sữa đặc', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&fit=crop', 'coffee'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('83d2ba41-4bdb-4eb1-b33d-5a571e779cfb', 'eb62726c-2e68-47fb-939b-2234a5c3b222', 'Cafe Latte', 'cafe-latte', 'Cà phê Latte thơm béo nhẹ nhàng phong cách Ý.', 'Espresso, sữa nóng, bọt sữa', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&fit=crop', 'coffee'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('86f5d0d9-f8d1-4ae4-8d95-7de67ce01421', 'eb62726c-2e68-47fb-939b-2234a5c3b222', 'Cold Brew', 'cold-brew', 'Cà phê ủ lạnh thanh mát, ít chua, vị mượt mà.', 'Hạt Arabica ủ lạnh 16 tiếng', 'https://images.unsplash.com/photo-1517959105821-eaf2591984ca?w=600&fit=crop', 'coffee'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('bd6c85d6-32f7-48d1-9ad0-62acccd674e1', '1b4ec1cb-41a3-4eaf-8ae0-1264828883ae', 'Trà đào cam sả', 'tra-dao-cam-sa', 'Trà đào thơm nức kết hợp vị cam chua ngọt và hương sả nồng nàn.', 'Trà đen, đào miếng, cam tươi, sả', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&fit=crop', 'drink'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('6728c462-0b0b-4008-a058-3a9c52008510', '1b4ec1cb-41a3-4eaf-8ae0-1264828883ae', 'Matcha Latte', 'matcha-latte', 'Trà xanh Uji Nhật Bản nguyên chất pha cùng sữa tươi.', 'Bột matcha Nhật, sữa tươi', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&fit=crop', 'drink'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('3fd75585-e88d-431c-a52a-784a6523f453', '1b4ec1cb-41a3-4eaf-8ae0-1264828883ae', 'Trà ô long sen', 'tra-o-long-sen', 'Trà ô long thanh khiết kết hợp hạt sen bùi béo.', 'Trà ô long, hạt sen tươi, nhãn', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&fit=crop', 'drink'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('b09ec2c9-2446-4628-98ee-508829eb4df1', '3b6a8781-29f7-4a92-b7c1-60935fa2a43a', 'Bánh Tiramisu', 'banh-tiramisu', 'Bánh Tiramisu chuẩn vị Ý, đắng nhẹ cacao, béo ngậy phô mai.', 'Mascarpone, cà phê, rượu rum, bột cacao', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&fit=crop', 'cake'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('e9cc030d-266c-4957-bcf5-a250cd0eb6a9', '3b6a8781-29f7-4a92-b7c1-60935fa2a43a', 'Bánh Red Velvet', 'banh-red-velvet', 'Bánh mousse Red Velvet màu đỏ kiêu sa xen lẫn kem phô mai.', 'Cốt bánh nhung đỏ, cream cheese', 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=600&fit=crop', 'cake'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('695193c9-cd20-4051-9337-b3facd6e4c53', '3b6a8781-29f7-4a92-b7c1-60935fa2a43a', 'Bánh mousse xoài', 'banh-mousse-xoai', 'Mousse xoài tươi thanh mát, chua ngọt tự nhiên.', 'Xoài cát tươi, gelatin, whipping cream', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&fit=crop', 'cake'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('67b6372d-91a0-4cee-ae4a-dbb232cd31c2', 'ffb5758c-c6c5-4d6c-843b-11d64b687a2e', 'Bánh quy bơ Pháp', 'banh-quy-bo-phap', 'Bánh quy bơ giòn rụm thơm lừng bơ nhập khẩu.', 'Bơ lạt, bột mì, đường', 'https://images.unsplash.com/photo-1590080875852-ba44f83ff2db?w=600&fit=crop', 'cake'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('11bc2c36-f647-43db-b16c-ffe08e79786e', '75186014-eca7-40f9-83eb-a97b6481d16a', 'Bánh sinh nhật Socola', 'banh-sinh-nhat-socola', 'Bánh sinh nhật phủ lớp kem socola đen nguyên chất sang trọng.', 'Cốt bánh gato, kem socola, trái cây tươi decor', 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=600&fit=crop', 'cake'::product_type, true, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('94d6c7c9-373e-44cc-b4d4-c35d92bd8a5d', '0758f406-2c79-40f1-aac1-d845e1e13f3b', 'Combo Sáng Năng Lượng', 'combo-sang-nang-luong', 'Bao gồm 1 Cafe Sữa Đá và 1 Bánh quy bơ.', 'Cafe sữa đá, bánh quy', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&fit=crop', 'combo'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

INSERT INTO "products" ("id", "category_id", "name", "slug", "description", "ingredients_info", "image_url", "product_type", "requires_note", "is_active") 
VALUES ('1a7b5c37-1d70-4c19-bef1-9047fa97738b', '0758f406-2c79-40f1-aac1-d845e1e13f3b', 'Combo Trà Chiều Thảnh Thơi', 'combo-tra-chieu-thanh-thoi', 'Bao gồm 1 Trà đào cam sả và 1 lát bánh Tiramisu.', 'Trà đào cam sả, bánh Tiramisu', 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600&fit=crop', 'combo'::product_type, false, true)
ON CONFLICT ("slug") DO UPDATE SET "image_url" = EXCLUDED."image_url";

-- 3. Insert Product Variants
INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('242417ba-8190-45d2-9e10-61360b71873b', '3d1059c0-3cae-48a4-bb3c-14af47ef86fe', 'CAFE-DEN-DA-S', 'Cafe Đen Đá - Cỡ Nhỏ', 'Nhỏ', 30000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('99ea99c6-92c9-499f-aeb3-51e49f69a2f0', '3d1059c0-3cae-48a4-bb3c-14af47ef86fe', 'CAFE-DEN-DA-M', 'Cafe Đen Đá - Cỡ Vừa', 'Vừa', 35000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('9500380e-122b-4501-8498-1e7d338e700c', '3d1059c0-3cae-48a4-bb3c-14af47ef86fe', 'CAFE-DEN-DA-L', 'Cafe Đen Đá - Cỡ Lớn', 'Lớn', 45000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('7cf5a5aa-40f4-4224-b269-e2483b23b1ac', '35018ec5-ea51-4377-aa56-27a98ee7ef96', 'CAFE-SUA-DA-S', 'Cafe Sữa Đá - Cỡ Nhỏ', 'Nhỏ', 30000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('5826a3eb-c17a-4330-bcf6-016646981088', '35018ec5-ea51-4377-aa56-27a98ee7ef96', 'CAFE-SUA-DA-M', 'Cafe Sữa Đá - Cỡ Vừa', 'Vừa', 35000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('d863f6e2-5055-4eda-8078-1961a5de24d8', '35018ec5-ea51-4377-aa56-27a98ee7ef96', 'CAFE-SUA-DA-L', 'Cafe Sữa Đá - Cỡ Lớn', 'Lớn', 45000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('8f38193e-9bdb-41bc-b103-a706e293ddfe', '83d2ba41-4bdb-4eb1-b33d-5a571e779cfb', 'CAFE-LATTE-S', 'Cafe Latte - Cỡ Nhỏ', 'Nhỏ', 40000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('c6aea19b-e186-4b82-a80d-095de3b31ac2', '83d2ba41-4bdb-4eb1-b33d-5a571e779cfb', 'CAFE-LATTE-M', 'Cafe Latte - Cỡ Vừa', 'Vừa', 45000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('40bffe7a-24fe-4949-b79a-c28595c8d83b', '83d2ba41-4bdb-4eb1-b33d-5a571e779cfb', 'CAFE-LATTE-L', 'Cafe Latte - Cỡ Lớn', 'Lớn', 55000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('7f50382b-2319-4ffc-a70f-b2367a8f4b05', '86f5d0d9-f8d1-4ae4-8d95-7de67ce01421', 'COLD-BREW-S', 'Cold Brew - Cỡ Nhỏ', 'Nhỏ', 50000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('69b06cd9-d534-41bb-b6cc-0377b4939f04', '86f5d0d9-f8d1-4ae4-8d95-7de67ce01421', 'COLD-BREW-M', 'Cold Brew - Cỡ Vừa', 'Vừa', 55000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('d85fe3ff-d297-4692-89cf-91c5cf28ca7b', '86f5d0d9-f8d1-4ae4-8d95-7de67ce01421', 'COLD-BREW-L', 'Cold Brew - Cỡ Lớn', 'Lớn', 65000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('5eae4076-a492-4abc-b339-7577e0f96d9e', 'bd6c85d6-32f7-48d1-9ad0-62acccd674e1', 'TRA-DAO-CAM-SA-S', 'Trà đào cam sả - Cỡ Nhỏ', 'Nhỏ', 30000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('0016a611-afd3-47a4-a224-601e55252fe2', 'bd6c85d6-32f7-48d1-9ad0-62acccd674e1', 'TRA-DAO-CAM-SA-M', 'Trà đào cam sả - Cỡ Vừa', 'Vừa', 35000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('a92766d6-42dc-4552-a737-7496dce92725', 'bd6c85d6-32f7-48d1-9ad0-62acccd674e1', 'TRA-DAO-CAM-SA-L', 'Trà đào cam sả - Cỡ Lớn', 'Lớn', 45000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('799f5b09-dcb8-4325-959e-adebb7627dfe', '6728c462-0b0b-4008-a058-3a9c52008510', 'MATCHA-LATTE-S', 'Matcha Latte - Cỡ Nhỏ', 'Nhỏ', 40000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('e0191698-0719-4ba5-b7d8-8cfb47437f78', '6728c462-0b0b-4008-a058-3a9c52008510', 'MATCHA-LATTE-M', 'Matcha Latte - Cỡ Vừa', 'Vừa', 45000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('351a11be-7932-4044-b956-1f90d94f8c6f', '6728c462-0b0b-4008-a058-3a9c52008510', 'MATCHA-LATTE-L', 'Matcha Latte - Cỡ Lớn', 'Lớn', 55000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('d7eecad3-d542-4ed2-be48-1a188f40fbff', '3fd75585-e88d-431c-a52a-784a6523f453', 'TRA-O-LONG-SEN-S', 'Trà ô long sen - Cỡ Nhỏ', 'Nhỏ', 30000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('e28f5904-4691-462a-a243-5144fb91201c', '3fd75585-e88d-431c-a52a-784a6523f453', 'TRA-O-LONG-SEN-M', 'Trà ô long sen - Cỡ Vừa', 'Vừa', 35000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('b74010d9-2c3d-4ab3-b189-925b7b8571cb', '3fd75585-e88d-431c-a52a-784a6523f453', 'TRA-O-LONG-SEN-L', 'Trà ô long sen - Cỡ Lớn', 'Lớn', 45000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('aaf7b31a-50c4-4f63-abf9-1a9a454b94a8', 'b09ec2c9-2446-4628-98ee-508829eb4df1', 'BANH-TIRAMISU-SLICE', 'Bánh Tiramisu - Một Lát', 'Một Lát', 45000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('442e533a-1fcf-4b1a-8b4c-7d90f10cae4d', 'b09ec2c9-2446-4628-98ee-508829eb4df1', 'BANH-TIRAMISU-WHOLE', 'Bánh Tiramisu - Nguyên Ổ', 'Nguyên Ổ', 225000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('c73811a3-45b0-4ab7-9a3d-b900a65f2c03', 'e9cc030d-266c-4957-bcf5-a250cd0eb6a9', 'BANH-RED-VELVET-SLICE', 'Bánh Red Velvet - Một Lát', 'Một Lát', 55000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('2b591017-d462-4460-9096-005c50a7c9b7', 'e9cc030d-266c-4957-bcf5-a250cd0eb6a9', 'BANH-RED-VELVET-WHOLE', 'Bánh Red Velvet - Nguyên Ổ', 'Nguyên Ổ', 235000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('c8bac0fc-06f4-43e8-a342-675c63a55d6a', '695193c9-cd20-4051-9337-b3facd6e4c53', 'BANH-MOUSSE-XOAI-SLICE', 'Bánh mousse xoài - Một Lát', 'Một Lát', 50000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('f9659f66-90bb-4cce-ac2e-3d6f9500223d', '695193c9-cd20-4051-9337-b3facd6e4c53', 'BANH-MOUSSE-XOAI-WHOLE', 'Bánh mousse xoài - Nguyên Ổ', 'Nguyên Ổ', 230000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('ec659ed2-4247-4d50-b27b-039cfad4c495', '67b6372d-91a0-4cee-ae4a-dbb232cd31c2', 'BANH-QUY-BO-PHAP-100G', 'Bánh quy bơ Pháp - Gói 100g', 'Gói 100g', 40000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('bd64d4b4-792b-45a4-90b2-6ea3c2405a65', '67b6372d-91a0-4cee-ae4a-dbb232cd31c2', 'BANH-QUY-BO-PHAP-300G', 'Bánh quy bơ Pháp - Hộp 300g', 'Hộp 300g', 110000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('bcea18b0-b37e-4f5e-8f59-d2a6c98f5f4d', '11bc2c36-f647-43db-b16c-ffe08e79786e', 'BSC-S', 'Bánh sinh nhật Socola - Nhỏ (15cm)', 'Nhỏ (15cm)', 220000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('be4684be-e93c-45fb-a23d-cfcd2604141d', '11bc2c36-f647-43db-b16c-ffe08e79786e', 'BSC-M', 'Bánh sinh nhật Socola - Vừa (20cm)', 'Vừa (20cm)', 350000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('713270f0-e79e-4c99-923a-4fb007e3b39b', '11bc2c36-f647-43db-b16c-ffe08e79786e', 'BSC-L', 'Bánh sinh nhật Socola - Lớn (25cm)', 'Lớn (25cm)', 480000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('817eea14-b73e-4b7b-8620-6ca755a6b653', '94d6c7c9-373e-44cc-b4d4-c35d92bd8a5d', 'COMBO-SANG-NANG-LUONG-DEFAULT', 'Combo Sáng Năng Lượng - Mặc định', 'Mặc định', 70000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

INSERT INTO "product_variants" ("id", "product_id", "sku", "variant_name", "size", "price", "status") 
VALUES ('ef07b533-1185-45e3-b04a-c1d616e9508c', '1a7b5c37-1d70-4c19-bef1-9047fa97738b', 'COMBO-TRA-CHIEU-THANH-THOI-DEFAULT', 'Combo Trà Chiều Thảnh Thơi - Mặc định', 'Mặc định', 85000, 'active'::variant_status)
ON CONFLICT ("sku") DO UPDATE SET "price" = EXCLUDED."price";

