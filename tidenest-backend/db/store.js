/**
 * Simple JSON file-based data store for TideNest
 * Uses only Node.js built-in modules
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Ensure data directory and files exist
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
  if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, '[]');
  if (!fs.existsSync(CONTACTS_FILE)) fs.writeFileSync(CONTACTS_FILE, '[]');
}

function readJson(file) {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeJson(file, data) {
  ensureStore();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------- Users ----------
function getUsers() {
  return readJson(USERS_FILE);
}

function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

function createUser({ name, email, password }) {
  const users = getUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: 'Email already registered' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeJson(USERS_FILE, users);

  // Return user without sensitive fields
  const { passwordHash, salt: _, ...safeUser } = user;
  return { user: safeUser };
}

function verifyPassword(user, password) {
  const hash = crypto.pbkdf2Sync(password, user.salt, 100000, 64, 'sha512').toString('hex');
  return hash === user.passwordHash;
}

// ---------- Bookings ----------
function getBookings() {
  return readJson(BOOKINGS_FILE);
}

function createBooking(data) {
  const bookings = getBookings();
  const booking = {
    id: crypto.randomUUID(),
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  bookings.push(booking);
  writeJson(BOOKINGS_FILE, bookings);
  return booking;
}

function getBookingsByUser(userId) {
  return getBookings().filter(b => b.userId === userId);
}

// ---------- Contact messages ----------
function createContact(data) {
  const contacts = readJson(CONTACTS_FILE);
  const message = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
    read: false
  };
  contacts.push(message);
  writeJson(CONTACTS_FILE, contacts);
  return message;
}

// ---------- Auth tokens (simple signed tokens) ----------
const SECRET = process.env.TIDENEST_SECRET || 'tidenest-dev-secret-change-in-production';

function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  ensureStore,
  getUsers,
  findUserByEmail,
  createUser,
  verifyPassword,
  getBookings,
  createBooking,
  getBookingsByUser,
  createContact,
  createToken,
  verifyToken
};
