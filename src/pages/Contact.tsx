import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { academyEnquiries } from '../data/educationalHub';
import { trackPageView } from '../utils';
import { Mail, Phone, MapPin } from 'lucide-react';
import { InstagramLink, WhatsAppOrderLink } from '../components/SocialLinks';
import { NITA_PHONE, NITA_PHONE_DISPLAY } from '../config/businessContact';
import SafeImage from '../components/SafeImage';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const requestedSubject = searchParams.get('subject') || '';
  const approvedSubject = Object.values(academyEnquiries).find(value => value === requestedSubject) || '';
  const [subject, setSubject] = useState<string>(approvedSubject);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { trackPageView('/contact'); }, []);
  useEffect(() => {
    if (!approvedSubject) return;
    setSubject(approvedSubject);
    if (window.location.hash !== '#nita-contact-form-panel') return;
    const frame = requestAnimationFrame(() => {
      document.getElementById('nita-contact-form-panel')?.scrollIntoView({ block: 'start' });
      document.getElementById('contact-subject')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [approvedSubject]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message || isSubmitting) return;
    setIsSubmitting(true); setError('');
    try {
      const response = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, message, ...(subject ? { subject } : {}) }) });
      if (response.ok) { setIsSuccess(true); setName(''); setEmail(''); setPhone(''); setMessage(''); setSubject(''); }
      else setError('Your message could not be sent. Please try again or contact us by phone or email.');
    } catch { setError('Your message could not be sent. Please check your connection and try again.'); }
    finally { setIsSubmitting(false); }
  };
  return (
    <div className="nita-contact-page" id="contact-page">
      <section className="nita-contact-banner" aria-labelledby="contact-title">
        <SafeImage src="/images/headers/contact-phone-notepad-communication.jpg" alt="A smartphone with a blank screen beside a pen on an open notebook" className="nita-contact-banner-photo" />
        <h1 id="contact-title">Say Hello!</h1>
      </section>
      <section className="nita-contact-layout" aria-label="Contact details and enquiry form">
        <div className="nita-contact-details">
          <h2>Get in touch</h2>
          <p>For product questions, order enquiries or feedback, use the contact details below or send us a message.</p>
          <address>
            <a className="nita-contact-method" href="mailto:nitafoodproducts@gmail.com"><Mail size={20} aria-hidden="true" /><span>nitafoodproducts@gmail.com</span></a>
            <a className="nita-contact-method" href={`tel:${NITA_PHONE}`}><Phone size={20} aria-hidden="true" /><span>{NITA_PHONE_DISPLAY}</span></a>
            <p className="nita-contact-method"><MapPin size={20} aria-hidden="true" /><span>P.O. Box 13028,<br />Kiserian, Arusha, Tanzania</span></p>
          </address>
          <p className="nita-contact-hours">Mon–Fri, 8:00 AM–5:00 PM</p>
          <div className="nita-contact-social" aria-label="Social media and WhatsApp orders"><InstagramLink /><WhatsAppOrderLink /></div>
        </div>
        <div className="nita-contact-form-panel" id="nita-contact-form-panel">
          {!isSuccess ? <form onSubmit={handleSubmit} aria-labelledby="message-title" aria-busy={isSubmitting}>
            <h2 id="message-title">Send a message</h2><p id="contact-required">Fields marked * are required.</p>
            <div className="nita-contact-field-pair">
              <div><label htmlFor="contact-name">Full name *</label><input id="contact-name" name="name" type="text" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} /></div>
              <div><label htmlFor="contact-email">Email address *</label><input id="contact-email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
            </div>
            <div><label htmlFor="contact-phone">Phone number (optional)</label><input id="contact-phone" name="phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><label htmlFor="contact-subject">Subject (optional)</label><input id="contact-subject" name="subject" type="text" maxLength={160} value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div><label htmlFor="contact-message">Message *</label><textarea id="contact-message" name="message" required rows={5} value={message} onChange={e => setMessage(e.target.value)} /></div>
            {error && <p role="alert" className="nita-contact-error">{error}</p>}
            <button type="submit" className="nita-contact-action" disabled={isSubmitting || !name || !email || !message}>{isSubmitting ? 'Sending message…' : 'Send message'}</button>
          </form> : <div className="nita-contact-success" role="status"><h2>Message received</h2><p>Thank you for contacting NITA Food Products.</p><button type="button" className="nita-contact-action" onClick={() => setIsSuccess(false)}>Send another message</button></div>}
        </div>
      </section>
    </div>
  );
}
