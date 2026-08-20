const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway persistent volume mounts here; falls back to local /data for dev
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DEFAULT_DATA_DIR = path.join(__dirname, 'data');

// If DATA_DIR points to an empty persistent volume (e.g. first deploy on Railway),
// seed it with the default JSON files bundled in the repo so login/schedule/etc. work.
function seedDataDirIfEmpty() {
  if (DATA_DIR === DEFAULT_DATA_DIR) return; // nothing to seed, already using bundled data
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const defaultFiles = fs.readdirSync(DEFAULT_DATA_DIR);
  for (const file of defaultFiles) {
    const destPath = path.join(DATA_DIR, file);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(path.join(DEFAULT_DATA_DIR, file), destPath);
      console.log(`Seeded ${file} into ${DATA_DIR}`);
    }
  }
}
seedDataDirIfEmpty();

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'xplosive-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 } // 30 days
}));

// ---------- helpers ----------
function readJSON(file) {
  const filePath = path.join(DATA_DIR, file);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
function writeJSON(file, data) {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// ---------- auth ----------
app.post('/auth/login', (req, res) => {
  const { pin } = req.body;
  const users = readJSON('users.json');
  const user = users.find(u => u.pin === String(pin));
  if (!user) return res.status(401).json({ error: 'Invalid PIN' });
  req.session.user = { name: user.name, role: user.role };
  res.json({ ok: true, user: req.session.user });
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/auth/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// ---------- read endpoints (any logged-in user) ----------
app.get('/api/schedule', requireLogin, (req, res) => res.json(readJSON('schedule.json')));
app.get('/api/events', requireLogin, (req, res) => res.json(readJSON('events.json')));
app.get('/api/competitions', requireLogin, (req, res) => res.json(readJSON('competitions.json')));
app.get('/api/supplies', requireLogin, (req, res) => res.json(readJSON('supplies.json')));

// ---------- users (admin only — for adding parent PINs) ----------
app.get('/api/users', requireAdmin, (req, res) => res.json(readJSON('users.json')));
app.put('/api/users', requireAdmin, (req, res) => {
  const users = req.body;
  const pins = users.map(u => String(u.pin));
  const hasDuplicates = new Set(pins).size !== pins.length;
  if (hasDuplicates) return res.status(400).json({ error: 'Duplicate PIN — each user needs a unique PIN.' });
  writeJSON('users.json', users);
  res.json({ ok: true });
});

// ---------- write endpoints (admin only) ----------
app.put('/api/schedule', requireAdmin, (req, res) => {
  writeJSON('schedule.json', req.body);
  res.json({ ok: true });
});
app.put('/api/events', requireAdmin, (req, res) => {
  writeJSON('events.json', req.body);
  res.json({ ok: true });
});
app.put('/api/competitions', requireAdmin, (req, res) => {
  writeJSON('competitions.json', req.body);
  res.json({ ok: true });
});
app.put('/api/supplies', requireAdmin, (req, res) => {
  writeJSON('supplies.json', req.body);
  res.json({ ok: true });
});

// ---------- static pages ----------
// index.html now lives in public/ as the public landing page,
// so express.static serves it automatically at "/" — no redirect needed.
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Xplosive Portal running on port ${PORT}`);
});
