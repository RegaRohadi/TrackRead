# 📖 TrackRead

TrackRead adalah aplikasi manajemen buku pribadi dan pelacak progres bacaan.
Repo ini adalah monorepo yang berisi dua bagian:

- **`backend/`** — REST API Laravel 12 (PostgreSQL, Sanctum)
- **`frontend/`** — SPA Vue 3 + TypeScript (Vite, Pinia, TailwindCSS)

---

## 📁 Structure

```
.
├── docker-compose.yml
├── .env.example
├── docker/
│   ├── php/
│   ├── nginx/
│   └── frontend/
├── backend/
└── frontend/
```

---

## 🚀 Setup

Jalankan dari root repository:

```bash
cp .env.example .env
docker compose up -d --build
```

- Frontend: http://localhost:5174
- API: http://localhost:8001/api/v1
- API docs: http://localhost:8001/docs/api
