import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { api, uploadToCloudinary } from '../api';
import { useApp } from '../context/AppContext';
import { Modal, errMsg } from './ui';

const MAX_MB = 100;

// Rasm va videolarni Cloudinary ga yuklab, backendga yozadi
export default function UploadModal({ onClose, onDone, defaultAlbumId = '' }) {
  const { toast } = useApp();
  const [files, setFiles] = useState([]); // {file, preview, caption, status, pct}
  const [albums, setAlbums] = useState([]);
  const [albumId, setAlbumId] = useState(defaultAlbumId);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef(null);

  useEffect(() => { api.get('/albums').then((r) => setAlbums(r.data || [])).catch(() => {}); }, []);
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.preview)), []); // eslint-disable-line

  const add = (list) => {
    const next = [];
    for (const file of Array.from(list)) {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      if (!isImg && !isVid) { toast(`${file.name}: faqat rasm yoki video`, 'error'); continue; }
      if (file.size > MAX_MB * 1024 * 1024) { toast(`${file.name}: ${MAX_MB}MB dan katta`, 'error'); continue; }
      next.push({ file, preview: URL.createObjectURL(file), isVid, caption: '', status: 'wait', pct: 0 });
    }
    setFiles((f) => [...f, ...next]);
  };

  const patch = (idx, p) => setFiles((fs) => fs.map((f, i) => (i === idx ? { ...f, ...p } : f)));

  const start = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status === 'done') { ok++; continue; }
      try {
        patch(i, { status: 'up', pct: 0 });
        const up = await uploadToCloudinary(f.file, (pct) => patch(i, { pct }));
        patch(i, { status: 'save', pct: 100 });
        if (up.type === 'video') {
          await api.post('/videos', {
            videoUrl: up.url, thumbnailUrl: up.thumbnail, title: f.caption.trim() || f.file.name.replace(/\.[^.]+$/, ''),
            durationSec: up.duration || null, albumId: albumId || null,
          });
        } else {
          await api.post('/photos', { imageUrl: up.url, thumbnailUrl: up.thumbnail, caption: f.caption.trim() || null, albumId: albumId || null });
        }
        patch(i, { status: 'done' });
        ok++;
      } catch (e) {
        patch(i, { status: 'err', err: errMsg(e) });
      }
    }
    setBusy(false);
    if (ok) { toast(`${ok} ta xotira qo'shildi 🎉`, 'success'); onDone && onDone(); }
    if (ok === files.length) onClose();
  };

  return (
    <Modal title="Xotira qo'shish" onClose={busy ? () => {} : onClose} wide>
      <div
        className={`drop ${over ? 'over' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
      >
        <Upload size={34} />
        <p style={{ margin: '8px 0 0', fontWeight: 700 }}>Rasm yoki videolarni shu yerga tashlang</p>
        <p className="hint" style={{ margin: '4px 0 0' }}>yoki bosib tanlang (har biri {MAX_MB}MB gacha)</p>
        <input ref={input} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div className="file-item" key={i}>
              {f.isVid ? <video className="thumb" src={f.preview} muted /> : <img className="thumb" src={f.preview} alt="" />}
              <div className="grow">
                <input className="input" style={{ padding: '7px 10px', borderRadius: 10 }} placeholder={f.isVid ? 'Video nomi' : 'Izoh (ixtiyoriy)'}
                  value={f.caption} disabled={busy || f.status === 'done'} onChange={(e) => patch(i, { caption: e.target.value })} />
                {f.status === 'up' && <div className="progress"><i style={{ width: f.pct + '%' }} /></div>}
                {f.status === 'save' && <span className="hint">Saqlanmoqda…</span>}
                {f.status === 'done' && <span className="hint" style={{ color: 'var(--mint)' }}>✓ Tayyor</span>}
                {f.status === 'err' && <span className="hint" style={{ color: 'var(--danger)' }}>{f.err}</span>}
              </div>
              {!busy && f.status !== 'done' && (
                <button className="btn btn-ghost btn-sm" onClick={() => setFiles((fs) => fs.filter((_, k) => k !== i))}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="field mt">
        <label>Albom</label>
        <select className="select" value={albumId} onChange={(e) => setAlbumId(e.target.value)} disabled={busy}>
          <option value="">Albomsiz</option>
          {albums.map((a) => <option key={a.id} value={a.id}>{a.name}{a.yearOrGrade ? ` (${a.yearOrGrade})` : ''}</option>)}
        </select>
      </div>

      <button className="btn btn-primary btn-block" disabled={!files.length || busy} onClick={start}>
        {busy ? 'Yuklanmoqda…' : `Yuklash (${files.length})`}
      </button>
    </Modal>
  );
}
