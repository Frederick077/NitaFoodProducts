import { siteSettings } from './config/siteSettings';
import { NITA_WHATSAPP_URL } from './config/businessContact';

// Tanzanian Shilling Formatter
export function formatTZS(amount: number): string {
  return (
    new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .trim() + ' TZS'
  );
}

// Track page view in Express analytics backend
export async function trackPageView(path: string) {
  try {
    await fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
  } catch (err) {
    console.warn('Analytics tracking error:', err);
  }
}

// Generate context-aware or general WhatsApp link
export function getWhatsAppLink(productName?: string, quantity?: number, size?: string): string {
  const phoneNumber = siteSettings.whatsappNumber;

  if (productName) {
    let msg = `Hello NITA FOOD PRODUCTS,\n\nI am interested in ${productName}.`;
    if (size && size !== 'Standard') {
      msg += `\nSize: ${size}`;
    }
    if (quantity && quantity > 1) {
      msg += `\nQuantity: ${quantity}`;
    }
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`;
  }

  return NITA_WHATSAPP_URL;
}

// Helper for slugifying category names for clean URLs
export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
