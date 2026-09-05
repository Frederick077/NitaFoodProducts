import { siteSettings } from './config/siteSettings';

// Tanzanian Shilling Formatter
export function formatTZS(amount: number): string {
  return (
    new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace('TZS', '')
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

  // General default message
  const defaultMsg = `Hello NITA FOOD PRODUCTS, I would like to know more about your products.`;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMsg)}`;
}

// Helper for slugifying category names for clean URLs
export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
