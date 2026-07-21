---
name: frontend-architecture
description: Kiến trúc thư mục và luồng dữ liệu chuẩn (Architecture Decision Rules) cho dự án Frontend.
---

# Architecture Decision Rules (Frontend)

Khi triển khai một tính năng mới, AI Agent BẮT BUỘC phải tuân thủ luồng dữ liệu một chiều (Unidirectional flow) và phân chia các lớp (layers) như sau. Tuyệt đối không được nhảy cóc (skip layers).

## Flow of Data
\`\`\`text
Page
  ↓
Feature
  ↓
Hook
  ↓
Service
  ↓
API
\`\`\`

## Trách nhiệm của từng Layer

1. **Pages (`src/app/pages/`)**:
   - Chỉ dùng để sắp xếp (orchestrate) các features.
   - Không chứa business logic.
   - Trả về cấu trúc Layout chung.

2. **Features (`src/app/features/`)**:
   - Chứa Business Logic cốt lõi của tính năng.
   - Gom nhóm tất cả Hooks, UI con, Types liên quan đến tính năng đó vào cùng một thư mục.

3. **Components (`src/app/components/` hoặc `features/<name>/ui/`)**:
   - Chỉ chịu trách nhiệm render UI (Dumb components).
   - Nhận dữ liệu qua Props. Không tự gọi API.

4. **Hooks (`features/<name>/hooks/` hoặc `hooks/`)**:
   - Quản lý trạng thái có thể tái sử dụng (Reusable State).
   - Đứng giữa Component và Service để xử lý side-effects (useEffect, useState).

5. **Services (`src/services/` hoặc `features/<name>/services/`)**:
   - Chịu trách nhiệm format, chuẩn bị payload và giao tiếp với Backend.
   - Tách biệt hoàn toàn khỏi React Lifecycle (không dùng hooks trong service).

6. **Utils (`src/utils/`)**:
   - Chứa các pure functions (hàm thuần túy) không phụ thuộc vào state hay side-effects.

## Quy tắc bắt buộc
- **Tuyệt đối không** nhồi nhét Logic gọi API trực tiếp vào bên trong UI Components.
- **Tuyệt đối không** để Page tự xử lý logic phức tạp. Đẩy logic xuống Custom Hooks hoặc Features.
