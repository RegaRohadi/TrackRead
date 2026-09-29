# 📖 TrackRead

TrackRead adalah aplikasi manajemen buku pribadi dan pelacak progres bacaan. Repo ini adalah monorepo yang berisi dua bagian:

- **`backend/`** — REST API Laravel 12 (PostgreSQL 17, Sanctum)
- **`frontend/`** — SPA Vue 3 + TypeScript (Vite, Pinia, TailwindCSS v4)

---

## ✨ Ringkasan Aplikasi

| Bagian | Teknologi |
| :--- | :--- |
| Backend | Laravel 12 · PHP 8.4 · PostgreSQL 17 · Laravel Sanctum · Dedoc Scramble |
| Frontend | Vue 3 (Composition API) · TypeScript · Vite · Pinia · Vue Router · TailwindCSS v4 · Axios · SweetAlert2 |
| Infrastruktur | Docker Compose: PostgreSQL, PHP-FPM, nginx API, nginx frontend |

Fitur utama:

- 🔐 **Autentikasi** — login & register, sesi Pinia, token Bearer Sanctum.
- 📚 **Manajemen buku** — tambah, edit, hapus, upload PDF/EPUB beserta cover, tampilan grid responsif.
- 📖 **Reader bawaan** — baca **PDF** (pdf.js) dan **EPUB** (epub.js) dengan progres tersimpan otomatis.
- 📊 **Progress & statistik** — progress bar dinamis (`pages_read / total_pages`).
- 🔎 **Pencarian & filter** — pencarian real-time (judul/penulis/ISBN) dan filter genre.
- 🎨 **UI modern** — responsif dengan TailwindCSS v4, modal, dan SweetAlert2.
- 🧪 **Testing** — Vitest & Playwright (frontend), PHPUnit (backend).

---

## 🚀 Cara Setup (Docker — Direkomendasikan)

Jalankan dari **root repository**:

```bash
cp .env.example .env
docker compose up -d --build
```

Entrypoint `php` otomatis menjalankan saat start:

1. install dependency Composer (jika `vendor/` belum ada)
2. generate `APP_KEY` (jika masih kosong)
3. `php artisan migrate --force`
4. `php artisan storage:link`

Opsional — isi perpustakaan awal:

```bash
docker compose exec php php artisan db:seed
```

### Akses

| Layanan | URL |
| :--- | :--- |
| Frontend (SPA) | http://localhost:5174 |
| API | http://localhost:8001/api/v1 |
| Dokumentasi API (Scramble) | http://localhost:8001/docs/api |
| Health check | http://localhost:8001/up |

### Service & Port

| Service | Container | Port host |
| :--- | :--- | :--- |
| PostgreSQL 17 | `trackread-postgres` | `5434` |
| PHP-FPM 8.4 | `trackread-php` | — |
| nginx API | `trackread-nginx` | `8001` |
| nginx frontend | `trackread-frontend` | `5174` |

Frontend mem-proxy `/api/` dan `/storage/` ke `trackread-nginx`, sehingga SPA dan API satu origin.

---

## 📁 Struktur Repository

```
.
├── docker-compose.yml       # satu compose untuk seluruh project
├── .env                     # env tunggal (git-ignored)
├── .env.example             # template kosong (hanya key)
├── docker/
│   ├── php/                 # image PHP-FPM + entrypoint + opcache
│   ├── nginx/               # konfigurasi nginx API
│   └── frontend/            # build multi-stage + nginx frontend
├── backend/                 # Laravel API
└── frontend/                # Vue SPA
```

---

## 🔑 Environment

Ada **satu `.env` di root** yang dipakai bersama oleh:

- **Docker Compose** (port & kredensial database)
- **Backend** — dibaca Laravel via `bootstrap/app.php` (`useEnvironmentPath`)
- **Frontend** — dibaca Vite via `envDir` (dev lokal/testing)

`backend/.env` tidak dipakai lagi. `.env.example` di-commit hanya berisi key (nilai kosong); `.env` sendiri di-gitignore.

Docker tetap jalan meski `.env` kosong karena `docker-compose.yml` menyediakan default aman (`DB_HOST=postgres`, `DB_DATABASE=trackread`, dst.). Untuk dev lokal, isi nilai yang diperlukan di `.env` root.

Variabel frontend:

```env
VITE_API_BASE_URL=http://localhost:8001/api/v1
VITE_STORAGE_BASE_URL=http://localhost:8001/storage
```

Build Docker frontend menimpanya dengan path relatif (`/api/v1`, `/storage`) agar lewat proxy nginx internal.

---

## 💻 Menjalankan Lokal (Tanpa Docker)

**Backend** (butuh PHP 8.2+ dengan ekstensi `pdo_pgsql`, `mbstring`, `gd`, `zip`):

```bash
cp .env.example .env          # dari root repository
cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve              # http://localhost:8000
```

**Frontend** (butuh Node.js 22+):

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

---

## 🛠️ API Endpoints

### 🔐 Autentikasi (`/api/v1/auth`)

| Method | Endpoint | Deskripsi | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Registrasi akun baru | ❌ |
| `POST` | `/auth/login` | Login & dapatkan token | ❌ |
| `POST` | `/auth/logout` | Cabut token aktif | ✅ |
| `GET` | `/auth/me` | Profil user yang login | ✅ |
| `POST` | `/auth/change-password` | Ubah password | ✅ |

### 📚 Manajemen Buku (`/api/v1/books`)

| Method | Endpoint | Deskripsi | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/books` | Daftar buku (paginasi: `?genre=&page=&per_page=`) | ✅ |
| `GET` | `/books/genres` | Daftar genre unik milik user | ✅ |
| `GET` | `/books/search` | Cari buku (`?q=&genre=&page=`) | ✅ |
| `GET` | `/books/{id}/file` | Stream file PDF/EPUB | ✅ |
| `POST` | `/books` | Tambah buku (multipart: `cover` + `pdf`/epub opsional) | ✅ |
| `PUT` | `/books/{id}` | Update detail buku / progres | ✅ |
| `DELETE` | `/books/{id}` | Hapus buku | ✅ |

Arsitektur backend: clean layered — Controllers → Form Requests → Services → Repositories (Eloquent) → Models & Migrations, dengan multi-tenancy per user.

---

## 🧪 Testing

```bash
# Backend (PHPUnit)
docker compose exec php php artisan test

# Frontend
cd frontend
npm run test:unit              # Vitest
npm run test:e2e               # Playwright
npm run type-check
npm run lint
```

---

## ☁️ Catatan Produksi

- Host nginx (`trackread.regazgaz.online`) mem-proxy ke `127.0.0.1:5174`, jadi **port host frontend wajib tetap `5174`**.
- Pertahankan nama project Compose `trackread` agar volume database `trackread_postgres_data` tetap dipakai.
- OPcache berjalan dengan `validate_timestamps=0`; perubahan kode PHP tidak otomatis terbaca. Setelah deploy, restart container: `docker compose restart php`.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
