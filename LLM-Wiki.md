# LLM-Wiki: Thư viện Văn Học Việt Nam

Đây là tài liệu tham khảo nội bộ (Wiki) dành cho LLM và Dev để nắm bắt toàn bộ kiến trúc, luồng xử lý và các hàm quan trọng của dự án Thư viện.

## 1. Tổng quan Kiến trúc (Architecture)
- **Frontend**: Next.js 16 (App Router), Tailwind CSS. Sử dụng `axios` qua `src/lib/apiClient.ts`.
- **Backend**: Node.js / Express.js.
- **Database**: MongoDB (thông qua Mongoose).
- **Core Pattern**: Backend áp dụng mô hình Route -> Controller -> Service -> Repository (ví dụ: `borrowController` gọi `BorrowService`, `borrowService` gọi `BorrowRepository`).

---

## 2. Các File & Luồng quan trọng nhất (Core Files & Flows)

### 2.1 Backend - Authorization (`backend/src/middleware/auth.js`)
- `protect(req, res, next)`: Middleware giải mã JWT từ header `Authorization: Bearer <token>`. Gắn thông tin người dùng vào `req.user`. Nếu không hợp lệ sẽ trả về 401.
- `adminOnly(req, res, next)`: Middleware kiểm tra `req.user.role`. Chỉ cho phép `admin` hoặc `librarian` tiếp tục.

### 2.2 Backend - Quản lý mượn trả (`backend/src/controllers/borrowController.js`)
File này chịu trách nhiệm lớn nhất trong nghiệp vụ Thư viện (Circulation):
- `createBorrow`: Tạo phiếu mượn sách. Gọi `borrowService.createBorrow(userId, bookId, days, librarianId)` (Librarian ID được lấy từ `req.user`).
- `returnBook`: Trả sách. Gọi `borrowService.returnBook(recordId)`.
- `renewBook`: Gia hạn sách. Nhận `days`, cập nhật ngày trả.
- `getBorrowStats`: Hàm Aggregation MongoDB rất phức tạp lấy số liệu Dashboard: Top sách mượn, lượt mượn/trả 30 ngày, thống kê quá hạn.
- `triggerEmailReminders`: Kích hoạt hàm `sendDueReminders()` từ `cronJobs.js` để gửi email nhắc nhở độc giả.

### 2.3 Backend - AI Services (`backend/src/ai/`)
- Quản lý logic AI (Gemini).
- Bao gồm các module tách biệt như `context.manager.js`, `prompt.builder.js`, `response.formatter.js` và `ai.service.js` để xây dựng bot tư vấn đọc sách.

### 2.4 Frontend - Giao tiếp API (`frontend/src/lib/apiClient.ts`)
Tất cả request ra bên ngoài được gom vào đây:
- Khởi tạo Axios instance truy cập tới `NEXT_PUBLIC_API_URL` hoặc `http://localhost:5000`.
- **Request Interceptor**: Tự động đính kèm Token (ưu tiên `sessionStorage` cho Admin tab, sau đó là `localStorage`).
- **Response Interceptor**: Xử lý lỗi 401 (xóa token tự động khi phiên đăng nhập hết hạn).

### 2.5 Frontend - Thành phần UI chính (`frontend/src/components/admin/AdminModals.tsx`)
- `BookModal`: Có 2 tab là "Thông tin chung" và "Danh sách bản sao". Tương tác với API thêm/sửa sách và quản lý mã vạch (BookItems/Copies) qua hàm `addCopy()` và `deleteCopy()`.
- `BorrowModal`: Lập phiếu mượn. Có 2 chế độ:
  1. Quét mã vạch (gọi `getCopyByBarcode`).
  2. Chọn từ danh sách dropdown.

---

## 3. Bản đồ Quy trình BPMM (Mermaid Flows)

Dưới đây là các sơ đồ BPMN chi tiết để hiểu luồng nghiệp vụ.

### Flow 1: Đăng nhập & Xác thực API (Authentication Flow)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend_AuthRoute
    participant DB_User

    User->>Frontend: Nhập Username/Password & Bấm Đăng nhập
    Frontend->>Backend_AuthRoute: POST /api/auth/login
    Backend_AuthRoute->>DB_User: Find user by username
    alt Không tìm thấy hoặc Sai MK
        DB_User-->>Backend_AuthRoute: Lỗi
        Backend_AuthRoute-->>Frontend: 401 Unauthorized
        Frontend-->>User: Hiển thị lỗi
    else Thành công
        DB_User-->>Backend_AuthRoute: Trả về Hash Password Check OK
        Backend_AuthRoute->>Backend_AuthRoute: Sign JWT Token
        Backend_AuthRoute-->>Frontend: 200 OK + JWT Token + Info
        Frontend->>Frontend: Lưu token vào localStorage/sessionStorage
        Frontend-->>User: Chuyển hướng (Redirect sang Admin/User Home)
    end
```

### Flow 2: Nghiệp vụ Mượn sách (Borrowing Flow)

```mermaid
sequenceDiagram
    actor Librarian
    participant AdminUI
    participant Backend_Borrow
    participant DB_Copy
    participant DB_BorrowRecord

    Librarian->>AdminUI: Mở BorrowModal
    Librarian->>AdminUI: Quét mã vạch sách (Barcode)
    AdminUI->>Backend_Borrow: GET /api/copies/barcode/:barcode
    Backend_Borrow-->>AdminUI: Trả về thông tin sách (Id, Title, Status)
    
    Librarian->>AdminUI: Chọn độc giả & Xác nhận Mượn
    AdminUI->>Backend_Borrow: POST /api/borrows (userId, bookId, days)
    
    Backend_Borrow->>DB_Copy: Kiểm tra số lượng tồn (Available > 0?)
    alt Hết sách (Available = 0)
        DB_Copy-->>Backend_Borrow: Lỗi thiếu kho
        Backend_Borrow-->>AdminUI: 400 Bad Request
        AdminUI-->>Librarian: Báo lỗi hết sách
    else Sẵn sàng
        Backend_Borrow->>DB_BorrowRecord: Tạo BorrowRecord mới (Status: borrowing)
        Backend_Borrow->>DB_Copy: Giảm Available - 1
        DB_Copy-->>Backend_Borrow: Cập nhật thành công
        Backend_Borrow-->>AdminUI: 201 Created (Kèm Record data)
        AdminUI-->>Librarian: Cập nhật UI Thành công
    end
```

### Flow 3: Trả sách và Tính phạt (Return & Fine Calculation)

```mermaid
sequenceDiagram
    actor Librarian
    participant AdminUI
    participant Backend_Borrow
    participant Service_CalculateFine
    participant DB_BorrowRecord

    Librarian->>AdminUI: Chọn "Trả sách" trên Record đang mượn
    AdminUI->>Backend_Borrow: POST /api/borrows/:recordId/return
    
    Backend_Borrow->>DB_BorrowRecord: Lấy thông tin Record (Ngày mượn, Ngày hẹn trả)
    Backend_Borrow->>Service_CalculateFine: Tính số ngày trễ = CurrentTime - Hẹn_Trả
    
    alt Trễ hạn (Cần phạt)
        Service_CalculateFine->>Service_CalculateFine: Fine = Số ngày trễ * Đơn giá phạt
    else Đúng hạn
        Service_CalculateFine->>Service_CalculateFine: Fine = 0
    end
    
    Backend_Borrow->>DB_BorrowRecord: Update {status: "returned", returnDate: Now, fineAmount: Fine}
    Backend_Borrow->>DB_BorrowRecord: Update Book Quantity (+1)
    
    DB_BorrowRecord-->>Backend_Borrow: OK
    Backend_Borrow-->>AdminUI: Trả về Record đã cập nhật
    AdminUI-->>Librarian: Hiển thị Đã trả (Cảnh báo đóng phạt nếu Fine > 0)
```

---
*Wiki này được thiết kế để LLM đọc và hiểu ngữ cảnh sâu sắc trước khi thực hiện các yêu cầu debug sửa lỗi logic backend hoặc xây dựng API frontend mới.*
