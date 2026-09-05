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
    aboutUs: NavDropdownItem[];
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
  whatsappNumber: '255712345678',
  contactEmail: 'info@nitafoods.co.tz',
  contactPhone: '+255 712 345 678',
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
    aboutUs: [
      { name: 'Our Story', path: '/about#story', desc: 'The heritage and journey of NITA' },
      { name: 'Mission & Vision', path: '/about#mission', desc: 'Our corporate nutritional goals' },
      { name: 'Our Values', path: '/about#values', desc: 'Quality, integrity, and safety' },
      { name: 'Our Production', path: '/about#production', desc: 'State-of-the-art processing facility' },
      { name: 'Quality Standards', path: '/quality', desc: 'TBS certified hygiene protocols' },
      { name: 'Certifications', path: '/quality#certifications', desc: 'Laboratory tests & regulatory seals' },
      { name: 'Sustainability', path: '/about#sustainability', desc: 'Empowering smallholder farmers' },
    ],
    explore: [
      { name: 'Gallery', path: '/gallery', desc: 'Photographic tour of our processes' },
      { name: 'Recipes', path: '/explore/recipes', desc: 'Nutritious ideas with NITA seeds & snacks' },
      { name: 'News & Updates', path: '/explore/news', desc: 'Latest announcements from our facility' },
      { name: 'FAQs', path: '/explore/faqs', desc: 'Common questions on orders & nutrition' },
      { name: 'Stockists & Retailers', path: '/explore/stockists', desc: 'Where to find NITA products' },
    ],
  },
};
