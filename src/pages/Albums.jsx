import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/ui.jsx';
import { optimize } from '../lib/upload.js';
import { Empty, ErrorBox, Loading, Modal, PageHead } from '../components/common.jsx';
import { PhotoGallery } from './Photos.jsx';
import { VideoGallery } from './Videos.jsx';

const EMOJIS = ['🎒', '🏕️', '🎉', '👩‍🏫', '😂', '🎓', '📚', '⚽', '🎨', '🚌'];

function AlbumForm({ album, onClose, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ name: album?.name || '', yearOrGrade: album?.yearOrGrade || '', description: album?.description || '' });
  const submit = async (e) => {
    e.preventDefault();
    const body = { name: f.name.trim(), yearOrGrade: f.yearOrGrade.trim() || null, description: f.description.trim() || null };
    try {
      if (album) await api.patch(`/albums/${album.id}`, body); else await api.post('/albums', body);
      toast('Saqlandi'); onDone(); onClose();
    } catch (er) { toast(er.message, 'bad'); }
  };
  return (
    <Modal title={album ? 'Albomni tahrirlash' : 'Yangi albom'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Nomi</label><input className="input" required value={f.name} maxLength={100} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Masalan: 9-sinf sayohati" /></div>
        <div className="field"><label>Yil yoki sinf</label><input className="input" value={f.yearOrGrade} maxLength={50} onChange={(e) => setF({ ...f, yearOrGrade: e.target.value })} placeholder="9-sinf" /></div>
        <div className="field"><label>Tavsif</label><textarea className="textarea" value={f.description} maxLength={500} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <button className="btn primary block">Saqlash</button>
      </form>
    </Modal>
  );
}

export function Albums() {
  const { isAdmin } = useAuth();
  const [albums, setAlbums] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(false);
  const load = () => api.get('/albums').then(setAlbums).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHead hand="hammasi o'z javonida" title="Albomlar">
        {isAdmin && <button className="btn primary" onClick={() => setForm(true)}><Plus size={18} /> Yangi albom</button>}
      </PageHead>
      {error && <ErrorBox error={error} onRetry={load} />}
      {!albums && !error && <Loading />}
      {albums?.length === 0 && <Empty emoji="📁" title="Albomlar yo'q">{isAdmin ? "Yuqoridagi tugma orqali birinchi albomni oching." : "Admin albom ochgach, bu yerda ko'rinadi."}</Empty>}
      <div className="album-grid">
        {albums?.map((a, i) => (
          <Link key={a.id} to={`/albomlar/${a.id}`} className="card album-card" style={{ transform: `rotate(${[-1, 0.8, -0.4][i % 3]}deg)` }}>
            <div className="album-cover" style={{ background: ['#FBE9AE', '#F8CDC3', '#CFE8DA', '#D0DDF8'][i % 4] }}>
              {a.coverImage ? <img src={optimize(a.coverImage, 600)} alt="" /> : <span className="emoji">{EMOJIS[i % EMOJIS.length]}</span>}
            </div>
            <div className="album-body">
              <h3>{a.name}</h3>
              <div className="small muted">{a.yearOrGrade && `${a.yearOrGrade} · `}{a.totalItems ?? 0} ta xotira</div>
            </div>
          </Link>
        ))}
      </div>
      {form && <AlbumForm onClose={() => setForm(false)} onDone={load} />}
    </>
  );
}

export function AlbumDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [album, setAlbum] = useState(null);
  const [tab, setTab] = useState('photos');
  const [edit, setEdit] = useState(false);
  const load = () => api.get(`/albums/${id}`).then(setAlbum).catch((e) => { toast(e.message, 'bad'); nav('/albomlar'); });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const remove = async () => {
    if (!confirm("Albom o'chirilsinmi? Ichidagi rasm va videolar o'chmaydi, faqat albomsiz qoladi.")) return;
    try { await api.del(`/albums/${id}`); toast("Albom o'chirildi"); nav('/albomlar'); } catch (e) { toast(e.message, 'bad'); }
  };
  if (!album) return <Loading />;

  return (
    <>
      <Link to="/albomlar" className="small muted row" style={{ marginBottom: 10, fontWeight: 700, width: 'fit-content' }}><ArrowLeft size={16} /> Albomlar</Link>
      <PageHead hand={album.yearOrGrade || 'albom'} title={album.name}>
        {isAdmin && <><button className="btn sm" onClick={() => setEdit(true)}><Pencil size={15} /> Tahrirlash</button><button className="btn sm danger" onClick={remove}><Trash2 size={15} /></button></>}
      </PageHead>
      {album.description && <p className="muted" style={{ marginTop: -8, marginBottom: 20, maxWidth: 640 }}>{album.description}</p>}
      <div className="seg" style={{ marginBottom: 22 }}>
        <button className={tab === 'photos' ? 'on' : ''} onClick={() => setTab('photos')}>Rasmlar {album.photos?.length ?? 0}</button>
        <button className={tab === 'videos' ? 'on' : ''} onClick={() => setTab('videos')}>Videolar {album.videos?.length ?? 0}</button>
      </div>
      {tab === 'photos' ? <PhotoGallery key="p" albumId={id} /> : <VideoGallery key="v" albumId={id} />}
      {edit && <AlbumForm album={album} onClose={() => setEdit(false)} onDone={load} />}
    </>
  );
}
