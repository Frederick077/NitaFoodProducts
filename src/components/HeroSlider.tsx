import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HeroSlide } from '../types';
import { heroSlides } from '../data/heroSlides';
import HeroTypewriter from './HeroTypewriter';

export interface HeroSliderProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number;
  className?: string;
}

export default function HeroSlider({ slides = heroSlides, autoPlayInterval = 5000, className = '' }: HeroSliderProps) {
  const slideList = useMemo(() => {
    const enabled = slides.filter(slide => slide.enabled).sort((a, b) => a.position - b.position);
    return enabled.length ? enabled : heroSlides.filter(slide => slide.enabled);
  }, [slides]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const index = currentIndex % Math.max(slideList.length, 1);
  const active = slideList[index];
  const rotating = slideList.length > 1 && !paused && !hovered && !focused && !hidden && !reducedMotion;
  const move = useCallback((direction: number) => {
    setCurrentIndex(previous => (previous + direction + slideList.length) % Math.max(slideList.length, 1));
  }, [slideList.length]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(media.matches);
    const onVisibility = () => setHidden(document.hidden);
    media.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { media.removeEventListener('change', onMotion); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => move(1), Math.max(1000, autoPlayInterval));
    return () => window.clearTimeout(timer);
  }, [rotating, autoPlayInterval, currentIndex, move]);

  if (!active) return null;
  const headline = active.headline || 'Eat healthy, Feel healthy, Look healthy';
  const lines = headline.split(/\n|(?<=,)\s*/).filter(Boolean);
  const approvedSlogan = lines.length === 3 && lines.every((line, i) => line.trim() === ['Eat healthy,', 'Feel healthy,', 'Look healthy'][i]);

  return (
    <section className={`nita-hero ${className}`} id="homepage-hero-carousel" role="region" aria-roledescription="carousel"
      aria-label="NITA Food Products featured photographs" aria-describedby="hero-motion-help"
      onKeyDown={event => { if (event.key === 'Escape') setPaused(true); }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
      <div className="nita-hero-copy">
        <p className="nita-hero-eyebrow">{active.eyebrow || 'NITA FOOD PRODUCTS'}</p>
        <h1 className="nita-type-hero" key={headline} aria-label={headline.replace(/\s+/g, ' ').trim()}>
          {lines.map((line, i) => <span className="block" key={i} aria-hidden="true">
            {approvedSlogan && i === 2 ? <HeroTypewriter text="Look healthy" reducedMotion={reducedMotion} active={!hidden} /> : line}
          </span>)}
        </h1>
        <p className="nita-hero-description">Seeds, flours and granola for everyday meals. Discover nutritious foods from NITA Food Products, made in Arusha, Tanzania.</p>
        <div className="nita-hero-actions">
          <Link className="nita-hero-cta" to={active.ctaLink || '/products'} id={`hero-slide-${index + 1}-cta`}>
            {active.ctaText || 'Shop Now'}
          </Link>
          <Link className="nita-hero-story" to="/about/our-story">Our Story <span aria-hidden="true">&rarr;</span></Link>
        </div>
        <span className="sr-only" id="hero-motion-help">Photographs rotate automatically unless reduced motion is enabled. Point to this section or focus its link to pause; press Escape while focused here to stop rotation for this visit.</span>
        <span className="sr-only" aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">Photograph {index + 1} of {slideList.length}</span>
      </div>
      <div className="nita-hero-media"><div className="nita-hero-photos">
        {slideList.map((slide, i) => <div key={slide.id} className={`nita-hero-slide ${i === index ? 'is-active' : ''}`} role="group" aria-roledescription="slide"
          aria-label={`${i + 1} of ${slideList.length}`} aria-hidden={i !== index} inert={i !== index}>
          {slide.imageUrl && !failedImages[slide.imageUrl] ? <img src={slide.imageUrl} alt={slide.altText || 'NITA Food Products display'}
            style={{ objectPosition: slide.imagePosition || 'center' }} onError={() => setFailedImages(previous => ({ ...previous, [slide.imageUrl]: true }))}
            loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} /> : <div className="nita-hero-fallback" role="img" aria-label="NITA product photography unavailable" />}
        </div>)}
      </div></div>
    </section>
  );
}
