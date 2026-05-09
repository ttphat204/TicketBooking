# Technical Assessment Context & Database Schema

Tài liệu này tổng hợp các phân tích kỹ thuật, lựa chọn công nghệ và kiến trúc cơ sở dữ liệu cho dự án TicketBooking (GEEK Up Technical Assessment).

## 1. Phân tích Kiến trúc (Backend Design Thinking)

Tư duy thiết kế Backend cho hệ thống này tập trung vào 3 trụ cột: **Data Integrity**, **Scalability/Concurrency**, và **Auditability**.

- **Data-First Defense**: Database là chốt chặn cuối cùng. Sử dụng `ROWVERSION` (Optimistic Locking) và Atomic Updates để chống Overselling.
- **User Experience under High Traffic**: Cơ chế Ticket Reservation (giữ chỗ) qua `ExpiresAt` và tính Idempotency qua `IdempotencyKey`.
- **Clean Architecture**: Tách biệt Domain Logic khỏi Infrastructure.
- **Trade-offs**: Ưu tiên **Strong Consistency** cho luồng đặt vé để đảm bảo trải nghiệm khách hàng chính xác nhất.

## 2. Database Schema (SQL Server)

Dưới đây là bản SQL Script đầy đủ và tối ưu nhất đã được thống nhất:

```sql
-- 1. Bảng lưu thông tin sự kiện
CREATE TABLE Concerts (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    EventDate DATETIME NOT NULL,
    Location NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 2. Bảng lưu loại vé và tồn kho (QUAN TRỌNG NHẤT)
CREATE TABLE TicketCategories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ConcertId INT FOREIGN KEY REFERENCES Concerts(Id),
    Name NVARCHAR(50) NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    TotalQuantity INT NOT NULL,
    AvailableQuantity INT NOT NULL,
    RowVersion ROWVERSION 
);

-- 3. Bảng lưu mã giảm giá
CREATE TABLE Vouchers (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Code VARCHAR(50) UNIQUE NOT NULL,
    DiscountAmount DECIMAL(18, 2) NOT NULL,
    MinOrderAmount DECIMAL(18, 2) DEFAULT 0,
    MaxUsage INT NOT NULL,
    CurrentUsage INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    ExpiryDate DATETIME NOT NULL
);

-- 4. Bảng lưu đơn hàng
CREATE TABLE Orders (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId INT NOT NULL, 
    TotalAmount DECIMAL(18, 2) NOT NULL,
    DiscountAmount DECIMAL(18, 2) DEFAULT 0, 
    VoucherId INT NULL FOREIGN KEY REFERENCES Vouchers(Id),
    Status NVARCHAR(20) DEFAULT 'Pending', 
    IdempotencyKey VARCHAR(255) UNIQUE, 
    ExpiresAt DATETIME NOT NULL, 
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 5. Chi tiết đơn hàng
CREATE TABLE OrderItems (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Orders(Id),
    TicketCategoryId INT FOREIGN KEY REFERENCES TicketCategories(Id),
    Quantity INT NOT NULL,
    PriceAtBooking DECIMAL(18, 2) NOT NULL
);

-- HỆ THỐNG CHỈ MỤC (INDEX)
CREATE INDEX IX_TicketCategories_ConcertId ON TicketCategories(ConcertId);
CREATE INDEX IX_Orders_IdempotencyKey ON Orders(IdempotencyKey);
CREATE INDEX IX_Orders_UserId ON Orders(UserId);
CREATE INDEX IX_Orders_Status_ExpiresAt ON Orders(Status, ExpiresAt);
```

## 3. Lựa chọn Công nghệ (Tech Stack)

- **Frontend**: ReactJS + TailwindCSS + Vite.
- **Backend**: NodeJS + Express + TypeScript.
- **Database**: SQL Server (Chính) + Redis (Cache/Inventory Counter).
- **Architecture**: Clean Architecture (Modular Monolith).
