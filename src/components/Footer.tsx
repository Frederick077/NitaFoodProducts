import { Link } from 'react-router-dom';
import { siteSettings } from '../config/siteSettings';
import { InstagramLink } from './SocialLinks';
import { NITA_PHONE, NITA_PHONE_DISPLAY } from '../config/businessContact';

export default function Footer() {
  return <footer className="nita-footer" id="main-footer">
    <div className="nita-footer-inner">
      <div className="nita-footer-grid">
        <div className="nita-footer-brand">
          <Link to="/" id="footer-logo" aria-label="NITA Food Products — home"><img src="/assets/nita-logo-transparent.png" alt="NITA Food Products" width="164" height="72" /></Link>
          <p>{siteSettings.slogan}</p>
          <div className="nita-footer-social"><InstagramLink /></div>
        </div>
        <nav aria-labelledby="footer-quick-links"><h2 id="footer-quick-links">Quick links</h2><ul>
          <li><Link to="/products">Shop</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/explore">Explore</Link></li>
          <li><Link to="/educational-hub">Educational Hub</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul></nav>
        <nav aria-labelledby="footer-explore"><h2 id="footer-explore">Explore</h2><ul>
          {siteSettings.navigation.explore.map(item => <li key={item.path}><Link to={item.path}>{item.name}</Link></li>)}
        </ul></nav>
        <div className="nita-footer-contact"><h2>Contact</h2>
          <address><a href={`tel:${NITA_PHONE}`}>{NITA_PHONE_DISPLAY}</a><a href="mailto:nitafoodproducts@gmail.com">nitafoodproducts@gmail.com</a><p>P.O. Box 13028,<br />Kiserian , Arusha, Tanzania</p></address>
          <div id="nita-whatsapp-dock" aria-label="WhatsApp contact" />
          <dl className="nita-footer-hours"><dt>Mon–Fri</dt><dd>8:00 AM–5:00 PM</dd><dt>Saturday</dt><dd>8:00 AM–3:30 PM</dd><dt>Sunday</dt><dd>Closed</dd></dl>
        </div>
      </div>
      <div className="nita-footer-bottom"><p>© {new Date().getFullYear()} {siteSettings.brandName}. All rights reserved.</p></div>
    </div>
  </footer>;
}
