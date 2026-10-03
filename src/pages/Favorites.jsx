import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Empty, ErrorBox, Loading, PageHead } from '../components/common.jsx';
import { MemoryRow, useViewer } from '../components/Memory.jsx';

export default function Favorites() {
  const { viewer, show } = useViewer();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api.list('/favorites', { limit: 50 }).then((r) => setItems(r.items.map((f) => {
      const k = f.photo ? 'photo' : f.video ? 'video' : 'post';
      return { ...f[k], memoryType: k };
    }).filter((x) => x.id))).catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <PageHead hand="faqat sizniki" title="Saqlanganlar" />
      {error && <ErrorBox error={error} />}
      {!items && !error && <Loading />}
      {items?.length === 0 && <Empty emoji="🔖" title="Hali hech narsa saqlanmagan">Yoqqan rasm, video yoki postdagi "Saqlash" tugmasini bosing.</Empty>}
      <div style={{ maxWidth: 780 }}>{items?.map((m) => <MemoryRow key={m.memoryType + m.id} item={m} onOpen={show} />)}</div>
      {viewer}
    </>
  );
}
