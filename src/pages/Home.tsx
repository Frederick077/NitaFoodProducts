import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product, SiteImage } from '../types';
import packagedProducts from '../assets/hero/hero-2.webp';
import pumpkinSeedPowder from '../assets/images/NITA Pumpkin Seed Powder.png';
import nitaFlour from '../assets/images/NITA Flour.png';
import { trackPageView } from '../utils';
import SafeImage from '../components/SafeImage';
import ProductCard from '../components/ProductCard';
import OrderModal from '../components/OrderModal';
import Hero from '../components/Hero';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState(false);
  const [productRequest, setProductRequest] = useState(0);
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);
  const [factoryImage, setFactoryImage] = useState<SiteImage | null>(null);
  const [productionImages, setProductionImages] = useState<SiteImage[]>([]);

  useEffect(() => {
    trackPageView('/');

    // Fetch site images for factory and production
    fetch('/api/site-images?section=FACTORY')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFactoryImage(data.filter((image: SiteImage) => image?.imageUrl && image.enabled !== false).sort((a: SiteImage, b: SiteImage) => a.position - b.position)[0] || null);
        }
      })
      .catch((e) => console.error('Error fetching factory image:', e));

    fetch('/api/site-images?section=PRODUCTION')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProductionImages(data.filter((image: SiteImage) => image?.imageUrl && image.enabled !== false).sort((a, b) => a.position - b.position));
        }
      })
      .catch((e) => console.error('Error fetching production images:', e));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductError(false);
      try {
        const readProducts = async (url: string): Promise<Product[]> => {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error('Products unavailable');
          const data: unknown = await response.json();
          if (!Array.isArray(data)) throw new Error('Invalid product response');
          return data;
        };
        const featured = await readProducts('/api/products?featured=true');
        const products = featured.length ? featured : await readProducts('/api/products');
        if (!controller.signal.aborted) setFeaturedProducts(products.slice(0, 4));
      } catch {
        if (!controller.signal.aborted) setProductError(true);
      } finally {
        if (!controller.signal.aborted) setLoadingProducts(false);
      }
    };
    void loadProducts();
    return () => controller.abort();
  }, [productRequest]);

  const aboutImageAlt = factoryImage?.altText && !/^(NITA Food Facility|NITA Food Standards and Processing)$/i.test(factoryImage.altText.trim())
    ? factoryImage.altTex
    : 'NITA branded product packaging';

  return (
    <div className="overflow-x-hidden" id="home-page">
      {/* 1. DYNAMIC HOMEPAGE HERO SECTION */}
      <Hero />

      {/* 2. ABOUT NITA: image-led narrative, informed by the reference About page. */}
      <section className="nita-editorial nita-about-story" id="about-preview" aria-labelledby="about-preview-title">
        <div className="nita-editorial-inner nita-home-about-row">
          <figure className="nita-story-figure">
            <SafeImage src={factoryImage?.imageUrl || packagedProducts} alt={aboutImageAlt}
              placeholderText="NITA product photograph unavailable" className="nita-story-photo nita-about-photo" loading="lazy" decoding="async" />
          </figure>
          <div className="nita-editorial-copy">
            <h2 id="about-preview-title">Food products, made in Tanzania.</h2>
            <p>In Tanzania today, millions of families quietly struggle with hidden nutritional deficiencies, leaving children vulnerable to stunted growth and low energy. At Nita Food Products, we believe the solution lies in nature’s smallest powerhouses.</p>
            <p>From our facility in Arusha, we carefully clean, peel, and process nutrient-dense seeds to extract their maximum life-giving benefits. We do not just make snacks, we build daily defense systems for your body, helping you combat malnutrition, protect your heart, and fuel active lifestyles.</p>
            <Link to="/about" className="nita-story-link" id="about-learn-more-btn">About NITA</Link>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT SHOWCASE */}
      <section className="nita-product-showcase" id="featured-products" aria-labelledby="featured-products-title">
        <div className="nita-showcase-inner">
          <div className="nita-showcase-heading">
            <h2 id="featured-products-title">Our Products</h2>
            <Link to="/products" id="view-all-products-btn">View all products</Link>
          </div>
          <div aria-busy={loadingProducts}>
            {loadingProducts ? (
              <div className="nita-showcase-loading" role="status">
                <span>Loading products...</span>
                <div className="nita-showcase-skeletons" aria-hidden="true"><div /><div /></div>
              </div>
            ) : productError ? (
              <div className="nita-showcase-state" role="alert">
                <p>We couldn't load the products. Please try again.</p>
                <button type="button" className="nita-product-action" onClick={() => setProductRequest(value => value + 1)}>Try again</button>
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="nita-showcase-state" role="status">
                <p>No products are available to display right now.</p>
                <Link to="/contact">Contact NITA about products</Link>
              </div>
            ) : (
              <div className="nita-product-grid" data-count={featuredProducts.length}>
                {featuredProducts.map(product => <ProductCard key={product.id} product={product}
                  onQuickOrder={setQuickOrderProduct} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. QUALITY: explanatory prose, with no unverified certification badges. */}
      <section className="nita-editorial nita-quality-story" id="why-choose-us" aria-labelledby="quality-preview-title">
        <div className="nita-editorial-inner nita-quality-layout">
          <h2 id="quality-preview-title">Quality information</h2>
          <div className="nita-quality-copy">
            <p>Check the ingredients and pack sizes before ordering. Product details are a starting point for choosing from the NITA range.</p>
            <p>For questions about processing, handling or packaging, contact NITA. We can discuss the information you need about a particular product.</p>
            <div className="nita-story-links">
              <Link to="/about#production" className="nita-story-link">Read about quality</Link>
              <Link to="/contact" className="nita-story-link">Ask a product question</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRODUCTION: a separate, full-width media-and-text story. */}
      <section className="nita-production-story" id="production-process" aria-labelledby="production-preview-title">
        <div className="nita-production-panel">
          <div className="nita-editorial-copy nita-production-copy">
            <h2 id="production-preview-title">Processing and packaging.</h2>
            <p>Our work brings ingredients into the packaged foods in the NITA range, from seeds and cereals to granola products.</p>
            <p>Find out more about our business, or speak with us about how a particular product is prepared, packed and supplied.</p>
            <Link to="/about#production" className="nita-story-link">About our production</Link>
          </div>
          <figure className="nita-production-figure">
            <SafeImage src={nitaFlour}
              alt="Front and back of NITA flour pouches"
              placeholderText="NITA photograph unavailable" className="nita-story-photo" style={{ objectFit: 'contain', objectPosition: 'center', backgroundColor: '#fff' }} loading="lazy" decoding="async" />
          </figure>
        </div>
        {productionImages.length > 1 && <div className="nita-editorial-inner nita-production-gallery" aria-label="More NITA photographs">
          {productionImages.slice(1, 5).map(image => <figure key={image.id}>
            <SafeImage src={image.imageUrl} alt={image.altText || image.title || 'NITA Food Products'}
              placeholderText="NITA photograph unavailable" className="nita-story-photo" loading="lazy" decoding="async" />

          </figure>)}
        </div>}
      </section>

      {/* 6. Contact: adapt the reference newsletter's image/copy composition. */}
      <section className="nita-closing" id="cta-contact" aria-labelledby="closing-title">
        <div className="nita-closing-panel">
          <SafeImage src={pumpkinSeedPowder} alt="Two NITA pumpkin seed powder jars in different sizes" className="nita-closing-photo" style={{ objectFit: 'contain', backgroundColor: '#fff' }} loading="lazy" decoding="async" />
          <div className="nita-closing-copy">
            <h2 id="closing-title">Questions about our products?</h2>
            <p>Ask us about the NITA range, pack sizes or an order. Tell us which products you are interested in so we can help with your enquiry.</p>
            <Link to="/contact" className="nita-contact-action" id="cta-contact-btn">Contact NITA Food Products</Link>
          </div>
        </div>
      </section>

      {/* Quick Order Modal */}
      {quickOrderProduct && (
        <OrderModal
          product={quickOrderProduct}
          onClose={() => setQuickOrderProduct(null)}
        />
      )}
    </div>
  );
}
