import React from 'react';
import HeroSlider from './HeroSlider';
import { HeroSlide } from '../types';
import { heroSlides } from '../data/heroSlides';

export interface HeroProps {
  slides?: HeroSlide[];
  brandText?: string;
  headline?: string;
  ctaText?: string;
  ctaLink?: string;
  heroImage?: string;
}

/**
 * Homepage Hero Component
 * Renders the full-width, 3-slide dynamic HeroSlider carousel.
 */
export default function Hero({
  slides,
  brandText,
  headline,
  ctaText,
  ctaLink,
  heroImage,
}: HeroProps) {
  // If specific props are provided, apply them to slide 1 for customization
  let resolvedSlides = slides || heroSlides;
  if (brandText || headline || ctaText || ctaLink || heroImage) {
    resolvedSlides = resolvedSlides.map((s, idx) => {
      if (idx === 0) {
        return {
          ...s,
          eyebrow: brandText || s.eyebrow,
          headline: headline || s.headline,
          ctaText: ctaText || s.ctaText,
          ctaLink: ctaLink || s.ctaLink,
          imageUrl: heroImage !== undefined ? heroImage : s.imageUrl,
        };
      }
      return s;
    });
  }

  return <HeroSlider slides={resolvedSlides} />;
}
