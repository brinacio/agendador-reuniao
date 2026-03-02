import { useState, useEffect } from 'react';

interface Meeting {
  id?: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration?: number;
  participants?: string;
  link?: string;
}

function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [form, setForm] = useState<Meeting>({ title: '', date: '', time: '', duration: 60 });
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    const res = await fetch('/api/meetings');
    const data = await res.json();
    setMeetings(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editing !== null) {
      await fetch(`/api/meetings/${editing}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setEditing(null);
    } else {
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setForm({ title: '', date: '', time: '', duration: 60 });
    await fetchMeetings();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
    fetchMeetings();
  };

  const handleEdit = (m: Meeting) => {
    setEditing(m.id!);
    setForm(m);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2563eb' }}>Agendador de Reuniao Rapido</h1>
      <form onSubmit={handleSubmit} style={{ background: '#f1f5f9', padding: 20, borderRadius: 8, marginBottom: 24 }}>
        <h2>{editing !== null ? 'Editar Reuniao' : 'Nova Reuniao'}</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <input required placeholder="Titulo*" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          <input placeholder="Descricao" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
            <input required type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>
          <input placeholder="Participantes (emails separados por virgula)" value={form.participants || ''} onChange={e => setForm({...form, participants: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          <input placeholder="Link da reuniao (Meet, Zoom, Teams...)" value={form.link || ''} onChange={e => setForm({...form, link: e.target.value})} style={{ padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}>
            {loading ? 'Salvando...' : editing !== null ? 'Atualizar' : 'Agendar Reuniao'}
          </button>
          {editing !== null && <button type="button" onClick={() => { setEditing(null); setForm({ title: '', date: '', time: '', duration: 60 }); }} style={{ padding: '10px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>}
        </div>
      </form>
      <h2>Reunioes Agendadas ({meetings.length})</h2>
      {meetings.length === 0 ? <p style={{ color: '#94a3b8' }}>Nenhuma reuniao agendada ainda.</p> : (
        meetings.map(m => (
          <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 12, background: 'white' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>{m.title}</h3>
            <p style={{ margin: '4px 0', color: '#64748b' }}>{m.date} as {m.time} | {m.duration} min</p>
            {m.description && <p style={{ margin: '4px 0' }}>{m.description}</p>}
            {m.participants && <p style={{ margin: '4px 0', fontSize: 14 }}>Participantes: {m.participants}</p>}
            {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Entrar na Reuniao</a>}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={() => handleEdit(m)} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Editar</button>
              <button onClick={() => handleDelete(m.id!)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Excluir</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default App;
