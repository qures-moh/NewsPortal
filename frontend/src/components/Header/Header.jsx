import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  Calendar,
  Flame,
  FileText,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { useSettings } from "../../context/SettingsContext";
import { getImageUrl } from "../../utils/imageUrl";
import { getLocalizedValue } from "../../utils/newsHelpers";
import { SocialIcon } from "../common/SocialIcons";
import "./Header.css";

const Header = ({ onMenuToggle }) => {
  const { language, changeLanguage } = useLanguage();
  const { branding, socialLinks, socialDisplay, websiteName, tags } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  const isHindi = language === "hi";

  // Formatted date string in English or Hindi locale
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString(isHindi ? "hi-IN" : "en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      setCurrentDate(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [isHindi]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const currentWebsiteName =
    getLocalizedValue(websiteName, language) ||
    (isHindi ? "दैनिक समाचार" : "DAINIK CHRONICLE");

  const logoUrl =
    branding?.logo?.isVisible && branding?.logo?.url
      ? getImageUrl(branding.logo.url)
      : null;

  // Active header social channels
  const headerSocials = socialDisplay?.showInHeader
    ? socialLinks.filter((s) => s.isActive && s.showInHeader && s.url)
    : [];

  // Top trending tags from admin
  const topTags = Array.isArray(tags) ? tags.slice(0, 5) : [];

  return (
    <header className="db-site-header">
      {/* 1. TOP UTILITY STRIP (Date, Edition, Language, Socials) */}
      <div className="db-top-bar">
        <div className="container db-top-bar-inner">
          {/* Left: Date, Edition, Trending */}
          <div className="db-top-left">
            <span className="db-date-display">
              <Calendar size={13} className="db-top-icon" />
              <span>{currentDate}</span>
            </span>

            <span className="db-edition-pill">
              <span className="db-edition-dot" />
              <span>{isHindi ? "राष्ट्रीय संस्करण" : "National Edition"}</span>
            </span>

            {/* Trending Tags Ticker */}
            {topTags.length > 0 && (
              <div className="db-top-trending">
                <span className="db-trending-label">
                  <Flame size={13} className="db-flame-icon" />
                  <span>{isHindi ? "ट्रेंडिंग:" : "Trending:"}</span>
                </span>
                <div className="db-tags-scroll">
                  {topTags.map((t) => {
                    const tagName = getLocalizedValue(t.name, language) || t.name?.en || t.slug;
                    return (
                      <Link
                        key={t._id || t.slug}
                        to={`/search?tag=${encodeURIComponent(t.slug || tagName)}`}
                        className="db-tag-pill"
                      >
                        #{tagName}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: e-Paper, Socials, Language Switcher */}
          <div className="db-top-right">
            <Link to="/" className="db-epaper-badge" title={isHindi ? "ई-पेपर" : "e-Paper"}>
              <FileText size={13} />
              <span>{isHindi ? "ई-पेपर" : "e-Paper"}</span>
            </Link>

            {/* Active Social Media */}
            {headerSocials.length > 0 && (
              <div className="db-social-group">
                {headerSocials.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="db-social-link"
                    title={social.platform}
                    aria-label={social.platform}
                  >
                    <SocialIcon platform={social.platform} size={13} />
                  </a>
                ))}
              </div>
            )}

            {/* Language Switcher */}
            <div className="db-language-toggle">
              <button
                type="button"
                className={`db-lang-choice ${language === "hi" ? "is-active" : ""}`}
                onClick={() => changeLanguage("hi")}
              >
                हिन्दी
              </button>
              <span className="db-lang-divider">|</span>
              <button
                type="button"
                className={`db-lang-choice ${language === "en" ? "is-active" : ""}`}
                onClick={() => changeLanguage("en")}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN NEWSPAPER MASTHEAD */}
      <div className="db-masthead">
        <div className="container db-masthead-inner">
          {/* Mobile menu button */}
          <button
            type="button"
            className="db-mobile-toggle-btn"
            onClick={onMenuToggle}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          {/* Central Newspaper Masthead Brand */}
          <Link to="/" className="db-brand-masthead" title={currentWebsiteName}>
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt={currentWebsiteName}
                className="db-brand-logo-img"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="db-newspaper-brand">
                {/* Dainik Bhaskar Style Sun Crest / Emblem */}
                <div className="db-brand-emblem-wrap">
                  <div className="db-sun-emblem">
                    <span className="emblem-center-letter">
                      {isHindi ? (currentWebsiteName.charAt(0) || "द") : (currentWebsiteName.charAt(0) || "N")}
                    </span>
                  </div>
                </div>

                <div className="db-brand-text-block">
                  <h1 className="db-brand-name">{currentWebsiteName}</h1>
                  <p className="db-brand-tagline">
                    {isHindi
                      ? "सत्य • निष्पक्षता • राष्ट्रहित — देश का अग्रणी समाचार पत्र"
                      : "TRUTH • INTEGRITY • NATION FIRST — INDIA'S TRUSTED NEWSPAPER"}
                  </p>
                </div>
              </div>
            )}
          </Link>

          {/* Right: Live Desk & Search */}
          <div className="db-masthead-actions">
            <form className="db-header-search" onSubmit={handleSearch}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHindi ? "खबर, विषय खोजें..." : "Search dispatches..."}
                className="db-search-input"
              />
              <button type="submit" className="db-search-btn" aria-label="Search">
                <Search size={16} />
              </button>
            </form>

            <div className="db-live-desk-pill">
              <span className="live-pulse-dot" />
              <span>{isHindi ? "लाइव डेस्क" : "LIVE DESK"}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
