import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Instagram, MessageSquare, Send, CheckCircle, ShieldCheck } from 'lucide-react';
import { trackPageView } from '../utils';
import SafeImage from '../components/SafeImage';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    trackPageView('/contact');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        console.error('Error sending message to backend database');
      }
    } catch (err) {
      console.error('Contact submit network error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent("Hello NITA FOOD PRODUCTS, I would like to order your products.");
    // Tanzanian business contact WhatsApp line
    const whatsAppNumber = "255712345678";
    window.open(`https://wa.me/${whatsAppNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white min-h-screen" id="contact-page">
      {/* Header section */}
      <section className="relative py-16 bg-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage 
            src="" 
            alt="Customer service" 
            placeholderText="Upload Contact Banner"
            className="w-full h-full object-cover opacity-15 filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 to-emerald-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-orange-400 text-xs font-bold uppercase tracking-widest bg-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-800 inline-block">
            Support center
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans">
            Contact Us
          </h1>
          <p className="text-emerald-200/80 text-sm sm:text-base max-w-xl mx-auto">
            Have questions about wholesale distributions, retail queries, or custom product orders? Drop us a line.
          </p>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column: Information cards & direct WhatsApp */}
          <div className="lg:col-span-5 space-y-8 text-left">
            <div className="space-y-4">
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">
                Corporate contact
              </span>
              <h2 className="text-3xl font-extrabold text-emerald-950 font-sans tracking-tight">
                Get In Touch Today
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Reach out via our official communication channels or send your product request directly to our customer support desk.
              </p>
            </div>

            {/* Structured Card Info */}
            <div className="space-y-4 bg-emerald-50/40 p-6 rounded-3xl border border-emerald-100/30">
              
              {/* Location */}
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm border border-emerald-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Our Location</span>
                  <p className="text-sm font-bold text-gray-900">Dar es Salaam, Tanzania</p>
                  <p className="text-xs text-gray-500">P.O. Box 12345, Sinza Area, Dar es Salaam</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm border border-emerald-100">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Phone Call Hotline</span>
                  <p className="text-sm font-bold text-gray-900">+255 712 345 678</p>
                  <p className="text-xs text-gray-500">Available Mon-Fri, 8:00 AM - 5:00 PM</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm border border-emerald-100">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Email Inquiries</span>
                  <p className="text-sm font-bold text-emerald-800">info@nitafoods.co.tz</p>
                  <p className="text-xs text-gray-500">Write anytime. We respond in 24 hours.</p>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm border border-emerald-100">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Social Network</span>
                  <a 
                    href="https://instagram.com/nitafoodproducts" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm font-bold text-emerald-800 hover:text-orange-500 transition"
                  >
                    @nitafoodproducts
                  </a>
                  <p className="text-xs text-gray-500">Follow for recipes, news and updates.</p>
                </div>
              </div>

            </div>

            {/* Direct WhatsApp Ordering Panel */}
            <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 space-y-4">
              <div className="flex items-center space-x-3 text-orange-800">
                <MessageSquare className="w-6 h-6 text-orange-500 fill-orange-100" />
                <h3 className="font-extrabold text-base font-sans">Express WhatsApp Ordering</h3>
              </div>
              <p className="text-xs text-orange-950/80 leading-relaxed">
                Skip the contact form! Click below to open a pre-formatted direct chat with our sales team for instant seed and snack dispatch arrangements.
              </p>
              <button
                onClick={handleWhatsAppDirect}
                className="w-full flex items-center justify-center space-x-2 px-5 py-3 text-xs font-extrabold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition duration-200 shadow-md shadow-orange-100"
              >
                <span>Order Directly on WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Right Column: Contact form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-left">
              
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-lg text-gray-900 font-sans">
                      Send a Message
                    </h3>
                    <p className="text-xs text-gray-500">
                      Submit your feedback or distribution inquiries below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Amina Juma"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. amina@gmail.com"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +255 712 345 678"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your question or request detail here..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !name || !email || !message}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition shadow-md shadow-emerald-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Sending Message...' : 'Send Message'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-12 text-center space-y-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                    <CheckCircle className="h-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 font-sans">
                      Message Dispatched!
                    </h3>
                    <p className="text-xs text-gray-500 px-6 leading-relaxed">
                      Thank you for contacting NITA Food Products. Your communication has been safely logged in our database system. We will contact you soon.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="px-6 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition"
                  >
                    Send Another Message
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
