import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { Empty, errMsg, Loading } from '../components/ui';
import MediaGrid from '../components/MediaGrid';
import MediaViewer from '../components/MediaViewer';
import UploadModal from '../components/UploadModal';

export default function Gallery() {
  const { toast } = useApp();
  const [tab, setTab] = useState('photo');
  const [albums, setAlbums] = useState([]);
  const [albumId, setAlbumId] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);
  const [upload, setUpload] = useState(false);

  useEffect(() => { api.get('/albums').then((r) => setAlbums(r.data || [])).catch(() => {}); }, []);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const r = await api.get(tab === 'photo' ? '/photos' : '/videos', { page: p, limit: 24, albumId });
      const rows = (r.data || []).map((x) => ({ ...x, kind: tab }));
      setItems((x) => (p === 1 ? rows : [...x, ...rows]));
      setMore(!!r.pagination?.hasNext);
      setTotal(r.pagination?.total || 0);
      setPage(p);
    } catch (e) { toast(errMsg(e), 'error'); }
    setLoading(false);
  }, [tab, albumId, toast]);

  useEffect(() => { setItems([]); load(1); }, [load]);

  return (
    <div>
      <div className="page-head">
        <div><h1>Foto<span className="mark">galereya</span></h1><p>Barcha rasm va videolar bir joyda. Bosing, kattalashtiring, izoh qoldiring.</p></div>
        <span className="tag">{total} ta</span>
      </div>

      <div className="tabs">
        <button className={tab === 'photo' ? 'on' : ''} onClick={() => setTab('photo')}>📷 Rasmlar</button>
        <button className={tab === 'video' ? 'on' : ''} onClick={() => setTab('video')}>🎬 Videolar</button>
      </div>

      <div className="chips" style={{ marginBottom: 22 }}>
        <button className={`chip ${albumId === '' ? 'on' : ''}`} onClick={() => setAlbumId('')}>Hammasi</button>
        {albums.map((a) => (
          <button key={a.id} className={`chip ${albumId === a.id ? 'on' : ''}`} onClick={() => setAlbumId(a.id)}>{a.name}</button>
        ))}
      </div>

      {items.length > 0 && <MediaGrid items={items} onOpen={(i) => setViewer({ index: i })} />}
      {loading && <Loading />}
      {!loading && items.length === 0 && (
        <Empty emoji={tab === 'photo' ? '📷' : '🎬'} title={tab === 'photo' ? 'Rasmlar yo\'q' : 'Videolar yo\'q'}>
          “Qo'shish” tugmasi orqali birinchi xotirani yuklang.
        </Empty>
      )}
      {!loading && more && <div className="more-wrap"><button className="btn" onClick={() => load(page + 1)}>Yana yuklash</button></div>}

      <button className="fab" onClick={() => setUpload(true)}><Plus size={22} /> Qo'shish</button>

      {upload && <UploadModal defaultAlbumId={albumId} onClose={() => setUpload(false)} onDone={() => load(1)} />}
      {viewer && (
        <MediaViewer
          items={items} index={viewer.index} onClose={() => setViewer(null)}
          onRemoved={(it) => setItems((x) => x.filter((y) => y.id !== it.id))}
          onChanged={(it, data) => setItems((x) => x.map((y) => (y.id === it.id ? { ...y, ...data, uploader: y.uploader, album: y.album } : y)))}
        />
      )}
    </div>
  );
}
