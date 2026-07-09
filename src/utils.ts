// Tanzanian Shilling Formatter
export function formatTZS(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('TZS', '').trim() + ' TZS';
}

// Track page view in Express analytics backend
export async function trackPageView(path: string) {
  try {
    await fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
  } catch (err) {
    console.warn('Analytics tracking error:', err);
  }
}

// Generate the WhatsApp link for direct ordering
export function getWhatsAppLink(productName: string, quantity: number, size: string) {
  const baseText = `Hello NITA FOOD PRODUCTS, I would like to order your products.`;
  const productDetails = `\n\nOrder Details:\nProduct: ${productName}\nQuantity: ${quantity}\nPack Size: ${size}`;
  const encodedText = encodeURIComponent(baseText + productDetails);
  
  // Tanzanian contact number format - usually starts with +255
  // We can use a standard placeholder or customizable number
  const phoneNumber = "255712345678"; 
  return `https://wa.me/${phoneNumber}?text=${encodedText}`;
}
