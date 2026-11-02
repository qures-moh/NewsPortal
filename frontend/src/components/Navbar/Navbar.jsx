import { useEffect, useState, useMemo } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  X,
  Home as HomeIcon,
  Search,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Globe,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { useSettings } from "../../context/SettingsContext";
import api from "../../api/api";
import { getImageUrl } from "../../utils/imageUrl";
import { getLocalizedValue } from "../../utils/newsHelpers";
import { SocialIcon } from "../common/SocialIcons";
import "./Navbar.css";

const extractArray = (response, key) => {
  const data = response?.data?.data;
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data)) return data;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const Navbar = ({ isMenuOpen, onCloseMenu }) => {
  const { language, changeLanguage } = useLanguage();
  const { branding, contact, socialLinks, websiteName } = useSettings();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [mobileSearch, setMobileSearch] = useState("");
  const [mobileLogoError, setMobileLogoError] = useState(false);

  const isHindi = language === "hi";

  
  useEffect(() => {
    const controller = new AbortController();

    const fetchNavigation = async () => {
      try {
        setLoading(true);
        const categoryResponse = await api.get("/categories", {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const categoryData = extractArray(categoryResponse, "categories");
        const activeCategories = categoryData.filter((c) => c.isActive !== false);
        setCategories(activeCategories);

       
        const subcategoryResults = await Promise.all(
          activeCategories.map(async (category) => {
            try {
              const response = await api.get(
                `/subcategories/category/${category._id}`,
                { signal: controller.signal }
              );
              const subs = extractArray(response, "subcategories");
              return [category._id, subs.filter((s) => s.isActive !== false)];
            } catch {
              return [category._id, []];
            }
          })
        );

        if (!controller.signal.aborted) {
          setSubcategoriesByCategory(Object.fromEntries(subcategoryResults));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Navigation load error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchNavigation();
    return () => controller.abort();
  }, []);

  
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCloseMenu();
    };
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMenuOpen, onCloseMenu]);

  const handleMobileSearch = (e) => {
    e.preventDefault();
    if (!mobileSearch.trim()) return;
    onCloseMenu();
    navigate(`/search?q=${encodeURIComponent(mobileSearch.trim())}`);
  };

  const handleLinkClick = () => {
    setExpandedCategory(null);
    onCloseMenu();
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const mobileLogoUrl =
    branding?.mobileLogo?.isVisible && branding?.mobileLogo?.url
      ? getImageUrl(branding.mobileLogo.url)
      : branding?.logo?.isVisible && branding?.logo?.url
      ? getImageUrl(branding.logo.url)
      : null;

  const currentWebsiteName = getLocalizedValue(websiteName, language) || (isHindi ? "दैनिक समाचार" : "THE CHRONICLE");

  // Divide categories into visible items + more dropdown if > 8
  const MAX_PRIMARY = 8;
  const visibleCategories = categories.slice(0, MAX_PRIMARY);
  const overflowCategories = categories.slice(MAX_PRIMARY);

  return (
    <>
    
      <nav className="mega-navbar">
        <div className="container navbar-container">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink to="/" end className="nav-link home-nav-link" title={isHindi ? "होम" : "Home"}>
                <HomeIcon size={16} />
                <span>{isHindi ? "होम" : "Home"}</span>
              </NavLink>
            </li>

            {visibleCategories.map((cat) => {
              const name = getLocalizedValue(cat.name, language);
              const slug = getLocalizedValue(cat.slug, language);
              const subcategories = subcategoriesByCategory[cat._id] || [];

              if (!name || !slug) return null;

              return (
                <li key={cat._id} className={`nav-item ${subcategories.length > 0 ? "has-dropdown" : ""}`}>
                  <NavLink to={`/category/${slug}`} className="nav-link">
                    <span>{name}</span>
                    {subcategories.length > 0 && <ChevronDown size={14} className="dropdown-arrow" />}
                  </NavLink>

                 
                  {subcategories.length > 0 && (
                    <div className="nav-dropdown-menu">
                      <div className="dropdown-header">
                        <span className="dropdown-title">{name}</span>
                        <Link to={`/category/${slug}`} className="dropdown-view-all">
                          {isHindi ? "सभी खबरें →" : "All Stories →"}
                        </Link>
                      </div>
                      <div className="dropdown-grid">
                        {subcategories.map((sub) => {
                          const subName = getLocalizedValue(sub.name, language);
                          const subSlug = getLocalizedValue(sub.slug, language);
                          if (!subName || !subSlug) return null;
                          return (
                            <Link
                              key={sub._id}
                              to={`/subcategory/${subSlug}`}
                              className="dropdown-item"
                            >
                              <span className="dropdown-item-bullet">•</span>
                              <span>{subName}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}

            
            {overflowCategories.length > 0 && (
              <li className="nav-item has-dropdown">
                <button type="button" className="nav-link more-nav-link">
                  <span>{isHindi ? "अन्य विषय" : "More"}</span>
                  <ChevronDown size={14} className="dropdown-arrow" />
                </button>
                <div className="nav-dropdown-menu overflow-menu">
                  <div className="dropdown-grid">
                    {overflowCategories.map((cat) => {
                      const name = getLocalizedValue(cat.name, language);
                      const slug = getLocalizedValue(cat.slug, language);
                      if (!name || !slug) return null;
                      return (
                        <Link key={cat._id} to={`/category/${slug}`} className="dropdown-item">
                          <span>{name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </li>
            )}
          </ul>
        </div>
      </nav>

     
      <div
        className={`mobile-backdrop ${isMenuOpen ? "active" : ""}`}
        onClick={onCloseMenu}
        aria-hidden="true"
      />

      {/* MOBILE DRAWER */}
      <aside className={`mobile-drawer ${isMenuOpen ? "open" : ""}`} aria-hidden={!isMenuOpen}>
        <div className="mobile-drawer-header">
          <Link to="/" className="mobile-drawer-brand" onClick={handleLinkClick}>
            {mobileLogoUrl && !mobileLogoError ? (
              <img
                src={mobileLogoUrl}
                alt={currentWebsiteName}
                className="mobile-logo-img"
                onError={() => setMobileLogoError(true)}
              />
            ) : (
              <span className="mobile-brand-title">{currentWebsiteName}</span>
            )}
          </Link>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMenu}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mobile-drawer-search">
          <form onSubmit={handleMobileSearch} className="mobile-search-form">
            <input
              type="search"
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              placeholder={isHindi ? "खबरें खोजें..." : "Search articles..."}
              className="mobile-search-input"
            />
            <button type="submit" className="mobile-search-btn">
              <Search size={16} />
            </button>
          </form>
        </div>

     
        <div className="mobile-lang-row">
          <span className="mobile-lang-label">{isHindi ? "भाषा:" : "Language:"}</span>
          <div className="mobile-lang-toggle">
            <button
              type="button"
              className={`mobile-lang-btn ${language === "en" ? "active" : ""}`}
              onClick={() => changeLanguage("en")}
            >
              English
            </button>
            <button
              type="button"
              className={`mobile-lang-btn ${language === "hi" ? "active" : ""}`}
              onClick={() => changeLanguage("hi")}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Navigation Accordion */}
        <nav className="mobile-nav-list">
          <NavLink to="/" end className="mobile-nav-item" onClick={handleLinkClick}>
            <HomeIcon size={18} />
            <span>{isHindi ? "होम" : "Home"}</span>
          </NavLink>

          {categories.map((cat) => {
            const name = getLocalizedValue(cat.name, language);
            const slug = getLocalizedValue(cat.slug, language);
            const subcategories = subcategoriesByCategory[cat._id] || [];
            const isExpanded = expandedCategory === cat._id;

            if (!name || !slug) return null;

            return (
              <div key={cat._id} className="mobile-category-block">
                <div className="mobile-category-row">
                  <NavLink
                    to={`/category/${slug}`}
                    className="mobile-nav-item"
                    onClick={handleLinkClick}
                  >
                    <span>{name}</span>
                  </NavLink>
                  {subcategories.length > 0 && (
                    <button
                      type="button"
                      className={`mobile-expand-toggle ${isExpanded ? "expanded" : ""}`}
                      onClick={() => toggleCategory(cat._id)}
                      aria-label="Toggle subcategories"
                    >
                      <ChevronDown size={18} />
                    </button>
                  )}
                </div>

                {isExpanded && subcategories.length > 0 && (
                  <div className="mobile-subcategories-list">
                    {subcategories.map((sub) => {
                      const subName = getLocalizedValue(sub.name, language);
                      const subSlug = getLocalizedValue(sub.slug, language);
                      if (!subName || !subSlug) return null;
                      return (
                        <NavLink
                          key={sub._id}
                          to={`/subcategory/${subSlug}`}
                          className="mobile-sub-item"
                          onClick={handleLinkClick}
                        >
                          {subName}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

       
        <div className="mobile-drawer-footer">
          {contact?.email?.isVisible && contact?.email?.value && (
            <div className="mobile-contact-line">
              <Mail size={14} />
              <a href={`mailto:${contact.email.value}`}>{contact.email.value}</a>
            </div>
          )}
          {contact?.mobile?.isVisible && contact?.mobile?.value && (
            <div className="mobile-contact-line">
              <Phone size={14} />
              <a href={`tel:${contact.mobile.value}`}>{contact.mobile.value}</a>
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="mobile-social-row">
              {socialLinks.filter((s) => s.isActive).map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-social-icon"
                  title={s.platform}
                >
                  <SocialIcon platform={s.platform} size={15} />
                </a>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navbar;
