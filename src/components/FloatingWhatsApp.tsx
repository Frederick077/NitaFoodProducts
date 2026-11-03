import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { getWhatsAppLink } from '../utils';
import { WhatsAppIcon, getOrderWhatsAppHref } from './SocialLinks';
import { Product } from '../types';

interface FloatingWhatsAppProps { currentProduct?: { name: string; size?: string } | null; }
export default function FloatingWhatsApp({ currentProduct }: FloatingWhatsAppProps) {
  const location = useLocation();
  const [detectedProduct, setDetectedProduct] = useState<{ name: string; size?: string } | null>(null);
  const [dock, setDock] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setDetectedProduct(null);
    if (currentProduct) return;
    const match = location.pathname.match(/^\/products\/([^/?#]+)/);
    if (!match) return;
    const controller = new AbortController();
    fetch(`/api/products/${match[1]}`, { signal: controller.signal }).then(res => res.ok ? res.json() : null)
      .then((product: Product | null) => { if (!controller.signal.aborted && product?.name) setDetectedProduct({ name: product.name, size: product.variants?.[0]?.size }); })
      .catch(() => { /* A failed lookup retains the general support message. */ });
    return () => controller.abort();
  }, [location.pathname, currentProduct]);
  useEffect(() => {
    // Dock in a reserved footer row while footer/form content is being read.
    // Keep the control in normal flow there rather than covering mobile fields or links.
    const slot = document.getElementById('nita-whatsapp-dock');
    const targets = ['main-footer', 'nita-contact-form-panel', 'cta-contact', 'product-detail-view', 'checkout-page']
      .map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    // Product information arrives asynchronously; observe its stable main region.
    const main = document.querySelector('main');
    if (location.pathname.startsWith('/products/') && main) targets.push(main);
    let frame = 0;
    const update = () => {
      frame = 0;
      // Do not move a link while someone is using it with the keyboard.
      if (document.activeElement?.id === 'floating-whatsapp-btn') return;
      const control = document.getElementById('floating-whatsapp-btn');
      if (!control) return;
      const style = getComputedStyle(control);
      const right = document.documentElement.clientWidth - (parseFloat(style.right) || 16);
      const bottom = innerHeight - (parseFloat(style.bottom) || 16);
      const wouldCoverControl = [...(main?.querySelectorAll('a,button,input,select,textarea,summary') || [])].some(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.left < right && rect.right > right - 52 && rect.top < bottom && rect.bottom > bottom - 52;
      });
      const contextualContentVisible = targets.some(target => {
        const rect = target.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
      });
      setDock(contextualContentVisible || wouldCoverControl ? slot : null);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(update);
    targets.forEach(target => observer.observe(target));
    const resize = new ResizeObserver(schedule);
    if (main) resize.observe(main);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('focusout', schedule);
    schedule();
    return () => {
      observer.disconnect(); resize.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusout', schedule);
    };
  }, [location.pathname]);
  const active = currentProduct || detectedProduct;
  const footerOrder = !!dock && !active;
  const content = <a href={active ? getWhatsAppLink(active.name, 1, active.size) : footerOrder ? getOrderWhatsAppHref() : getWhatsAppLink()} target="_blank" rel="noopener noreferrer"
    className={`nita-whatsapp${dock ? ' is-docked' : ''}`} aria-label={footerOrder ? "Order directly from NITA Food Products on WhatsApp (opens in a new tab)" : "Chat with NITA Food Products on WhatsApp (opens in a new tab)"} id="floating-whatsapp-btn">
    <WhatsAppIcon />
  </a>;
  return dock ? createPortal(content, dock) : content;
}
