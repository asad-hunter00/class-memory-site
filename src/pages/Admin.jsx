import { useEffect, useState } from 'react';
import { Check, X, Trash2, Plus } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/ui.jsx';
import { Avatar, Empty, Loading, PageHead } from '../components/common.jsx';

const TABS = [['pending', "Kutayotganlar"], ['members', "A'zolar"], ['news', "E'lonlar"], ['channels', 'Kanallar'], ['logs', 'Jurnal']];

function Users({ status, reloadKey, onChanged }) {
  const { user: me } = useAuth();
  const toast = useToast();
  const [list, setList] = useState(null);
  const load = () => api.list('/admin/users', { status, limit: 100 }).then((r) => setList(r.items)).catch((e) => toast(e.message, 'bad'));
  useEffect(() => { setList(null); load(); /* eslint-disable-next-line */ }, [status, reloadKey]);
  const act = async (fn, ok) => { try { await fn(); toast(ok); await load(); onChanged?.(); } catch (e) { toast(e.message, 'bad'); } };

  if (!list) return <Loading />;
  if (list.length === 0) return <Empty emoji={status === 'PENDING' ? '🎉' : '👥'} title={status === 'PENDING' ? "Kutayotgan so'rov yo'q" : "Hech kim yo'q"} />;
  return (
    <div className="card">
      {list.map((u) => (
        <div className="list-row" key={u.id}>
          <Avatar user={u} size={42} />
          <div className="grow"><b>{u.fullName}</b> {u.role === 'ADMIN' && <span className="chip accent">Admin</span>}<div className="small muted">@{u.username} · {u.dateFormatted} da qo'shilgan{u.status === 'REJECTED' ? ' · rad etilgan' : ''}</div></div>
          {status === 'PENDING' && <>
            <button className="btn primary sm" onClick={() => act(() => api.patch(`/admin/users/${u.id}/approve`), `${u.fullName} tasdiqlandi`)}><Check size={16} /> Qabul</button>
            <button className="btn sm" onClick={() => act(() => api.patch(`/admin/users/${u.id}/reject`), 'Rad etildi')}><X size={16} /> Rad</button>
          </>}
          {status === 'APPROVED' && u.id !== me.id && <>
            <select className="select" style={{ width: 'auto', padding: '6px 10px' }} value={u.role} onChange={(e) => act(() => api.patch(`/admin/users/${u.id}/role`, { role: e.target.value }), 'Rol o\'zgardi')}>
              <option value="MEMBER">Sinfdosh</option><option value="ADMIN">Admin</option>
            </select>
            <button className="btn sm danger" onClick={() => confirm(`${u.fullName} o'chirilsinmi? Uning hamma rasmi va yozuvlari ham o'chadi.`) && act(() => api.del(`/admin/users/${u.id}`), "Foydalanuvchi o'chirildi")}><Trash2 size={15} /></button>
          </>}
        </div>
      ))}
    </div>
  );
}

function News() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [f, setF] = useState({ title: '', description: '', date: '', isPinned: false });
  const load = () => api.get('/announcements').then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = { title: f.title.trim(), description: f.description.trim(), isPinned: f.isPinned };
      if (f.date) body.eventDate = new Date(`${f.date}T12:00:00`).toISOString();
      await api.post('/announcements', body); toast("E'lon yuborildi 📣"); setF({ title: '', description: '', date: '', isPinned: false }); load();
    } catch (er) { toast(er.message, 'bad'); }
  };
  return (
    <div className="two-col">
      <form className="card pad" onSubmit={submit}>
        <h3 style={{ marginBottom: 14 }}>Yangi e'lon</h3>
        <div className="field"><label>Sarlavha</label><input className="input" required minLength={2} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Bitiruv kechasi — 20 iyun" /></div>
        <div className="field"><label>Matn</label><textarea className="textarea" required minLength={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="field"><label>Voqea sanasi (ixtiyoriy)</label><input className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <label className="row small" style={{ marginBottom: 14 }}><input type="checkbox" checked={f.isPinned} onChange={(e) => setF({ ...f, isPinned: e.target.checked })} /> Yuqorida mahkamlash</label>
        <button className="btn primary block">Yuborish (hammaga bildirishnoma ketadi)</button>
      </form>
      <div className="card">
        {!list ? <Loading /> : list.length === 0 ? <Empty emoji="📣" title="E'lon yo'q" /> : list.map((n) => (
          <div className="list-row" key={n.id}><div className="grow"><b>{n.title}</b><div className="small muted">{n.dateFormatted}</div></div>
            <button className="btn sm danger" onClick={async () => { if (confirm("O'chirilsinmi?")) { try { await api.del(`/announcements/${n.id}`); load(); } catch (e) { toast(e.message, 'bad'); } } }}><Trash2 size={15} /></button></div>
        ))}
      </div>
    </div>
  );
}

function Channels() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const load = () => api.get('/channels').then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  const add = async (e) => {
    e.preventDefault();
    try { await api.post('/channels', { name: name.trim().toLowerCase(), description: desc.trim() || null }); setName(''); setDesc(''); toast('Kanal ochildi'); load(); } catch (er) { toast(er.message, 'bad'); }
  };
  return (
    <div className="two-col">
      <form className="card pad" onSubmit={add}>
        <h3 style={{ marginBottom: 14 }}>Yangi kanal</h3>
        <div className="field"><label>Nomi (kichik harf, raqam, - yoki _)</label><input className="input" required minLength={2} pattern="[a-z0-9_\-]+" value={name} onChange={(e) => setName(e.target.value)} placeholder="xotiralar" /></div>
        <div className="field"><label>Tavsif</label><input className="input" maxLength={300} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <button className="btn primary block"><Plus size={16} /> Ochish</button>
      </form>
      <div className="card">
        {!list ? <Loading /> : list.map((c) => (
          <div className="list-row" key={c.id}><div className="grow"><b># {c.name}</b> {c.isDefault && <span className="chip accent">asosiy</span>}<div className="small muted">{c.messageCount} ta xabar</div></div>
            {!c.isDefault && <button className="btn sm danger" onClick={async () => { if (confirm(`#${c.name} va undagi barcha xabarlar o'chirilsinmi?`)) { try { await api.del(`/channels/${c.id}`); load(); } catch (e) { toast(e.message, 'bad'); } } }}><Trash2 size={15} /></button>}</div>
        ))}
      </div>
    </div>
  );
}

function Logs() {
  const [list, setList] = useState(null);
  useEffect(() => { api.list('/admin/audit-logs', { limit: 50 }).then((r) => setList(r.items)).catch(() => setList([])); }, []);
  if (!list) return <Loading />;
  if (!list.length) return <Empty emoji="📜" title="Jurnal bo'sh" />;
  return <div className="card">{list.map((l) => (
    <div className="list-row" key={l.id}><span className="chip">{l.targetType}</span><div className="grow"><b>{l.action.replaceAll('_', ' ').toLowerCase()}</b><div className="small muted">{l.admin?.fullName}</div></div><span className="small muted">{l.dateFormatted} {l.timeFormatted}</span></div>
  ))}</div>;
}

export default function Admin() {
  const [tab, setTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [tick, setTick] = useState(0);
  const loadStats = () => api.get('/admin/stats').then(setStats).catch(() => {});
  useEffect(() => { loadStats(); }, []);

  return (
    <>
      <PageHead hand="faqat adminlar uchun" title="Boshqaruv paneli" />
      {stats && (
        <div className="stats" style={{ marginTop: 0 }}>
          <div className="card stat"><b>{stats.users?.pending ?? 0}</b><span>Kutayotgan</span></div>
          <div className="card stat"><b>{stats.users?.approved ?? 0}</b><span>Tasdiqlangan</span></div>
          <div className="card stat"><b>{(stats.memories?.photos ?? 0) + (stats.memories?.videos ?? 0)}</b><span>Rasm + video</span></div>
          <div className="card stat"><b>{stats.memories?.messages ?? 0}</b><span>Xabar</span></div>
        </div>
      )}
      <div className="tabs">{TABS.map(([k, t]) => <button key={k} className={`chip chip-btn ${tab === k ? 'on' : ''}`} style={{ padding: '7px 16px', fontSize: 14 }} onClick={() => setTab(k)}>{t}{k === 'pending' && stats?.users?.pending > 0 ? ` (${stats.users.pending})` : ''}</button>)}</div>
      {tab === 'pending' && <Users status="PENDING" reloadKey={tick} onChanged={() => { loadStats(); setTick((t) => t + 1); }} />}
      {tab === 'members' && <Users status="APPROVED" reloadKey={tick} onChanged={loadStats} />}
      {tab === 'news' && <News />}
      {tab === 'channels' && <Channels />}
      {tab === 'logs' && <Logs />}
    </>
  );
}
