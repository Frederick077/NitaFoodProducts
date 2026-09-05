import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { getWhatsAppLink } from '../utils';
import { Product } from '../types';

interface FloatingWhatsAppProps {
  currentProduct?: {
    name: string;
    size?: string;
  } | null;
}

export default function FloatingWhatsApp({ currentProduct }: FloatingWhatsAppProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [detectedProduct, setDetectedProduct] = useState<{ name: string; size?: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    // If passed directly via prop, use that
    if (currentProduct) {
      setDetectedProduct(currentProduct);
      return;
    }

    // Auto-detect if on a product detail route
    const match = location.pathname.match(/^\/products\/([^/?#]+)/);
    if (match && match[1]) {
      const productId = match[1];
      fetch(`/api/products/${productId}`)
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((prod: Product | null) => {
          if (prod && prod.name) {
            const firstSize = prod.variants?.[0]?.size;
            setDetectedProduct({
              name: prod.name,
              size: firstSize,
            });
          } else {
            setDetectedProduct(null);
          }
        })
        .catch(() => setDetectedProduct(null));
    } else {
      setDetectedProduct(null);
    }
  }, [location.pathname, currentProduct]);

  // Context-aware WhatsApp URL
  const activeProduct = currentProduct || detectedProduct;
  const whatsappUrl = activeProduct
    ? getWhatsAppLink(activeProduct.name, 1, activeProduct.size)
    : getWhatsAppLink();

  // Auto-show tooltip briefly on first load or page navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2500);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [location.pathname]);

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-auto"
      id="floating-whatsapp-container"
    >
      {/* Tooltip / Prompt bubble */}
      {(showTooltip || isHovered) && (
        <div
          className="mb-3 max-w-[240px] bg-white text-gray-800 text-xs py-2.5 px-3.5 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-2 animate-fade-in text-left select-none relative"
          id="whatsapp-tooltip-bubble"
        >
          <div className="flex-1">
            <span className="font-extrabold text-emerald-900 block text-[11px]">Chat with NITA</span>
            <p className="text-[10px] text-gray-600 leading-snug">
              {activeProduct ? `Order ${activeProduct.name}` : 'Order directly or ask questions'}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
              setIsHovered(false);
            }}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
            aria-label="Dismiss chat tooltip"
          >
            <X className="w-3 h-3" />
          </button>
          {/* Arrow pointing down */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-emerald-100 transform rotate-45" />
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-2xl shadow-emerald-950/20 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
        aria-label="Chat with NITA Food Products on WhatsApp"
        id="floating-whatsapp-btn"
      >
        {/* Radar Pulse Effect */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 group-hover:animate-ping" />

        {/* WhatsApp Icon (Official SVG) */}
        <svg
          className="w-7 h-7 fill-current relative z-10"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.507 14.307l-.009.075c-.239.988-1.381 1.77-2.316 1.73-.671-.028-1.536-.341-2.92-1.026-2.28-1.127-3.753-3.468-3.867-3.626-.115-.157-.929-1.238-.929-2.361 0-1.124.586-1.677.794-1.907.208-.23.454-.288.605-.288.152 0 .303.001.436.008.14.008.328-.053.513.391.19.458.648 1.58.705 1.695.057.115.095.25.019.402-.076.153-.114.248-.227.382-.114.134-.239.299-.341.402-.114.114-.233.238-.1.467.133.228.591.975 1.269 1.579.873.777 1.609 1.018 1.837 1.132.228.114.361.095.494-.057.133-.153.57-.665.722-.894.152-.228.304-.19.513-.114.209.076 1.328.627 1.556.741.228.114.38.171.436.266.057.095.057.551-.182 1.539z" />
          <path d="M12.004 0C5.373 0 0 5.373 0 12c0 2.12.552 4.11 1.517 5.84L0 24l6.32-1.488C8.01 23.47 9.957 24 12.004 24c6.627 0 12-5.373 12-12s-5.373-12-12.004-12zm0 22.02c-1.87 0-3.636-.504-5.163-1.385l-.37-.214-3.748.882.905-3.652-.236-.386A9.97 9.97 0 012.004 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10.02-10 10.02z" />
        </svg>

        {/* Live indicator dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full z-20" />
      </a>
    </div>
  );
}
