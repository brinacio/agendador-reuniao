import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database
const db = new Database('meetings.db');

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER DEFAULT 60,
    participants TEXT,
    link TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// API Routes
app.get('/api/meetings', (req, res) => {
  const meetings = db.prepare('SELECT * FROM meetings ORDER BY date, time').all();
  res.json(meetings);
});

app.get('/api/meetings/:id', (req, res) => {
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  res.json(meeting);
});

app.post('/api/meetings', (req, res) => {
  const { title, description, date, time, duration, participants, link } = req.body;
  if (!title || !date || !time) {
    return res.status(400).json({ error: 'Title, date and time are required' });
  }
  const result = db.prepare(
    'INSERT INTO meetings (title, description, date, time, duration, participants, link) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(title, description, date, time, duration || 60, participants, link);
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(meeting);
});

app.put('/api/meetings/:id', (req, res) => {
  const { title, description, date, time, duration, participants, link } = req.body;
  const existing = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Meeting not found' });
  db.prepare(
    'UPDATE meetings SET title=?, description=?, date=?, time=?, duration=?, participants=?, link=? WHERE id=?'
  ).run(title, description, date, time, duration, participants, link, req.params.id);
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  res.json(meeting);
});

app.delete('/api/meetings/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Meeting not found' });
  db.prepare('DELETE FROM meetings WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

app.get('/api/meetings/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
