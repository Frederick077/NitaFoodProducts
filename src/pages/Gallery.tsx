import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Image as ImageIcon, SlidersHorizontal, Maximize2 } from 'lucide-react';
import { GalleryItem } from '../types';
import { trackPageView } from '../utils';
import SafeImage from '../components/SafeImage';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Products' | 'Packaging' | 'Production Process' | 'Company Events' | 'Customers'>('All');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const categories: ('All' | 'Products' | 'Packaging' | 'Production Process' | 'Company Events' | 'Customers')[] = [
    'All',
    'Products',
    'Packaging',
    'Production Process',
    'Company Events',
    'Customers'
  ];

  useEffect(() => {
    trackPageView('/gallery');

    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
        }
      })
      .catch((err) => console.error('Error fetching gallery items:', err))
      .finally(() => setLoading(false));
  }, []);

  // Only show items that have an actual uploaded photo
  const itemsWithImages = items.filter((item) => Boolean(item.image && item.image.trim() !== ''));

  const filteredItems = itemsWithImages.filter((item) => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  return (
    <div className="bg-white min-h-screen" id="gallery-page">
      {/* Hero Header */}
      <section className="relative py-16 bg-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage 
            src="" 
            alt="Corporate meeting events" 
            placeholderText="Upload Gallery Banner"
            className="w-full h-full object-cover opacity-15 filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 to-emerald-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-orange-400 text-xs font-bold uppercase tracking-widest bg-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-800 inline-block">
            NITA Visual Tour
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans">
            Our Gallery
          </h1>
          <p className="text-emerald-200/80 text-sm sm:text-base max-w-xl mx-auto">
            A photographic inside look at our organic materials, processing standard, events, and satisfied customers.
          </p>
        </div>
      </section>

      {/* Main Grid Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Controls */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-50 scale-[1.02]'
                  : 'bg-white text-gray-700 border-gray-100 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading display */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 font-medium">Loading high-resolution visuals...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center bg-gray-50/80 rounded-3xl border border-dashed border-gray-200">
            <ImageIcon className="w-12 h-12 text-emerald-800/30 mx-auto mb-3" />
            <h4 className="text-gray-700 font-bold text-sm">No photos uploaded in this category yet</h4>
            <p className="text-gray-400 font-medium text-xs mt-1">Photos uploaded through the Admin Dashboard will appear here automatically.</p>
          </div>
        ) : (
          /* Bento-grid inspired layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" id="gallery-image-grid">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => item.image && item.image !== '' && setLightboxImage(item.image)}
                className={`group relative h-72 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl bg-gray-100 border border-gray-100/50 transition duration-300 ${item.image && item.image !== '' ? 'cursor-zoom-in' : 'cursor-default'}`}
              >
                <SafeImage
                  src={item.image}
                  alt={`NITA Gallery item - ${item.category}`}
                  placeholderText="Upload Gallery Photo"
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                />
                
                {/* Visual Cover hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-900/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-6 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400">Category</span>
                      <h4 className="text-white font-bold text-sm mt-0.5">{item.category}</h4>
                    </div>
                    <div className="p-2 bg-white/15 rounded-xl text-white backdrop-blur-md">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Always-visible top pill badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-emerald-900 text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm group-hover:opacity-0 transition duration-200">
                  {item.category}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Modal overlay */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" id="lightbox-overlay">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
              title="Close overlay"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl relative">
              <img
                src={lightboxImage}
                alt="Enlarged gallery visual"
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
