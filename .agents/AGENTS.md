# TỔNG QUAN DỰ ÁN (PROJECT INFO)

Dự án này là hệ thống E-Commerce (Thương mại điện tử) bán Bánh và Cà Phê (Cake & Coffee).
Hệ thống bao gồm 2 phần chính:
- **Frontend (FE)**: Xây dựng bằng ReactJS (Vite).
- **Backend (BE)**: Xây dựng bằng NestJS + TypeORM + PostgreSQL.

Mục tiêu cốt lõi của dự án là tính ổn định, dễ bảo trì và trải nghiệm người dùng tối ưu (Aesthetics & Performance).

# QUY TẮC CHUNG CHO AI AGENT (RULES)

Khi AI Agent (Antigravity/Gemini) làm việc trong dự án này, BẮT BUỘC tuân thủ các nguyên tắc sau:

1. **Hiểu rõ Kiến trúc trước khi Code**: 
   - Không được viết code trực tiếp vào các file quá lớn (Mega-components) mà chưa cân nhắc chia nhỏ.
   - Tuân thủ nguyên tắc Single Responsibility Principle (SRP) ở cả Frontend (chia Hooks/UI) và Backend (chia Service/Controller).

2. **Cẩn trọng với Code hiện tại**:
   - Khi Refactor, tuyệt đối không được làm vỡ các tính năng hiện có.
   - Luôn sao lưu (nếu cần) hoặc chia theo từng Phase nhỏ để nghiệm thu. Nếu thấy rủi ro (như file > 1000 dòng), phải dừng lại và đề xuất với người dùng, không được cố chấp tự động Replace.

3. **Luôn kiểm tra Build**:
   - Mỗi khi thay đổi cấu trúc Frontend, hãy chạy `npm run build` để kiểm tra lỗi TypeScript hoặc sai đường dẫn Import.

4. **Sử dụng đúng công cụ**:
   - Ưu tiên sử dụng `view_file` để đọc code.
   - Ưu tiên sử dụng `replace_file_content` hoặc `multi_replace_file_content` thay vì chạy script `sed` hay regex để sửa code.
   - Tuân thủ nghiêm ngặt chuẩn API Response đã thống nhất giữa BE và FE.
