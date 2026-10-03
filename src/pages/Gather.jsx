import { useEffect, useState } from 'react';
import { Plus, MapPin, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/ui.jsx';
import { monthName } from '../lib/util.js';
import { Avatar, Empty, ErrorBox, Loading, Modal, PageHead } from '../components/common.jsx';

/* ---------------- Uchrashuvlar ---------------- */
function EventForm({ onClose, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ title: '', description: '', location: '', date: '', time: '18:00' });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reunions', { title: f.title.trim(), description: f.description.trim(), location: f.location.trim(), eventDate: new Date(`${f.date}T${f.time}`).toISOString() });
      toast('Uchrashuv rejalashtirildi 🎉'); onDone(); onClose();
    } catch (er) { toast(er.message, 'bad'); }
  };
  return (
    <Modal title="Yangi uchrashuv" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Nomi</label><input className="input" required minLength={2} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="1 yillik uchrashuv" /></div>
        <div className="field"><label>Qayerda</label><input className="input" required minLength={2} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Toshkent, Botanika bog'i" /></div>
        <div className="grid-2">
          <div className="field"><label>Sana</label><input className="input" type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          <div className="field"><label>Vaqt</label><input className="input" type="time" required value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
        </div>
        <div className="field"><label>Tavsif</label><textarea className="textarea" required minLength={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <button className="btn primary block">Yaratish</button>
      </form>
    </Modal>
  );
}

function EventCard({ ev, onChange }) {
  const toast = useToast();
  const d = new Date(ev.eventDate);
  const past = d.getTime() < Date.now();
  const rsvp = async (status) => {
    try { await api.post(`/reunions/${ev.id}/rsvp`, { status }); onChange(); } catch (e) { toast(e.message, 'bad'); }
  };
  const c = ev.rsvpCounts || {};
  return (
    <div className="card pad" style={{ opacity: past ? .7 : 1 }}>
      <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div className="event-date"><i>{monthName(d.getMonth()).slice(0, 3)}</i><b>{d.getDate()}</b><small>{d.getFullYear()}</small></div>
        <div className="grow">
          <h3 style={{ fontSize: 22 }}>{ev.title}</h3>
          <div className="small muted row" style={{ gap: 6, margin: '4px 0 8px' }}><MapPin size={14} /> {ev.location} · {String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')}</div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{ev.description}</p>
        </div>
      </div>
      <div className="row wrap" style={{ marginTop: 16, gap: 14 }}>
        {!past && <div className="seg">
          <button className={`go ${ev.myRsvpStatus === 'GOING' ? 'on' : ''}`} onClick={() => rsvp('GOING')}>Boraman</button>
          <button className={`maybe ${ev.myRsvpStatus === 'MAYBE' ? 'on' : ''}`} onClick={() => rsvp('MAYBE')}>Balki</button>
          <button className={`no ${ev.myRsvpStatus === 'NOT_GOING' ? 'on' : ''}`} onClick={() => rsvp('NOT_GOING')}>Bormayman</button>
        </div>}
        <span className="chip green">{c.going || 0} boradi</span><span className="chip accent">{c.maybe || 0} balki</span>
        <div className="row" style={{ marginLeft: 'auto', gap: 0 }}>{(ev.attendees?.going || []).slice(0, 6).map((u, i) => <div key={u.id} style={{ marginLeft: i ? -10 : 0 }}><Avatar user={u} size={30} /></div>)}</div>
      </div>
    </div>
  );
}

/* ---------------- So'rovnomalar ---------------- */
function PollForm({ onClose, onDone }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState(['', '']);
  const submit = async (e) => {
    e.preventDefault();
    const options = opts.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) return toast("Kamida 2 ta variant kerak", 'bad');
    try { await api.post('/polls', { question: q.trim(), options }); toast("So'rovnoma yaratildi"); onDone(); onClose(); } catch (er) { toast(er.message, 'bad'); }
  };
  return (
    <Modal title="Yangi so'rovnoma" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Savol</label><input className="input" required minLength={3} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qachon yig'ilamiz?" /></div>
        <div className="field"><label>Variantlar</label>
          {opts.map((o, i) => (
            <div className="row" key={i}><input className="input" value={o} maxLength={200} onChange={(e) => setOpts(opts.map((x, k) => (k === i ? e.target.value : x)))} placeholder={`Variant ${i + 1}`} />
              {opts.length > 2 && <button type="button" className="icon-btn" onClick={() => setOpts(opts.filter((_, k) => k !== i))}><X size={18} /></button>}</div>
          ))}
          {opts.length < 8 && <button type="button" className="btn ghost sm" style={{ width: 'fit-content' }} onClick={() => setOpts([...opts, ''])}><Plus size={15} /> Variant qo'shish</button>}
        </div>
        <button className="btn primary block">Yaratish</button>
      </form>
    </Modal>
  );
}

function PollCard({ poll, onChange }) {
  const toast = useToast();
  const closed = poll.isClosed || (poll.expiresAt && new Date(poll.expiresAt) < new Date());
  const vote = async (optionId) => {
    try { await api.post(`/polls/${poll.id}/vote`, { optionId }); onChange(); } catch (e) { toast(e.message, 'bad'); }
  };
  return (
    <div className="card pad">
      <h3 style={{ fontSize: 21 }}>{poll.question}</h3>
      <div className="small muted">{poll.creator?.fullName} · {poll.dateFormatted} · {poll.totalVotes} ta ovoz {closed && '· yopilgan'}</div>
      {poll.options.map((o) => (
        <button key={o.id} className={`opt ${poll.myVotedOptionId === o.id ? 'mine' : ''}`} disabled={closed || poll.hasVoted} onClick={() => vote(o.id)}>
          {poll.hasVoted || closed ? <span className="bar" style={{ width: o.percentage + '%' }} /> : null}
          <span>{o.text}</span>{(poll.hasVoted || closed) && <span className="pct">{o.percentage}%</span>}
          {poll.myVotedOptionId === o.id && <span>✓</span>}
        </button>
      ))}
      {!poll.hasVoted && !closed && <div className="hint" style={{ marginTop: 8 }}>Bir marta ovoz berish mumkin.</div>}
    </div>
  );
}

export default function Gather() {
  const [tab, setTab] = useState('events');
  const [events, setEvents] = useState(null);
  const [polls, setPolls] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(false);
  const loadE = () => api.get('/reunions').then(setEvents).catch((e) => setError(e.message));
  const loadP = () => api.get('/polls').then(setPolls).catch((e) => setError(e.message));
  useEffect(() => { loadE(); loadP(); }, []);
  const upcoming = events?.filter((e) => new Date(e.eventDate) >= new Date()) || [];
  const past = events?.filter((e) => new Date(e.eventDate) < new Date()).reverse() || [];

  return (
    <>
      <PageHead hand="qachon, qayerda ko'rishamiz?" title="Uchrashuv va ovoz">
        <button className="btn primary" onClick={() => setForm(true)}><Plus size={18} /> {tab === 'events' ? 'Uchrashuv' : "So'rovnoma"}</button>
      </PageHead>
      <div className="seg" style={{ marginBottom: 22 }}>
        <button className={tab === 'events' ? 'on' : ''} onClick={() => setTab('events')}>Uchrashuvlar</button>
        <button className={tab === 'polls' ? 'on' : ''} onClick={() => setTab('polls')}>So'rovnomalar</button>
      </div>
      {error && <ErrorBox error={error} />}
      {tab === 'events' && (!events ? <Loading /> : (
        <div style={{ display: 'grid', gap: 18, maxWidth: 780 }}>
          {events.length === 0 && <Empty emoji="🥳" title="Uchrashuv rejalanmagan">Birinchi bo'lib sana va joy taklif qiling.</Empty>}
          {upcoming.map((e) => <EventCard key={e.id} ev={e} onChange={loadE} />)}
          {past.length > 0 && <h3 style={{ marginTop: 10 }}>O'tgan uchrashuvlar</h3>}
          {past.map((e) => <EventCard key={e.id} ev={e} onChange={loadE} />)}
        </div>
      ))}
      {tab === 'polls' && (!polls ? <Loading /> : (
        <div style={{ display: 'grid', gap: 18, maxWidth: 680 }}>
          {polls.length === 0 && <Empty emoji="🗳️" title="So'rovnoma yo'q">"Qachon yig'ilamiz?" deb so'rab ko'ring.</Empty>}
          {polls.map((p) => <PollCard key={p.id} poll={p} onChange={loadP} />)}
        </div>
      ))}
      {form && (tab === 'events' ? <EventForm onClose={() => setForm(false)} onDone={loadE} /> : <PollForm onClose={() => setForm(false)} onDone={loadP} />)}
    </>
  );
}
