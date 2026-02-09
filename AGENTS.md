# Hospital Tauri Project - Agent Guidelines

This document provides essential instructions for AI agents working on the Hospital Tauri codebase.

## 1. Project Overview
- **Type:** Desktop Application (Tauri v2)
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS v4, Shadcn UI
- **Backend:** Rust (Tauri core), SQLite (via `tauri-plugin-sql`)
- **State Management:** Zustand, React Query (TanStack Query)
- **Package Manager:** `pnpm`

## 2. Build & Verification Commands

### Frontend
- **Install Dependencies:** `pnpm install`
- **Type Check:** `pnpm tsc --noEmit` (Run this after ANY frontend changes)
- **Dev Server:** `pnpm dev` (Vite only)

### Backend (Tauri/Rust)
- **Dev Mode:** `pnpm tauri dev` (Runs Rust backend + Vite frontend)
- **Build:** `pnpm tauri build`
- **Lint:** `cd src-tauri && cargo clippy`
- **Format:** `cd src-tauri && cargo fmt`
- **Test:** `cd src-tauri && cargo test` (Standard Rust testing)

### Running a Single Test
- **Rust:** `cd src-tauri && cargo test <test_name>`
- **Frontend:** *No test runner currently configured.* Focus on type safety via `tsc`.

## 3. Code Style & Conventions

### General
- **Path Aliases:** Use `@/` to refer to the `src/` directory (configured in `tsconfig.json` and `vite.config.ts`).
- **Formatting:** Adhere to existing patterns. Rust uses `rustfmt`. Frontend relies on Prettier-like formatting (ensure consistent indentation/quotes).

### Frontend (React/TypeScript)
- **Components:** Functional components with named exports.
- **Naming:**
    - Components: PascalCase (e.g., `SessionList.tsx`)
    - Functions/Variables: camelCase
    - Types/Interfaces: PascalCase
- **Data Fetching (React Query):**
    - **Pattern:** Use `mutationOptions` factories for mutations (e.g., `addSessionMutationOptions`).
    - **Location:** `src/lib/tanstack-query/`
    - **Database Access:** **Direct SQL execution via `getDb()`** is performed in the frontend layer (specifically in query/mutation functions), not via a separate backend API for basic CRUD.
- **Validation:** Use `zod` schemas for all form inputs and data structures.
- **Styling:** TailwindCSS v4. Use utility classes directly.
    - Example: `className="flex items-center space-x-2"`
- **I18n:** Use `i18next` (`i18n.t("key")`) for all user-facing text.

### Backend (Rust)
- **Structure:** Modularize logic in `src-tauri/src/`.
    - `lib.rs`: Plugin registration and setup.
    - `main.rs`: Entry point (handle Wayland fixes here).
    - `database.rs`: Database connection logic.
- **Plugins:** Prefer official Tauri plugins (`tauri-plugin-*`) over custom implementations where possible.
- **Async:** Use `tokio` runtime.
- **Error Handling:** Use `Result<T, E>` and propagate errors. Log errors using `log::error!`.

### Database (SQLite)
- **Migrations:** Managed via `tauri-plugin-sql` (check `migrations` folder if exists, or inline setup).
- **Queries:** Parameterized queries are MANDATORY to prevent SQL injection.
    - Correct: `db.execute("INSERT INTO ... VALUES (?)", [value])`
    - Incorrect: `db.execute(f"INSERT INTO ... VALUES ({value})")`

## 4. Specific Workflows

### Adding a New Feature
1.  **Define Schema:** Create Zod schema in `src/types/`.
2.  **Create Query/Mutation:** Add `mutationOptions` or `queryOptions` in `src/lib/tanstack-query/`.
3.  **UI Component:** Build component in `src/components/` using Shadcn UI primitives.
4.  **Route:** Register in `react-router-dom` configuration if a new page.
5.  **Verify:** Run `pnpm tsc --noEmit` and check for type errors.

### Modifying Backend
1.  Edit Rust files in `src-tauri/src/`.
2.  Run `cd src-tauri && cargo check` to verify compilation.
3.  If adding a command, register it in `lib.rs` under `.invoke_handler()`.

## 5. Environment
- **Platform:** Linux (Wayland support required via `main.rs` fix), Windows, macOS.
- **Port:** Dev server runs on port `1420`.
