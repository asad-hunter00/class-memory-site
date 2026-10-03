import { useEffect, useState } from 'react';
import { Lock, Unlock, Plus } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/ui.jsx';
import { getSocket } from '../lib/socket.js';
import { Avatar, Empty, ErrorBox, Loading, Modal, PageHead } from '../components/common.jsx';

function daysLeft(iso) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (d <= 0) return 'bugun ochiladi';
  if (d < 31) return `${d} kun qoldi`;
  const y = Math.floor(d / 365); const m = Math.floor((d % 365) / 30);
  return `${y ? y + ' yil ' : ''}${m ? m + ' oy ' : ''}qoldi`.trim();
}

function NewCapsule({ onClose, onDone }) {
  const toast = useToast();
  const plus = (years) => { const d = new Date(); d.setFullYear(d.getFullYear() + years); return d.toISOString().slice(0, 10); };
  const [f, setF] = useState({ title: '', message: '', date: plus(5) });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api.post('/time-capsules', { title: f.title.trim(), message: f.message.trim(), unlockAt: new Date(`${f.date}T09:00:00`).toISOString() });
      toast('Kapsula muhrlandi 🔒'); onDone(); onClose();
    } catch (er) { toast(er.message, 'bad'); } finally { setBusy(false); }
  };
  return (
    <Modal title="Kelajakka xat" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="muted small" style={{ marginBottom: 14 }}>Yozgan xatingiz belgilangan kungacha hech kimga ko'rinmaydi. Faqat o'zingiz o'qiy olasiz.</p>
        <div className="field"><label>Sarlavha</label><input className="input" required minLength={2} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="2031-yildagi menga" /></div>
        <div className="field"><label>Xat</label><textarea className="textarea" required minLength={2} style={{ minHeight: 140 }} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Salom, kelajakdagi men! Hozir men…" /></div>
        <div className="field"><label>Ochilish sanasi</label>
          <input className="input" type="date" required min={plus(0)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <div className="row wrap" style={{ gap: 6 }}>{[1, 5, 10].map((y) => <button type="button" key={y} className="chip chip-btn" onClick={() => setF({ ...f, date: plus(y) })}>{y} yildan keyin</button>)}</div>
        </div>
        <button className="btn primary block" disabled={busy}>{busy ? <span className="spin" /> : <><Lock size={17} /> Muhrlash</>}</button>
      </form>
    </Modal>
  );
}

export default function Capsules() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(false);
  const toast = useToast();
  const load = () => api.get('/time-capsules').then(setItems).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const s = getSocket();
    const on = () => { toast('Bitta vaqt kapsulasi ochildi! 🎉'); load(); };
    s?.on('time_capsule_unlocked', on);
    return () => s?.off('time_capsule_unlocked', on);
    // eslint-disable-next-line
  }, []);
  const open = items?.filter((c) => c.isUnlocked) || [];
  const locked = items?.filter((c) => !c.isUnlocked) || [];

  return (
    <>
      <PageHead hand="vaqt mashinasi" title="Vaqt kapsulasi"><button className="btn primary" onClick={() => setForm(true)}><Plus size={18} /> Xat yozish</button></PageHead>
      {error && <ErrorBox error={error} onRetry={load} />}
      {!items && !error && <Loading />}
      {items?.length === 0 && <Empty emoji="⏳" title="Hali kapsula yo'q">Kelajakdagi o'zingizga xat yozing. 5 yildan keyin o'qish juda qiziq bo'ladi.</Empty>}
      {locked.length > 0 && <h2 style={{ fontSize: 22, margin: '4px 0 14px' }}>Muhrlangan ({locked.length})</h2>}
      <div className="cap-grid">
        {locked.map((c) => (
          <div key={c.id} className="card capsule locked">
            <div className="row" style={{ marginBottom: 12 }}><div className="seal"><Lock size={22} /></div>
              <div className="grow"><h3 style={{ fontSize: 20 }}>{c.title}</h3><div className="small muted">{c.creator?.fullName} yozgan · {c.dateFormatted}</div></div></div>
            <div className="chip accent">🔒 {c.unlockAtFormatted?.split(' ')[0] || 'Muhrlangan'} gacha · {daysLeft(c.unlockAt)}</div>
            {c.message && !c.message.startsWith('🔒') && <p className="post-text" style={{ marginTop: 14 }}>{c.message}</p>}
          </div>
        ))}
      </div>
      {open.length > 0 && <h2 style={{ fontSize: 22, margin: '30px 0 14px' }}>Ochilganlar ({open.length})</h2>}
      <div className="cap-grid">
        {open.map((c) => (
          <div key={c.id} className="card capsule open">
            <div className="row" style={{ marginBottom: 12 }}><div className="seal"><Unlock size={22} /></div>
              <div className="grow"><h3 style={{ fontSize: 20 }}>{c.title}</h3><div className="small muted">{c.creator?.fullName} · {c.dateFormatted} da yozilgan</div></div><Avatar user={c.creator} size={36} /></div>
            <p className="post-text">{c.message}</p>
            {c.mediaUrl && <div className="post-media"><img src={c.mediaUrl} alt="" /></div>}
          </div>
        ))}
      </div>
      {form && <NewCapsule onClose={() => setForm(false)} onDone={load} />}
    </>
  );
}
