---
name: api-conventions
description: Quy chuẩn giao tiếp API giữa Frontend và Backend.
---

# API Conventions

1. **Chuẩn hóa API Response (Backend)**:
   - BE bắt buộc phải trả về format chuẩn thông qua `TransformInterceptor`:
     \`\`\`json
     {
       "success": true,
       "message": "Operation successful",
       "data": { ... }
     }
     \`\`\`
   - Đối với lỗi, BE phải trả về qua `AllExceptionsFilter`:
     \`\`\`json
     {
       "success": false,
       "message": "Error details",
       "error": "Bad Request",
       "statusCode": 400
     }
     \`\`\`

2. **Tiêu thụ API (Frontend)**:
   - Luôn sử dụng hàm `parseRes()` (hoặc tiện ích tương đương) để trích xuất `data` từ chuẩn API Response mới.
   - Luôn sử dụng khối `try / catch` cho mọi thao tác gọi API.
   - Bắt và hiển thị lỗi thân thiện với người dùng (qua toast notifications) dựa trên `err.message` trả về từ server.

3. **Cấu trúc Route (Backend)**:
   - RESTful standards:
     - `GET /resource` (Lấy danh sách)
     - `GET /resource/:id` (Lấy chi tiết)
     - `POST /resource` (Tạo mới)
     - `PATCH /resource/:id` (Cập nhật 1 phần)
     - `DELETE /resource/:id` (Xóa)

4. **Bảo mật & Headers**:
   - Gắn Authorization Header (`Bearer Token`) vào tất cả các routes cần bảo mật.
   - Khi token hết hạn (Status 401), Frontend cần có logic Refresh Token ngầm (Silent Refresh) thay vì văng người dùng ra ngoài ngay lập tức.
