import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { companySectionForHash } from '../data/companySections';
import { trackPageView } from '../utils';
import productTable from '../assets/hero/hero-1.webp';
import productDisplay from '../assets/images/NITA Pumpkin Seed Powder.png';

function CompanyPhoto({ src, alt, portrait = false, eager = false }: { src?: string; alt: string; portrait?: boolean; eager?: boolean }) {
  const [failedSource, setFailedSource] = useState<string>();
  return <figure className={`company-photo${portrait ? ' company-photo--portrait' : ''}`}>
    {src && failedSource !== src
      ? <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSource(src)} />
      : <div className="company-photo-placeholder" role="img" aria-label={`Photography space reserved for ${alt}`} />}
  </figure>;
}

const values = [
  ['Nutrition & Wellbeing', 'Making nutritious foods and practical nutrition knowledge more accessible.'],
  ['Quality & Care', 'Taking care in ingredient handling, processing and product presentation.'],
  ['Integrity', 'Building trust through clear communication and responsible business practices.'],
  ['Community Empowerment', 'Recognizing the contributions of farmers, women and local communities.'],
  ['Agricultural Value Addition', 'Transforming agricultural ingredients into useful food products.'],
];

const productFamilies = [
  ['Ready-to-Eat Snacks', 'Pumpkin seed granola bars and granola cereals.'],
  ['Nutritional Powders & Flours', 'Pumpkin seed powder, pumpkin flour and butternut flour.'],
  ['Premium Seeds', 'Pumpkin seeds, sunflower seeds, chia seeds, flax seeds, fenugreek seeds and sesame seeds.'],
  ['Specialty Spreads & Oils', 'Pumpkin seed butter and pumpkin seed oil.'],
];

export default function About() {
  const location = useLocation();
  useEffect(() => { trackPageView('/about'); }, []);
  useEffect(() => {
    if (!location.hash) return;
    const section = companySectionForHash(location.hash);
    const timer = window.setTimeout(() => {
      const target = document.getElementById(section);
      if (target) {
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
        target.focus({ preventScroll: true });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.hash]);

  return <div className="nita-page company-page company-page--about" id="about-page">
    <div className="nita-page-inner">
      <section className="company-introduction" id="introduction" aria-labelledby="company-title" tabIndex={-1}>
        <div className="company-prose">
          <p className="company-eyebrow">About NITA Food Products · Arusha, Tanzania</p>
          <h1 id="company-title">Rooted in Arusha. <span>Nourishing Communities.</span></h1>
          <p className="company-welcome">Welcome to NITA Food Products.</p>
          <p>Based in Kiserian, Arusha, Tanzania, we are a women-led food processing and production company.</p>
          <p>We specialize in transforming nutrient-dense seeds, with a particular focus on pumpkin-based ingredients, into convenient foods for everyday use.</p>
          <a className="nita-story-link" href="#story">Read our story <span aria-hidden="true">→</span></a>
        </div>
        <CompanyPhoto src={productTable} alt="NITA chia seed and granola pouches arranged with bowls of ingredients on a table" eager />
      </section>

      <section className="company-purpose" id="mission" aria-label="Our Vision & Mission" tabIndex={-1}>
        <div><p className="company-eyebrow">Our purpose</p><h2>Our Vision</h2><p>To reduce malnutrition, diseases and improve livelihoods among people in the societies across the world.</p></div>
        <div><h2>Our Mission</h2><p>Provision of healthy food products to the societies anywhere in the world.</p></div>
      </section>

      <section className="company-story" id="story" aria-labelledby="company-story-title" tabIndex={-1}>
        <header><p className="company-eyebrow">Our beginnings</p><h2 id="company-story-title">Our Story: Born from a Mother's Experience</h2></header>
        <div className="company-story-body">
          <div className="company-prose">
            <p className="company-story-lead">Nita Food Products was founded by Lilian Mmbando, whose personal journey through motherhood inspired a mission to improve access to nutritious food.</p>
            <p>During her pregnancy, Lilian experienced fainting episodes and anaemia associated with nutritional deficiencies. After giving birth, she faced another challenge: difficulty producing enough breast milk to feed her newborn baby.</p>
            <p>She began incorporating pumpkin seeds into her diet and, through her own experience, noticed an improvement in her breast milk supply. She was able to breastfeed her baby, who went on to grow in good health. This experience inspired her to explore how nutritious foods could support other mothers facing similar challenges.</p>
            <p>In 2019, Nita Food Products began its journey by producing pumpkin seed powder, initially focusing on the nutritional needs of pregnant women and breastfeeding mothers.</p>
            <p>Since then, Nita Food Products has grown beyond its original product, developing a wider range of nutritious foods and extending its reach to more families and communities.</p>
            <p>Today, the company continues to promote healthier food choices through its products and community nutrition education, guided by the same purpose that inspired its beginnings.</p>
          </div>
        </div>
      </section>

      <section className="company-products" id="products" aria-labelledby="company-products-title" tabIndex={-1}>
        <header><p className="company-eyebrow">From agricultural ingredients to everyday foods</p><h2 id="company-products-title">What We Bring to Your Table</h2><p className="company-range-note">An overview of our product families. Visit our Shop for the current product range and pack information.</p></header>
        <div className="company-products-body">
          <CompanyPhoto src={productDisplay} alt="Two NITA pumpkin seed powder jars in different sizes" />
          <div><dl>{productFamilies.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl><Link to="/products" className="nita-story-link">Explore the Shop <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className="company-values" id="values" aria-labelledby="company-values-title" tabIndex={-1}>
        <header><p className="company-eyebrow">Our approach</p><h2 id="company-values-title">What Guides Our Work</h2><p>These are the values that guides our work.</p></header>
        <dl>{values.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl>
      </section>

      <section className="company-quality" id="production" aria-labelledby="company-quality-title" tabIndex={-1}>
        <div className="company-prose"><p className="company-eyebrow">Care at every stage</p><h2 id="company-quality-title">Our Commitment to Quality</h2><p>At NITA Food Products, quality is an important part of how we source, handle, process and present our food products.</p><p>We aim to provide clear product information and maintain responsible food-processing practices.</p><Link className="nita-story-link" to="/contact">Ask about product information <span aria-hidden="true">→</span></Link></div>
        <CompanyPhoto src={productDisplay} alt="Two NITA pumpkin seed powder jars in different sizes" />
      </section>

      <section className="company-community" id="community" aria-labelledby="company-community-title" tabIndex={-1}>
        <div><p className="company-eyebrow">Food, livelihoods & learning</p><h2 id="company-community-title">Empowering Communities Together</h2><div className="company-prose"><p>Nita Food Products connects food processing with agricultural livelihoods and nutrition education.</p><p>The company purchases agricultural ingredients from farmers, creates value through processing and provides employment opportunities within its operations.</p><p>Nita Food Products also participates in community engagement, workshops and exhibitions that help people learn more about food and nutrition.</p></div><Link className="nita-story-link" to="/educational-hub">Discover Nita Nutrition Academy <span aria-hidden="true">→</span></Link></div>
        <CompanyPhoto src="/images/education/IMG-20261027-WA0070.jpg" alt="A speaker addressing adults seated outdoors beside a brick building" portrait />
      </section>

      <section className="company-discover" id="discover" aria-labelledby="company-discover-title" tabIndex={-1}>
        <h2 id="company-discover-title">Discover Nita Food Products</h2>
        <div><Link className="company-cta-primary" to="/products">Explore Our Shop</Link><Link className="company-cta-secondary" to="/contact">Get in Touch with Us</Link></div>
      </section>
    </div>
  </div>;
}
