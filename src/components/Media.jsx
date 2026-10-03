import { useEffect, useState } from 'react';
import { Pin, Pencil, Play } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/ui.jsx';
import { optimize } from '../lib/upload.js';
import { REACTIONS, emojiOf, fmtDuration } from '../lib/util.js';
import { Modal, Who, Loading } from './common.jsx';
import { Comments, ReactionButton, FavButton, DeleteButton } from './Social.jsx';

// kind: 'photo' | 'video'. Rasm yoki videoni to'liq ko'rsatadi: izoh, reaksiya, saqlash, o'chirish.
export function MediaView({ kind, id, onClose, onChanged }) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [item, setItem] = useState(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const base = kind === 'photo' ? '/photos' : '/videos';

  useEffect(() => {
    let alive = true;
    api.get(`${base}/${id}`).then((d) => alive && setItem(d)).catch((e) => { toast(e.message, 'bad'); onClose(); });
    return () => { alive = false; };
    // eslint-disable-next-line
  }, [id]);

  if (!item) return <Modal bare wide onClose={onClose}><Loading /></Modal>;

  const mine = item.reactions?.find((r) => r.userId === user.id)?.type || null;
  const summary = REACTIONS.map((r) => ({ ...r, n: item.reactions?.filter((x) => x.type === r.type).length || 0 })).filter((r) => r.n);
  const canEdit = item.uploader?.id === user.id || isAdmin;
  const title = kind === 'photo' ? item.caption : item.title;

  const setReaction = (type) => setItem((it) => {
    const rest = (it.reactions || []).filter((r) => r.userId !== user.id);
    return { ...it, reactions: type ? [...rest, { type, userId: user.id }] : rest };
  });
  const remove = async () => {
    if (!confirm("Rostdan o'chirilsinmi?")) return;
    try { await api.del(`${base}/${id}`); toast("O'chirildi"); onChanged?.(); onClose(); } catch (e) { toast(e.message, 'bad'); }
  };
  const pin = async () => {
    try { await api.patch(`${base}/${id}/pin`); setItem({ ...item, isPinned: !item.isPinned }); onChanged?.(); } catch (e) { toast(e.message, 'bad'); }
  };
  const save = async () => {
    try {
      await api.patch(`${base}/${id}`, kind === 'photo' ? { caption: text } : { title: text });
      setItem({ ...item, ...(kind === 'photo' ? { caption: text } : { title: text }) }); setEditing(false); onChanged?.();
    } catch (e) { toast(e.message, 'bad'); }
  };

  return (
    <Modal bare wide onClose={onClose}>
      <div className="lightbox">
        <div className="lb-media">
          {kind === 'photo'
            ? <img src={optimize(item.imageUrl, 1400)} alt={item.caption || 'Rasm'} />
            : <video src={item.videoUrl} poster={item.thumbnailUrl || undefined} controls autoPlay playsInline />}
        </div>
        <div className="lb-side">
          <Who user={item.uploader} item={item} />
          {editing ? (
            <div className="field"><textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
              <div className="row"><button className="btn primary sm" onClick={save}>Saqlash</button><button className="btn sm" onClick={() => setEditing(false)}>Bekor</button></div></div>
          ) : (
            <div style={{ marginBottom: 6 }}>
              {title && <p className="post-text" style={{ fontWeight: kind === 'video' ? 800 : 500, fontSize: kind === 'video' ? 19 : 16 }}>{title}</p>}
              {kind === 'video' && item.description && <p className="muted" style={{ marginTop: 4 }}>{item.description}</p>}
              {item.album && <span className="chip accent" style={{ marginTop: 8 }}>📁 {item.album.name}</span>}
            </div>
          )}
          {summary.length > 0 && <div className="row wrap small" style={{ gap: 6, margin: '8px 0' }}>{summary.map((r) => <span key={r.type} className="chip">{r.emoji} {r.n}</span>)}</div>}
          <div className="post-actions" style={{ marginTop: 8 }}>
            <ReactionButton kind={kind} id={id} mine={mine} onChange={setReaction} />
            <FavButton kind={kind} id={id} isFav={!!item.isFavorited} onChange={(v) => setItem({ ...item, isFavorited: v })} />
            {canEdit && !editing && <button className="act" onClick={() => { setText(title || ''); setEditing(true); }}><Pencil size={16} /></button>}
            {isAdmin && <button className={`act ${item.isPinned ? 'on' : ''}`} onClick={pin} title="Muhim deb belgilash"><Pin size={16} /></button>}
            {canEdit && <DeleteButton onClick={remove} />}
          </div>
          <Comments kind={kind} id={id} />
        </div>
      </div>
    </Modal>
  );
}

export function PhotoTile({ photo, onOpen }) {
  return (
    <button className="tile" onClick={() => onOpen(photo)} aria-label={photo.caption || 'Rasm'}>
      {photo.isPinned && <Pin className="pin" size={20} fill="currentColor" />}
      <img src={optimize(photo.thumbnailUrl || photo.imageUrl, 520)} alt={photo.caption || ''} loading="lazy" />
      {(photo._count?.reactions > 0 || photo._count?.comments > 0) && (
        <div className="count">
          {photo._count.reactions > 0 && <span>❤ {photo._count.reactions}</span>}
          {photo._count.comments > 0 && <span>💬 {photo._count.comments}</span>}
        </div>
      )}
      <span className="cap">{photo.caption || photo.dateFormatted}</span>
    </button>
  );
}

export function VideoCard({ video, onOpen }) {
  return (
    <button className="card vcard" onClick={() => onOpen(video)}>
      <div className="vthumb">
        {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" loading="lazy" /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', fontSize: 48 }}>🎬</div>}
        <div className="play"><i><Play size={24} fill="currentColor" /></i></div>
        {video.durationSec ? <span className="dur">{fmtDuration(video.durationSec)}</span> : null}
      </div>
      <div className="vinfo">
        <h3>{video.title}</h3>
        <div className="small muted">{video.uploader?.fullName} · {video.dateFormatted}</div>
      </div>
    </button>
  );
}

export { emojiOf };
