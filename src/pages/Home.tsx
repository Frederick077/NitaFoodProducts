import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Leaf, 
  Sparkles, 
  UserCheck, 
  ChevronRight
} from 'lucide-react';
import { Product } from '../types';
import { trackPageView } from '../utils';
import SafeImage from '../components/SafeImage';
import ProductCard from '../components/ProductCard';
import OrderModal from '../components/OrderModal';
import Hero from '../components/Hero';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);
  const [factoryImage, setFactoryImage] = useState<string>('');
  const [productionImages, setProductionImages] = useState<any[]>([]);

  useEffect(() => {
    trackPageView('/');
    
    // Fetch products dynamically from backend
    fetch('/api/products?featured=true')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // If fewer than 3 featured, also fetch all and take top items
          if (data.length > 0) {
            setFeaturedProducts(data.slice(0, 4));
          } else {
            fetch('/api/products')
              .then((r) => r.json())
              .then((allData) => {
                if (Array.isArray(allData)) setFeaturedProducts(allData.slice(0, 4));
              });
          }
        }
      })
      .catch((err) => console.error('Error fetching featured products:', err))
      .finally(() => setLoadingProducts(false));

    // Fetch site images for factory and production
    fetch('/api/site-images?section=FACTORY')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFactoryImage(data[0].imageUrl);
        }
      })
      .catch((e) => console.error('Error fetching factory image:', e));

    fetch('/api/site-images?section=PRODUCTION')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProductionImages(data);
        }
      })
      .catch((e) => console.error('Error fetching production images:', e));
  }, []);

  const whyChooseUs = [
    {
      title: 'Quality Ingredients',
      description: 'We source pure, organic seeds and grains directly from trusted local farmers across Tanzania, ensuring optimal nutritional richness.',
      icon: Leaf,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'High Hygiene Standards',
      description: 'Our processing plants maintain state-of-the-art cleanliness. Every batch undergoes meticulous sanitization and strict hands-free packaging.',
      icon: ShieldCheck,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
    },
    {
      title: 'Trusted Products',
      description: 'NITA Food Products is fully TBS (Tanzania Bureau of Standards) certified. Our products are recognized for reliability and absolute health benefit integrity.',
      icon: Sparkles,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Customer Satisfaction',
      description: 'Your health and feedback drive our innovation. We offer rapid customer assistance, tailored pack sizes, and instant direct ordering.',
      icon: UserCheck,
      color: 'bg-red-50 text-red-600 border-red-100',
    },
  ];

  const processTimeline = [
    {
      step: '01',
      title: 'Raw Materials',
      sub: 'From Farmers',
      desc: 'Selected carefully from Tanzanian smallholder agricultural partners.',
    },
    {
      step: '02',
      title: 'Quality Inspection',
      sub: 'Meticulous Testing',
      desc: 'Thorough seed sorting, moisture checking, and quality evaluation.',
    },
    {
      step: '03',
      title: 'Processing',
      sub: 'Pristine De-shelling',
      desc: 'Modern machines hull and process the ingredients at low temperatures.',
    },
    {
      step: '04',
      title: 'Packaging',
      sub: 'Aseptic Sealing',
      desc: 'Pouch filling under hermetic, sterile food-grade protective atmospheres.',
    },
    {
      step: '05',
      title: 'Distribution',
      sub: 'Global Reach',
      desc: 'Quick express supply channels to supermarkets, retailers, and exports.',
    },
  ];

  return (
    <div className="overflow-x-hidden" id="home-page">
      {/* 1. DYNAMIC HOMEPAGE HERO SECTION */}
      <Hero />

      {/* 2. ABOUT PREVIEW SECTION */}
      <section className="py-24 bg-white px-4 md:px-8 relative" id="about-preview">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-emerald-100 rounded-3xl -z-10" />
              <SafeImage
                src={factoryImage}
                alt="NITA Food Standards and Processing"
                placeholderText="NITA Food Facility"
                className="w-full h-[400px] object-cover rounded-3xl shadow-xl border-4 border-white relative z-10"
              />
              <div className="absolute -bottom-6 -right-6 bg-orange-500 text-white p-6 rounded-2xl shadow-lg z-20 hidden sm:block max-w-[200px]">
                <p className="text-2xl font-black">100%</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-100">Natural & Certified Organic</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="text-emerald-700 text-xs font-extrabold uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
              Who We Are
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
              Committed to Tanzanian Food Quality & Health
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              At <strong>NITA FOOD PRODUCTS</strong>, we pride ourselves on being a forward-thinking food manufacturer based in Tanzania. Founded on the principle of <strong>"Eat healthy, Feel healthy, Look healthy"</strong>, we specialize in processing local agricultural raw materials into nutritious consumer food goods including shelled seeds and high-energy granola snack bars. 
            </p>
            <p className="text-gray-600 text-base leading-relaxed">
              Our core approach bridges local farming with absolute state-of-the-art hygiene standards. Every seed and grain is subjected to rigorous quality testing before entering our pristine production environment. We empower your lifestyle with healthy eating options.
            </p>
            
            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-orange-500 font-bold transition-all group"
                id="about-learn-more-btn"
              >
                <span>Learn More About Our Journey</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition duration-150" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SECTION (DYNAMIC SHOPIFY-STYLE GRID) */}
      <section className="py-24 bg-emerald-50/50 border-y border-emerald-100/50 px-4 md:px-8" id="featured-products">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-orange-500 text-xs font-extrabold uppercase tracking-widest bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100 inline-block">
              Highly Recommended
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
              Featured Healthy Products
            </h2>
            <p className="text-gray-500 text-sm">
              Discover our top-selling healthy products formulated from natural ingredients without chemical additives.
            </p>
          </div>

          {/* Dynamic Products Grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-4 border border-gray-100 animate-pulse space-y-4">
                  <div className="h-48 bg-gray-100 rounded-2xl" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">Products are currently loading from the database.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onQuickOrder={(p) => setQuickOrderProduct(p)}
                />
              ))}
            </div>
          )}

          <div className="pt-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow-md shadow-emerald-700/10"
              id="view-all-products-btn"
            >
              <span>Explore Entire Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US SECTION */}
      <section className="py-24 bg-white px-4 md:px-8" id="why-choose-us">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-emerald-700 text-xs font-extrabold uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100 inline-block">
              The NITA Promise
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
              Why Societies Choose NITA Food Products
            </h2>
            <p className="text-gray-500 text-sm">
              We stand apart through our strict commitments to raw material integrity, cleanliness, and human wellness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            {whyChooseUs.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition duration-300 space-y-6"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 text-base font-sans">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PRODUCTION PROCESS TIMELINE */}
      <section className="py-24 bg-emerald-950 text-white px-4 md:px-8 relative overflow-hidden" id="production-process">
        {/* Background decorative graphic */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-900/40 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto text-center space-y-20">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-orange-400 text-xs font-extrabold uppercase tracking-widest bg-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-800 inline-block">
              Visual Timeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans tracking-tight">
              Our Pristine Production Process
            </h2>
            <p className="text-emerald-200/60 text-sm">
              How we transform agricultural harvests into premium, highly hygienic consumer snacks.
            </p>
          </div>

          {/* Timeline representation */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-emerald-800/80 z-0" />

            {processTimeline.map((item, idx) => {
              const matchedImg = productionImages.find(
                (p) => p.position === idx || (p.title && p.title.toLowerCase().includes(item.title.toLowerCase()))
              );
              return (
                <div key={idx} className="space-y-4 relative z-10 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-900 text-orange-400 border-2 border-emerald-800 font-extrabold text-lg flex items-center justify-center shadow-lg hover:border-orange-400 transition-all duration-300">
                    {item.step}
                  </div>
                  
                  {matchedImg && (
                    <div className="w-full h-24 rounded-xl overflow-hidden border border-emerald-800/60 shadow-md">
                      <SafeImage
                        src={matchedImg.imageUrl}
                        alt={matchedImg.altText || item.title}
                        placeholderText={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1 px-2">
                    <h3 className="font-bold text-sm text-white">{item.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider text-orange-400 font-bold block">{item.sub}</span>
                    <p className="text-xs text-emerald-200/60 leading-relaxed pt-2">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="py-24 bg-orange-500 text-white px-4 md:px-8 text-center relative overflow-hidden" id="cta-contact">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-orange-600 rounded-full blur-2xl opacity-50" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-orange-400 rounded-full blur-2xl opacity-50" />

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-sans tracking-tight">
            Looking for premium quality food products?
          </h2>
          <p className="text-base sm:text-lg text-orange-50 max-w-xl mx-auto leading-relaxed">
            Partner with Tanzania’s trusted healthy food processing manufacturer today. We fulfill retail, bulk, and wholesale export orders.
          </p>
          <div className="pt-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 hover:bg-orange-50 font-bold text-base rounded-2xl transition shadow-lg shadow-orange-950/25"
              id="cta-contact-btn"
            >
              <span>Contact NITA Food Products</span>
              <ArrowRight className="w-5 h-5 text-orange-600" />
            </Link>
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
