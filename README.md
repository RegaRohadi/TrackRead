# 📱 TrackRead Frontend

Modern Single Page Application (SPA) for **TrackRead** — a personal book management and reading progress tracker. Built with **Vue 3**, **TypeScript**, **Vite**, **Pinia**, and **TailwindCSS v4**.

---

## 🌟 Key Features

- 🔐 **Authentication Flows**: Unified Login & Register view with form validation and Pinia session management.
- 📚 **Interactive Book Management**: Add, edit, delete, and view reading materials in a responsive card grid.
- 📊 **Visual Progress Bars**: Dynamic reading progress calculation (`pages_read / total_pages`).
- 🔎 **Real-time Filter & Search**: Instant debounce search by title/author/ISBN and genre filtering.
- 🎨 **Modern Design**: Responsive UI with TailwindCSS v4, modals, and SweetAlert2 interactive alerts.
- 🧪 **Comprehensive Testing**: Unit tests with Vitest and End-to-End tests with Playwright.

---

## 🛠️ Tech Stack

- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Language:** TypeScript
- **Styling:** TailwindCSS v4
- **State Management:** Pinia
- **Routing:** Vue Router (with `requiresAuth` guards)
- **HTTP Client:** Axios
- **Dialogs & Alerts:** SweetAlert2
- **Testing:** Vitest & Playwright
- **Linting & Formatting:** Oxlint & Oxformat / ESLint

---

## 🐳 Running with Docker

1. **Build and start the container:**
   ```bash
   docker compose up -d --build
   ```

2. **Access the application:**
   - Open `http://localhost:5173` in your browser.
   - Served via high-performance Nginx with SPA routing configured.

---

## 💻 Running Locally (Development Mode)

### Prerequisites
- Node.js 22+ & npm

### Steps
1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment (Optional):**
   ```bash
   cp .env.example .env
   ```
   *By default, the frontend connects to backend at `http://localhost:8001/api/v1`.*

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   *Vite dev server will start at `http://localhost:5173`.*

---

## 🧪 Testing & Code Quality

```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run linter
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
