import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database
const db = new Database('meetings.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    descricao TEXT NOT NULL,
    criador_token TEXT NOT NULL,
    fechado INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS disponibilidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    dia TEXT NOT NULL,
    hora TEXT NOT NULL,
    disponivel INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
  );
`);

// Health check - keeps service alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes

// Create meeting
app.post('/api/meetings', (req, res) => {
  const { id, descricao, criador_token } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO meetings (id, descricao, criador_token) VALUES (?, ?, ?)');
    stmt.run(id, descricao, criador_token);
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar reunião' });
  }
});

// Get meeting
app.get('/api/meetings/:id', (req, res) => {
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Reunião não encontrada' });
  const participantes = db.prepare('SELECT DISTINCT nome FROM disponibilidades WHERE meeting_id = ?').all(req.params.id);
  res.json({ ...meeting, participantes: participantes.map((p: any) => p.nome) });
});

// Save availability
app.post('/api/meetings/:id/disponibilidades', (req, res) => {
  const { nome, slots } = req.body;
  const meeting_id = req.params.id;
  try {
    db.prepare('DELETE FROM disponibilidades WHERE meeting_id = ? AND nome = ?').run(meeting_id, nome);
    const stmt = db.prepare('INSERT INTO disponibilidades (meeting_id, nome, dia, hora, disponivel) VALUES (?, ?, ?, ?, ?)');
    for (const slot of slots) {
      stmt.run(meeting_id, nome, slot.dia, slot.hora, slot.disponivel ? 1 : 0);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar disponibilidades' });
  }
});

// Close meeting
app.post('/api/meetings/:id/fechar', (req, res) => {
  const { criador_token } = req.body;
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id) as any;
  if (!meeting) return res.status(404).json({ error: 'Reunião não encontrada' });
  if (meeting.criador_token !== criador_token) return res.status(403).json({ error: 'Sem permissão' });
  db.prepare('UPDATE meetings SET fechado = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get results
app.get('/api/meetings/:id/resultados', (req, res) => {
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id) as any;
  if (!meeting) return res.status(404).json({ error: 'Reunião não encontrada' });
  
  const participantes = db.prepare('SELECT DISTINCT nome FROM disponibilidades WHERE meeting_id = ?').all(req.params.id) as any[];
  const totalParticipantes = participantes.length;
  
  if (totalParticipantes === 0) return res.json({ resultados: [], totalParticipantes: 0 });
  
  const slotsLivres = db.prepare(
    'SELECT dia, hora, nome FROM disponibilidades WHERE meeting_id = ? AND disponivel = 1'
  ).all(req.params.id) as any[];
  
  const slotMap: Record<string, Set<string>> = {};
  for (const slot of slotsLivres) {
    const key = `${slot.dia}|${slot.hora}`;
    if (!slotMap[key]) slotMap[key] = new Set();
    slotMap[key].add(slot.nome);
  }
  
  const resultados = Object.entries(slotMap)
    .map(([key, nomes]) => {
      const [dia, hora] = key.split('|');
      return { dia, hora, nomes: Array.from(nomes), count: nomes.size };
    })
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  res.json({ resultados, totalParticipantes });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
