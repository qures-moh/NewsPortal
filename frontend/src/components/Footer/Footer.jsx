import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { useSettings } from "../../context/SettingsContext";
import api from "../../api/api";
import { getImageUrl } from "../../utils/imageUrl";
import { getLocalizedValue } from "../../utils/newsHelpers";
import { SocialIcon } from "../common/SocialIcons";
import "./Footer.css";

const Footer = () => {
  const { language } = useLanguage();
  const { settings, branding, contact, socialLinks, socialDisplay, websiteName, tags } = useSettings();

  const [categories, setCategories] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const isHindi = language === "hi";

  useEffect(() => {
    let isMounted = true;
    api
      .get("/categories")
      .then((res) => {
        if (!isMounted) return;
        const raw = res.data?.categories || res.data?.data?.categories || res.data?.data || [];
        setCategories(Array.isArray(raw) ? raw.filter((c) => c.isActive !== false) : []);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail("");
      setSubscribed(false);
    }, 4000);
  };

  const currentWebsiteName = getLocalizedValue(websiteName, language) || (isHindi ? "दैनिक समाचार" : "THE CHRONICLE");
  const footerLogoUrl =
    branding?.footerLogo?.isVisible && branding?.footerLogo?.url
      ? getImageUrl(branding.footerLogo.url)
      : branding?.logo?.isVisible && branding?.logo?.url
      ? getImageUrl(branding.logo.url)
      : null;

  const footerSocials = socialDisplay?.showInFooter
    ? socialLinks.filter((s) => s.isActive && s.showInFooter && s.url)
    : [];

  const addressText = getLocalizedValue(contact?.address?.value, language);

  const footerDescription =
    getLocalizedValue(settings?.footerDescription, language) ||
    (isHindi
      ? "एक स्वतंत्र, निष्पक्ष और विश्वसनीय डिजिटल समाचार माध्यम। हम तथ्य आधारित पत्रकारिता और जनहित के मुद्दों को प्राथमिकता देते हैं।"
      : "Dedicated to fearless investigative journalism, ground reporting, and thoughtful political, financial, and cultural analysis.");

  return (
    <footer className="site-footer">
      {/* 1. NEWSLETTER STRIP */}
      <div className="footer-newsletter-strip">
        <div className="container newsletter-inner">
          <div className="newsletter-text">
            <h3>{isHindi ? "दैनिक समाचार बुलेटिन" : "THE MORNING BRIEFING"}</h3>
            <p>
              {isHindi
                ? "देश-विदेश की महत्वपूर्ण खबरें और संपादकीय विश्लेषण सीधे अपने इनबॉक्स में पाएं।"
                : "Get essential headlines, investigative reports, and opinion delivered to your inbox every morning."}
            </p>
          </div>

          <form className="newsletter-form" onSubmit={handleSubscribe}>
            {subscribed ? (
              <div className="newsletter-success">
                <CheckCircle size={18} />
                <span>{isHindi ? "सदस्यता के लिए धन्यवाद!" : "Thank you for subscribing!"}</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={isHindi ? "अपना ईमेल दर्ज करें..." : "Enter your email address..."}
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-submit-btn">
                  <span>{isHindi ? "सदस्यता लें" : "Subscribe"}</span>
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* 2. MAIN FOOTER DIRECTORY */}
      <div className="footer-main-section">
        <div className="container footer-grid">
          {/* Column 1: Brand & Bio */}
          <div className="footer-col footer-col-brand">
            <Link to="/" className="footer-brand" onClick={scrollToTop}>
              {footerLogoUrl && !logoError ? (
                <img
                  src={footerLogoUrl}
                  alt={currentWebsiteName}
                  className="footer-logo-img"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="footer-brand-title">{currentWebsiteName}</span>
              )}
            </Link>

            <p className="footer-brand-desc">{footerDescription}</p>

            {/* Social Media Links */}
            {footerSocials.length > 0 && (
              <div className="footer-social-links">
                {footerSocials.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-btn"
                    title={social.platform}
                    aria-label={social.platform}
                  >
                    <SocialIcon platform={social.platform} size={15} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: News Categories */}
          <div className="footer-col">
            <h4 className="footer-col-title">{isHindi ? "प्रमुख श्रेणियां" : "NEWS DESKS"}</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/" onClick={scrollToTop}>{isHindi ? "होम पेज" : "Home / Top Stories"}</Link>
              </li>
              {categories.slice(0, 7).map((cat) => {
                const name = getLocalizedValue(cat.name, language);
                const slug = getLocalizedValue(cat.slug, language);
                if (!name || !slug) return null;
                return (
                  <li key={cat._id}>
                    <Link to={`/category/${slug}`} onClick={scrollToTop}>
                      {name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3: Trending Topics / Tags */}
          <div className="footer-col">
            <h4 className="footer-col-title">{isHindi ? "ट्रेंडिंग विषय" : "TRENDING TOPICS"}</h4>
            <div className="footer-tags-cloud">
              {tags.slice(0, 10).map((t) => {
                const tagName = getLocalizedValue(t.name, language) || t.name?.en || t.slug;
                return (
                  <Link
                    key={t._id || t.slug}
                    to={`/search?tag=${encodeURIComponent(t.slug || tagName)}`}
                    className="footer-tag-chip"
                    onClick={scrollToTop}
                  >
                    #{tagName}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Column 4: Contact & Editorial Office */}
          {contact?.showContactInFooter && (
            <div className="footer-col footer-col-contact">
              <h4 className="footer-col-title">{isHindi ? "संपादकीय कार्यालय" : "EDITORIAL DESK"}</h4>

              {addressText && contact?.address?.isVisible && (
                <div className="footer-contact-item">
                  <MapPin size={16} className="contact-icon" />
                  <span>{addressText}</span>
                </div>
              )}

              {contact?.email?.isVisible && contact?.email?.value && (
                <div className="footer-contact-item">
                  <Mail size={16} className="contact-icon" />
                  <a href={`mailto:${contact.email.value}`}>{contact.email.value}</a>
                </div>
              )}

              {contact?.mobile?.isVisible && contact?.mobile?.value && (
                <div className="footer-contact-item">
                  <Phone size={16} className="contact-icon" />
                  <a href={`tel:${contact.mobile.value}`}>{contact.mobile.value}</a>
                </div>
              )}

              {contact?.whatsapp?.isVisible && contact?.whatsapp?.value && (
                <div className="footer-contact-item">
                  <MessageCircle size={16} className="contact-icon" />
                  <a
                    href={`https://wa.me/${contact.whatsapp.value.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {contact.whatsapp.value} (WhatsApp)
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. COPYRIGHT & LEGAL BAR */}
      <div className="footer-bottom-bar">
        <div className="container bottom-bar-inner">
          <p className="copyright-text">
            © {new Date().getFullYear()} {currentWebsiteName}. {isHindi ? "सर्वाधिकार सुरक्षित।" : "All rights reserved."}
          </p>

          <div className="footer-legal-links">
            <Link to="/">{isHindi ? "गोपनीयता नीति" : "Privacy Policy"}</Link>
            <span className="dot-divider">•</span>
            <Link to="/">{isHindi ? "नियम एवं शर्तें" : "Terms of Service"}</Link>
            <span className="dot-divider">•</span>
            <Link to="/">{isHindi ? "आचार संहिता" : "Editorial Code"}</Link>
          </div>

          <button
            type="button"
            className="back-to-top-btn"
            onClick={scrollToTop}
            aria-label="Back to top"
          >
            <span>{isHindi ? "शीर्ष पर जाएं" : "Back to top"}</span>
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
