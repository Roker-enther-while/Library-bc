# Architecture Security Validation Prototype 🛡️🚀

Nguyên mẫu (Prototype) này được xây dựng để **xác thực yêu cầu phi chức năng về tính an toàn (Security Requirements)** cho kiến trúc hệ thống Quản lý Thư viện theo các hướng dẫn trong **Bài thực hành số 11 (Phần 2)**.

Nguyên mẫu mô phỏng và xác thực kiến trúc 3 thành phần chính:
**Client** -> **API Gateway (Cổng bảo mật - Port 4000)** -> **Các Microservices (Auth-Service Port 4001, Library-Service Port 4002)** -> **Database (MongoDB: security_demo)**

---

## 🏗️ Các Tầng Bảo Mật Được Xác Thực (6 Security Layers)

1. **Hạn chế tần suất truy cập (Login Rate Limiter):** Ngăn chặn tấn công Brute Force bằng cách giới hạn tối đa 5 yêu cầu đăng nhập trong 10 giây cho mỗi IP tại API Gateway.
2. **Chống tấn công NoSQL Injection (NoSQL Sanitizer):** Tự động lọc sạch và loại bỏ các toán tử query độc hại dạng `$` hoặc `.` (ví dụ: `{ $ne: null }`) khỏi dữ liệu đầu vào.
3. **Bộ lọc phát hiện mã độc hại Injection (Threat Injection Filter):** Phát hiện các mẫu tấn công XSS (như `<script>`, `javascript:`) và SQLi (như `SELECT`, `UNION`, `--`) ở API Gateway, lập tức trả về `403 Forbidden` và ghi lại nhật ký cảnh báo nguy hiểm (`danger`).
4. **Mã hóa dữ liệu nhạy cảm (Transparent AES-256-GCM Cryptography):** Sử dụng thuật toán AES-256-GCM để mã hóa các thông tin nhạy cảm của người dùng (`studentId`, `phone`) khi lưu xuống đĩa dữ liệu (MongoDB). Dữ liệu chỉ được giải mã tự động khi tải lên bộ nhớ tạm bởi tầng nghiệp vụ được phân quyền.
5. **Phân quyền truy cập tài nguyên (Role-Based Access Control - RBAC):** Kiểm soát và chặn đứng các yêu cầu leo thang đặc quyền (ví dụ: Reader không được phép thực hiện các thao tác thêm sách của Thủ thư/Admin).
6. **Cơ chế tự động khóa tài khoản (Intrusion Auto-Lock Engine):** Khi một tài khoản đã đăng nhập thực hiện hành vi tấn công hệ thống (XSS/SQLi) đủ **3 lần** liên tiếp, hệ thống sẽ tự động chuyển đổi trạng thái thẻ thành viên thành `locked` (Khóa tài khoản) và ghi nhận cảnh báo khẩn cấp cấp độ `danger`.

---

## ⚙️ Hướng Dẫn Cài Đặt Ban Đầu

### 1. Chuẩn bị
- Đảm bảo máy tính đã cài đặt **Node.js** và **MongoDB** đang chạy tại cổng mặc định `localhost:27017`.

### 2. Cài đặt Dependencies
Mở Command Prompt/PowerShell tại thư mục `security-prototype` này và chạy lệnh:
```bash
npm install
```

---

## 📺 Kịch Bản Chạy Demo Tự Động (Simulation)

### Bước 1: Khởi động các Services
Chạy file batch:
```bash
start_all.bat
```
Lệnh này sẽ tự động mở ra 3 cửa sổ CMD tương ứng:
- Cửa sổ 1: **API-Gateway** (Port 4000)
- Cửa sổ 2: **Auth-Service** (Port 4001)
- Cửa sổ 3: **Library-Service** (Port 4002)

### Bước 2: Chạy kịch bản tự động hóa tấn công và kiểm thử bảo mật
Trong cửa sổ terminal mới, hãy chạy file batch sau:
```bash
simulate.bat
```
Hệ thống sẽ thực hiện seeding cơ sở dữ liệu và tự động chạy qua 6 kịch bản tấn công:
1. Đăng nhập thành công và so sánh dữ liệu thô bị mã hóa trong DB (Ciphertext) với dữ liệu đã giải mã hiển thị trên màn hình.
2. Đăng nhập Admin, thêm sách và hiển thị **Audit Log** ghi nhận thông tin Admin.
3. Sử dụng quyền Reader để gọi API thêm sách -> Bị chặn đứng với lỗi `403 Forbidden` (Kiểm chứng RBAC).
4. Thực hiện tấn công SQLi và XSS Injection -> Bị Gateway phát hiện, từ chối và ghi log cảnh báo xâm nhập.
5. Tấn công brute-force đăng nhập nhanh -> Bị chặn bởi Rate Limiter với mã lỗi `429 Too Many Requests`.
6. Thực hiện 3 cuộc tấn công Injection liên tục dưới tài khoản Reader -> Cổng Gateway kích hoạt cơ chế **Auto-Lock**, khóa tài khoản độc giả và từ chối các phiên đăng nhập tiếp theo.

---

## 💻 Hướng Dẫn Chạy Demo Bằng Lệnh Thủ Công (Manual CLI Demo)

Nếu bạn muốn chạy thử từng lệnh bằng tay bằng công cụ dòng lệnh (như `curl` hoặc **PowerShell**), hãy làm theo các bước bên dưới:

> [!NOTE]
> Bật song song các terminal microservices (`start_all.bat`) và thực thi các dòng lệnh bên dưới trong terminal phụ.

### Lệnh 1: Seeding cơ sở dữ liệu ban đầu
```bash
npm run seed
```

### Lệnh 2: Đăng nhập Reader thông thường để lấy JWT Token
- **Lệnh curl (CMD/Linux):**
  ```bash
  curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"reader\",\"password\":\"readerpassword\"}"
  ```
- **Lệnh PowerShell:**
  ```powershell
  Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/login" -ContentType "application/json" -Body '{"username":"reader","password":"readerpassword"}'
  ```
*(Hãy copy chuỗi mã `token` trả về trong phản hồi để sử dụng cho các lệnh tiếp theo).*

### Lệnh 3: Xem dữ liệu nhạy cảm đã được giải mã tự động (so với dữ liệu thô trong DB)
- **Lệnh curl (Hãy thay thế [TOKEN_CUA_BAN] bằng token vừa lấy được):**
  ```bash
  curl -X GET http://localhost:4000/api/library/sensitive-profile -H "Authorization: Bearer [TOKEN_CUA_BAN]"
  ```
- **Lệnh PowerShell:**
  ```powershell
  Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/library/sensitive-profile" -Headers @{ Authorization = "Bearer [TOKEN_CUA_BAN]" }
  ```
*(Phản hồi sẽ hiển thị rõ ràng: Dữ liệu thô lưu trữ trong DB đã bị mã hóa AES-256-GCM, nhưng khi đi qua API bảo mật đã được tự động giải mã thành công cho Reader).*

### Lệnh 4: Thử nghiệm leo thang đặc quyền (Reader thêm sách trái phép)
- **Lệnh curl:**
  ```bash
  curl -X POST http://localhost:4000/api/library/books -H "Authorization: Bearer [TOKEN_CUA_BAN]" -H "Content-Type: application/json" -d "{\"title\":\"Sach Hack\",\"author\":\"Hacker\",\"category\":\"IT\",\"isbn\":\"999\"}"
  ```
- **Lệnh PowerShell:**
  ```powershell
  Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/library/books" -Headers @{ Authorization = "Bearer [TOKEN_CUA_BAN]" } -ContentType "application/json" -Body '{"title":"Sach Hack","author":"Hacker","category":"IT","isbn":"999"}'
  ```
*(Hệ thống lập tức chặn đứng và phản hồi: `403 Forbidden - Bạn không có quyền thực hiện hành động này!`)*

### Lệnh 5: Thực hiện tấn công SQL Injection
- **Lệnh curl:**
  ```bash
  curl -X GET "http://localhost:4000/api/library/books?search=SELECT%20*%20FROM%20users;" -H "Authorization: Bearer [TOKEN_CUA_BAN]"
  ```
- **Lệnh PowerShell:**
  ```powershell
  Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/library/books?search=SELECT * FROM users;" -Headers @{ Authorization = "Bearer [TOKEN_CUA_BAN]" }
  ```
*(Gateway lập tức chặn và phản hồi: `Hành vi bất thường (tấn công SQLi/XSS) bị phát hiện...`)*

### Lệnh 6: Thực hiện tấn công Brute Force đăng nhập (Chạy liên tục nhiều lần)
Chạy lệnh này nhanh 6 lần liên tiếp:
- **Lệnh curl:**
  ```bash
  curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"reader\",\"password\":\"sai_mat_khau\"}"
  ```
*(Từ lần thứ 6, hệ thống sẽ phản hồi: `429 Too Many Requests - Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 10 giây.`)*

---

## 📹 Hướng Dẫn Quay Video Demo Đạt Điểm Tuyệt Đối 💯

Bài tập yêu cầu nộp **Video Demo** chứng minh kiến trúc có áp dụng các kỹ thuật để bảo đảm an toàn thông tin. Bạn có thể tự tin quay màn hình theo các bước sau:

1. **Giới thiệu cấu trúc thư mục:** Mở thư mục `security-prototype` trong VS Code. Chỉ cho giảng viên thấy các thành phần kiến trúc đã phân tách rõ ràng:
   - `gateway/`: Đóng vai trò Firewall, lọc SQLi/XSS, Mongo Sanitize và giới hạn rate limit.
   - `auth-service/`: Đảm nhận việc băm mật khẩu (bcrypt) và tạo token (JWT).
   - `library-service/`: Đảm nhận phân quyền RBAC và thực thi ghi nhận nhật ký hệ thống (Audit Logs).
   - `models/User.js`: Cho giảng viên xem các hàm hooks `pre('save')` mã hóa AES-256-GCM tự động và giải mã `post('init')`.
2. **Khởi chạy hệ thống:** Chạy file `start_all.bat`. Mở dạng chia đôi màn hình (Split screen) 3 cửa sổ CMD tương ứng Gateway, Auth, và Library Service để nhìn thấy log chạy song song.
3. **Thực thi mô phỏng:** Chạy file `simulate.bat`.
4. **Thuyết minh trong quá trình chạy:**
   - **Mã hóa dữ liệu:** Chỉ ra giá trị `phone` và `studentId` trong Database MongoDB đã bị mã hóa thành chuỗi hexa dài phức tạp chứa vector khởi tạo (IV) và mã xác thực (Auth Tag) bảo mật cao, không thể đọc trộm. Trong khi Client đăng nhập hợp lệ vẫn đọc được dữ liệu rõ ràng.
   - **Kiểm soát đặc quyền (RBAC):** Chỉ ra màn hình khi Reader cố tình gửi lệnh POST tạo sách mới đã bị chặn đứng với mã lỗi 403 Forbidden.
   - **Tấn công SQLi/XSS:** Chỉ ra dòng lệnh tấn công bằng câu lệnh SQL `SELECT` hoặc thẻ `<script>` đã bị Gateway chặn ngay lập tức, và trong cửa sổ API Gateway xuất hiện log đỏ: `[Gateway] [SECURITY ALERT] Malicious SQLi Attempt detected...`.
   - **Tự động khóa tài khoản (Auto-Lock):** Thuyết minh cơ chế bảo vệ chủ động. Sau 3 lần Reader cố tình tấn công Injection, Gateway tự động khóa thẻ thành viên. Chỉ ra màn hình ở lượt thử đăng nhập cuối cùng của Reader bị hệ thống từ chối đăng nhập thẳng thừng vì thẻ đã bị chuyển thành `locked`.
5. **Kết luận:** Kết luận rằng kiến trúc này hoàn toàn bảo đảm và chứng thực tuyệt đối các yêu cầu về an toàn bảo mật, an ninh hệ thống và toàn vẹn dữ liệu đúng theo kiến trúc thiết kế.
