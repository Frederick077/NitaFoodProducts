import { useEffect, useRef, useState } from 'react';
import { GalleryItem } from '../types';
import { trackPageView } from '../utils';
import PageBanner from '../components/PageBanner';
import SafeImage from '../components/SafeImage';
import pumpkinSeedPowder from '../assets/images/NITA Pumpkin Seed Powder.png';

const categories = ['All', 'Products', 'Packaging', 'Production Process', 'Company Events', 'Customers'];
export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    trackPageView('/gallery');
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch('/api/gallery', { signal: controller.signal }).then(async res => {
      const data: GalleryItem[] = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error();
      if (!controller.signal.aborted) setItems(data.filter(item => item.enabled !== false && (item.image?.trim() || item.imageUrl?.trim())).sort((a, b) => (a.position || 0) - (b.position || 0)));
    }).catch(() => { if (!controller.signal.aborted) setError('Photographs could not be loaded. Please try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    else if (!selected && dialog.current?.open) dialog.current.close();
  }, [selected]);
  const filtered = items.filter(item => category === 'All' || item.category === category);
  const src = (item: GalleryItem) => item.image || item.imageUrl || '';
  return <div className="nita-page" id="gallery-page">
    <PageBanner title="NITA in photographs" image={pumpkinSeedPowder} alt="Two NITA pumpkin seed powder jars in different sizes" />
    <section className="nita-page-inner nita-gallery-content" aria-label="Photograph collection" aria-busy={loading}>
      <p className="nita-gallery-intro">A closer look at Nita Food Products and photographs from our business.</p>
      <div className="nita-gallery-filters" aria-label="Photograph categories">{categories.map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
      {loading ? <p className="nita-page-state" role="status">Loading photographs...</p> : error ? <div className="nita-page-state" role="alert"><p>{error}</p><button className="nita-contact-action" onClick={() => setAttempt(n => n + 1)}>Try again</button></div> : !filtered.length ? <div className="nita-page-state"><h2>No photographs to display</h2><p>{items.length ? 'Choose another category to see more photographs.' : 'Please check again later.'}</p></div> : <div className="nita-gallery-grid" id="gallery-image-grid">{filtered.map(item => <figure key={item.id} aria-description={item.description || undefined}>
        <button type="button" className="nita-gallery-photo-button" onClick={event => { returnFocus.current = event.currentTarget; setSelected(item); }} aria-label={`Enlarge ${item.title || item.altText || 'NITA photograph'}`}><SafeImage src={src(item)} alt={item.altText || item.title || 'NITA Food Products photograph'} className="nita-gallery-photo" loading="lazy" decoding="async" placeholderText="Photograph unavailable" /></button>
      </figure>)}</div>}
    </section>
    <dialog ref={dialog} className="nita-gallery-dialog" id="lightbox-overlay" aria-label={selected?.title || 'Enlarged NITA photograph'} onClose={() => { setSelected(null); returnFocus.current?.focus({ preventScroll: true }); }} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
      <button type="button" className="nita-gallery-close" onClick={() => setSelected(null)} aria-label="Close photograph">Close</button>
      {selected && <figure><SafeImage src={src(selected)} alt={selected.altText || selected.title || 'NITA Food Products photograph'} className="nita-gallery-enlarged" placeholderText="Photograph unavailable" /></figure>}
    </dialog>
  </div>;
}
