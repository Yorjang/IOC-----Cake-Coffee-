---
name: react-best-practices
description: Quy tắc và chuẩn mực khi viết code ReactJS cho dự án.
---

# React Best Practices

1. **Phân tách State và View (Smart vs Dumb Components)**:
   - Các logic phức tạp, state management phải được đưa vào Custom Hooks.
   - Component chỉ nên nhận props và render UI. Tránh lạm dụng `useEffect` bên trong UI Component.

2. **Giới hạn số dòng code (Component Limits)**:
   - Một file component lý tưởng không nên vượt quá **300 dòng**.
   - Nếu vượt quá, hãy tự hỏi: "Liệu mình có đang nhồi nhét quá nhiều trách nhiệm vào component này không?" và tiến hành chia nhỏ (refactor).

3. **Performance Optimization**:
   - Sử dụng `useMemo` cho các phép toán nặng hoặc derived state phức tạp.
   - Sử dụng `useCallback` khi truyền hàm xuống các Child Components để tránh re-render không cần thiết.
   - Hạn chế inline functions và inline objects ở JSX nếu chúng gây ra re-render tốn kém.

4. **Quản lý Context**:
   - Chỉ đưa vào Global Context (như `AuthContext`, `CartContext`) những dữ liệu thực sự cần chia sẻ toàn cục.
   - Tránh đẩy mọi thứ vào Context gây phình to và khó kiểm soát.

5. **Xử lý Side Effects**:
   - Mọi API call bên trong `useEffect` nên có cleanup function nếu cần thiết (hủy fetch, clearTimeout).
   - Đảm bảo khai báo đúng và đủ Dependencies array `[]` để tránh bugs ẩn.
