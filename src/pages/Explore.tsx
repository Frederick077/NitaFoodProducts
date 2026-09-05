import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  MapPin, 
  Bell, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight,
  Utensils,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { trackPageView, getWhatsAppLink } from '../utils';
import SafeImage from '../components/SafeImage';

type ExploreTab = 'recipes' | 'news' | 'faqs' | 'stockists';

export default function Explore() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ExploreTab>('recipes');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    trackPageView(location.pathname);
    if (location.pathname.includes('recipes')) setActiveTab('recipes');
    else if (location.pathname.includes('news')) setActiveTab('news');
    else if (location.pathname.includes('faqs')) setActiveTab('faqs');
    else if (location.pathname.includes('stockists')) setActiveTab('stockists');
  }, [location.pathname]);

  const recipes = [
    {
      title: 'Power-Packed Pumpkin Seed Energy Smoothie Bowl',
      prepTime: '10 Mins',
      servings: '2 Servings',
      difficulty: 'Easy',
      desc: 'A superfood breakfast bowl blending frozen bananas, fresh East African mango, and generous roasted NITA pumpkin seeds.',
      ingredients: [
        '3 tablespoons NITA peeled pumpkin seeds',
        '2 ripe bananas (frozen)',
        '1 cup unsweetened almond or fresh milk',
        '1 tablespoon raw honey',
        'Toppings: Fresh berries, chia seeds, sliced kiwi'
      ],
      instructions: [
        'Add frozen bananas, milk, and half of the NITA pumpkin seeds to a high-speed blender.',
        'Blend until smooth and velvety.',
        'Pour into bowls and top with remaining crunchy pumpkin seeds and fresh fruit.'
      ]
    },
    {
      title: 'Crunchy NITA Granola Parfait with Natural Yoghurt',
      prepTime: '5 Mins',
      servings: '1 Serving',
      difficulty: 'Super Easy',
      desc: 'Layered probiotic Greek yoghurt with crisp NITA honey granola clusters and a drizzle of organic passionfruit puree.',
      ingredients: [
        '1/2 cup NITA Granola Snack Bar (crumbled)',
        '1 cup natural Greek yoghurt',
        '2 tbsp tropical passionfruit pulp',
        '1 tsp roasted sunflower seeds'
      ],
      instructions: [
        'In a tall glass, spoon in 3 tablespoons of Greek yoghurt.',
        'Add a layer of crumbled NITA granola.',
        'Repeat layers and top with passionfruit pulp and sunflower seeds.'
      ]
    },
    {
      title: 'Zesty Herb-Roasted Savory Pumpkin Seed Salad Topper',
      prepTime: '12 Mins',
      servings: '4 Servings',
      difficulty: 'Easy',
      desc: 'Elevate your daily green salads with garlic, paprika, and sea salt toasted NITA pumpkin seeds.',
      ingredients: [
        '1 cup NITA organic raw pumpkin seeds',
        '1 tbsp cold-pressed olive oil',
        '1/2 tsp smoked paprika',
        '1/4 tsp garlic powder & pinch of sea salt'
      ],
      instructions: [
        'Heat a skillet over medium-low heat.',
        'Toss NITA pumpkin seeds in olive oil, paprika, garlic powder, and salt.',
        'Dry roast for 4–5 minutes until fragrant and lightly puffed.',
        'Cool and sprinkle over garden salads.'
      ]
    }
  ];

  const newsItems = [
    {
      date: 'August 2026',
      title: 'TBS Recertification Completed with Distinction',
      category: 'Quality Milestone',
      desc: 'NITA Food Products has successfully completed our annual Tanzania Bureau of Standards (TBS) hygiene assessment with 100% compliance across aseptic packaging chambers.'
    },
    {
      date: 'July 2026',
      title: 'Expanded Direct Partnerships with Southern Tanzania Farmers',
      category: 'Community & Farming',
      desc: 'We are thrilled to onboard 45 additional smallholder farming families in Ruvuma and Iringa, guaranteeing fair harvest pricing and sustainable agro-processing practices.'
    },
    {
      date: 'June 2026',
      title: 'New Eco-Friendly Hermetic Pouch Packaging Deployed',
      category: 'Innovation',
      desc: 'Our latest food-grade multilayer pouches reduce plastic usage while extending seed crispness and nutrient preservation for up to 18 months.'
    }
  ];

  const faqs = [
    {
      q: 'Where does NITA Food Products source its raw materials?',
      a: 'We source 100% of our pumpkin seeds, sunflower seeds, and whole-grains directly from vetted smallholder farmers across Tanzania. We test every single batch for purity, lack of pesticides, and moisture content before processing.'
    },
    {
      q: 'Are NITA products TBS certified?',
      a: 'Yes, absolutely. NITA Food Products Ltd is officially certified by the Tanzania Bureau of Standards (TBS). Our manufacturing facility complies strictly with East African hygiene and aseptic food packaging mandates.'
    },
    {
      q: 'How can I place an order for retail or wholesale?',
      a: 'You can order online directly through this website by clicking "Order Product Now", or chat instantly with our sales representative on WhatsApp using the button on the right. We deliver within Dar es Salaam and arrange express courier dispatch nationwide.'
    },
    {
      q: 'What is the shelf life of NITA packaged seeds and snacks?',
      a: 'Thanks to our airtight hermetic sealing and gentle dry-roasting techniques that remove ambient moisture below 4%, our products maintain peak crispness and nutrient integrity for 12 to 18 months in unopened pouches.'
    },
    {
      q: 'Do you offer custom package sizes or corporate gifts?',
      a: 'Yes! We offer standard 250g, 500g, 1kg retail packs as well as customized wholesale bulk bags and branded corporate health gift hampers for events and wellness programs.'
    }
  ];

  const stockists = [
    {
      region: 'Dar es Salaam (Kinondoni)',
      store: 'Sinza Healthy Food Mart & Supermarkets',
      address: 'Sinza Mori Road, Near Kijiweni, Dar es Salaam',
      phone: '+255 712 345 678'
    },
    {
      region: 'Dar es Salaam (Ilala)',
      store: 'City Centre Organic & Health Hub',
      address: 'Samora Avenue, Central Plaza Ground Floor',
      phone: '+255 712 345 678'
    },
    {
      region: 'Dar es Salaam (Mikocheni & Masaki)',
      store: 'Peninsula Gourmet & Fresh Greens',
      address: 'Haile Selassie Road, Masaki',
      phone: '+255 712 345 678'
    },
    {
      region: 'Arusha & Northern Zone',
      store: 'Kilimanjaro Nutrition & Agro Depot',
      address: 'Sokoine Road, Arusha City',
      phone: '+255 712 345 678'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-left" id="explore-hub-page">
      {/* Header Banner */}
      <section className="relative py-16 sm:py-20 bg-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src=""
            alt="Explore NITA Food Products"
            placeholderText="NITA Explore Banner"
            className="w-full h-full object-cover opacity-15 filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/75 to-emerald-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-orange-400 text-xs font-black uppercase tracking-widest bg-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-800 inline-block">
            NITA Explore
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-sans">
            Recipes, News & Information
          </h1>
          <p className="text-emerald-200/80 text-sm sm:text-base max-w-xl mx-auto">
            Discover wholesome ways to enjoy our nutritional food products, keep updated with company news, and find local retail points.
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-white p-2 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-lg flex items-center justify-start sm:justify-center overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'recipes'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Healthy Recipes</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'news'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>News & Updates</span>
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'faqs'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQs</span>
          </button>

          <button
            onClick={() => setActiveTab('stockists')}
            className={`px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stockists'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Find Stockists</span>
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* 1. RECIPES TAB */}
        {activeTab === 'recipes' && (
          <div className="space-y-8" id="recipes-section">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-sans">
                Delicious Ways to Enjoy NITA Products
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Nutrient-dense, quick, and easy ideas curated by our food nutrition specialists.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              {recipes.map((r, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:shadow-md hover:border-emerald-100 transition duration-300"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> {r.prepTime}
                      </span>
                      <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full">
                        {r.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-emerald-950 font-sans leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{r.desc}</p>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                        Ingredients:
                      </h4>
                      <ul className="space-y-1.5 text-xs text-gray-600">
                        {r.ingredients.map((ing, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                            <span>{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                        Quick Preparation:
                      </h4>
                      <ol className="space-y-1.5 text-xs text-gray-600 list-decimal list-inside">
                        {r.instructions.map((step, sIdx) => (
                          <li key={sIdx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition"
                  >
                    <span>Shop Ingredients For This Recipe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. NEWS TAB */}
        {activeTab === 'news' && (
          <div className="space-y-8" id="news-section">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-sans">
                Latest Announcements & Factory Milestones
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Direct dispatches on our agro-partnerships, hygiene innovations, and product launches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {newsItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-orange-500 font-extrabold bg-orange-50 px-2.5 py-1 rounded-full uppercase">
                      {item.category}
                    </span>
                    <span className="text-gray-400 font-medium">{item.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-emerald-950 font-sans">{item.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. FAQS TAB */}
        {activeTab === 'faqs' && (
          <div className="max-w-3xl mx-auto space-y-8" id="faqs-section">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-sans">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Answers to common inquiries regarding our ingredients, certifications, and ordering.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-6 py-4.5 flex items-center justify-between text-left gap-4 hover:bg-gray-50/50 transition"
                    >
                      <span className="text-sm font-bold text-emerald-950 font-sans">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'transform rotate-180 text-emerald-700' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Need More Assistance Banner */}
            <div className="bg-emerald-900 text-white p-6 sm:p-8 rounded-3xl text-center space-y-4 mt-8">
              <h3 className="text-lg font-bold font-sans">Have a specific question not listed here?</h3>
              <p className="text-xs text-emerald-200/80 max-w-md mx-auto">
                Our customer assistance team is available daily on WhatsApp and phone hotline to assist you.
              </p>
              <div className="pt-2">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-md shadow-orange-950/20"
                >
                  <span>Chat With Us on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 4. STOCKISTS TAB */}
        {activeTab === 'stockists' && (
          <div className="space-y-8" id="stockists-section">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-sans">
                Where to Find NITA Food Products
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Authorized supermarkets, organic grocers, and distributors across Tanzania.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
              {stockists.map((st, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-500 block">
                      {st.region}
                    </span>
                    <h3 className="text-sm font-bold text-emerald-950 font-sans">{st.store}</h3>
                    <p className="text-xs text-gray-500">{st.address}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 text-xs font-semibold text-emerald-800">
                    {st.phone}
                  </div>
                </div>
              ))}
            </div>

            {/* Wholesale distribution notice */}
            <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 text-center space-y-3">
              <h3 className="text-base font-bold text-emerald-950 font-sans">
                Interested in stocking NITA products at your supermarket or pharmacy?
              </h3>
              <p className="text-xs text-emerald-800/80 max-w-xl mx-auto">
                We supply retailers with wholesale bulk pricing, retail display racks, and marketing support. Contact our sales department today.
              </p>
              <div className="pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition"
                >
                  <span>Inquire for Retail Distribution</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
