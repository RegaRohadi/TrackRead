# 📖 TrackRead Backend (API)

REST API backend for **TrackRead** — a personal book management and reading progress tracker. Built with **Laravel 12**, **PostgreSQL**, and **Laravel Sanctum**.

---

## 🚀 Tech Stack & Architecture

- **Framework:** Laravel 12 (PHP 8.2+)
- **Database:** PostgreSQL 17
- **Authentication:** Laravel Sanctum (Bearer Token)
- **API Documentation:** Dedoc Scramble (`/docs/api`)
- **Testing:** PHPUnit (Unit & Feature tests)
- **Architecture Pattern:** Clean Layered Architecture
  - **Controllers:** Request handling & response transformations via API Resources
  - **Form Requests:** Input validation rules
  - **Services:** Business logic separation
  - **Repositories (Eloquent):** Database query abstraction
  - **Models & Migrations:** Multi-tenancy per user

---

## 🛠️ API Endpoints

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user account | ❌ No |
| `POST` | `/auth/login` | Log in and receive API token | ❌ No |
| `POST` | `/auth/logout` | Revoke current user token | ✅ Yes |
| `GET` | `/auth/me` | Fetch authenticated user profile | ✅ Yes |
| `POST` | `/auth/change-password` | Update current user password | ✅ Yes |

### 📚 Book Management (`/api/v1/books`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/books` | Paginated list of books (supports `?genre=&page=&per_page=`) | ✅ Yes |
| `GET` | `/books/genres` | Unique list of user genres | ✅ Yes |
| `GET` | `/books/search` | Search books (`?q=&genre=&page=`) | ✅ Yes |
| `GET` | `/books/{id}/file` | Stream the uploaded file (PDF/EPUB) | ✅ Yes |
| `POST` | `/books` | Create new book (multipart/form-data with optional `cover` + `pdf`/epub file) | ✅ Yes |
| `PUT` | `/books/{id}` | Update existing book details or progress | ✅ Yes |
| `DELETE` | `/books/{id}` | Delete book from library | ✅ Yes |

---

## 🐳 Running with Docker (Recommended)

> Run these commands from the **repository root**; a single `docker-compose.yml`
> there starts PostgreSQL, the API and the frontend together.

1. **Copy Environment File (root):**
   ```bash
   cp .env.example .env
   ```
   *Fill in the values you need. For Docker, `docker-compose.yml` provides safe
   defaults (`DB_HOST=postgres`, etc.) so it boots even with a blank `.env`.*

2. **Build and Start Containers:**
   ```bash
   docker compose up -d --build
   ```
   The `php` entrypoint automatically runs `composer install`, `key:generate`
   (when `APP_KEY` is empty), `migrate --force` and `storage:link`.

3. **Seed initial data (optional):**
   ```bash
   docker compose exec php php artisan db:seed
   ```
   *`InitialBookSeeder` replaces the library with every EPUB in `storage/app/public/initial_books/`
   (metadata, curated genre, cover, and estimated page count are extracted automatically).*

4. **Access the API:**
   - Base URL: `http://localhost:8001/api/v1`
   - Interactive API Docs: `http://localhost:8001/docs/api`
   - Frontend: `http://localhost:5174`

> **Note:** OPcache runs with `validate_timestamps=0`, so PHP code changes are not
> picked up automatically. After deploying, restart the container:
> `docker compose restart php` (or run `opcache_reset()`).

---

## 💻 Running Locally (Without Docker)

### Prerequisites
- PHP 8.2+ with `pdo_pgsql`, `mbstring`, `gd`, `zip` extensions (`zip` is required to parse EPUB metadata/covers)
- Composer 2.x
- PostgreSQL server running locally

### Steps
```bash
# 1. Setup environment (single root .env shared by backend & frontend)
cp .env.example .env

# 2. Install dependencies
composer install
php artisan key:generate

# 3. Configure .env with your local PostgreSQL credentials, then run:
php artisan migrate
php artisan storage:link

# 4. Start local development server
php artisan serve
```

---

## 🧪 Testing

Run PHPUnit tests:
```bash
# In Docker:
docker compose exec php php artisan test

# Locally:
php artisan test
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
