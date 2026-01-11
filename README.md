# SGMC Management System

SGMC is a lightweight desktop application for record management and financial tracking. This is a volunteering project.

## Architecture

The project is built with Tauri, following a philosophy of minimal Rust code. Almost all logic is handled in the React/TypeScript frontend to ensure high maintainability and rapid development.

## Data Management

Database state and synchronization are managed using TanStack Query. It interacts directly with the SQLite database via the Tauri SQL plugin within the frontend layer. This setup handles:

- Asynchronous data fetching and caching.
- Seamless synchronization between the persistent SQLite storage and the user interface.

## Tech Stack

- Framework: Tauri v2

- Frontend: React 19, TypeScript

- State Management: TanStack Query v5

- Database: SQLite (Tauri SQL Plugin)

- Styling: Tailwind CSS v4

- Localization: i18next (English & Arabic RTL support)

## Linux Compatibility (Wayland)

There is a known limitation with WebKitGTK when running on Wayland. To ensure the application runs correctly on Linux distributions using Wayland, a workaround has been implemented in `src-tauri/src/main.rs`.

The application detects the Wayland environment and automatically restarts itself with the following environment variables:

- `GDK_BACKEND=x11`

- `WEBKIT_DISABLE_COMPOSITING_MODE=1`

## Build and Development

### Development

```bash
pnpm install
pnpm tauri dev
```

### Cross-Compilation (Arch Linux to Windows)

To build for Windows using cargo-xwin on Arch Linux:

```bash
pnpm tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc
```
