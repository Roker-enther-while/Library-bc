# Hướng dẫn Triển khai (Deployment Guide)

Dự án Thư Viện Văn Học Việt Nam bao gồm 2 phần chính: **Backend (Node.js/Express)** và **Frontend (Next.js)**. 

Dưới đây là các bước để đưa hệ thống lên môi trường online.

---

## 1. Chuẩn bị (Prerequisites)

- **Database**: Sử dụng MongoDB Atlas (Cloud).
- **AI**: Cần có API Key từ [OpenRouter](https://openrouter.ai/).
- **Hình ảnh**: Tài khoản [Cloudinary](https://cloudinary.com/) (Free) để lưu trữ bìa sách.
- **Email**: Tài khoản Gmail và [App Password](https://support.google.com/accounts/answer/185833).

---

## 2. Triển khai Backend (Node.js)

**Gợi ý nền tảng**: Render, Railway, hoặc VPS riêng.

1.  Upload code thư mục `backend` lên host.
2.  Cấu hình các biến môi trường (Environment Variables) dựa trên file `.env.example`:
    -   `MONGO_URI`: Địa chỉ kết nối MongoDB Atlas.
    -   `JWT_SECRET`: Chuỗi bảo mật ngẫu nhiên.
    -   `FRONTEND_URL`: URL của Frontend sau khi triển khai (ví dụ: `https://thuvien.vercel.app`).
    -   `OPENROUTER_API_KEY`, `CLOUDINARY_*`, `EMAIL_*`.
3.  Lệnh khởi chạy: `npm install` và `npm start`.

---

## 3. Triển khai Frontend (Next.js)

**Gợi ý nền tảng**: Vercel (Khuyên dùng), Netlify.

1.  Kết nối kho lưu trữ (Repository) với Vercel.
2.  Cấu hình biến môi trường trong Vercel Settings:
    -   `NEXT_PUBLIC_API_URL`: URL của Backend đã triển khai (ví dụ: `https://thuvien-api.onrender.com`).
3.  Vercel sẽ tự động thực hiện: `npm run build` và deploy.

---

## 4. Lưu ý quan trọng (Important Notes)

-   **CORS**: Nếu Frontend không gọi được API, hãy kiểm tra lại biến `FRONTEND_URL` ở Backend xem đã khớp chính xác chưa (không được thừa dấu `/` ở cuối).
-   **Chỉ mục tìm kiếm (Text Index)**: Sau khi kết nối Database mới, hãy đảm bảo đã tạo Text Index cho các trường `title`, `authorName`, `summary` trong MongoDB để tính năng tìm sách hoạt động.
-   **Bảo mật**: Tuyệt đối không commit file `.env` lên GitHub công khai. Luôn sử dụng `.env.example` làm mẫu.

---

Chúc bạn triển khai thành công! 📚
