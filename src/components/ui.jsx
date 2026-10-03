import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const PALETTE = ['#ffc21a', '#ff6b8a', '#2fb990', '#4c9aff', '#8b6cf0', '#ff8a3d'];

export function Avatar({ user, size = 40, className = '', style }) {
  const name = user?.fullName || user?.username || '?';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % PALETTE.length;
  return (
    <span className={`avatar ${className}`} style={{ '--s': `${size}px`, background: user?.avatarUrl ? '#ddd' : PALETTE[idx], ...style }}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt={name} loading="lazy" /> : initials}
    </span>
  );
}

export function Loading({ text = 'Yuklanmoqda…' }) {
  return (
    <div className="loading">
      <span className="spinner" />
      {text}
    </div>
  );
}

export function Empty({ emoji = '📭', title, children }) {
  return (
    <div className="empty">
      <span className="big">{emoji}</span>
      <h3>{title}</h3>
      {children && <p style={{ margin: 0 }}>{children}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'lg' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={onClose} aria-label="Yopish">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function useDebounced(value, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function errMsg(e) {
  return e?.message || 'Xatolik yuz berdi';
}

// "Bugun", "Kecha" yoki sana
export function whenText(item) {
  if (!item) return '';
  return `${item.dateFormatted || ''} · ${item.timeFormatted || ''}`;
}
