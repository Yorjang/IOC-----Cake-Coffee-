---
name: typescript-standards
description: Tiêu chuẩn khi viết TypeScript trong dự án Frontend và Backend.
---

# TypeScript Standards

1. **Khuyến khích sử dụng Interfaces thay vì Types**:
   - Sử dụng `interface` cho việc khai báo cấu trúc Object, Prop Types, Response Types để tận dụng khả năng Declaration Merging và dễ dàng extends.
   - Chỉ dùng `type` cho Union Types, Tuples, hoặc Mapped Types.

2. **Tránh lạm dụng `any`**:
   - Hạn chế tối đa việc sử dụng `any`. Nếu chưa rõ kiểu dữ liệu, ưu tiên sử dụng `unknown` hoặc `Record<string, unknown>`.
   - Nếu phải dùng `any` trong quá trình Refactor nhanh (như `err: any`), phải đánh dấu FIXME hoặc TO-DO để định nghĩa lại sau.

3. **Chặt chẽ với Nullable và Optional**:
   - Tận dụng triệt để Optional Chaining (`?.`) và Nullish Coalescing (`??`) để tránh các lỗi undefined crash ứng dụng.
   - Khi định nghĩa API Response, các trường có thể null phải được khai báo rõ ràng (ví dụ: `imageUrl: string | null`).

4. **Định nghĩa Tên Rõ Ràng**:
   - Prefix tên các Interface Props của React components bằng tên Component + `Props` (VD: `AdminProductTableProps`).
   - PascalCase cho Tên Interface/Type/Enum. camelCase cho Tên biến/Hàm.
