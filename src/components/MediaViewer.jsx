import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pin, Trash2, X, Pencil, Check } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { Avatar, errMsg, Loading } from './ui';
import { Comments, ReactionBar } from './Social';

// items: [{kind:'photo'|'video', id, ...}], index
export default function MediaViewer({ items, index, onClose, onChanged, onRemoved }) {
  const { user, toast } = useApp();
  const [i, setI] = useState(index);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [cap, setCap] = useState('');
  const item = items[i];

  const load = useCallback(async () => {
    setDetail(null);
    setEditing(false);
    try {
      const r = await api.get(`/${item.kind}s/${item.id}`);
      setDetail(r.data);
    } catch (e) { toast(errMsg(e), 'error'); }
  }, [item.id, item.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const go = useCallback((d) => setI((x) => (x + d + items.length) % items.length), [items.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) { if (e.key === 'Escape') onClose(); return; }
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && items.length > 1) go(1);
      if (e.key === 'ArrowLeft' && items.length > 1) go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [go, onClose, items.length]);

  const d = detail;
  const isVideo = item.kind === 'video';
  const uploader = d?.uploader || item.uploader;
  const owner = d && (d.uploaderId === user.id || d.uploader?.id === user.id);
  const myReaction = d?.reactions?.find((r) => r.userId === user.id)?.type || null;
  const title = isVideo ? d?.title || item.title : d?.caption ?? item.caption;

  const saveCap = async () => {
    try {
      const body = isVideo ? { title: cap } : { caption: cap };
      const r = await api.patch(`/${item.kind}s/${item.id}`, body);
      setDetail((x) => ({ ...x, ...body }));
      onChanged && onChanged(item, r.data);
      setEditing(false);
      toast('Saqlandi', 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const remove = async () => {
    if (!confirm('Bu xotirani o\'chirasizmi? Qaytarib bo\'lmaydi.')) return;
    try {
      await api.del(`/${item.kind}s/${item.id}`);
      toast('O\'chirildi');
      onRemoved && onRemoved(item);
      if (items.length <= 1) onClose(); else go(1);
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const pin = async () => {
    try {
      const r = await api.patch(`/${item.kind}s/${item.id}/pin`);
      setDetail((x) => ({ ...x, isPinned: r.data.isPinned }));
      onChanged && onChanged(item, r.data);
      toast(r.data.isPinned ? 'Mahkamlandi 📌' : 'Mahkamlash olib tashlandi');
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  return (
    <div className="lb-bg">
      <div className="lb">
        <div className="lb-media" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <button className="lb-close" onClick={onClose} aria-label="Yopish"><X size={20} /></button>
          {items.length > 1 && <button className="lb-nav prev" onClick={() => go(-1)} aria-label="Oldingi"><ChevronLeft /></button>}
          {isVideo
            ? <video key={item.id} src={item.videoUrl} poster={item.thumbnailUrl || undefined} controls autoPlay playsInline />
            : <img key={item.id} src={item.imageUrl} alt={item.caption || ''} />}
          {items.length > 1 && <button className="lb-nav next" onClick={() => go(1)} aria-label="Keyingi"><ChevronRight /></button>}
        </div>
        <aside className="lb-side">
          <div className="lb-side-top">
            <div className="flex">
              <Avatar user={uploader} size={42} />
              <div className="grow">
                <b>{uploader?.fullName}</b>
                <div className="meta">{item.dateFormatted} · {item.timeFormatted}</div>
              </div>
              {user.role === 'ADMIN' && <button className="btn btn-ghost btn-sm" onClick={pin} title="Mahkamlash"><Pin size={16} /></button>}
              {(owner || user.role === 'ADMIN') && <button className="btn btn-ghost btn-sm btn-danger" onClick={remove} aria-label="O'chirish"><Trash2 size={16} /></button>}
            </div>
            <div style={{ margin: '14px 0 4px' }}>
              {editing ? (
                <div className="flex">
                  <input className="input" value={cap} onChange={(e) => setCap(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveCap()} />
                  <button className="btn btn-primary btn-sm" onClick={saveCap} aria-label="Saqlash"><Check size={16} /></button>
                </div>
              ) : (
                <div className="between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    {title ? <p style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{title}</p> : <p className="meta" style={{ margin: 0 }}>Izoh yo'q</p>}
                    {isVideo && (d?.description || item.description) && <p className="meta" style={{ margin: '4px 0 0' }}>{d?.description || item.description}</p>}
                    {(d?.album || item.album) && <span className="tag mint" style={{ marginTop: 8 }}>📁 {(d?.album || item.album).name}</span>}
                  </div>
                  {(owner || user.role === 'ADMIN') && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setCap(title || ''); setEditing(true); }} aria-label="Tahrirlash"><Pencil size={15} /></button>
                  )}
                </div>
              )}
            </div>
            {d ? (
              <div style={{ marginTop: 12 }}>
                <ReactionBar kind={item.kind} id={item.id} count={d.reactions?.length || 0} mine={myReaction} favorited={!!d.isFavorited} />
              </div>
            ) : <Loading text="" />}
          </div>
          <div className="lb-comments">
            {d ? <Comments kind={item.kind} id={item.id} initial={d.comments} /> : <Loading text="Izohlar…" />}
          </div>
        </aside>
      </div>
    </div>
  );
}
