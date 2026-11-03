import { getProductInformation } from '../productInformation';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { variantLabel } from '../variantLabel';
import { getProductPresentation } from '../productPresentation';
import { trackPageView, formatTZS, getWhatsAppLink } from '../utils';
import SafeImage from '../components/SafeImage';
import ProductCard from '../components/ProductCard';
import { getProductImages } from '../catalog';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartFeedback, setCartFeedback] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setRelated([]); setProduct(null);
    setCartFeedback(''); setQuantity(1); setSelectedImageIndex(0); setSelectedVariantId('');
    trackPageView(`/products/${id}`);
    fetch(`/api/products/${id}`, { signal: controller.signal }).then(async res => {
      if (!res.ok) throw new Error(res.status === 404 ? 'This product could not be found.' : 'This product could not be loaded. Please try again.');
      const data: Product = await res.json();
      if (!data?.id || !data.name) throw new Error('This product could not be loaded. Please try again.');
      if (controller.signal.aborted) return;
      setProduct(data);
      const initial = data.variants?.find(v => v.available && Number.isFinite(v.price) && v.price >= 0) || data.variants?.[0];
      setSelectedVariantId(initial?.id || '');
      // Recommendations may fail independently without hiding the selected product.
      fetch('/api/products', { signal: controller.signal }).then(async r => {
        if (!r.ok) return;
        const all: Product[] = await r.json();
        if (Array.isArray(all) && !controller.signal.aborted) setRelated(all.filter(p => p.id !== data.id && (p.category === data.category || p.isFeatured)).slice(0, 3));
      }).catch(() => {});
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Product unavailable.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, attempt]);
  if (loading) return <div className="nita-page nita-page-inner nita-page-state" role="status"><h1>Product details</h1><p>Loading product...</p></div>;
  if (error || !product) return <div className="nita-page nita-page-inner nita-page-state"><h1>Product unavailable</h1><p role="alert">{error}</p><button className="nita-contact-action" onClick={() => setAttempt(n => n + 1)}>Try again</button><Link className="nita-story-link" to="/products">Return to products</Link></div>;
  // Retain API image order; legacy records may only have the original image field.
  const gallery = getProductImages(product);
  const images = gallery.length ? gallery : [{ id: 'primary', imageUrl: '', altText: product.name, position: 0 }];
  const activeImage = images[selectedImageIndex] || images[0];
  const variants = product.variants || [];
  const active = variants.find(v => v.id === selectedVariantId);
  const presentation = getProductPresentation(active ? { ...product, variants: [active] } : { ...product, variants: [] });
  const price = presentation.price;
  const canOrder = !!active && active.available && Number.isFinite(active.price) && active.price >= 0 && presentation.canQuickOrder;
  const addToCart = () => {
    try { addItem(product, selectedVariantId, quantity); setCartFeedback('Added to cart. Continue shopping or open your cart.'); }
    catch (e) { setCartFeedback((e as Error).message); }
  };
  return <article className="nita-page nita-detail" id="product-detail-view">
    <div className="nita-page-inner">
      <nav className="nita-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/products">Products</Link><span aria-hidden="true">/</span><span aria-current="page">{product.name}</span></nav>
      <div className="nita-detail-layout">
        <div className="nita-detail-gallery">
          <div className="nita-detail-main-photo"><SafeImage key={activeImage.id} src={activeImage.imageUrl} alt={activeImage.altText || product.name} placeholderText="Product photograph unavailable" className="nita-detail-photo" /></div>
          {images.length > 1 && <div className="nita-detail-thumbnails" aria-label="Product photographs">{images.map((image, index) => <button key={image.id} type="button" onClick={() => setSelectedImageIndex(index)} aria-label={`Show photograph ${index + 1} of ${images.length}`} aria-pressed={index === selectedImageIndex}><SafeImage src={image.imageUrl} alt="" className="nita-detail-thumb" placeholderText="No photo" loading="lazy" /></button>)}</div>}
        </div>
        <div className="nita-detail-info">
          <Link to={`/products?categoryId=${encodeURIComponent(product.categoryId)}`} className="nita-detail-category">{product.category}</Link>
          <h1>{product.name}</h1>
          {product.shortDescription && <p>{product.shortDescription}</p>}
          <div className="nita-detail-price" aria-live="polite">{price !== null ? <><strong>{formatTZS(price)}</strong>{presentation.compareAtPrice !== null && <del><span className="sr-only">Previous price </span>{formatTZS(presentation.compareAtPrice)}</del>}</> : <span>Price information unavailable</span>}</div>
          <p className="nita-detail-ordering-note">Orders are requests. NITA will verify availability before confirming.</p>
          {!!variants.length && <fieldset className="nita-detail-variants"><legend>Pack size</legend><div>{variants.map(variant => <button type="button" key={variant.id} disabled={!variant.available || !Number.isFinite(variant.price) || variant.price < 0} aria-pressed={variant.id === selectedVariantId} onClick={() => { setSelectedVariantId(variant.id); setQuantity(1); setCartFeedback(''); }}><span>{variantLabel(variant)}</span><span>{Number.isFinite(variant.price) && variant.price >= 0 ? formatTZS(variant.price) : 'Price unavailable'}</span>{!variant.available && <span>Inactive pack</span>}</button>)}</div></fieldset>}
          {active && <div className="nita-detail-quantity"><span id="detail-quantity-label">Quantity</span><div role="group" aria-labelledby="detail-quantity-label"><button type="button" aria-label="Decrease quantity" disabled={!canOrder || quantity <= 1} onClick={() => setQuantity(n => Math.max(1, n - 1))}>-</button><output aria-live="polite">{quantity}</output><button type="button" aria-label="Increase quantity" disabled={!canOrder || quantity >= 100000} onClick={() => setQuantity(n => Math.min(n + 1, 100000))}>+</button></div>{price !== null && <span>Total: {formatTZS(price * quantity)}</span>}</div>}
          <button type="button" className="nita-contact-action nita-detail-add" disabled={!canOrder} onClick={addToCart}>{canOrder ? 'Add to cart' : 'Ordering unavailable'}</button>
          <p role="status" className="nita-detail-feedback">{cartFeedback}</p>
          <a className="nita-story-link" href={getWhatsAppLink(product.name, quantity, active ? variantLabel(active) : 'Standard')} target="_blank" rel="noopener noreferrer">Order via WhatsApp <span className="sr-only">(opens in a new tab)</span></a>

        </div>
      </div>
      {getProductInformation(product).length > 0 && <div className="nita-product-information-sections" aria-label="Product information">
        {getProductInformation(product).map(section => <section key={section.id} id={`product-${section.id}`} aria-labelledby={`product-${section.id}-heading`}>
          <h2 id={`product-${section.id}-heading`}>{section.title}</h2>
          <div>{section.basis && <p className="nita-nutrition-basis">{section.basis}</p>}<p>{section.text}</p></div>
        </section>)}
      </div>}
      {!!related.length && <section className="nita-detail-related" aria-labelledby="related-title"><div className="nita-related-heading"><h2 id="related-title">More from NITA</h2><Link className="nita-story-link" to="/products">View all products</Link></div><div className="nita-product-grid nita-product-grid--catalog" data-count={related.length}>{related.map(item => <ProductCard key={item.id} product={item} />)}</div></section>}
    </div>
  </article>;
}
