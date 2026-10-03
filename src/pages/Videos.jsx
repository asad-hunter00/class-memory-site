import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty, ErrorBox, Loading, PageHead } from '../components/common.jsx';
import { MediaView, VideoCard } from '../components/Media.jsx';
import { VideoUpload, useAlbums } from '../components/Uploaders.jsx';

export function VideoGallery({ albumId }) {
  const albums = useAlbums();
  const [filter, setFilter] = useState(albumId || '');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [state, setState] = useState({ loading: true, error: null });
  const [open, setOpen] = useState(null);
  const [upload, setUpload] = useState(false);

  const load = async (p = 1, f = filter) => {
    try {
      const { items: it, pagination } = await api.list('/videos', { page: p, limit: 12, albumId: f });
      setItems((cur) => (p === 1 ? it : [...cur, ...it]));
      setMore(!!pagination?.hasNext); setPage(p); setState({ loading: false, error: null });
    } catch (e) { setState({ loading: false, error: e.message }); }
  };
  useEffect(() => { setState({ loading: true, error: null }); load(1, filter); /* eslint-disable-next-line */ }, [filter]);

  return (
    <>
      <div className="row wrap" style={{ marginBottom: 20 }}>
        {!albumId && <>
          <button className={`chip chip-btn ${filter === '' ? 'on' : ''}`} onClick={() => setFilter('')}>Hammasi</button>
          {albums.map((a) => <button key={a.id} className={`chip chip-btn ${filter === a.id ? 'on' : ''}`} onClick={() => setFilter(a.id)}>{a.name}</button>)}
        </>}
        <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={() => setUpload(true)}><Plus size={17} /> Video qo'shish</button>
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorBox error={state.error} onRetry={() => load(1)} />}
      {!state.loading && !state.error && items.length === 0 && <Empty emoji="🎬" title="Hali video yo'q">Sayohat, bitiruv yoki darsdagi kulgili lahzani yuklang.<span className="hand">kamera tayyor?</span></Empty>}
      <div className="vgrid">{items.map((v) => <VideoCard key={v.id} video={v} onOpen={() => setOpen(v.id)} />)}</div>
      {more && <div className="center"><button className="btn" onClick={() => load(page + 1)}>Yana ko'rsatish</button></div>}
      {open && <MediaView kind="video" id={open} onClose={() => setOpen(null)} onChanged={() => load(1)} />}
      {upload && <VideoUpload defaultAlbum={filter} onClose={() => setUpload(false)} onDone={() => load(1)} />}
    </>
  );
}

export default function Videos() {
  return (
    <>
      <PageHead hand="bosing va tomosha qiling" title="Videolar" />
      <VideoGallery />
    </>
  );
}
