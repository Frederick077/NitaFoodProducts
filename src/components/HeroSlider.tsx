import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroSlide } from '../types';
import { heroSlides } from '../data/heroSlides';

export interface HeroSliderProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number; // Exactly 5000 milliseconds
  className?: string;
}

const AUTOPLAY_INTERVAL = 5000;

/**
 * Split headline lines by newlines or commas for high-impact typography
 */
function getHeadlineLines(headline: string): string[] {
  if (!headline) {
    return ['Eat healthy,', 'Feel healthy,', 'Look healthy'];
  }
  if (headline.includes('\n')) {
    return headline
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }
  if (headline.includes(',')) {
    const parts = headline
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.map((part, idx) => (idx < parts.length - 1 ? `${part},` : part));
  }
  return [headline];
}

export default function HeroSlider({
  slides = heroSlides,
  autoPlayInterval = AUTOPLAY_INTERVAL,
  className = '',
}: HeroSliderProps) {
  // Filter only enabled slides and sort by position
  const activeSlides = slides
    .filter((s) => s.enabled)
    .sort((a, b) => a.position - b.position);

  // Fallback to centralized heroSlides if empty
  const slideList = activeSlides.length > 0 ? activeSlides : heroSlides;

  // Slide index state: initial slide 0 displays immediately on load
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Navigation handlers
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slideList.length);
  }, [slideList.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slideList.length) % slideList.length);
  }, [slideList.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Preload slides 2 and 3 so switching does not cause a blank flash
  useEffect(() => {
    if (slideList.length > 1) {
      slideList.slice(1).forEach((slide) => {
        if (slide.imageUrl) {
          const img = new Image();
          img.src = slide.imageUrl;
        }
      });
    }
  }, [slideList]);

  // Auto-play timer management (automatically changes slide every EXACTLY 5000ms)
  useEffect(() => {
    if (slideList.length <= 1) return;

    timerRef.current = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIndex, autoPlayInterval, slideList.length, goToNext]);

  // Image failure handler (falls back to dark green background without hiding text)
  const handleImageError = (idOrIndex: string) => {
    console.warn(`[HeroCarousel] Hero image failed to load for slide: ${idOrIndex}. Falling back to gradient.`);
    setFailedImages((prev) => ({ ...prev, [idOrIndex]: true }));
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  };

  return (
    <section
      className={`relative w-full h-[72vh] sm:h-[76vh] lg:h-[80vh] min-h-[520px] max-h-[850px] overflow-hidden select-none bg-emerald-950 ${className}`}
      id="homepage-hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="NITA Food Products Featured Carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* LAYER 1: Fallback Background (always present at base behind all slides) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#062415] via-[#0b3d22] to-[#041a0e] -z-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* LAYER 2 & 3 & 4: SLIDES (Image, Restrained Readability Overlay, and Text Content) */}
      <div className="absolute inset-0 z-0">
        {slideList.map((slide, index) => {
          const isActive = index === currentIndex;
          const slideKey = slide.id || `slide-${index}`;
          const isImageFailed = failedImages[slideKey];
          const headlineLines = getHeadlineLines(slide.headline);

          return (
            <div
              key={slideKey}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${slideList.length}: ${slide.headline}`}
              aria-hidden={!isActive}
            >
              {/* LAYER 2: Hero Image (Full hero cover, sitting behind overlay and text) */}
              {slide.imageUrl && !isImageFailed ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.headline || 'NITA Food Products'}
                  onError={() => handleImageError(slideKey)}
                  className="absolute inset-0 w-full h-full object-cover object-center z-0"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  referrerPolicy="no-referrer"
                />
              ) : (
                /* Fallback gradient for this slide if image fails or is empty */
                <div className="absolute inset-0 bg-gradient-to-br from-[#062415] via-[#0b3d22] to-[#041a0e] z-0">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px]" />
                </div>
              )}

              {/* LAYER 3: Readability Gradient Overlay (restrained, dark from left and bottom) */}
              <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
              <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {/* LAYER 4: Text and CTA Overlay (Vertical-centered for flawless legibility) */}
              <div className="absolute inset-0 z-20 flex items-center justify-start pointer-events-none">
                <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 lg:px-16 pt-8 pb-16 pointer-events-auto">
                  <div className="max-w-xl text-left space-y-4 sm:space-y-5">
                    {/* Eyebrow: NITA FOOD PRODUCTS */}
                    <div>
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-orange-400 font-sans">
                        {slide.eyebrow || 'NITA FOOD PRODUCTS'}
                      </p>
                    </div>

                    {/* Headline: High-contrast white editorial typography */}
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] font-black tracking-tight text-white font-sans leading-[1.15] drop-shadow-lg"
                      style={{ fontSize: 'clamp(2.1rem, 3.5vw, 3.4rem)' }}
                    >
                      {headlineLines.map((line, lIdx) => (
                        <span key={lIdx} className="block">
                          {line}
                        </span>
                      ))}
                    </h1>

                    {/* CTA Button: NITA Orange Pill */}
                    <div className="pt-2 sm:pt-3">
                      <Link
                        to={slide.ctaLink || '/products'}
                        className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs sm:text-sm font-extrabold uppercase tracking-widest rounded-full transition-all duration-200 shadow-lg shadow-black/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        id={`hero-slide-${index + 1}-cta`}
                      >
                        {slide.ctaText || 'SHOP NOW'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LAYER 5: CONTROLS (Manual Previous & Next Arrows) */}
      {slideList.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/55 active:bg-black/75 text-white/90 hover:text-white backdrop-blur-xs border border-white/15 flex items-center justify-center transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/60 cursor-pointer"
            aria-label="Previous hero slide"
            id="hero-carousel-prev-btn"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/55 active:bg-black/75 text-white/90 hover:text-white backdrop-blur-xs border border-white/15 flex items-center justify-center transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/60 cursor-pointer"
            aria-label="Next hero slide"
            id="hero-carousel-next-btn"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* LAYER 5: CONTROLS (3 Slide Indicators in Lower-Left) */}
      {slideList.length > 1 && (
        <div
          className="absolute bottom-6 sm:bottom-8 left-6 sm:left-12 lg:left-16 z-30 flex items-center space-x-2.5"
          role="tablist"
          aria-label="Slide navigation dots"
          id="hero-carousel-indicators"
        >
          {slideList.map((_, dotIdx) => {
            const isCurrent = dotIdx === currentIndex;
            return (
              <button
                key={dotIdx}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`Go to slide ${dotIdx + 1}`}
                onClick={() => goToSlide(dotIdx)}
                className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/60 cursor-pointer ${
                  isCurrent
                    ? 'w-8 sm:w-10 bg-orange-500 shadow-sm'
                    : 'w-2.5 bg-white/40 hover:bg-white/75'
                }`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
