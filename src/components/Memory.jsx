import { useState } from 'react';
import { optimize } from '../lib/upload.js';
import { MediaView } from './Media.jsx';
import { Link } from 'react-router-dom';

// Har xil turdagi xotirani (rasm/video/post) bir xil ko'rinishda ko'rsatadi
export function kindOf(item) {
  return item.memoryType || (item.imageUrl && !item.text ? 'photo' : item.videoUrl && item.title ? 'video' : item.text ? 'post' : 'photo');
}
export function titleOf(item) {
  const k = kindOf(item);
  if (k === 'video') return item.title;
  if (k === 'photo') return item.caption || 'Rasm';
  return item.text;
}
export function thumbOf(item) {
  const k = kindOf(item);
  if (k === 'photo') return optimize(item.thumbnailUrl || item.imageUrl, 300);
  if (k === 'video') return item.thumbnailUrl;
  return item.imageUrl ? optimize(item.imageUrl, 300) : null;
}
const ICON = { photo: '📷', video: '🎬', post: '✍️' };
const LABEL = { photo: 'Rasm', video: 'Video', post: 'Post' };

export function useViewer() {
  const [open, setOpen] = useState(null);
  const viewer = open ? <MediaView kind={open.kind} id={open.id} onClose={() => setOpen(null)} /> : null;
  const show = (item) => { const k = kindOf(item); if (k === 'post') return false; setOpen({ kind: k, id: item.id }); return true; };
  return { viewer, show };
}

export function MemoryRow({ item, onOpen }) {
  const k = kindOf(item);
  const who = item.uploader || item.author;
  const body = (
    <>
      <div className="th">{thumbOf(item) ? <img src={thumbOf(item)} alt="" loading="lazy" /> : ICON[k]}</div>
      <div className="grow">
        <div className="row small muted" style={{ gap: 8, marginBottom: 2 }}><span className="chip">{ICON[k]} {LABEL[k]}</span><span>{item.dateFormatted}</span></div>
        <div style={{ fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{titleOf(item)}</div>
        <div className="small muted">{who?.fullName}{item.album ? ` · 📁 ${item.album.name}` : ''}</div>
      </div>
    </>
  );
  if (k === 'post') return <Link to="/lenta" className="card tl-item">{body}</Link>;
  return <div className="card tl-item" onClick={() => onOpen(item)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}>{body}</div>;
}
