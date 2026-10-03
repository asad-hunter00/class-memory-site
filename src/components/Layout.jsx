import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Newspaper, Images, Clapperboard, FolderHeart, MessageCircle, History, Hourglass, CalendarHeart, Users, Bookmark, Shield, Search, Bell, Moon, Sun, Menu, LogOut, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { useToast } from '../lib/ui.jsx';
import { Avatar } from './common.jsx';
import { whenText } from '../lib/util.js';

const NAV = [
  { label: 'Asosiy', items: [
    { to: '/', icon: Home, text: 'Bosh sahifa', end: true },
    { to: '/lenta', icon: Newspaper, text: 'Lenta' },
    { to: '/chat', icon: MessageCircle, text: 'Sinf chati' },
  ] },
  { label: 'Xotiralar', items: [
    { to: '/rasmlar', icon: Images, text: 'Rasmlar' },
    { to: '/videolar', icon: Clapperboard, text: 'Videolar' },
    { to: '/albomlar', icon: FolderHeart, text: 'Albomlar' },
    { to: '/xronologiya', icon: History, text: 'Xronologiya' },
    { to: '/saqlanganlar', icon: Bookmark, text: 'Saqlanganlar' },
  ] },
  { label: 'Biz', items: [
    { to: '/sinfdoshlar', icon: Users, text: 'Sinfdoshlar' },
    { to: '/kapsula', icon: Hourglass, text: 'Vaqt kapsulasi' },
    { to: '/uchrashuv', icon: CalendarHeart, text: 'Uchrashuv va ovoz' },
  ] },
];

export function useTheme() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');
  const toggle = () => {
    const t = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t; setTheme(t);
    try { localStorage.setItem('theme', t); } catch {}
  };
  return [theme, toggle];
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const nav = useNavigate();
  const ref = useRef(null);
  const toast = useToast();

  const load = async () => {
    try {
      const json = await api.list('/notifications', { limit: 20 });
      setItems(json.items);
      setUnread(json.items.filter((n) => !n.isRead).length);
    } catch { /* jim */ }
  };
  useEffect(() => {
    load();
    const s = getSocket();
    const on = (n) => { toast(n?.title || 'Yangi bildirishnoma'); load(); };
    s?.on('notification', on);
    const t = setInterval(load, 90000);
    return () => { s?.off('notification', on); clearInterval(t); };
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const readAll = async () => { try { await api.patch('/notifications/read-all'); load(); } catch {} };
  const click = async (n) => {
    setOpen(false);
    if (!n.isRead) { api.patch(`/notifications/${n.id}/read`).then(load).catch(() => {}); }
    if (n.link && n.link.startsWith('/')) nav(n.link);
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Bildirishnomalar"><Bell size={21} />{unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}</button>
      {open && (
        <div className="notif-pop">
          <div className="row" style={{ padding: '12px 16px', borderBottom: '2px dashed var(--line)' }}>
            <b className="grow" style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Bildirishnomalar</b>
            {unread > 0 && <button className="btn ghost sm" onClick={readAll}>Hammasini o'qildi</button>}
          </div>
          {items.length === 0 && <div className="empty" style={{ padding: 30 }}><span className="em" style={{ fontSize: 36 }}>🔔</span>Hozircha tinch</div>}
          {items.map((n) => (
            <button key={n.id} className={`notif ${n.isRead ? '' : 'unread'}`} onClick={() => click(n)}>
              <Avatar user={n.actor || { fullName: '🔔' }} size={36} />
              <div><b style={{ fontSize: 14 }}>{n.title}</b><div className="small muted">{n.message}</div><div className="small" style={{ color: 'var(--ink3)' }}>{whenText(n)}</div></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [days, setDays] = useState(null);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => { api.get('/memories/stats').then((s) => setDays(s?.graduationCountdown)).catch(() => {}); }, []);

  const submit = (e) => { e.preventDefault(); if (q.trim()) { nav(`/qidiruv?q=${encodeURIComponent(q.trim())}`); setQ(''); } };

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">8-B</div>
          <div><div className="brand-name">Sinf Esdaligi</div><div className="brand-sub">hech qachon unutmaymiz</div></div>
        </div>
        <nav className="nav">
          {NAV.map((g) => (
            <div key={g.label}>
              <div className="nav-label">{g.label}</div>
              {g.items.map((i) => <NavLink key={i.to} to={i.to} end={i.end}><i.icon size={19} />{i.text}</NavLink>)}
            </div>
          ))}
          {isAdmin && <><div className="nav-label">Boshqaruv</div><NavLink to="/admin"><Shield size={19} />Admin panel</NavLink></>}
        </nav>
        {days && (
          <div className="side-card">
            {days.hasGraduated ? (<><div className="big">{days.daysSinceGraduation}</div><div className="hand">kun bitirganimizga bo'ldi 🎓</div></>)
              : (<><div className="big">{days.daysRemaining}</div><div className="hand">kun qoldi bitirishgacha 🎓</div></>)}
          </div>
        )}
        <NavLink to="/profil" className="side-user" style={{ color: 'inherit' }}>
          <Avatar user={user} size={38} />
          <div className="grow"><div className="nm">{user?.fullName}</div><div className="rl">{user?.role === 'ADMIN' ? 'Admin' : '@' + user?.username}</div></div>
        </NavLink>
      </aside>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Menyu"><Menu size={22} /></button>
          <form className="search" onSubmit={submit}><Search size={18} /><input className="input" placeholder="Xotiralardan qidirish…" value={q} onChange={(e) => setQ(e.target.value)} /></form>
          <div className="top-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Mavzuni almashtirish" title={theme === 'dark' ? 'Yorug\' rejim' : 'Qorong\'i rejim'}>{theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}</button>
            <Notifications />
            <button className="icon-btn" onClick={() => { logout(); nav('/kirish'); }} aria-label="Chiqish" title="Chiqish"><LogOut size={20} /></button>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>

      <nav className="bottom-nav">
        <NavLink to="/" end><Home size={21} />Bosh</NavLink>
        <NavLink to="/lenta"><Newspaper size={21} />Lenta</NavLink>
        <NavLink to="/rasmlar"><Images size={21} />Rasmlar</NavLink>
        <NavLink to="/chat"><MessageCircle size={21} />Chat</NavLink>
        <button onClick={() => setOpen(true)}><MoreHorizontal size={21} />Yana</button>
      </nav>
    </div>
  );
}

