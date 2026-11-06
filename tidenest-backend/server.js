/**
 * TideNest Backend Server
 * Pure Node.js (no external dependencies)
 * Run: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const store = require('./db/store');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..'); // parent folder contains TideNest.html

// Initialize data store
store.ensureStore();

// ---------- Helpers ----------
function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function getAuthUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  return store.verifyToken(token);
}

// ---------- API Routes ----------
async function handleApi(req, res, pathname) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  try {
    // Health check
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { status: 'ok', service: 'TideNest API' });
    }

    // ----- Auth: Sign Up -----
    if (pathname === '/api/auth/signup' && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, email, password } = body;

      if (!name || !email || !password) {
        return sendJson(res, 400, { error: 'Name, email and password are required' });
      }
      if (password.length < 6) {
        return sendJson(res, 400, { error: 'Password must be at least 6 characters' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { error: 'Invalid email address' });
      }

      const result = store.createUser({ name: name.trim(), email: email.trim(), password });
      if (result.error) {
        return sendJson(res, 409, { error: result.error });
      }

      const token = store.createToken(result.user);
      return sendJson(res, 201, {
        message: 'Account created successfully',
        user: result.user,
        token
      });
    }

    // ----- Auth: Log In -----
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password are required' });
      }

      const user = store.findUserByEmail(email.trim());
      if (!user || !store.verifyPassword(user, password)) {
        return sendJson(res, 401, { error: 'Invalid email or password' });
      }

      const { passwordHash, salt, ...safeUser } = user;
      const token = store.createToken(safeUser);

      return sendJson(res, 200, {
        message: 'Logged in successfully',
        user: safeUser,
        token
      });
    }

    // ----- Auth: Me (current user) -----
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const user = getAuthUser(req);
      if (!user) return sendJson(res, 401, { error: 'Not authenticated' });
      return sendJson(res, 200, { user });
    }

    // ----- Bookings: Create -----
    if (pathname === '/api/bookings' && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, service, date, location, notes } = body;

      if (!name || !service || !date || !location) {
        return sendJson(res, 400, {
          error: 'Name, service, date and location are required'
        });
      }

      const allowedServices = [
        'House Cleaning',
        'Deep Cleaning',
        'Sofa & Upholstery',
        'Window Cleaning'
      ];
      if (!allowedServices.includes(service)) {
        return sendJson(res, 400, { error: 'Invalid service selected' });
      }

      // Optional: attach logged-in user
      const authUser = getAuthUser(req);

      const booking = store.createBooking({
        customerName: name.trim(),
        service,
        preferredDate: date,
        location: location.trim(),
        notes: notes ? notes.trim() : '',
        userId: authUser ? authUser.id : null,
        userEmail: authUser ? authUser.email : null
      });

      return sendJson(res, 201, {
        message: 'Booking request received successfully',
        booking
      });
    }

    // ----- Bookings: List (for logged-in user or admin) -----
    if (pathname === '/api/bookings' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Login required to view bookings' });

      const bookings = store.getBookingsByUser(authUser.id);
      return sendJson(res, 200, { bookings });
    }

    // ----- Contact form -----
    if (pathname === '/api/contact' && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, email, message } = body;

      if (!name || !email || !message) {
        return sendJson(res, 400, { error: 'Name, email and message are required' });
      }

      const contact = store.createContact({
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
      });

      return sendJson(res, 201, {
        message: 'Thank you! Your message has been received. We will get back to you soon.',
        id: contact.id
      });
    }

    // ----- Services list (static for now) -----
    if (pathname === '/api/services' && req.method === 'GET') {
      return sendJson(res, 200, {
        services: [
          { id: 'house', name: 'House Cleaning', priceFrom: 1500, currency: 'KSh', description: 'General cleaning for your living room, bedroom, kitchen and more.' },
          { id: 'deep', name: 'Deep Cleaning', priceFrom: 3000, currency: 'KSh', description: 'Thorough cleaning for a healthier, fresher environment.' },
          { id: 'sofa', name: 'Sofa & Upholstery', priceFrom: 1000, currency: 'KSh', description: 'Clean and refresh your sofas, cushions and furniture.' },
          { id: 'window', name: 'Window Cleaning', priceFrom: 800, currency: 'KSh', description: 'Crystal clear windows for a brighter space.' }
        ]
      });
    }

    // Not found
    return sendJson(res, 404, { error: 'API endpoint not found' });

  } catch (err) {
    console.error('API Error:', err.message);
    return sendJson(res, 500, { error: 'Internal server error' });
  }
}

// ---------- Static file serving (optional – serves the HTML) ----------
function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/TideNest.html' : pathname;
  // Security: prevent directory traversal
  filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(PUBLIC_DIR, filePath);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(fullPath).toLowerCase();
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ---------- Main server ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);

  if (pathname.startsWith('/api/')) {
    return handleApi(req, res, pathname);
  }

  // Serve static files (HTML + images if placed next to it)
  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`\n🚀 TideNest backend running at http://localhost:${PORT}`);
  console.log(`   Frontend:  http://localhost:${PORT}/`);
  console.log(`   API health: http://localhost:${PORT}/api/health`);
  console.log(`   Data stored in: ${path.join(__dirname, 'db', 'data')}\n`);
});
