# TideNest – Complete Source Code

**Clean Spaces. Happy Lives.**

A full-stack cleaning services platform (frontend + backend).

---

## Project Structure

```
tidenest-full/
├── TideNest.html              # Frontend (single-page app)
├── start.sh                   # Quick start script
├── .gitignore
├── README.md                  # This file
└── tidenest-backend/
    ├── server.js              # Main backend server
    ├── package.json
    ├── README.md              # Backend-specific docs
    ├── .env.example
    └── db/
        ├── store.js           # Data access layer
        └── data/              # JSON storage (auto-created)
            ├── users.json
            ├── bookings.json
            └── contacts.json
```

---

## Requirements

- **Node.js** 18+ (uses only built-in modules – no `npm install` needed)

---

## How to Run

### Option 1 – Quick start
```bash
chmod +x start.sh
./start.sh
```

### Option 2 – Manual
```bash
cd tidenest-backend
node server.js
```

Then open your browser:

**http://localhost:3000**

(You can change the port with `PORT=4000 node server.js`)

---

## What Works Out of the Box

| Feature              | Description                                      |
|----------------------|--------------------------------------------------|
| Home & Services      | Browse cleaning packages with prices in KSh      |
| Book a Service       | Submit real booking requests                     |
| Sign Up / Log In     | User accounts with secure password hashing       |
| Contact Form         | Messages are stored on the server                |
| Auth state           | Header shows logged-in user + Log Out            |
| Mobile responsive    | Works on phone, tablet and desktop               |

---

## API Overview

| Method | Endpoint             | Purpose                    |
|--------|----------------------|----------------------------|
| GET    | `/api/health`        | Health check               |
| POST   | `/api/auth/signup`   | Create account             |
| POST   | `/api/auth/login`    | Log in                     |
| GET    | `/api/auth/me`       | Get current user           |
| POST   | `/api/bookings`      | Create booking             |
| GET    | `/api/bookings`      | List my bookings (auth)    |
| POST   | `/api/contact`       | Submit contact message     |
| GET    | `/api/services`      | List services              |

Full details are in `tidenest-backend/README.md`.

---

## Data Storage

All data is saved as plain JSON files inside:

```
tidenest-backend/db/data/
```

You can open these files to inspect users, bookings and contact messages.

---

## Customisation Tips

1. Change the secret used for tokens:
   ```bash
   export TIDENEST_SECRET="your-long-random-string"
   node server.js
   ```

2. Add real images next to `TideNest.html` (e.g. `house-cleaning.jpeg`) – the frontend already references them.

3. For production:
   - Put the app behind HTTPS
   - Switch JSON storage to SQLite or PostgreSQL
   - Add email notifications for new bookings
   - Set a strong `TIDENEST_SECRET`

---

## License

MIT – free to use and modify for your own projects.
'''
