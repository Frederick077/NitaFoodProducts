import { Instagram } from 'lucide-react';
import { NITA_WHATSAPP_URL } from '../config/businessContact';

// General contact actions share the owner's approved number and exact message.
export function getOrderWhatsAppHref() {
  return NITA_WHATSAPP_URL;
}

/** Authentic WhatsApp glyph already used by the site's floating control. */
export function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d="M12.004 0C5.373 0 0 5.373 0 12c0 2.12.552 4.11 1.517 5.84L0 24l6.32-1.488C8.01 23.47 9.957 24 12.004 24c6.627 0 12-5.373 12-12s-5.373-12-12.004-12zm0 22.02c-1.87 0-3.636-.504-5.163-1.385l-.37-.214-3.748.882.905-3.652-.236-.386A9.97 9.97 0 012.004 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10.02-10 10.02z"/><path d="M17.507 14.307c-.239.988-1.381 1.77-2.316 1.73-.671-.028-1.536-.341-2.92-1.026-2.28-1.127-3.753-3.468-3.867-3.626-.115-.157-.929-1.238-.929-2.361 0-1.124.586-1.677.794-1.907.208-.23.454-.288.605-.288.152 0 .303.001.436.008.14.008.328-.053.513.391.19.458.648 1.58.705 1.695.057.115.095.25.019.402-.076.153-.114.248-.227.382-.114.134-.239.299-.341.402-.114.114-.233.238-.1.467.133.228.591.975 1.269 1.579.873.777 1.609 1.018 1.837 1.132.228.114.361.095.494-.057.133-.153.57-.665.722-.894.152-.228.304-.19.513-.114.209.076 1.328.627 1.556.741.228.114.38.171.436.266.057.095.057.551-.182 1.539z"/></svg>;
}

export function InstagramLink() {
  return <a className="nita-social-icon" href="https://www.instagram.com/nitafoodproducts/" target="_blank" rel="noopener noreferrer" aria-label="Visit NITA Food Products on Instagram (opens in a new tab)"><Instagram size={22} aria-hidden="true" /></a>;
}

export function WhatsAppOrderLink() {
  return <a className="nita-social-icon" href={getOrderWhatsAppHref()} target="_blank" rel="noopener noreferrer" aria-label="Order directly from NITA Food Products on WhatsApp (opens in a new tab)" id="contact-whatsapp"><WhatsAppIcon /></a>;
}
