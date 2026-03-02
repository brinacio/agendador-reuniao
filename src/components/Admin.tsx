import { useState, useEffect } from 'react';

interface AdminProps {
  meetingId: string;
}

interface Meeting {
  id: string;
  descricao: string;
  fechado: number;
  participantes: string[];
}

export default function Admin({ meetingId }: AdminProps) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [fechando, setFechando] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [totalParticipantes, setTotalParticipantes] = useState(0);
  const [toast, setToast] = useState('');
  const [linkCopiado, setLinkCopiado] = useState(false);

  const criador_token = localStorage.getItem(`criador_${meetingId}`);
  const isCriador = !!criador_token;

  const agendaLink = `${window.location.origin}${window.location.pathname}#/agenda/${meetingId}`;

  useEffect(() => {
    fetchMeeting();
    const interval = setInterval(fetchMeeting, 10000);
    return () => clearInterval(interval);
  }, [meetingId]);

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      setMeeting(data);
      if (data.fechado) fetchResultados();
    } catch {
      setMeeting(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchResultados = async () => {
    const res = await fetch(`/api/meetings/${meetingId}/resultados`);
    const data = await res.json();
    setResultados(data.resultados || []);
    setTotalParticipantes(data.totalParticipantes || 0);
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(agendaLink);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  const fecharMarcacao = async () => {
    if (!criador_token) return;
    setFechando(true);
    await fetch(`/api/meetings/${meetingId}/fechar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ criador_token }),
    });
    await fetchMeeting();
    await fetchResultados();
    setFechando(false);
  };

  const irParaAgenda = () => {
    window.location.hash = `#/agenda/${meetingId}`;
  };

  const voltarInicio = () => {
    window.location.hash = '';
  };

  const DIAS: Record<string, string> = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta' };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Carregando...</p></div>;
  if (!meeting) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 text-center max-w-sm">
        <p className="text-slate-700 mb-4">Reunião não encontrada.</p>
        <button onClick={voltarInicio} className="text-blue-500 hover:underline">Voltar ao início</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={voltarInicio} className="text-slate-400 hover:text-slate-600 text-sm">← Nova reunião</button>
            {meeting.fechado ? <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full">Encerrada</span> : <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full">● Coletando</span>}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Painel da Reunião</h2>
          <p className="text-slate-600 text-sm mb-4">{meeting.descricao}</p>
          <div className="text-sm text-slate-500">
            {meeting.participantes.length} resposta{meeting.participantes.length !== 1 ? 's' : ''} recebida{meeting.participantes.length !== 1 ? 's' : ''}
            {meeting.participantes.length > 0 && <span className="ml-2 text-slate-400">({meeting.participantes.join(', ')})</span>}
          </div>
        </div>

        {!meeting.fechado && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
            <h3 className="font-semibold text-slate-700 mb-3">Link para participantes</h3>
            <div className="flex gap-2 mb-4">
              <input readOnly value={agendaLink} className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 bg-slate-50" />
              <button onClick={copiarLink} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                {linkCopiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={irParaAgenda} className="flex-1 border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 rounded-xl text-sm font-medium">
                Entrar e Marcar
              </button>
              {isCriador && (
                <button onClick={fecharMarcacao} disabled={fechando} className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2 rounded-xl text-sm font-medium">
                  {fechando ? 'Encerrando...' : 'Fechar Marcação'}
                </button>
              )}
            </div>
          </div>
        )}

        {meeting.fechado && resultados.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-slate-700 mb-4">Melhores horários</h3>
            <div className="space-y-3">
              {resultados.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <span className="font-medium text-slate-800">{DIAS[r.dia] || r.dia} {r.hora}</span>
                    <p className="text-xs text-slate-500 mt-1">{r.nomes.join(', ')}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {r.count}/{totalParticipantes}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {meeting.fechado && resultados.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center text-slate-500">
            Nenhuma disponibilidade registrada.
          </div>
        )}
      </div>
    </div>
  );
}
