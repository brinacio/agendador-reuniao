import { useState } from 'react';

interface HomeProps {
  onMeetingCreated: (id: string) => void;
}

export default function Home({ onMeetingCreated }: HomeProps) {
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const handleCriar = async () => {
    if (!descricao.trim()) {
      setToast('Por favor, adicione uma descrição para a reunião.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setLoading(true);
    const id = crypto.randomUUID();
    const criador_token = crypto.randomUUID();
    try {
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, descricao, criador_token }),
      });
      localStorage.setItem(`criador_${id}`, criador_token);
      onMeetingCreated(id);
    } catch (e) {
      setToast('Erro ao criar reunião. Tente novamente.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {toast && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
            {toast}
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Agendador de Reunião</h1>
            <p className="text-slate-500 mt-2">Colete disponibilidades e encontre o melhor horário</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descrição da reunião
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-4 text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Ex: Reunião de planejamento do projeto X. Participantes esperados: João, Maria, Pedro."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <button
            onClick={handleCriar}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            {loading ? 'Criando...' : 'Criar Reunião'}
          </button>
        </div>
      </div>
    </div>
  );
}
