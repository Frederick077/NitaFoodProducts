import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Target, Eye, ShieldCheck, Award, Users, Lightbulb, CheckSquare, Factory, Sprout } from 'lucide-react';
import { trackPageView } from '../utils';
import SafeImage from '../components/SafeImage';

export default function About() {
  const location = useLocation();
  const [factoryImage, setFactoryImage] = useState<string>('');
  const [productionImage, setProductionImage] = useState<string>('');

  useEffect(() => {
    trackPageView('/about');
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }

    // Fetch dynamic factory and production site images
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
        if (Array.isArray(data) && data.length > 0) {
          // Use step 2/3 or first production image
          const chosen = data.find((i) => i.position === 1) || data[0];
          setProductionImage(chosen.imageUrl);
        }
      })
      .catch((e) => console.error('Error fetching production image:', e));
  }, [location.hash]);

  const coreValues = [
    {
      title: 'Quality',
      desc: 'We never compromise on nutritional standard, taste, or hygiene. Only premium grades enter our shelves.',
      icon: Award,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Integrity',
      desc: 'Honest farming collaborations, fully authentic labeling, and transparent supply pipelines.',
      icon: ShieldCheck,
      color: 'text-orange-600 bg-orange-50 border-orange-100',
    },
    {
      title: 'Innovation',
      desc: 'Continuously refining de-shelling and aseptic packaging techniques to maximize seed freshness and shelf life.',
      icon: Lightbulb,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Customer Focus',
      desc: 'Structuring customizable package sizes, active direct ordering, and prioritizing client nutritional feedback.',
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Safety',
      desc: 'Stringent sterilization, hands-free packaging chambers, and full health standards compliance.',
      icon: CheckSquare,
      color: 'text-red-600 bg-red-50 border-red-100',
    },
  ];

  return (
    <div className="bg-white min-h-screen" id="about-page">
      {/* Page Header */}
      <section className="relative py-20 bg-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src=""
            alt="Organic food"
            placeholderText="Upload About Banner"
            className="w-full h-full object-cover opacity-15 filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 to-emerald-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-orange-400 text-xs font-bold uppercase tracking-widest bg-emerald-900 px-3 py-1 rounded-full border border-emerald-800 inline-block">
            Corporate Profile
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans">
            About NITA Food Products
          </h1>
          <p className="text-emerald-200/80 text-sm sm:text-base max-w-xl mx-auto">
            Discover the story, principles, and people behind Tanzania’s premium food packaging and processing excellence.
          </p>
        </div>
      </section>

      {/* 1. Our Story Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="story">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="text-emerald-700 text-xs font-extrabold uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
              Our Journey & Roots
            </span>
            <h2 className="text-3xl font-extrabold text-emerald-950 font-sans tracking-tight leading-tight">
              A Passion For Authentic Nutrition & Hygiene Standards
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              NITA Food Products is an innovative agro-processing and food manufacturing enterprise headquartered in Tanzania. Founded on the core philosophy of <strong>"Eat healthy, Feel healthy, Look healthy,"</strong> we produce seed-based nutritious snacks and health bars of international quality.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              We leverage the pristine, rich agricultural landscape of East Africa to secure organic raw pumpkin seeds, sunflower seeds, and whole-grains directly from trained farming communities. By cutting out middle channels, we guarantee that farmers receive equitable pricing, and our clients receive harvest-fresh quality.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Our state-of-the-art facility features automated mechanical hulling, light dry-roasting, and sterile hermetic sealing. We operate under absolute hygiene guidelines to minimize biological contamination, yielding rich products packed with clean energy, fibers, minerals, and healthy fats.
            </p>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -bottom-4 -left-4 w-full h-full bg-orange-100 rounded-3xl -z-10" />
            <SafeImage
              src={factoryImage}
              alt="NITA Food Processing Facility"
              placeholderText="NITA Food Factory Facility"
              className="w-full h-[450px] object-cover rounded-3xl shadow-xl border-4 border-white"
            />
          </div>
        </div>
      </section>

      {/* 2. Mission & Vision Section */}
      <section className="py-20 bg-emerald-50 border-y border-emerald-100/50 px-4 md:px-8" id="mission">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Mission Card */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-emerald-100 shadow-sm space-y-6 flex flex-col items-start text-left hover:shadow-md transition">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-700">
              <Target className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-emerald-950 font-sans tracking-tight">
                Our Corporate Mission
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed italic">
                "Provision of healthy food products to the societies anywhere in the world."
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 w-full text-xs text-gray-500">
              Fulfilling localized nutritional goals through global-standard manufacturing lines.
            </div>
          </div>

          {/* Vision Card */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-emerald-100 shadow-sm space-y-6 flex flex-col items-start text-left hover:shadow-md transition">
            <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">
              <Eye className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-emerald-950 font-sans tracking-tight">
                Our Corporate Vision
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed italic">
                "To reduce malnutrition, diseases and improve livelihoods among people in the societies across the world."
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 w-full text-xs text-gray-500">
              Investing back into farmer welfare, sustainable packaging, and immune health.
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Values Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-16" id="values">
        <div className="max-w-2xl mx-auto space-y-4">
          <span className="text-orange-500 text-xs font-extrabold uppercase tracking-widest bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100 inline-block">
            Our Pillars
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
            NITA'S Immutable Core Values
          </h2>
          <p className="text-gray-500 text-sm">
            These guiding principles form the bedrock of our manufacturing protocols, community relationships, and daily operations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-left">
          {coreValues.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-emerald-100 hover:shadow-sm transition duration-300 space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${val.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base font-sans">{val.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{val.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Production Facility Section */}
      <section className="py-20 bg-slate-50 border-t border-gray-100 px-4 md:px-8" id="production">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <span className="text-emerald-700 text-xs font-extrabold uppercase tracking-widest bg-emerald-100/60 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5" />
              <span>Modern Manufacturing Plant</span>
            </span>
            <h2 className="text-3xl font-extrabold text-emerald-950 font-sans tracking-tight">
              State-of-the-Art Processing Technology
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Our factory operates specialized high-throughput precision sorting, mechanical air-classification, and low-temperature dehydrating equipment that protects vital micronutrients, zinc, and healthy lipids.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-gray-100">
                <span className="text-2xl font-black text-emerald-800">99.8%</span>
                <span className="text-xs text-gray-500 block">Purity Sorting Precision</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100">
                <span className="text-2xl font-black text-orange-500">&lt; 4%</span>
                <span className="text-xs text-gray-500 block">Controlled Moisture Level</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-emerald-950 h-80 flex items-center justify-center">
            <SafeImage
              src={productionImage}
              alt="NITA Production Equipment"
              placeholderText="NITA Food Processing Machinery"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 5. Sustainability Section */}
      <section className="py-20 bg-emerald-900 text-white px-4 md:px-8" id="sustainability">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 px-4 py-1.5 rounded-full border border-emerald-700 text-emerald-200 text-xs font-bold">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>Community & Sustainability</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-sans">
            Empowering Tanzanian Agricultural Communities
          </h2>
          <p className="text-emerald-100/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Every pouch of NITA pumpkin seeds and wholesome snacks directly supports smallholder farmers in rural Tanzania. We provide training on sustainable harvesting, seed conservation, and guaranteed off-take contracts.
          </p>
        </div>
      </section>
    </div>
  );
}
