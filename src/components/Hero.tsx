import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroTypewriter from './HeroTypewriter';
import pumpkinSeedPowder from '../assets/images/NITA Pumpkin Seed Powder.png';

export interface HeroProps {
  brandText?: string;
  headline?: string;
  ctaText?: string;
  ctaLink?: string;
  heroImage?: string;
}

/** Static homepage photograph with the existing slogan and typewriter behavior. */
export default function Hero({
  brandText = 'NITA FOOD PRODUCTS',
  headline = 'Eat healthy, Feel healthy, Look healthy',
  ctaText = 'Shop Now',
  ctaLink = '/products',
  heroImage = pumpkinSeedPowder,
}: HeroProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(media.matches);
    const onVisibility = () => setHidden(document.hidden);
    media.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { media.removeEventListener('change', onMotion); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  const lines = headline.split(/\n|(?<=,)\s*/).filter(Boolean);
  const approvedSlogan = lines.length === 3 && lines.every((line, i) => line.trim() === ['Eat healthy,', 'Feel healthy,', 'Look healthy'][i]);

  return <section className="nita-hero" id="homepage-hero" aria-label="NITA Food Products">
    <div className="nita-hero-copy">
      <p className="nita-hero-eyebrow">{brandText}</p>
      <h1 className="nita-type-hero" key={headline} aria-label={headline.replace(/\s+/g, ' ').trim()}>
        {lines.map((line, i) => <span className="block" key={i} aria-hidden="true">
          {approvedSlogan && i === 2 ? <HeroTypewriter text="Look healthy" reducedMotion={reducedMotion} active={!hidden} /> : line}
        </span>)}
      </h1>
      <p className="nita-hero-description">Seeds, flours and granola for everyday meals. Discover nutritious foods from NITA Food Products, made in Arusha, Tanzania.</p>
      <div className="nita-hero-actions">
        <Link className="nita-hero-cta" to={ctaLink} id="hero-slide-1-cta">{ctaText}</Link>
        <Link className="nita-hero-story" to="/about/our-story">Our Story <span aria-hidden="true">&rarr;</span></Link>
      </div>
    </div>
    <div className="nita-hero-media"><div className="nita-hero-photos">
      {heroImage && failedSource !== heroImage
        ? <img className="nita-hero-static-photo" src={heroImage} alt="Two NITA pumpkin seed powder jars in different sizes" loading="eager" fetchPriority="high" onError={() => setFailedSource(heroImage)} />
        : <div className="nita-hero-fallback" role="img" aria-label="NITA product photography unavailable" />}
    </div></div>
  </section>;
}
