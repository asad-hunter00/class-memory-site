import { useState } from 'react';
import { Heart, MessageCircle, Bookmark, Trash2, Send } from 'lucide-react';
import { api } from '../lib/api.js';
import { REACTIONS, emojiOf, whenText } from '../lib/util.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/ui.jsx';
import { Avatar } from './common.jsx';

// kind: 'post' | 'photo' | 'video'
const idKey = (kind) => `${kind}Id`;
const targetType = (kind) => kind.toUpperCase();

export function ReactionButton({ kind, id, mine, onChange }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const pick = async (type) => {
    setOpen(false);
    try {
      await api.post('/reactions', { type, [idKey(kind)]: id });
      onChange(mine === type ? null : type);
    } catch (e) { toast(e.message, 'bad'); }
  };
  return (
    <div className="react-wrap" onMouseLeave={() => setOpen(false)}>
      {open && <div className="react-pop">{REACTIONS.map((r) => <button key={r.type} onClick={() => pick(r.type)} title={r.label}>{r.emoji}</button>)}</div>}
      <button className={`act ${mine ? 'on' : ''}`} onMouseEnter={() => setOpen(true)} onClick={() => (mine ? pick(mine) : pick('HEART'))}>
        {mine ? <span style={{ fontSize: 17 }}>{emojiOf(mine)}</span> : <Heart size={18} />} Yoqdi
      </button>
    </div>
  );
}

export function FavButton({ kind, id, isFav, onChange }) {
  const toast = useToast();
  const toggle = async () => {
    try {
      if (isFav) {
        const { items } = await api.list('/favorites', { limit: 50, targetType: targetType(kind) });
        const f = items.find((x) => x[idKey(kind)] === id || x[kind]?.id === id);
        if (f) await api.del(`/favorites/${f.id}`);
        onChange(false);
      } else {
        await api.post('/favorites', { targetType: targetType(kind), [idKey(kind)]: id });
        onChange(true);
        toast('Saqlanganlarga qo\'shildi');
      }
    } catch (e) { toast(e.message, 'bad'); }
  };
  return <button className={`act fav ${isFav ? 'on' : ''}`} onClick={toggle} title="Saqlash"><Bookmark size={18} fill={isFav ? 'currentColor' : 'none'} /> <span className="hide-m">Saqlash</span></button>;
}

export function Comments({ kind, id, onCount }) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const { items } = await api.list('/comments', { [idKey(kind)]: id, limit: 100 }); setItems(items); onCount?.(items.length); }
    catch (e) { toast(e.message, 'bad'); setItems([]); }
  };
  if (items === null && !busy) { setBusy(true); load().finally(() => setBusy(false)); }

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post('/comments', { text: text.trim(), [idKey(kind)]: id });
      setText(''); await load();
    } catch (er) { toast(er.message, 'bad'); }
  };
  const remove = async (cid) => {
    try { await api.del(`/comments/${cid}`); await load(); } catch (e) { toast(e.message, 'bad'); }
  };

  return (
    <div>
      <div className="comments">
        {items === null && <span className="muted small">Yuklanmoqda…</span>}
        {items?.length === 0 && <span className="muted small hand">Birinchi bo'lib yozing ✍️</span>}
        {items?.map((c) => (
          <div className="comment" key={c.id}>
            <Avatar user={c.author} size={32} />
            <div style={{ minWidth: 0 }}>
              <div className="bubble"><b>{c.author?.fullName}</b>{c.text}</div>
              <div className="meta">{whenText(c)}{(c.author?.id === user.id || isAdmin) && <> · <a href="#" onClick={(e) => { e.preventDefault(); remove(c.id); }} style={{ color: 'var(--red)' }}>o'chirish</a></>}</div>
            </div>
          </div>
        ))}
      </div>
      <form className="comment-form" onSubmit={send}>
        <input className="input" placeholder="Izoh yozing…" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
        <button className="btn primary sm" aria-label="Yuborish"><Send size={16} /></button>
      </form>
    </div>
  );
}

export function CommentToggle({ count, open, onClick }) {
  return <button className={`act ${open ? 'on' : ''}`} style={open ? { color: 'var(--ink)', background: 'var(--bg2)' } : {}} onClick={onClick}><MessageCircle size={18} /> {count ?? 0} izoh</button>;
}

export function DeleteButton({ onClick }) {
  return <button className="act" onClick={onClick} style={{ color: 'var(--red)' }}><Trash2 size={17} /> <span className="hide-m">O'chirish</span></button>;
}
