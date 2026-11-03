import { NITA_PHONE, NITA_WHATSAPP_NUMBER } from './businessContact';

/**
 * Centralized site configuration and content defaults for NITA FOOD PRODUCTS
 */

export interface NavDropdownItem {
  name: string;
  path: string;
  desc?: string;
  badge?: string;
}

export interface SiteSettings {
  brandName: string;
  brandNameFormatted: {
    first: string;
    highlight: string;
    last: string;
  };
  companyFullName: string;
  slogan: string;
  whatsappNumber: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  hero: {
    enabled: boolean;
    brandText: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaLink: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    heroImage?: string;
  };
  navigation: {
    explore: NavDropdownItem[];
  };
}

export const siteSettings: SiteSettings = {
  brandName: 'NITA FOOD PRODUCTS',
  brandNameFormatted: {
    first: 'NITA',
    highlight: 'FOOD',
    last: 'PRODUCTS',
  },
  companyFullName: 'NITA FOOD PRODUCTS LTD',
  // The official slogan must strictly be: "Eat healthy, Feel healthy, Look healthy"
  slogan: 'Eat healthy, Feel healthy, Look healthy',
  // Centralized WhatsApp contact line (International format without leading plus)
  whatsappNumber: NITA_WHATSAPP_NUMBER,
  contactEmail: 'info@nitafoods.co.tz',
  contactPhone: NITA_PHONE,
  location: 'Dar es Salaam, Tanzania',
  hero: {
    enabled: true,
    brandText: 'NITA FOOD PRODUCTS',
    headline: 'Eat healthy, Feel healthy, Look healthy',
    subheadline:
      'We produce premium quality healthy food products using carefully selected local ingredients while maintaining world-class standards of hygiene, nutrition, and natural freshness.',
    ctaText: 'SHOP NOW',
    ctaLink: '/products',
    secondaryCtaText: 'Contact Us',
    secondaryCtaLink: '/contact',
    heroImage: '',
  },
  navigation: {
    explore: [
      { name: 'Gallery', path: '/gallery', desc: 'Photographic tour of our processes' },
      { name: 'Recipes', path: '/explore/recipes', desc: 'Owner-provided recipes with NITA ingredients' },
      { name: 'FAQs', path: '/explore/faqs', desc: 'Common questions on orders & nutrition' },
      { name: 'Stockists & Retailers', path: '/explore/stockists', desc: 'Where to find NITA products' },
    ],
  },
};
