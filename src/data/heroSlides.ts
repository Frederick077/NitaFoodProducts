import hero1 from '../assets/hero/hero-1.webp';
import hero2 from '../assets/hero/hero-2.webp';
import hero3 from '../assets/hero/hero-3.webp';
import { HeroSlide } from '../types';

/**
 * Centralized Hero Slides Configuration for NITA FOOD PRODUCTS Homepage Carousel
 *
 * Developer / Manual Asset Management:
 * To insert your three real NITA hero photographs, place the files at:
 *   1. src/assets/hero/hero-1.webp
 *   2. src/assets/hero/hero-2.webp
 *   3. src/assets/hero/hero-3.webp
 */
export const heroSlides: HeroSlide[] = [
  {
    id: 'slide-1',
    imageUrl: hero1,
    eyebrow: 'NITA FOOD PRODUCTS',
    headline: 'Eat healthy, Feel healthy, Look healthy',
    ctaText: 'SHOP NOW',
    ctaLink: '/products',
    enabled: true,
    position: 1,
  },
  {
    id: 'slide-2',
    imageUrl: hero2,
    eyebrow: 'NITA FOOD PRODUCTS',
    headline: 'Eat healthy, Feel healthy, Look healthy',
    ctaText: 'SHOP NOW',
    ctaLink: '/products',
    enabled: true,
    position: 2,
  },
  {
    id: 'slide-3',
    imageUrl: hero3,
    eyebrow: 'NITA FOOD PRODUCTS',
    headline: 'Eat healthy, Feel healthy, Look healthy',
    ctaText: 'SHOP NOW',
    ctaLink: '/products',
    enabled: true,
    position: 3,
  },
];

export default heroSlides;
