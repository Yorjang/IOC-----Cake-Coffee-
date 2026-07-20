---
name: testing-standards
description: Các nguyên tắc và phương pháp kiểm thử (Testing) cho dự án.
---

# Testing Standards

1. **Unit Testing**:
   - Sử dụng Jest hoặc Vitest.
   - Tập trung viết test cho các tầng logic thuần túy trước: `Utils` (Pure Functions) và `Custom Hooks` (State Management).
   - Backend: Viết Unit test cho các `Services` và `Guards` / `Interceptors`.

2. **Integration Testing**:
   - Frontend: Kiểm tra sự tương tác giữa các Components và Contexts (sử dụng React Testing Library).
   - Backend: Dùng Supertest để giả lập HTTP requests vào Controllers, xác minh Response có theo chuẩn API hay không.

3. **Nguyên tắc viết Test (AAA)**:
   - **Arrange**: Chuẩn bị dữ liệu giả (mock data), khởi tạo môi trường.
   - **Act**: Gọi hàm / Tương tác UI.
   - **Assert**: Kiểm chứng kết quả đầu ra (expect).
   - Tên test case phải rõ ràng theo cấu trúc: `it('should [hành động mong muốn] when [điều kiện]')`.
