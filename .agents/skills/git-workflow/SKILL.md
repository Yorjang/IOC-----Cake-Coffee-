---
name: git-workflow
description: Chuẩn mực quản lý mã nguồn bằng Git (Git Workflow).
---

# Git Workflow Conventions

1. **Commit Messages**:
   - Sử dụng chuẩn Conventional Commits.
   - Format: `<type>(<scope>): <subject>`
   - Các `type` hợp lệ: `feat` (tính năng), `fix` (sửa lỗi), `docs` (tài liệu), `style` (format code), `refactor` (tái cấu trúc), `test` (kiểm thử), `chore` (cấu hình).
   - Ví dụ: `feat(cart): add merged session logic`

2. **Branching Model**:
   - `main`: Nhánh production, chứa code ổn định. Không commit trực tiếp lên main.
   - `develop`: Nhánh chứa code đang phát triển.
   - `feature/<name>`: Nhánh phát triển tính năng mới.
   - `bugfix/<name>`: Nhánh sửa lỗi.

3. **Pull Requests**:
   - PR phải nhỏ gọn, tập trung vào 1 vấn đề (Single Responsibility).
   - Phải tự review code của bản thân trước khi tạo PR.
