import { Play } from 'lucide-react';
import { fmtDuration, thumb, videoPoster } from '../api';

export default function MediaGrid({ items, onOpen }) {
  return (
    <div className="masonry">
      {items.map((it, i) => {
        const isVideo = it.kind === 'video';
        const src = isVideo ? videoPoster(it) : thumb(it.thumbnailUrl && !it.thumbnailUrl.includes('/upload/c_') ? it.imageUrl : it.imageUrl, 500);
        const cap = isVideo ? it.title : it.caption;
        return (
          <button className="polaroid" key={`${it.kind}-${it.id}`} onClick={() => onOpen(i)}>
            {it.isPinned && <span className="pinned">📌</span>}
            <div className="ph" style={isVideo ? { aspectRatio: '16/10' } : undefined}>
              <img src={src} alt={cap || ''} loading="lazy" style={isVideo ? { height: '100%', objectFit: 'cover' } : undefined} />
              {isVideo && (
                <div className="play-badge"><span><Play size={22} fill="currentColor" /></span>
                  {it.durationSec ? <em className="dur" style={{ fontStyle: 'normal' }}>{fmtDuration(it.durationSec)}</em> : null}
                </div>
              )}
            </div>
            {cap && <div className="cap">{cap}</div>}
            <div className="sub">
              <span>{it.uploader?.fullName?.split(' ')[0]}</span>
              <span>{it.dateFormatted}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
