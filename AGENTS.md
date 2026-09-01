# Base44 Dev Environment

## Stack
- **Frontend:** React 19 + Vite 8 (dev server on port 3000)
- **Mock API:** json-server watching `db.json` on port 3001

## Architecture
Single compose service (`web`) runs both processes:
- `npm run server` → json-server on port 3001 (background)
- `npm run dev` → Vite dev server on port 3000 (foreground)

Vite proxies `/usuarios` requests to json-server on port 3001, so the frontend
uses relative URLs (e.g. `/usuarios`) instead of hardcoded `http://localhost:3000`.

## Running
```
docker compose -f docker-compose.base44.yml up -d
```

## Notes
- `react-icons` was added to `package.json` (used throughout the UI but was missing from dependencies).
- Fetch calls in `Login.jsx` and `Register.jsx` were changed from absolute `http://localhost:3000/...` to relative `/...` so Vite's proxy handles them correctly in the preview.
- No external secrets required — json-server uses the local `db.json` file.
- Seed users in `db.json`: `kauafidalgo01@gmail.com` / `kauafidalgo0803` and `admin@gmail.com` / `admin1`.
