# Hospital Tauri

A modern, robust desktop application for hospital and clinic management, built with Tauri v2, React 19, and Rust.

## 🚀 Features

*   **Patient Management:** Add, update, and manage patient records with comprehensive search and filtering.
*   **Statement Generation:** Create detailed financial statements and invoices for treatments.
*   **Doctor & Clinic Management:** Assign doctors and clinics to statements; manage their profiles.
*   **Attachment Handling:** Upload and manage scanned documents/images for each statement.
*   **Printing Support:** Custom, high-quality print previews for A4 invoices, supporting multi-page statements and full-page attachments.
*   **Backup & Restore:**
    *   **Hybrid Incremental Backup:** Efficiently backs up the SQLite database (snapshots) and synchronizes attachments (incremental diff) to Google Drive.
    *   **One-Click Restore:** Seamlessly restore data and attachments from the cloud.
*   **Internationalization (i18n):** Full support for English and Arabic (RTL).
*   **Dark Mode:** Built-in theme switching.

## 🛠️ Tech Stack

### Core
*   **Framework:** [Tauri v2](https://tauri.app/)
*   **Backend:** Rust
*   **Frontend:** React 19, TypeScript
*   **Database:** SQLite (via `tauri-plugin-sql`)

### Frontend Ecosystem
*   **Build Tool:** Vite
*   **Styling:** TailwindCSS v4
*   **UI Components:** Shadcn UI, Radix UI
*   **State Management:** Zustand, TanStack Query (React Query)
*   **Routing:** React Router v7
*   **Validation:** Zod
*   **Forms:** React Hook Form

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or later)
*   [pnpm](https://pnpm.io/)
*   [Rust](https://www.rust-lang.org/tools/install) (latest stable)
*   Build tools for your platform (Visual Studio C++ Build Tools for Windows, Xcode Command Line Tools for macOS, etc.)

## 🏁 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/hospital-tauri.git
    cd hospital-tauri
    ```

2.  **Install frontend dependencies:**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm tauri dev
    ```
    This command will start the Vite frontend server and compile the Rust backend.

## 🏗️ Build & Release

To build the application for production:

```bash
pnpm tauri build
```
The output binaries/installers will be located in `src-tauri/target/release/bundle/`.

### Linux Compatibility (Wayland)
The application includes a built-in workaround for WebKitGTK on Wayland. It detects the environment and automatically restarts with `GDK_BACKEND=x11` to ensure stability.

### Cross-Compilation
To build for Windows from Linux (e.g., using `cargo-xwin`):
```bash
pnpm tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc
```

## 💾 Backup System

The application uses a **Hybrid Incremental Backup** strategy to Google Drive:
*   **Database:** A full, compressed snapshot (`.db.gz`) is created for every backup.
*   **Attachments:** Only new or modified files are uploaded (incremental sync) to an `attachments/` folder on Drive.
*   **Restore:** Downloads the selected database snapshot and syncs any missing attachment files from the cloud to the local machine.
