import { useEffect, useState } from 'react';
import { MapPin, Briefcase } from 'lucide-react';
import { api } from '../lib/api.js';
import { useDebounced } from '../lib/util.js';
import { Avatar, Empty, ErrorBox, Loading, Modal, PageHead } from '../components/common.jsx';
import { MemoryRow, useViewer } from '../components/Memory.jsx';

export function MemberModal({ id, onClose }) {
  const { viewer, show } = useViewer();
  const [u, setU] = useState(null);
  const [mem, setMem] = useState([]);
  useEffect(() => {
    api.get(`/users/${id}`).then(setU).catch(onClose);
    api.get(`/users/${id}/memories`, { limit: 12 }).then((d) => setMem(d?.memories || [])).catch(() => {});
    // eslint-disable-next-line
  }, [id]);
  return (
    <Modal bare onClose={onClose}>
      {!u ? <Loading /> : (
        <div className="modal-body" style={{ paddingTop: 28 }}>
          <div className="row" style={{ gap: 18, alignItems: 'center' }}>
            <Avatar user={u} size={84} />
            <div>
              <h3 style={{ fontSize: 26 }}>{u.fullName}</h3>
              {u.nickname && <div className="hand" style={{ color: 'var(--red)', fontSize: 26 }}>«{u.nickname}»</div>}
              <div className="small muted">@{u.username}{u.role === 'ADMIN' && ' · Admin'}</div>
            </div>
          </div>
          {u.bio && <p style={{ marginTop: 14, whiteSpace: 'pre-wrap' }}>{u.bio}</p>}
          <div className="row wrap" style={{ marginTop: 12 }}>
            {(u.currentCity || u.currentCountry) && <span className="chip accent"><MapPin size={13} /> {[u.currentCity, u.currentCountry].filter(Boolean).join(', ')}</span>}
            {u.currentOccupation && <span className="chip"><Briefcase size={13} /> {u.currentOccupation}</span>}
            <span className="chip">📷 {u._count?.photos ?? 0}</span><span className="chip">🎬 {u._count?.videos ?? 0}</span><span className="chip">✍️ {u._count?.posts ?? 0}</span>
          </div>
          {mem.length > 0 && <><h4 style={{ margin: '22px 0 12px', fontSize: 19 }}>Xotiralari</h4><div>{mem.map((m) => <MemberMem key={m.memoryType + m.id} m={m} show={show} />)}</div></>}
        </div>
      )}
      {viewer}
    </Modal>
  );
}
const MemberMem = ({ m, show }) => <MemoryRow item={m} onOpen={show} />;

export default function Members() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [list, setList] = useState(null);
  const [where, setWhere] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => { api.list('/users', { limit: 100, search: dq }).then((r) => setList(r.items)).catch((e) => setError(e.message)); }, [dq]);
  useEffect(() => { if (tab === 'where' && !where) api.get('/users/locations').then(setWhere).catch((e) => setError(e.message)); }, [tab, where]);

  const byCountry = {};
  (where || []).forEach((u) => { const k = u.currentCountry || 'Boshqa'; (byCountry[k] ||= []).push(u); });

  return (
    <>
      <PageHead hand="bizning jamoa" title="Sinfdoshlar">
        <div className="seg"><button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>Hammasi</button><button className={tab === 'where' ? 'on' : ''} onClick={() => setTab('where')}>Hozir qayerdamiz?</button></div>
      </PageHead>
      {error && <ErrorBox error={error} />}
      {tab === 'all' && <>
        <input className="input" style={{ maxWidth: 360, marginBottom: 24, borderRadius: 999 }} placeholder="Ism, laqab yoki shahar…" value={q} onChange={(e) => setQ(e.target.value)} />
        {!list ? <Loading /> : list.length === 0 ? <Empty emoji="🔎" title="Hech kim topilmadi" /> : (
          <div className="members">{list.map((u) => (
            <div key={u.id} className="card member" onClick={() => setOpen(u.id)}>
              <div className="tape" />
              <Avatar user={u} size={78} />
              <h3>{u.fullName}</h3>
              {u.nickname && <div className="nick">«{u.nickname}»</div>}
              <div className="small muted" style={{ marginTop: 4 }}>{u.currentCity ? `📍 ${u.currentCity}` : `@${u.username}`}</div>
              {u.role === 'ADMIN' && <span className="chip accent" style={{ marginTop: 8 }}>Admin</span>}
            </div>))}</div>
        )}
      </>}
      {tab === 'where' && (!where ? <Loading /> : where.length === 0
        ? <Empty emoji="🌍" title="Hozircha hech kim joyini yozmagan">Profilingizga shahar va davlatni kiriting. Sinfdoshlar sizni topadi.</Empty>
        : <div className="where-grid">{Object.entries(byCountry).sort((a, b) => b[1].length - a[1].length).map(([country, us]) => (
          <div key={country} className="card country">
            <h3>{country}<span className="chip accent">{us.length}</span></h3>
            {us.map((u) => (
              <div key={u.id} className="row" style={{ padding: '7px 0', cursor: 'pointer' }} onClick={() => setOpen(u.id)}>
                <Avatar user={u} size={32} /><div className="grow"><b style={{ fontSize: 14 }}>{u.fullName}</b><div className="small muted">{u.currentCity}{u.currentOccupation ? ` · ${u.currentOccupation}` : ''}</div></div>
              </div>))}
          </div>))}</div>)}
      {open && <MemberModal id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
