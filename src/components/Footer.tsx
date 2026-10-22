import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Globe, Heart, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900" id="main-footer">
      {/* Decorative top strip */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-orange-400 to-emerald-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Presentation */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2" id="footer-logo">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 text-white font-bold text-xl shadow-lg">
                <span className="text-orange-300">N</span>I
              </div>
              <div>
                <span className="block text-xl font-bold tracking-tight text-white">
                  Nita <span className="text-orange-400">Food</span>
                </span>
                <span className="block text-[10px] tracking-widest text-emerald-300 font-semibold leading-none">
                  Products
                </span>
              </div>
            </Link>
            <p className="text-sm text-emerald-200/80 leading-relaxed font-sans">
              "Eat healthy, Feel healthy, Look healthy"<br />
              We produce and supply premium natural food products across Tanzania and the globe, promoting hygiene and nutritional excellence.
            </p>
            <div className="flex space-x-3">
              <a 
                href="https://instagram.com/nitafoodproducts" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-900/80 hover:bg-orange-500 hover:text-white text-emerald-200 transition-all duration-300 shadow-inner"
                title="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#whatsapp-link" 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-900/80 hover:bg-orange-500 hover:text-white text-emerald-200 transition-all duration-300 shadow-inner"
              >
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-white text-base font-semibold tracking-wide uppercase border-b border-emerald-900 pb-2">
              Quick Navigation
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="text-emerald-200/80 hover:text-orange-400 transition flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-emerald-200/80 hover:text-orange-400 transition flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span>About</span>
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-emerald-200/80 hover:text-orange-400 transition flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span>Products</span>
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-emerald-200/80 hover:text-orange-400 transition flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span>Gallery</span>
                </Link>
              </li>
              <li>
                <Link to="/quality" className="text-emerald-200/80 hover:text-orange-400 transition flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span>Quality Standards</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-emerald-200/80 hover:text-orange-400 transition flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span>Get In Touch</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <h3 className="text-white text-base font-semibold tracking-wide uppercase border-b border-emerald-900 pb-2">
              Contact Info
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span className="text-emerald-200/80 leading-relaxed">
                  P.O. Box 13028,<br />
                  Arusha, Tanzania
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-400 shrink-0" />
                <span className="text-emerald-200/80">+255 757 542 585</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-400 shrink-0" />
                <span className="text-emerald-200/80">nitafoodproducts@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Location & Operating Hours */}
          <div className="space-y-6">
            <h3 className="text-white text-base font-semibold tracking-wide uppercase border-b border-emerald-900 pb-2">
              Operating Hours
            </h3>
            <div className="space-y-4 text-sm bg-emerald-900/30 p-4 rounded-xl border border-emerald-900">
              <div className="flex justify-between">
                <span className="text-emerald-300">Mon - Fri:</span>
                <span className="text-white font-medium">8:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300">Saturday:</span>
                <span className="text-white font-medium">8:00 AM - 3:30 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300">Sunday:</span>
                <span className="text-orange-300 font-semibold">Closed</span>
              </div>
              <p className="text-[11px] text-emerald-300/60 text-center pt-2 border-t border-emerald-900/60">
                Food Safety Certified & TBS Standard Compliant
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="mt-16 pt-8 border-t border-emerald-900 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-4">
          <p>
            &copy; {currentYear} NITA FOOD PRODUCTS. All Rights Reserved.
          </p>
          <p className="flex items-center gap-1">
           
          </p>
        </div>
      </div>
    </footer>
  );
}
