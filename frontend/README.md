# 🚀 Smart CV - Frontend Monorepo

Welcome to the **Smart CV** Frontend Repository! 

Smart CV is a next-generation recruitment and profile-building platform designed to connect candidates and recruiters. This repository is built as a modern **Monorepo** using **pnpm Workspaces**, ensuring optimal code sharing, ultra-fast dependency management, and highly-scalable shared modules.

*   **Backend Repository**: [smartCv-be](https://github.com/phamlucchuong/smartCv-be)

---

## 🛠️ 1. Technical Stack

The frontend architecture uses cutting-edge technologies aligned with modern web standards:

*   **Monorepo Architecture**: [pnpm Workspaces](https://pnpm.io/workspaces) locks workspace packages and links them locally in-memory without publishing, saving disk space and optimizing compilation.
*   **Core Libraries**: [React 19](https://react.dev/) and [Vite 8](https://vite.dev/) provide instant Hot Module Replacement (HMR) and a lightning-fast development server booting in milliseconds.
*   **Type-Safe Routing**: [TanStack Router v1](https://tanstack.com/router) introduces highly-robust, 100% type-safe *File-Based Routing* with compile-time path verification.
*   **Client State Management**: [Zustand v5](https://zustand-demo.pmnd.rs/) manages global client-side UI states in a lightweight, high-performance store that persists cleanly across route transitions.
*   **Design System & Theme**: `@smart-cv/ui` wraps custom **shadcn/ui + Tailwind CSS** with HSL CSS Variables to deliver unified light/dark color palettes.
*   **Localization (i18n)**: `@smart-cv/i18n` uses **i18next** to dynamically load localization JSON files by namespaces, fully supporting English and Vietnamese translations.
*   **API Client Generation**: `@smart-cv/api` automatically compiles Swagger JSON endpoints using **Orval + React Query v5 + Axios** to produce type-safe hooks for clean backend integration.

---

## 📂 2. Folder Structure

The monorepo separates independent web applications (`apps`) from shared local workspace dependencies (`packages`).

```bash
smartCV-fe/
├── apps/                        # --- APPLICATIONS ---
│   ├── web-candidate/           # Portal for job candidates (Profile builder, job search, apply) -> Port: 3000
│   ├── web-recruiter/           # Portal for recruiters (Job post creation, candidate management) -> Port: 3001
│   └── web-admin/               # Administrative panel (User management, platform configs) -> Port: 3003
│
├── packages/                    # --- SHARED MONOREPO LIBRARIES ---
│   ├── ui/                      # Design system (shadcn/ui + Tailwind CSS, Button, Card, Input...)
│   ├── i18n/                    # Shared localization framework & VI/EN JSON files
│   └── api/                     # Shared OpenAPI client generator (Orval + React Query hooks)
│
├── .gitignore                   # Strict security file to exclude credentials, logs, and build artifacts
├── pnpm-workspace.yaml          # Defines pnpm workspace application targets
├── package.json                 # Monorepo scripts and workspace settings
└── pnpm-lock.yaml               # Synced dependency lockfile for the entire monorepo
```

---

## ⚙️ 3. Environment Variables

We manage app-specific variables using a template [.env.example](file:///home/lucchuong/Documents/smartCV-fe/.env.example). Copy this file into each app's workspace and adjust the variables as required.

Detailed variable explanations:

| Variable | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `String (URL)` | `https://api.example.com` | Base API Gateway endpoint that the Orval Axios mutator targets. |
| `VITE_I18N_DEFAULT_LOCALE` | `String` | `en` | The default localization locale of the application upon first visit (`vi`/`en`). |
| `VITE_I18N_FALLBACK_LOCALE` | `String` | `en` | The fallback locale used when a translation key is missing. |

---

## 🚀 4. Installation & Getting Started

### Prerequisites
*   **Node.js**: Version 18 or above.
*   **pnpm**: Version 9 or 10 is recommended (Install globally via `npm install -g pnpm`).

---

### Step 1: Install Dependencies
Run this single command from the monorepo root to fetch and link all applications and shared packages:

```bash
pnpm install
```
*This command links internal shared modules (@smart-cv/ui, @smart-cv/i18n, @smart-cv/api) directly into node_modules for local compiling.*

---

### Step 2: Configure Environment Variables
Create a local `.env` file for each web application by copying the template:

```bash
# For Linux / macOS
cp .env.example apps/web-candidate/.env
cp .env.example apps/web-recruiter/.env
cp .env.example apps/web-admin/.env

# For Windows (Command Prompt)
copy .env.example apps\web-candidate\.env
copy .env.example apps\web-recruiter\.env
copy .env.example apps\web-admin\.env
```
*After copying, open the `.env` file inside each app directory and update `VITE_API_BASE_URL` to point to your local Backend API Gateway.*

---

### Step 3: Run the Development Server

#### Spin up ALL applications concurrently:
From the monorepo root directory, run:
```bash
pnpm dev
```
*This command starts all three development servers simultaneously:*
*   Candidate Web Portal: `http://localhost:3000`
*   Recruiter Web Portal: `http://localhost:3001`
*   Admin Dashboard: `http://localhost:3003`

#### Spin up a specific application:
If you want to conserve memory or work on a single app:

*   **Job Candidate App**:
    ```bash
    pnpm -F web-candidate dev
    ```
*   **Recruiter App**:
    ```bash
    pnpm -F web-recruiter dev
    ```
*   **Admin App**:
    ```bash
    pnpm -F web-admin dev
    ```

---

### Step 4: Compile for Production

To build production-ready, optimized bundles for all applications, run:

```bash
pnpm build
```

To run a static typecheck on a specific workspace (e.g., candidate app) to guarantee zero runtime failures:

```bash
pnpm -F web-candidate exec tsc --noEmit
```
