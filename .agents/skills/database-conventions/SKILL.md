---
name: database-conventions
description: Các quy chuẩn thiết kế Database và TypeORM Entities.
---

# Database Conventions

1. **Naming Conventions (TypeORM)**:
   - Tên Table: Sử dụng chữ thường, số nhiều, cách nhau bằng dấu gạch dưới (VD: `users`, `order_items`).
   - Tên Column: Sử dụng `camelCase` trong Entity, nhưng ánh xạ sang `snake_case` trong Database.
   - Luôn định nghĩa rõ ràng type, chiều dài (length), nullable cho từng column.

2. **Khóa chính (Primary Keys) & Foreign Keys**:
   - Khuyến khích sử dụng UUID làm Khóa chính (`@PrimaryGeneratedColumn('uuid')`) thay vì Auto Increment ID để tăng cường bảo mật và tiện lợi khi migrate/merge data.
   - Luôn thiết lập `onDelete: 'CASCADE'` hoặc `onDelete: 'SET NULL'` một cách có ý thức cho các quan hệ (Relations).

3. **Timestamps**:
   - Mọi Entity bắt buộc phải có `createdAt` và `updatedAt`.
   - Đối với dữ liệu không thể xóa cứng (Soft Delete), thêm cột `deletedAt`.

4. **Performance**:
   - Luôn đánh Index (`@Index()`) cho các cột thường xuyên được truy vấn (VD: `email`, `status`, `userId`).
