# TideNest Backend

Lightweight backend for the TideNest cleaning services platform.

## Features

- **User authentication** – Sign up, log in, JWT-style tokens (HMAC signed)
- **Bookings** – Create cleaning service bookings
- **Contact form** – Store customer messages
- **Services list** – Static catalog of cleaning services
- **JSON file storage** – No external database required
- **Static file serving** – Serves the frontend HTML from the parent directory

## Tech Stack

- Pure Node.js (no npm packages required)
- Built-in `http`, `fs`, `crypto`, `url` modules
- Password hashing with PBKDF2
- Simple signed tokens for sessions

## Quick Start

```bash
cd tidenest-backend
node server.js
```

Then open: **http://localhost:3000**

The frontend (`TideNest.html`) is served automatically from the parent folder.

## API Endpoints

| Method | Endpoint            | Description                  | Auth required |
|--------|---------------------|------------------------------|---------------|
| GET    | `/api/health`       | Health check                 | No            |
| POST   | `/api/auth/signup`  | Create account               | No            |
| POST   | `/api/auth/login`   | Log in                       | No            |
| GET    | `/api/auth/me`      | Current user                 | Yes           |
| POST   | `/api/bookings`     | Create booking               | Optional      |
| GET    | `/api/bookings`     | List user's bookings         | Yes           |
| POST   | `/api/contact`      | Submit contact message       | No            |
| GET    | `/api/services`     | List available services      | No            |

### Example requests

**Sign up**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123"}'
```

**Log in**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123"}'
```

**Create booking**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","service":"House Cleaning","date":"2026-11-05","location":"Nairobi"}'
```

## Data Storage

All data is stored as JSON files in:

```
tidenest-backend/db/data/
  ├── users.json
  ├── bookings.json
  └── contacts.json
```

## Environment

- `PORT` – server port (default `3000`)
- `TIDENEST_SECRET` – token signing secret (change in production)

## Production Notes

This is a clean, educational/demo backend. For production you would typically:

1. Switch to a real database (PostgreSQL / SQLite with better-sqlite3 / MongoDB)
2. Use a proper JWT library and stronger secret management
3. Add rate limiting, input sanitization, and HTTPS
4. Add email notifications for new bookings
5. Add admin dashboard for managing bookings and cleaners
'''
