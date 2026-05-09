# Thiết Kế Hệ Thống Và Kế Hoạch Triển Khai Antigravity

Dưới đây là bản tổng hợp kế hoạch chi tiết (Blueprints) để bạn sẵn sàng chuyển sang bước thực thi mã nguồn. Tài liệu này được chuẩn bị để công cụ **Antigravity** có thể đọc hiểu và hỗ trợ bạn triển khai code một cách nhất quán theo đúng tư duy "Engineering Thinking" đã thống nhất.

---

## 1. Kiến trúc Tổng thể (Modular Monolith)

Hệ thống sẽ được triển khai theo cấu trúc **Clean Architecture** phân lớp rõ ràng để tách biệt logic nghiệp vụ khỏi kỹ thuật.

- `src/domain`: Chứa các Entity (Concert, Ticket, Voucher, Order) và logic nghiệp vụ bất biến (ví dụ: quy tắc tính tiền, điều kiện áp dụng voucher).
- `src/application (Use Cases)`: Chứa luồng xử lý chính. Đây là nơi thực hiện **Transaction** và phối hợp giữa các Repository (ví dụ: `CreateBookingUseCase`).
- `src/infrastructure`: Chứa các Adapter kết nối bên ngoài như SQL Server (TypeORM/Sequelize), Redis, hoặc Mail Service.
- `src/interfaces`: Chứa REST API Controllers, DTOs (Data Transfer Objects) và các Middleware (Auth, Idempotency, Rate Limiting).

---

## 2. Coding Guideline & Convention

Để đảm bảo code sạch và dễ kiểm thử (Unit Test), chúng ta tuân thủ các quy tắc sau:

- **Ngôn ngữ**: **TypeScript** để định nghĩa Interface chặt chẽ cho Ticket, Order, Voucher.
- **Nguyên lý thiết kế**: Áp dụng triệt để **SOLID**.
- **Xử lý lỗi (Error Handling)**: Sử dụng các lớp lỗi tùy chỉnh (Custom Error Classes) để trả về mã lỗi HTTP đồng nhất.
- **Idempotency**: Mọi API "Ghi" (POST/PUT/PATCH) nhạy cảm phải yêu cầu header `X-Idempotency-Key` (UUID) để chống trùng lặp.
- **Concurrency Control**: Sử dụng **Optimistic Locking** thông qua trường `RowVersion` trong SQL Server để chặn đứng việc bán quá số lượng vé (Overselling).

---

## 3. Quy trình triển khai một API mới (Step-by-Step)

Để Antigravity hỗ trợ code nhanh, quy trình chuẩn như sau:

1. **Định nghĩa DTO**: Xác định dữ liệu đầu vào và đầu ra.
2. **Viết Domain Logic**: Thực hiện các phép kiểm tra hoặc tính toán cốt lõi.
3. **Tạo Use Case**: Triển khai logic nghiệp vụ (ví dụ: Check kho -> Trừ kho ảo trên Redis -> Mở Transaction DB -> Ghi Order).
4. **Implement Repository**: Viết các câu truy vấn SQL (ưu tiên các câu lệnh nguyên tử như `UPDATE...WHERE Quantity > 0`).
5. **Controller & Routing**: Đăng ký endpoint và gắn Middleware cần thiết.
6. **Unit Test**: Viết test cho logic quan trọng nhất (như hàm `applyVoucher` hoặc `decrementInventory`).

---

## 4. Hướng dẫn Setup & Local Run

Kế hoạch setup môi trường để đảm bảo hệ thống "sống sót" dưới Peak Traffic:

- **Môi trường yêu cầu**: Node.js (v18+), SQL Server Local instance, Redis Server.
- **Database Setup**: Chạy Script SQL đã tối ưu với các chỉ mục (Index) như `IX_Orders_IdempotencyKey` và `IX_Orders_Status_ExpiresAt`.
- **Redis Setup**: Cấu hình **Connection Pool** để chịu tải 500 requests/phút.
- **Environment Variables**: Lưu trữ `DB_CONNECTION`, `REDIS_URL`, và `VOUCHER_EXPIRY_MINUTES`.

---

## 5. API Documentation & Testing (Swagger & Postman)

Tài liệu phải luôn đi kèm với mã nguồn để kiểm chứng.

- **Swagger (OpenAPI)**: Tích hợp trực tiếp vào codebase để tự động sinh tài liệu. Phải thể hiện rõ các trạng thái đơn hàng: `Received`, `Pending`, `Paid`, `Expired`.
- **Postman Collection**: Thiết lập các kịch bản test:
    - **Happy Path**: Đặt vé thành công.
    - **Edge Case**: Áp mã voucher hết hạn hoặc hết lượt dùng.
    - **Load Simulation**: Gửi nhiều request cùng `IdempotencyKey` để kiểm tra khả năng chống trùng.

---

**Sẵn sàng thực thi:**
Bạn có thể khởi động **Antigravity** ngay bây giờ. Hãy yêu cầu nó bắt đầu từ lớp **Domain** và **Infrastructure (Database Connection)** để làm nền tảng trước khi xây dựng các API xử lý Flash Sale quan trọng nhất.
