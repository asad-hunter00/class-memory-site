import { useEffect, useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { uploadToCloud } from '../lib/upload.js';
import { useToast } from '../lib/ui.jsx';
import { Modal } from './common.jsx';

export function useAlbums() {
  const [albums, setAlbums] = useState([]);
  useEffect(() => { api.get('/albums').then((a) => setAlbums(a || [])).catch(() => {}); }, []);
  return albums;
}

export function AlbumSelect({ value, onChange, albums }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Albomsiz</option>
      {albums.map((a) => <option key={a.id} value={a.id}>{a.name}{a.yearOrGrade ? ` (${a.yearOrGrade})` : ''}</option>)}
    </select>
  );
}

// Bir nechta rasm yuklash
export function PhotoUpload({ onClose, onDone, defaultAlbum = '' }) {
  const toast = useToast();
  const albums = useAlbums();
  const [files, setFiles] = useState([]); // {file, local, progress, state}
  const [caption, setCaption] = useState('');
  const [albumId, setAlbumId] = useState(defaultAlbum);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  const add = (list) => {
    const arr = [...list].filter((f) => f.type.startsWith('image/')).slice(0, 20);
    setFiles((cur) => [...cur, ...arr.map((file) => ({ file, local: URL.createObjectURL(file), progress: 0, state: 'wait' }))].slice(0, 20));
  };
  const upd = (i, ch) => setFiles((cur) => cur.map((f, k) => (k === i ? { ...f, ...ch } : f)));

  const start = async () => {
    setBusy(true); let ok = 0;
    for (let i = 0; i < files.length; i++) {
      if (files[i].state === 'done') { ok++; continue; }
      upd(i, { state: 'up' });
      try {
        const r = await uploadToCloud(files[i].file, (p) => upd(i, { progress: p }));
        await api.post('/photos', { imageUrl: r.url, thumbnailUrl: r.thumb, caption: caption.trim() || null, albumId: albumId || null });
        upd(i, { state: 'done', progress: 100 }); ok++;
      } catch (e) { upd(i, { state: 'err' }); toast(e.message, 'bad'); }
    }
    setBusy(false);
    if (ok) { toast(`${ok} ta rasm yuklandi 📸`); onDone?.(); }
    if (ok === files.length) onClose();
  };

  return (
    <Modal title="Rasm qo'shish" onClose={busy ? () => {} : onClose}>
      <div
        className="card pad" style={{ textAlign: 'center', borderStyle: 'dashed', borderWidth: 2, cursor: 'pointer', marginBottom: 14 }}
        onClick={() => input.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
      >
        <UploadCloud size={34} /><div style={{ fontWeight: 800 }}>Rasmlarni tanlang yoki shu yerga tashlang</div><div className="hint">20 tagacha, jpg / png / webp</div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {files.length > 0 && (
        <div className="row wrap" style={{ marginBottom: 14, gap: 8 }}>
          {files.map((f, i) => (
            <div key={i} style={{ position: 'relative', width: 78, height: 78 }}>
              <img src={f.local} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, opacity: f.state === 'done' ? .5 : 1, border: f.state === 'err' ? '2px solid var(--red)' : '1.5px solid var(--line)' }} />
              {f.state === 'up' && <div className="progress" style={{ position: 'absolute', left: 4, right: 4, bottom: 4, height: 6 }}><i style={{ width: f.progress + '%' }} /></div>}
              {f.state === 'done' && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 24 }}>✅</span>}
              {!busy && f.state !== 'done' && <button className="x" style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 0, background: 'var(--ink)', color: 'var(--bg)', display: 'grid', placeItems: 'center' }} onClick={() => setFiles(files.filter((_, k) => k !== i))}><X size={13} /></button>}
            </div>
          ))}
        </div>
      )}
      <div className="field"><label>Izoh (hammasiga)</label><input className="input" maxLength={300} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Masalan: Bio darsidagi kulgi 😂" /></div>
      <div className="field"><label>Albom</label><AlbumSelect value={albumId} onChange={setAlbumId} albums={albums} /></div>
      <button className="btn primary block" disabled={!files.length || busy} onClick={start}>{busy ? <><span className="spin" /> Yuklanmoqda…</> : `Yuklash (${files.length})`}</button>
    </Modal>
  );
}

// Bitta video yuklash
export function VideoUpload({ onClose, onDone, defaultAlbum = '' }) {
  const toast = useToast();
  const albums = useAlbums();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [albumId, setAlbumId] = useState(defaultAlbum);
  const [progress, setProgress] = useState(null);
  const input = useRef(null);

  const go = async (e) => {
    e.preventDefault();
    if (!file) return toast('Avval video tanlang', 'bad');
    setProgress(0);
    try {
      const r = await uploadToCloud(file, setProgress);
      await api.post('/videos', { videoUrl: r.url, thumbnailUrl: r.thumb, title: title.trim(), description: desc.trim() || null, durationSec: r.duration || null, albumId: albumId || null });
      toast('Video yuklandi 🎬'); onDone?.(); onClose();
    } catch (er) { toast(er.message, 'bad'); setProgress(null); }
  };

  return (
    <Modal title="Video qo'shish" onClose={progress !== null ? () => {} : onClose}>
      <form onSubmit={go}>
        <div className="card pad" style={{ textAlign: 'center', borderStyle: 'dashed', borderWidth: 2, cursor: 'pointer', marginBottom: 14 }} onClick={() => input.current.click()}>
          <UploadCloud size={34} /><div style={{ fontWeight: 800 }}>{file ? file.name : 'Video tanlang'}</div>
          <div className="hint">{file ? `${(file.size / 1048576).toFixed(1)} MB` : 'mp4 / mov / webm'}</div>
          <input ref={input} type="file" accept="video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); } }} />
        </div>
        <div className="field"><label>Sarlavha</label><input className="input" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>Tavsif (ixtiyoriy)</label><textarea className="textarea" style={{ minHeight: 70 }} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="field"><label>Albom</label><AlbumSelect value={albumId} onChange={setAlbumId} albums={albums} /></div>
        {progress !== null && <div className="progress" style={{ marginBottom: 12 }}><i style={{ width: progress + '%' }} /></div>}
        <button className="btn primary block" disabled={progress !== null}>{progress !== null ? `Yuklanmoqda… ${progress}%` : 'Yuklash'}</button>
      </form>
    </Modal>
  );
}
