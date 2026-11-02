
import { useState, useEffect, useMemo } from "react";
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
  const { branding, socialLinks, socialDisplay, websiteName, tags } =
    useSettings();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const navigate = useNavigate();
  const isHindi = language === "hi";

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setCurrentDate(
        now.toLocaleDateString(isHindi ? "hi-IN" : "en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateTime();

    const timer = setInterval(updateTime, 60000);

    return () => clearInterval(timer);
  }, [isHindi]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 150);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    navigate(`/search?q=${encodeURIComponent(query)}`);

    setSearchQuery("");
    setIsMobileSearchOpen(false);
  };

  const currentWebsiteName =
    getLocalizedValue(websiteName, language) ||
    (isHindi ? "दैनिक समाचार" : "DAINIK CHRONICLE");

  const logoUrl =
    branding?.logo?.isVisible && branding?.logo?.url
      ? getImageUrl(branding.logo.url)
      : null;

  const headerSocials = socialDisplay?.showInHeader
    ? socialLinks.filter(
        (social) => social.isActive && social.showInHeader && social.url
      )
    : [];

  const topTags = useMemo(() => {
    if (!Array.isArray(tags)) return [];

    return tags
      .filter((tag) => tag?.isActive !== false && tag?.isTrending !== false)
      .map((tag) => {
        const tagName =
          getLocalizedValue(tag?.name, language) ||
          getLocalizedValue(tag?.name, "en");

        const tagSlug =
          getLocalizedValue(tag?.slug, language) ||
          getLocalizedValue(tag?.slug, "en");

        return {
          ...tag,
          tagName,
          tagSlug,
        };
      })
      .filter((tag) => tag.tagName && tag.tagSlug)
      .sort(
        (a, b) =>
          (a.trendingOrder || 0) - (b.trendingOrder || 0)
      )
      .slice(0, 5);
  }, [tags, language]);

  return (
    <header className={`db-site-header ${isScrolled ? "db-header-scrolled" : ""}`}>
      <div className="db-top-bar">
        <div className="container db-top-bar-inner">
          <div className="db-top-left">
            <span className="db-date-display">
              <Calendar size={13} className="db-top-icon" />
              <span>{currentDate}</span>
            </span>

            <span className="db-edition-pill">
              <span className="db-edition-dot" />
              <span>
                {isHindi ? "राष्ट्रीय संस्करण" : "National Edition"}
              </span>
            </span>

            {topTags.length > 0 && (
              <div className="db-top-trending">
                <span className="db-trending-label">
                  <Flame size={13} className="db-flame-icon" />
                  <span>{isHindi ? "ट्रेंडिंग:" : "Trending:"}</span>
                </span>

                <div className="db-tags-scroll">
                  {topTags.map((tag) => (
                    <Link
                      key={tag._id}
                      to={`/search?tag=${encodeURIComponent(
                        tag.tagSlug
                      )}&tagName=${encodeURIComponent(tag.tagName)}`}
                      className="db-tag-pill"
                      aria-label={
                        isHindi
                          ? `${tag.tagName} टैग की खबरें देखें`
                          : `View news tagged ${tag.tagName}`
                      }
                    >
                      #{tag.tagName}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="db-top-right">
            <Link
              to="/"
              className="db-epaper-badge"
              title={isHindi ? "ई-पेपर" : "e-Paper"}
            >
              <FileText size={13} />
              <span>{isHindi ? "ई-पेपर" : "e-Paper"}</span>
            </Link>

            {headerSocials.length > 0 && (
              <div className="db-social-group">
                {headerSocials.map((social) => (
                  <a
                    key={social._id}
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

            <div className="db-language-toggle">
              <button
                type="button"
                className={`db-lang-choice ${
                  language === "hi" ? "is-active" : ""
                }`}
                onClick={() => changeLanguage("hi")}
                aria-pressed={language === "hi"}
              >
                हिन्दी
              </button>

              <span className="db-lang-divider">|</span>

              <button
                type="button"
                className={`db-lang-choice ${
                  language === "en" ? "is-active" : ""
                }`}
                onClick={() => changeLanguage("en")}
                aria-pressed={language === "en"}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`db-masthead ${
          isScrolled ? "db-masthead-sticky" : ""
        }`}
      >
        <div className="container db-masthead-inner">
          <button
            type="button"
            className="db-mobile-toggle-btn"
            onClick={onMenuToggle}
            aria-label={isHindi ? "नेविगेशन मेनू खोलें" : "Open navigation menu"}
          >
            <Menu size={22} />
          </button>

          <Link
            to="/"
            className="db-brand-masthead"
            title={currentWebsiteName}
          >
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt={currentWebsiteName}
                className="db-brand-logo-img"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="db-newspaper-brand">
                <div className="db-brand-emblem-wrap">
                  <div className="db-sun-emblem">
                    <span className="emblem-center-letter">
                      {currentWebsiteName.charAt(0) || "N"}
                    </span>
                  </div>
                </div>

                <div className="db-brand-text-block">
                  <h1 className="db-brand-name">
                    {currentWebsiteName}
                  </h1>

                  <p className="db-brand-tagline">
                    {isHindi
                      ? "सत्य • निष्पक्षता • राष्ट्रहित — देश का अग्रणी समाचार पत्र"
                      : "TRUTH • INTEGRITY • NATION FIRST — INDIA'S TRUSTED NEWSPAPER"}
                  </p>
                </div>
              </div>
            )}
          </Link>

          <div className="db-masthead-actions">
          <button
  type="button"
  className="db-desktop-search-icon"
  onClick={() => navigate("/search")}
  aria-label={isHindi ? "खबर खोजें" : "Search news"}
>
  <Search size={20} />
</button>

            <div className="db-live-desk-pill">
              <span className="live-pulse-dot" />
              <span>{isHindi ? "लाइव डेस्क" : "LIVE DESK"}</span>
            </div>
          </div>

          <button
            type="button"
            className="db-mobile-search-toggle"
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            aria-label={isHindi ? "खोजें" : "Search"}
            aria-expanded={isMobileSearchOpen}
          >
            <Search size={21} />
          </button>
        </div>

        {isMobileSearchOpen && (
          <div className="db-mobile-search-panel">
            <form
              className="db-mobile-search-form"
              onSubmit={handleSearch}
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHindi ? "खबर खोजें..." : "Search news..."}
                autoFocus
                aria-label={isHindi ? "खबर खोजें" : "Search news"}
              />

              <button
                type="submit"
                aria-label={isHindi ? "खोजें" : "Search"}
              >
                <Search size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
