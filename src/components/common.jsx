import { useEffect } from 'react';
import { X } from 'lucide-react';
import { initials, whenText } from '../lib/util.js';
import { optimize } from '../lib/upload.js';

const AV_COLORS = ['#F2B01E', '#F29A8B', '#9AD0B5', '#9DB8EE', '#E4B6E0', '#F2C98A', '#B7D77A'];
const colorFor = (s = '') => AV_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];

export function Avatar({ user, size = 40, onClick }) {
  const s = { '--s': size + 'px', '--c': colorFor(user?.id || user?.username || ''), cursor: onClick ? 'pointer' : undefined };
  if (user?.avatarUrl) return <img className="avatar" style={s} src={optimize(user.avatarUrl, 200)} alt={user.fullName} onClick={onClick} loading="lazy" />;
  return <div className="avatar" style={s} onClick={onClick} title={user?.fullName}>{initials(user?.fullName)}</div>;
}

export function Modal({ title, onClose, children, wide, bare }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        {bare ? <button className="close-x" onClick={onClose} aria-label="Yopish"><X size={18} /></button> : (
          <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Yopish"><X size={20} /></button></div>
        )}
        {bare ? children : <div className="modal-body">{children}</div>}
      </div>
    </div>
  );
}

export function Empty({ emoji = '📭', title, children }) {
  return <div className="empty"><span className="em">{emoji}</span><h3>{title}</h3><div>{children}</div></div>;
}

export function Loading({ label }) {
  return <div className="center"><span className="spin" /> {label && <span className="muted" style={{ marginLeft: 10 }}>{label}</span>}</div>;
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="card pad" style={{ textAlign: 'center' }}>
      <p className="err">{error}</p>
      {onRetry && <button className="btn sm" onClick={onRetry}>Qayta urinish</button>}
    </div>
  );
}

export function PageHead({ hand, title, children }) {
  return (
    <div className="page-head">
      <div>{hand && <span className="hand">{hand}</span>}<h1>{title}</h1></div>
      <div className="row wrap">{children}</div>
    </div>
  );
}

export function Who({ user, item }) {
  return (
    <div className="post-head">
      <Avatar user={user} size={42} />
      <div className="grow">
        <div className="nm">{user?.fullName} {user?.nickname && <span className="hand" style={{ fontSize: 19, color: 'var(--red)' }}>«{user.nickname}»</span>}</div>
        <div className="sub" title={item?.dateTimeFormatted}>{item?.dateFormatted} · {item?.timeFormatted}{item?.createdAt && whenText(item) !== item.dateFormatted && ` · ${whenText(item)}`}</div>
      </div>
    </div>
  );
}
