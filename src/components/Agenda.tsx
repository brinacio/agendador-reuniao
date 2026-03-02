import { useState, useEffect } from 'react';

interface AgendaProps {
  meetingId: string;
}

const DIAS = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
];

const HORAS: string[] = [];
for (let h = 7; h < 21; h++) {
  HORAS.push(`${String(h).padStart(2,'0')}:00`);
  HORAS.push(`${String(h).padStart(2,'0')}:30`);
}

export default function Agenda({ meetingId }: AgendaProps) {
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [modoLivre, setModoLivre] = useState(true);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    fetch(`/api/meetings/${meetingId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setMeeting(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [meetingId]);

  const toggleSlot = (dia: string, hora: string) => {
    const key = `${dia}|${hora}`;
    setSelecionados(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleDia = (dia: string) => {
    const diaKeys = HORAS.map(h => `${dia}|${h}`);
    const todosSelected = diaKeys.every(k => selecionados.has(k));
    setSelecionados(prev => {
      const next = new Set(prev);
      diaKeys.forEach(k => todosSelected ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const marcarTodos = () => {
    const all = new Set<string>();
    DIAS.forEach(d => HORAS.forEach(h => all.add(`${d.key}|${h}`)));
    setSelecionados(all);
  };

  const limparTodos = () => setSelecionados(new Set());

  const handleSalvar = async () => {
    if (!nome.trim()) { alert('Por favor, informe seu nome.'); return; }
    setSalvando(true);
    const slots: any[] = [];
    DIAS.forEach(d => {
      HORAS.forEach(h => {
        const key = `${d.key}|${h}`;
        const marcado = selecionados.has(key);
        if (modoLivre && marcado) slots.push({ dia: d.key, hora: h, disponivel: true });
        else if (!modoLivre && !marcado) slots.push({ dia: d.key, hora: h, disponivel: true });
      });
    });
    await fetch(`/api/meetings/${meetingId}/disponibilidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim(), slots }),
    });
    setSalvando(false);
    setSalvo(true);
  };

  const voltarInicio = () => { window.location.hash = ''; };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Carregando...</p></div>;
  if (!meeting) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 text-center">
        <p className="text-slate-700 mb-4">Reunião não encontrada ou expirada.</p>
        <button onClick={voltarInicio} className="text-blue-500 hover:underline">Voltar ao início</button>
      </div>
    </div>
  );
  if (meeting.fechado) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 text-center">
        <p className="text-slate-700 mb-4">Esta reunião já foi encerrada.</p>
        <button onClick={voltarInicio} className="text-blue-500 hover:underline">Voltar ao início</button>
      </div>
    </div>
  );
  if (salvo) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 text-center max-w-sm">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Obrigado, {nome}!</h2>
        <p className="text-slate-500">Sua disponibilidade foi registrada com sucesso.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <button onClick={voltarInicio} className="text-slate-400 hover:text-slate-600 text-sm mb-3 block">← Voltar</button>
          <h2 className="text-xl font-bold text-slate-900">{meeting.descricao}</h2>
          <p className="text-slate-500 text-sm mt-1">Marque seus horários disponíveis</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Seu nome</label>
          <input
            type="text" placeholder="Ex: João Silva"
            value={nome} onChange={e => setNome(e.target.value)}
            className="w-full max-w-sm border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setModoLivre(true); setSelecionados(new Set()); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${modoLivre ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Horários Livres
              </button>
              <button
                onClick={() => { setModoLivre(false); setSelecionados(new Set()); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!modoLivre ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Horários Ocupados
              </button>
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={marcarTodos} className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl">Marcar Todos</button>
              <button onClick={limparTodos} className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl">Limpar Todos</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-16 p-1"></th>
                  {DIAS.map(d => (
                    <th key={d.key} className="p-1">
                      <button
                        onClick={() => toggleDia(d.key)}
                        className="w-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 py-2 rounded-lg transition-colors"
                      >
                        {d.label}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HORAS.map(hora => (
                  <tr key={hora}>
                    <td className="text-right pr-2 text-xs text-slate-400 py-0.5">{hora}</td>
                    {DIAS.map(d => {
                      const key = `${d.key}|${hora}`;
                      const sel = selecionados.has(key);
                      const livreColor = sel ? 'bg-green-400 border-green-500' : 'bg-white border-slate-200 hover:border-green-300';
                      const ocupadoColor = sel ? 'bg-red-400 border-red-500' : 'bg-white border-slate-200 hover:border-red-300';
                      return (
                        <td key={d.key} className="p-0.5">
                          <button
                            onClick={() => toggleSlot(d.key, hora)}
                            className={`w-full h-7 border rounded text-xs font-medium transition-colors ${modoLivre ? livreColor : ocupadoColor} ${sel ? 'text-white' : 'text-slate-400'}`}
                          >
                            {sel ? hora : ''}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-2xl transition-colors"
        >
          {salvando ? 'Salvando...' : 'Salvar Minhas Disponibilidades'}
        </button>
      </div>
    </div>
  );
}
