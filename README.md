# Finly

> **Premium, personal, offline-first expense tracking designed for non-calendar salary cycles.**

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-SDK_58-000020.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB.svg)](https://reactnative.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## The Problem

Traditional personal finance applications lock spending analysis into calendar-month containers (1st to 30th/31st). For salaried professionals whose salary arrives on fluctuating dates (e.g. 5th of November followed by 13th of December), calendar-based tracking breaks down:
- November cash flow is distorted.
- Daily budget limits cannot be accurately determined.
- Savings and carry-forward balances are miscalculated.

## The Solution

**Finly** models your personal financial periods directly around **actual salary receipt dates**:
- **Dynamic Salary Cycles**: A cycle starts on the exact date your salary is received and automatically concludes the day before your next salary arrives.
- **Deterministic Paise Math**: All monetary amounts are recorded in integer paise to eliminate floating-point arithmetic errors.
- **Offline & Private**: Built on SQLite with zero mandatory backend servers and ₹0 recurring cost.
- **Encrypted Cloud Backup**: Direct client-to-Google Drive encrypted backup (AES-256-GCM) under full user ownership.

---

## Tech Stack

| Technology | Role |
| :--- | :--- |
| **React Native & Expo (SDK 58)** | Cross-platform native mobile foundation (Android & iOS) |
| **Expo Router** | File-based navigation with typed routes |
| **Expo SQLite & Drizzle ORM** | Local, high-performance transactional database |
| **TypeScript (Strict Mode)** | End-to-end type safety |
| **Zustand** | Lightweight, reactive UI state management |
| **React Hook Form & Zod** | Form handling and deterministic validation |
| **Jest & jest-expo** | Comprehensive automated test harness |

---

## Folder Structure

```
Finly/
├── app/                  # File-based navigation routes (Expo Router)
│   ├── (tabs)/           # Dashboard, Transactions, Salary, Settings
│   ├── transaction/      # Transaction modals & detail screens
│   ├── salary/           # Salary cycle management screens
│   └── _layout.tsx       # Root layout & providers
├── src/
│   ├── components/       # Shared UI components
│   ├── features/         # Feature modules (dashboard, salary-cycles, etc.)
│   ├── domain/           # Pure business logic (100% unit-tested)
│   ├── database/         # Drizzle schema, migrations, repositories
│   ├── services/         # Drive backup, speech recognition
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand state stores
│   ├── constants/        # Environment & config
│   ├── theme/            # Design tokens (colors, typography, spacing)
│   ├── types/            # Domain interfaces & TypeScript types
│   └── utils/            # Utility helpers (integer paise currency math)
├── tests/                # Automated tests (unit & domain)
└── docs/                 # Architecture & Development guides
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Start Expo development server
npm start

# 4. Run tests and type checks
npm run typecheck
npm run lint
npm test
```

For complete setup instructions, see the [Development Setup Guide](file:///D:/Finly/docs/DEVELOPMENT.md).  
For architectural details, see the [Architecture Documentation](file:///D:/Finly/docs/ARCHITECTURE.md).

---

## Project Status

- [x] **Prompt 01**: Project Foundation & Clean Architecture Initialization.
- [ ] **Phase 1**: Core Expense Tracking & Drizzle/SQLite Schema.
- [ ] **Phase 2**: Dynamic Salary-Cycle Management Engine.
- [ ] **Phase 3**: Dashboard & Financial Analytics.
- [ ] **Phase 4**: Natural Voice Expense Entry.
- [ ] **Phase 5**: Home Screen Widgets (Android & iOS).
- [ ] **Phase 6**: Encrypted Google Drive Backup & Restore.
- [ ] **Phase 7**: Spending Insights & Local Notifications.
- [ ] **Phase 8**: QA, Performance & Release Readiness.
