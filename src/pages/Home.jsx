import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Clapperboard, Users, MessageCircle, Megaphone, Pin, Trophy } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { optimize } from '../lib/upload.js';
import { fmtDateLocal } from '../lib/util.js';
import { Avatar, Empty } from '../components/common.jsx';
import { MediaView, PhotoTile } from '../components/Media.jsx';
import { kindOf, thumbOf, titleOf, useViewer } from '../components/Memory.jsx';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Tungi uyg\'oqlik' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech';
}

export default function Home() {
  const { user } = useAuth();
  const { viewer, show } = useViewer();
  const [stats, setStats] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [otd, setOtd] = useState([]);
  const [news, setNews] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const safe = (p, fn) => p.then(fn).catch(() => {});
    safe(api.get('/memories/stats'), setStats);
    safe(api.list('/photos', { limit: 8 }), (r) => setPhotos(r.items));
    safe(api.get('/memories/on-this-day'), (d) => setOtd(d?.memories || []));
    safe(api.get('/announcements'), (d) => setNews(Array.isArray(d) ? d : d?.items || d?.announcements || []));
    safe(api.get('/memories/pinned'), (d) => setPinned((d?.all || []).filter((x) => x.memoryType !== 'announcement')));
  }, []);

  const c = stats?.counts; const cd = stats?.graduationCountdown;
  const hero = photos.slice(0, 3);
  const days = cd?.hasGraduated ? cd.daysSinceGraduation : cd?.daysRemaining;

  return (
    <>
      <section className="hero">
        <div>
          <span className="hand">{greeting()}, {user.fullName.split(' ')[0]}!</span>
          <h1>{stats?.class?.name || 'Bizning sinf'}<br />esdaliklari shu yerda</h1>
          <p>{stats?.class?.schoolName ? `${stats.class.schoolName}. ` : ''}Rasmlar, videolar, suhbatlar va kelajakka yozilgan xatlar. Kerak bo'lganda, yillar o'tib ham topasiz.</p>
          {cd && (
            <div className="countdown">
              <div className="cd-box"><b>{days}</b><span>{cd.hasGraduated ? 'kun o\'tdi' : 'kun qoldi'}</span></div>
              <div className="cd-box"><b>{cd.targetDate?.slice(0, 5)}</b><span>bitiruv kuni</span></div>
            </div>
          )}
        </div>
        <div className="hero-polaroids" aria-hidden>
          {hero.length === 0 && ['📸', '🎓', '🎒'].map((e, i) => (
            <div key={i} className={`polaroid p${i + 1}`}><div className="ph" style={{ display: 'grid', placeItems: 'center', fontSize: 48 }}>{e}</div><span className="cap">{['birinchi rasm', 'bitiruv', 'sayohat'][i]}</span></div>
          ))}
          {hero.map((p, i) => (
            <div key={p.id} className={`polaroid p${i + 1}`}><img src={optimize(p.thumbnailUrl || p.imageUrl, 360)} alt="" /><span className="cap">{p.caption || p.dateFormatted}</span></div>
          ))}
        </div>
      </section>

      <div className="stats">
        {[
          { n: c?.totalPhotos, t: 'Rasm', i: Camera, to: '/rasmlar' },
          { n: c?.totalVideos, t: 'Video', i: Clapperboard, to: '/videolar' },
          { n: c?.totalMembers, t: 'Sinfdosh', i: Users, to: '/sinfdoshlar' },
          { n: c?.totalMessages, t: 'Xabar', i: MessageCircle, to: '/chat' },
        ].map((s) => (
          <Link key={s.t} to={s.to} className="card stat"><span className="ic"><s.i size={19} /></span><b>{s.n ?? '–'}</b><span>{s.t}</span></Link>
        ))}
      </div>

      <section className="section" style={{ marginTop: 6 }}>
        <div className="section-head"><h2>Bugun tarixda <span className="hand" style={{ fontSize: 24 }}>— shu kuni…</span></h2></div>
        {otd.length === 0
          ? <div className="card pad row"><span style={{ fontSize: 34 }}>🗓️</span><div><b>Bugun uchun eski xotira yo'q.</b><div className="muted small">Ko'proq rasm yuklangan sari, har kuni "N yil oldin bugun…" paydo bo'ladi.</div></div></div>
          : <div className="otd">{otd.map((m) => (
            <div key={m.id} className="otd-item" onClick={() => show(m)}>
              {thumbOf(m) ? <img src={thumbOf(m)} alt="" /> : <div className="ph">{titleOf(m)}</div>}
              <span className="yr">{new Date(m.createdAt).getFullYear()}</span><small>{m.dateFormatted}</small>
            </div>))}</div>}
      </section>

      <div className="two-col section">
        <div>
          <div className="section-head"><h2>E'lonlar</h2></div>
          {news.length === 0 ? <div className="card"><Empty emoji="📣" title="E'lon yo'q">Admin e'lon qo'ysa, shu yerda chiqadi.</Empty></div> : (
            <div className="card">{news.slice(0, 4).map((n) => (
              <div className="list-row" key={n.id} style={{ alignItems: 'flex-start' }}>
                <span className="chip accent" style={{ marginTop: 2 }}>{n.isPinned ? <Pin size={13} /> : <Megaphone size={13} />}</span>
                <div className="grow"><b>{n.title}</b><div className="muted small" style={{ whiteSpace: 'pre-wrap' }}>{n.description}</div>
                  <div className="small" style={{ color: 'var(--ink3)', marginTop: 2 }}>{n.eventDate ? `📅 ${fmtDateLocal(n.eventDate)} · ` : ''}{n.dateFormatted}</div></div>
              </div>))}</div>
          )}
        </div>
        <div>
          <div className="section-head"><h2>Eng faollar</h2></div>
          <div className="card">
            {(stats?.leaderboard || []).slice(0, 5).map((u, i) => (
              <div className="list-row" key={u.id}>
                <span style={{ width: 22, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: i === 0 ? 'var(--accent)' : 'var(--ink3)' }}>{i === 0 ? <Trophy size={20} fill="currentColor" /> : i + 1}</span>
                <Avatar user={u} size={34} /><div className="grow"><b>{u.fullName}</b></div><span className="chip">{u.score} ball</span>
              </div>))}
            {!stats?.leaderboard?.length && <Empty emoji="🏆" title="Hali bo'sh">Rasm yuklang, post yozing, ball to'plang!</Empty>}
          </div>
        </div>
      </div>

      {pinned.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Muhim lahzalar</h2></div>
          <div className="otd">{pinned.map((m) => (
            <div key={m.id} className="otd-item" onClick={() => show(m)}>
              {thumbOf(m) ? <img src={thumbOf(m)} alt="" /> : <div className="ph">{titleOf(m)}</div>}
              <span className="yr">{kindOf(m) === 'video' ? '🎬' : '📌'} {titleOf(m)?.slice(0, 22)}</span>
            </div>))}</div>
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2>Oxirgi rasmlar</h2><Link to="/rasmlar">Hammasi →</Link></div>
        {photos.length === 0 ? <div className="card"><Empty emoji="📷" title="Rasm yo'q">Birinchi rasmni yuklang.</Empty></div>
          : <div className="masonry">{photos.map((p) => <PhotoTile key={p.id} photo={p} onOpen={() => setOpen(p.id)} />)}</div>}
      </section>
      {open && <MediaView kind="photo" id={open} onClose={() => setOpen(null)} />}
      {viewer}
    </>
  );
}
