import { useState, useEffect } from 'react';
import Home from './components/Home';
import Agenda from './components/Agenda';
import Admin from './components/Admin';

type Page = 'home' | 'agenda' | 'admin';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [meetingId, setMeetingId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/agenda/')) {
      const id = hash.replace('#/agenda/', '');
      setMeetingId(id);
      setPage('agenda');
    } else if (hash.startsWith('#/admin/')) {
      const id = hash.replace('#/admin/', '');
      setMeetingId(id);
      setPage('admin');
    }
    const handleHashChange = () => {
      const h = window.location.hash;
      if (h.startsWith('#/agenda/')) {
        setMeetingId(h.replace('#/agenda/', ''));
        setPage('agenda');
      } else if (h.startsWith('#/admin/')) {
        setMeetingId(h.replace('#/admin/', ''));
        setPage('admin');
      } else {
        setPage('home');
        setMeetingId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const goToAdmin = (id: string) => {
    setMeetingId(id);
    setPage('admin');
    window.location.hash = `#/admin/${id}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {page === 'home' && <Home onMeetingCreated={goToAdmin} />}
      {page === 'agenda' && meetingId && <Agenda meetingId={meetingId} />}
      {page === 'admin' && meetingId && <Admin meetingId={meetingId} />}
    </div>
  );
}

export default App;
