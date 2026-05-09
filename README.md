# Ticket Booking Backend System 🎫

A high-performance, scalable, and robust ticket booking backend built with **Node.js**, **TypeScript**, and **SQL Server**. This project demonstrates advanced patterns for handling high-concurrency "Flash Sale" scenarios, ensuring data integrity and preventing overselling.

## 🚀 Key Features

- **Modular Monolith Architecture**: Clean separation of concerns following Domain-Driven Design (DDD) principles.
- **High Concurrency Control**: Implements **Optimistic Locking** using SQL `ROWVERSION` to prevent race conditions during ticket booking.
- **Idempotency**: Protects against duplicate orders using unique `IdempotencyKey`.
- **Automated Inventory Management**: Background worker to automatically release expired "Pending" tickets back to the pool.
- **Professional API Docs**: Fully integrated **Swagger UI**.
- **Robust Testing**: Unit tests for core business logic using **Jest**.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Microsoft SQL Server (MSSQL)
- **Validation**: Manual DTO validation & Type safety
- **Documentation**: Swagger / OpenApi 3.0
- **Testing**: Jest & ts-jest

---

## 📁 Project Structure

```text
src/
├── application/           # Use Cases & DTOs (Business Logic Orchestration)
├── domain/                # Entities & Repository Interfaces (Core Domain)
├── infrastructure/        # Database, Repositories Impl, Workers (External Tools)
└── interfaces/            # HTTP Controllers & Routes (Entry Points)
tests/                     # Unit & Integration Tests
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js installed.
- SQL Server running locally or on a server.
- Database created with the provided schema (see `Technical_Assessment_Context.md`).

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
DB_USER=your_user
DB_PASSWORD=your_password
DB_SERVER=localhost
DB_NAME=TicketBooking
DB_TRUST_SERVER_CERTIFICATE=true
```

### 3. Installation
```bash
npm install
```

### 4. Seed Data
Run the SQL script provided in the assessment context to seed initial Concerts, Categories, and Vouchers.

### 5. Start Development
```bash
npm run dev
```

---

## 📖 API Documentation

Once the server is running, access the interactive Swagger UI at:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/swagger)**

---

## 🧪 Testing

We use Jest for unit testing core use cases.
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

---

## 🛡️ Core Concepts Explained

### 1. Optimistic Locking
To prevent overselling when 500+ users buy the same ticket at once, we use `ROWVERSION`. Every update to `TicketCategories` checks if the version has changed since the user last read it. If it changed, the transaction fails and the user is notified.

### 2. Idempotency
Clients send an `idempotencyKey` with every order. If a request is retried (e.g., due to network timeout), the backend returns the *existing* order instead of creating a duplicate one.

### 3. Background Worker
The `ExpiredOrderWorker` runs every 30 seconds to find orders that have been "Pending" for more than 10 minutes. It automatically cancels them and restores the ticket count to the inventory, ensuring no "stuck" inventory.

---

## 📝 Coding Guidelines

- **Clean Architecture**: Never import `infrastructure` directly into `domain`.
- **Async/Await**: Always handle database operations asynchronously.
- **Fail Fast**: Validate input DTOs at the controller level before reaching the Use Case.
- **Type Safety**: Use TypeScript interfaces for all data structures.

---
*Developed for the GEEK Up Technical Assessment.*
