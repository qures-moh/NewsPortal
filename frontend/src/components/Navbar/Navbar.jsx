
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";

import "./Navbar.css";

const getLocalizedValue = (value, language) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  return value[language] || value.en || value.hi || "";
};

const extractArray = (response, key) => {
  const data = response?.data?.data;

  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }

  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
};

const Navbar = ({ isMenuOpen, onCloseMenu }) => {
  const { language } = useLanguage();

  const [categories, setCategories] = useState([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] =
    useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedCategory, setExpandedCategory] = useState(null);

  // Fetch categories and their subcategories.
  useEffect(() => {
    const controller = new AbortController();

    const fetchNavigation = async () => {
      try {
        setLoading(true);
        setError("");

        const categoryResponse = await api.get("/categories", {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const categoryData = extractArray(
          categoryResponse,
          "categories"
        );

        const activeCategories = categoryData.filter(
          (category) => category.isActive !== false
        );

        setCategories(activeCategories);

        // Fetch subcategories for each category.
        const subcategoryResults = await Promise.all(
          activeCategories.map(async (category) => {
            try {
              const response = await api.get(
                `/subcategories/category/${category._id}`,
                { signal: controller.signal }
              );

              const subcategories = extractArray(
                response,
                "subcategories"
              );

              return [
                category._id,
                subcategories.filter(
                  (subcategory) => subcategory.isActive !== false
                ),
              ];
            } catch (err) {
              if (!controller.signal.aborted) {
                console.error(
                  `Failed to fetch subcategories for ${category._id}:`,
                  err
                );
              }

              return [category._id, []];
            }
          })
        );

        if (controller.signal.aborted) return;

        setSubcategoriesByCategory(
          Object.fromEntries(subcategoryResults)
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Navigation fetch error:", err);
          setError(
            err.response?.data?.message ||
              "Unable to load navigation."
          );
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

  // Close drawer on Escape.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onCloseMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen, onCloseMenu]);

  // Prevent background scrolling while drawer is open.
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const handleLinkClick = () => {
    setExpandedCategory(null);
    onCloseMenu();
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategory((previous) =>
      previous === categoryId ? null : categoryId
    );
  };

  const renderSubcategoryLinks = (categoryId) => {
    const subcategories =
      subcategoriesByCategory[categoryId] || [];

    return subcategories.map((subcategory) => {
      const name = getLocalizedValue(
        subcategory.name,
        language
      );

      const slug = getLocalizedValue(
        subcategory.slug,
        language
      );

      if (!name || !slug) return null;

      return (
        <NavLink
          key={subcategory._id}
          to={`/subcategory/${slug}`}
          className="navbar-subcategory-link"
          onClick={handleLinkClick}
        >
          {name}
        </NavLink>
      );
    });
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" end className="navbar-link">
            {language === "hi" ? "होम" : "Home"}
          </NavLink>

          {loading && (
            <span className="navbar-status">Loading...</span>
          )}

          {!loading &&
            categories.map((category) => {
              const name = getLocalizedValue(
                category.name,
                language
              );

              const slug = getLocalizedValue(
                category.slug,
                language
              );

              if (!name || !slug) return null;

              const subcategories =
                subcategoriesByCategory[category._id] || [];

              return (
                <div
                  className="navbar-category"
                  key={category._id}
                >
                  <NavLink
                    to={`/category/${slug}`}
                    className="navbar-link"
                  >
                    {name}

                    {subcategories.length > 0 && (
                      <ChevronDown size={15} />
                    )}
                  </NavLink>

                  {subcategories.length > 0 && (
                    <div className="navbar-dropdown">
                      {renderSubcategoryLinks(category._id)}
                    </div>
                  )}
                </div>
              );
            })}

          {error && (
            <span className="navbar-status">{error}</span>
          )}
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-nav-backdrop ${
          isMenuOpen ? "active" : ""
        }`}
        onClick={onCloseMenu}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <aside
        className={`mobile-nav-drawer ${
          isMenuOpen ? "open" : ""
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-nav-header">
          <h2>
            {language === "hi" ? "मेन्यू" : "Menu"}
          </h2>

          <button
            type="button"
            className="mobile-nav-close"
            onClick={onCloseMenu}
            aria-label="Close navigation menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mobile-nav-links">
          <NavLink
            to="/"
            end
            className="mobile-nav-link"
            onClick={handleLinkClick}
          >
            {language === "hi" ? "होम" : "Home"}
          </NavLink>

          {loading && (
            <p className="navbar-status">
              {language === "hi"
                ? "लोड हो रहा है..."
                : "Loading categories..."}
            </p>
          )}

          {!loading &&
            categories.map((category) => {
              const name = getLocalizedValue(
                category.name,
                language
              );

              const slug = getLocalizedValue(
                category.slug,
                language
              );

              if (!name || !slug) return null;

              const subcategories =
                subcategoriesByCategory[category._id] || [];

              const isExpanded =
                expandedCategory === category._id;

              return (
                <div
                  className="mobile-category-group"
                  key={category._id}
                >
                  <div className="mobile-category-heading">
                    <NavLink
                      to={`/category/${slug}`}
                      className="mobile-nav-link"
                      onClick={handleLinkClick}
                    >
                      {name}
                    </NavLink>

                    {subcategories.length > 0 && (
                      <button
                        type="button"
                        className="mobile-category-toggle"
                        onClick={() =>
                          toggleCategory(category._id)
                        }
                        aria-expanded={isExpanded}
                        aria-label={`Toggle ${name} subcategories`}
                      >
                        <ChevronDown
                          size={19}
                          className={
                            isExpanded ? "rotated" : ""
                          }
                        />
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mobile-subcategory-list">
                      {renderSubcategoryLinks(category._id)}
                    </div>
                  )}
                </div>
              );
            })}

          {error && (
            <p className="navbar-status">{error}</p>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navbar;
