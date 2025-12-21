# Library Management System

A production-grade, full-stack mono-repository for managing library operations, including Book Inventory, Requests, Lending/Fines, and Audits. Built with **NestJS** (Backend), **Next.js** (Frontend), and **Prisma** (Database).

 > [!NOTE]
 > This project is set up as a monorepo using [TurboRepo](https://turbo.build/repo).

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC)**: Secure access for `MEMBER`, `LIBRARIAN`, and `ADMIN` roles.
*   **Book Inventory**: Manage books and individual physical copies (`AVAILABLE`, `ISSUED`, `LOST`, etc.).
*   **Advanced Request System**:
    *   **Pickup**: Reserve online, collect in person.
    *   **Delivery**: Request delivery, Librarian dispatches, confirms delivery.
    *   **Automated Reservation**: Inventory is automatically reserved upon request approval.
*   **Fine Function Engine**:
    *   Dynamic fine calculation based on role-specific logic (Grace Period, Daily Rate, Caps).
    *   Snapshotting: Loans lock in the fine rules active at the time of creation.
*   **Audit Logging**: Automatic tracking of critical actions (Approvals, Rejections, Rule Updates).
*   **Global Error Handling**: Standardized API error responses.

---

## 🛠 Tech Stack

### Backend (`apps/api`)
*   **Framework**: [NestJS](https://nestjs.com/)
*   **Database ORM**: [Prisma](https://www.prisma.io/)
*   **Language**: TypeScript
*   **Authentication**: Passport-JWT (Access/Refresh Tokens)
*   **Documentation**: Swagger / OpenAPI

### Frontend (`apps/web`)
*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Styling**: Tailwind CSS + Shadcn UI
*   **State Management**: React Query (TanStack Query)
*   **Validation**: Zod + React Hook Form

---

## 🏁 Quick Start

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL
*   npm

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd library-management-system
npm install
```

### 2. Environment Setup
Create `.env` files based on `.env.example`.

**Root / Apps**:
Ensure `DATABASE_URL` is set in `packages/database/.env` (or root `.env` if configured to load from there).

Example `.env` content:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/library_db?schema=public"
JWT_SECRET="super-secret-key"
JWT_REFRESH_SECRET="super-secret-refresh-key"
```

### 3. Database Migration
Generate Prisma client and push schema to DB:
```bash
# Generate Client
npx turbo run db:generate

# Push Schema (Dev)
npx prisma db push --schema=packages/database/prisma/schema.prisma
```
*(Alternatively use `prisma migrate dev` if migrations are preferred)*

### 4. Running the App
Start both frontend and backend in development mode:
```bash
npx turbo run dev
```
*   **Frontend**: `http://localhost:3000`
*   **Backend API**: `http://localhost:3001`
*   **Swagger Docs**: `http://localhost:3001/api/docs`

---

## 📖 API Documentation

The API is fully documented using Swagger.
Visit **`http://localhost:3001/api/docs`** to explore endpoints, schemas, and test requests.

### Core Flows

#### 1. Book Request (Member)
1.  **Place Request** (`POST /requests`): User requests a book for `PICKUP` or `DELIVERY`.
2.  system checks `InventoryItem` availability.
3.  Request created with status `PENDING`.

#### 2. Fulfillment (Librarian)
1.  **Approve** (`PATCH /requests/:id/approve`): Librarian approves. System **Reserves** an Inventory Item.
2.  **Collect/Deliver**:
    *   **Pickup**: Librarian calls `collect` -> creates active **Loan**.
    *   **Delivery**: Librarian calls `dispatch` -> `confirmDelivery` -> creates active **Loan**.

#### 3. Fines & Return
1.  System calculates fines dynamically based on the **Loan Snapshot**.
2.  `Overdue Fine` = `(Overdue Days - Grace Period) * Daily Rate`.

---

## 🧪 Testing

The project uses **Jest** (Backend) and **Vitest** (Frontend).

### Run ALL Tests
```bash
npx turbo run test
```

### Backend Tests
```bash
cd apps/api
npm run test
```
*   Includes unit tests for `RequestsService` (mocked Prisma).

### Frontend Tests
```bash
cd apps/web
npm run test
```
*   Includes component tests for `BookCard` and other UI elements.

---

## 🔮 Roadmap

*   [ ] **Email Notifications**: Notify users on Approval, Delivery, Overdue.
*   [ ] **Payment Gateway**: Integration (Stripe/Razorpay) for paying fines.
*   [ ] **Advanced Reporting**: Charts for borrowing trends (Admin Dashboard).
*   [ ] **ISBN Scanner**: Barcode integration for fast inventory management.

---

## 📄 License
UNLICENSED