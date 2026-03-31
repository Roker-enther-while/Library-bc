# Hướng Dẫn Sử Dụng và Cấu Trúc Dự Án Thư Viện

Tài liệu này cung cấp cái nhìn tổng quan về hệ thống Quản lý Thư viện, bao gồm hướng dẫn sử dụng, tổng hợp các tính năng chính và cấu trúc mã nguồn đang được áp dụng trong nền tảng.

## 1. Hướng Dẫn Sử Dụng

### Dành cho Độc giả
- Đăng nhập và Đăng ký: Người dùng có thể tạo tài khoản mới hoặc đăng nhập vào hệ thống để bắt đầu quá trình mượn sách.
- Khám phá Thư viện: Xem danh sách các quyển sách mới, xem theo thể loại, hoặc tìm kiếm sách theo tên và tác giả.
- Mượn sách và Đặt trước (Reservation):
  - Người dùng có thể mượn sách vật lý bằng cách tới thư viện hoặc dùng tính năng QR Borrow (Mượn qua mã QR).
  - Có thể đặt trước sách nếu sách đang được mượn.
- Đọc sách trực tuyến: Hỗ trợ đọc các tài liệu số hoá trực tuyến với chế độ tuỳ chỉnh giao diện (Reading Mode).
- Đánh giá và Yêu thích: Người dùng có thể lưu lại sách yêu thích và đánh giá (Star Rating) cho từng quyển sách.
- AI Chatbot: Truy cập trợ lý ảo AI để được giải đáp thắc mắc, tìm kiếm sách hoặc thực hiện tác vụ mượn sách thông qua hội thoại tự nhiên trực tiếp trên giao diện màn hình.

### Dành cho Quản trị viên (Admin / Thủ thư)
- Đăng nhập Admin: Truy cập thông qua màn hình đăng nhập độc lập dành riêng cho quản trị viên, với hệ thống phân quyền quản lý chặt chẽ được tách riêng với người dùng.
- Quản lý Sách: Thêm, sửa, xóa thông tin sách, số lượng, danh mục và tác giả.
- Quản lý Phiếu mượn và Phiếu trả: Theo dõi các giao dịch mượn trả sách, duyệt yêu cầu gia hạn hoặc xử lý khách mượn quá hạn.
- Quản lý Thành viên: Xem danh sách người dùng, thay đổi quyền hạn hoặc khóa/mở khóa tài khoản khách hàng khi cần thiết.
- Quản lý Yêu cầu Đặt trước: Phê duyệt hoặc huỷ xử lý các yêu cầu đặt trước sách của độc giả.
- Theo dõi Bảo mật (Security Logs): Giám sát lịch sử đăng nhập, quản lý phiên hoạt động để phát hiện các truy cập trái phép hoặc bất thường.
- Xem Báo cáo và Thống kê: Thống kê tình hình mượn trả bằng các biểu đồ trực quan (Charts và Stats).

## 2. Tính Năng Nổi Bật

- Tích hợp Trí tuệ Nhân tạo (AI): Tích hợp AI Chatbot thông minh giúp tương tác, tư vấn sách và hỗ trợ độc giả 24/7 trực tiếp trên màn hình.
- Bảo mật Nâng cao: Phân quyền rõ ràng thông qua luồng xác thực JWT và Session. Giám sát hệ thống với thành phần Security Monitor hiện đại.
- Chế độ Đọc Tùy chỉnh (Reading Mode): Cho phép người dùng tùy chọn màu sắc nền, phông chữ và kích cỡ chữ trải nghiệm đọc sách số.
- Quét mã QR: Quản lý nhanh chóng sách thông qua hệ thống mã QR tiên tiến tích hợp trên nền tảng.
- Bảng điều khiển Quản trị (Dashboard) Phân đoạn: Giao diện quản trị viên chia theo các Module (Tab) cụ thể như Accounts, Borrows, Members, News, Reservations cho phép thực thi tác vụ nhanh gọn.

## 3. Cấu Trúc Mã Nguồn (src)

Dự án được chia thành hai phân vùng chính: Frontend và Backend. Dưới đây là kiến trúc các thư mục mã nguồn cốt lõi trong cấu trúc hiện tại.

### 3.1 Cấu trúc Frontend (frontend/src)
Nền tảng giao diện người dùng được xây dựng dựa trên Next.js 15+ (App Router), React 19, và Tailwind CSS.

- app/: Chứa các trang giao diện hiển thị cho người dùng, cấu trúc điều hướng Page Route được định tuyến tự động bằng Next.js (chứa trang chủ, bảng quản trị, đọc sách, hồ sơ cá nhân).
- components/: Nơi lưu trữ các UI Component có thể tái sử dụng. Được module hóa thành:
  - admin/: Các thành phần thuộc trang báo cáo quản trị (AdminSidebar, AdminModals, BorrowsTab, MembersTab, StatsCharts).
  - layout/: Các thành phần khung giao diện chung (Header, Footer, AIChatbot, SecurityMonitor).
  - ui/: Các component cốt lõi, phần tử nhỏ cơ bản (BookCard, Toast, Modal).
- contexts/: Quản lý trạng thái toàn cục (State Management Context) của ứng dụng bằng kĩ thuật React Context API.
- hooks/: Cung cấp các Custom Hooks để trừu tượng hóa logic nội bộ của Component giúp tái sử dụng mã hiệu quả.
- lib/: Chứa các tập tin, hàm nền tảng, mã tiện ích và file API Clients (ví dụ apiClient, aiService, security module, bookUtils).
- types/: Tại đây thực hiện định nghĩa các Interface và Types bằng ngôn ngữ TypeScript đảm bảo tính nhất quán dữ liệu ở Client.

### 3.2 Cấu trúc Backend (backend/src)
Máy chủ xử lý nghiệp vụ được xây dựng với Node.js, Express.js và cơ sở dữ liệu MongoDB. Cấu trúc mã tuân theo kiến trúc Layered Architecture vững chắc.

- ai/: Tích hợp các thiết lập và logic liên quan đến kết nối trí tuệ nhân tạo (xử lý mô hình AI, Prompts, workflow mượn sách).
- config/: Chứa dữ liệu cấu hình hạ tầng trung tâm, thiết lập kết nối cơ sở dữ liệu.
- controllers/: Tầng Controller xử lý tín hiệu Request (vào) từ Web gửi tới, điều phối lệnh gọi xuống tầng Services rồi trả về Response.
- middleware/: Các hàm chặn và xử lý trung gian như xác thực JWT, kiểm duyệt nội dung, giới hạn yêu cầu, xử lý lỗi hệ thống.
- models/: Nơi lưu trữ cấu trúc thiết kế dữ liệu bằng Schema của Mongoose.
- repositories/: Tầng trừu tượng hóa giao tiếp trực tiếp với cơ sở dữ liệu, đảm đương xử lý thao tác CRUD phân lập Service và Model.
- routes/: Khai báo sơ đồ điều hướng API endpoint chính thức cho máy chủ Express.
- services/: Chứa các thuật toán xử lý và rules (quy tắc) của nghiệp vụ (Business logic services) riêng biệt.
- scripts/: Các đoạn tệp tin hệ thống và các công cụ phục vụ xử lý dữ liệu nền.
- server.js: Tệp khởi chạy (entry point) cấp cao, mở HTTP server và chạy ứng dụng Express ban đầu.

## 4. Kiến Trúc Phần Mềm Sử Dụng

Dự án áp dụng nhiều mẫu thiết kế (Design Patterns) và mô hình kiến trúc tiến tiến nhằm bảo đảm tính dễ bảo trì, mở rộng và bảo mật cao:

### 4.1. Kiến Trúc Lớp Backend (Layered Architecture)
Backend Node.js tuân thủ nghiêm ngặt mô hình ba lớp (3-Tier Layered Architecture):
- Controllers Layer: Đóng vai trò làm cổng tiếp nhận tín hiệu từ các đường dẫn (Routes). Xác thực định dạng đầu vào và chuyển tiếp công việc nội bộ xuống Service, nhận kết quả và bọc chúng vào Response chuẩn.
- Services Layer: Đây là dải chức năng trung tâm (Core Business Logic). Mọi quy tắc và tính toán liên quan đến vận hành thực tế đều thực thi tại đây.
- Repositories Layer (Repository Pattern): Lớp chuyên trách tương tác trực tiếp tới cơ sở dữ liệu MongoDB. Lớp Service sẽ không bao giờ gọi các thư viện hoặc câu lệnh MongoDB trực tiếp mà chỉ giao tiếp thông qua các hàm có sẵn trong Repository. Điều này hỗ trợ đổi nền tảng lưu trữ CSDL mà không ảnh hưởng tới Service bên trên.

### 4.2. Kiến Trúc Frontend Client-Server Model
Với Next.js App Router, dự án phân tách rõ ràng luồng máy chủ và luồng máy khách:
- Server Components: Hữu ích tại các trang đọc dữ liệu ban đầu, thân thiện với công cụ tìm kiếm (SEO) và tải trang chớp nhoáng vì nó kết xuất giao diện sẵn từ phía Server và gửi HTML về trình duyệt.
- Client Components: Các module cần tương tác từ người dùng (sử dụng Hooks như useState, useEffect) hoặc tích hợp thư viện từ bên thứ ba (như biểu đồ Recharts, xử lý Modal). Mã sẽ được gói riêng biệt, giảm dung lượng tổng của trang.
- Quản trị Trạng thái (State Management): Tận dụng React Context API nhẹ gọn chia làm nhiều nhánh nhỏ (ví dụ AuthContext cho xác thực, ThemeContext cho giao diện), kết hợp song song với các Custom Hooks riêng của ứng dụng để bóc tách luồng giao diện với luồng thao tác logic.

### 4.3. Mô Hình Bảo Mật Web (Web Security Pattern)
- Cơ chế Xác thực Stateless (JWT): Mọi API nội bộ được bảo vệ bởi Token không lưu trạng thái phân giải từ header `Authorization`, bảo đảm tính phân tách độc lập giữa máy chủ và giao diện.
- Xác thực Kép (Dual Environment Auth): Hệ thống sử dụng phân phối token bằng HTTP Authorization kết hợp các kĩ thuật làm mới phiên cục bộ quản lý bởi Session/Local Storage ở máy khách, giúp các tab quản trị viên độc lập với tab người dùng thường (Hạn chế rủi ro bảo mật dồn phiên chung).
- Bảo vệ Hạ tầng Hệ Thống: Cổng API rào chắn qua các thư viện trung gian như Helmet (bọc HTTP headers), Rate Limiting (chống tấn công DDoS), và Mongo Sanitize (ngăn chặn tấn công Injection).
