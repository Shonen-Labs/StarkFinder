# anon backend – quick start

This doc shows how to set up and run the Rust backend in `anon/backend/`.

## Prerequisites
- Docker and Docker Compose
- Rust (for local `cargo run` option)

## 1) Environment file
From `anon/backend/`:

```bash
cp .env.example .env
```

Adjust `DATABASE_URL` in `.env` if your Postgres differs. Defaults point to a local Postgres at `localhost:5432`.

## 2) Start Postgres via Docker
From repo root (where `docker-compose.yml` is):

```bash
docker compose up -d db
```

This runs Postgres 16 on port `5432`.

## Option A: Run backend locally (recommended for development)
From `anon/backend/`:

```bash
# compile-time offline mode for sqlx (uses the checked .sqlx metadata)
SQLX_OFFLINE=true cargo run
```

- Server defaults to `PORT=8080` (set in `.env`).
- Logs are controlled by `RUST_LOG` (default `info`).
- Migrations run automatically on startup.

Visit:
- API base: http://localhost:8080
- Swagger UI: http://localhost:8080/docs

## Option B: Run backend in Docker
From repo root:

```bash
# Build and run the Rust backend container and Postgres
docker compose up -d --build db anon-rust
```

- Container exposes `8080` → host `8080` (see `docker-compose.yml`).
- Logs: `docker compose logs -f anon-rust`
- Stop: `docker compose down` (adds `-v` to clear volumes if desired).

## Troubleshooting
- "DATABASE_URL not set": ensure you copied `.env` in `anon/backend/`.
- Connection refused: make sure `docker compose up -d db` is running and `DATABASE_URL` points to it.
- Port in use: change `PORT` in `.env` and restart.
