import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Avatar, Empty, ErrorBox, Loading, PageHead } from '../components/common.jsx';
import { MemoryRow, useViewer } from '../components/Memory.jsx';
import { MemberModal } from './Members.jsx';

export default function SearchPage() {
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  const { viewer, show } = useViewer();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [member, setMember] = useState(null);

  useEffect(() => {
    if (!q) return;
    setData(null); setError(null);
    api.get('/search', { q, limit: 12 }).then(setData).catch((e) => setError(e.message));
  }, [q]);

  const r = data?.results;
  const Sec = ({ title, children }) => <section className="section" style={{ marginTop: 26 }}><div className="section-head"><h2 style={{ fontSize: 21 }}>{title}</h2></div>{children}</section>;

  return (
    <>
      <PageHead hand="topamiz!" title={`"${q}"`} />
      {error && <ErrorBox error={error} />}
      {!data && !error && q && <Loading />}
      {data && data.totalCount === 0 && <Empty emoji="🔍" title="Hech narsa topilmadi">Boshqa so'z bilan urinib ko'ring.</Empty>}
      {r && <div style={{ maxWidth: 780 }}>
        {r.classmates?.length > 0 && <Sec title="Sinfdoshlar"><div className="card">{r.classmates.map((u) => (
          <div key={u.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => setMember(u.id)}><Avatar user={u} size={38} /><div className="grow"><b>{u.fullName}</b><div className="small muted">@{u.username}{u.currentCity ? ` · ${u.currentCity}` : ''}</div></div></div>))}</div></Sec>}
        {r.photos?.length > 0 && <Sec title="Rasmlar">{r.photos.map((m) => <MemoryRow key={m.id} item={{ ...m, memoryType: 'photo' }} onOpen={show} />)}</Sec>}
        {r.videos?.length > 0 && <Sec title="Videolar">{r.videos.map((m) => <MemoryRow key={m.id} item={{ ...m, memoryType: 'video' }} onOpen={show} />)}</Sec>}
        {r.posts?.length > 0 && <Sec title="Postlar">{r.posts.map((m) => <MemoryRow key={m.id} item={{ ...m, memoryType: 'post' }} onOpen={show} />)}</Sec>}
        {r.albums?.length > 0 && <Sec title="Albomlar"><div className="row wrap">{r.albums.map((a) => <Link key={a.id} to={`/albomlar/${a.id}`} className="chip accent" style={{ padding: '8px 14px', fontSize: 14 }}>📁 {a.name}</Link>)}</div></Sec>}
        {r.messages?.length > 0 && <Sec title="Chatdan"><div className="card">{r.messages.map((m) => (
          <Link to="/chat" key={m.id} className="list-row"><Avatar user={m.sender} size={34} /><div className="grow"><b className="small">{m.sender?.fullName}</b> <span className="small muted">{m.dateFormatted} {m.timeFormatted}</span><div>{m.text}</div></div></Link>))}</div></Sec>}
      </div>}
      {viewer}
      {member && <MemberModal id={member} onClose={() => setMember(null)} />}
    </>
  );
}
