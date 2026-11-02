import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Layers,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import Advertisement from "../../components/Advertisement/Advertisement";
import NewsCard from "../../components/NewsCard/NewsCard";
import { getLocalizedValue } from "../../utils/newsHelpers";
import "./Subcategory.css";

const extractArray = (response, key) => {
  const data = response?.data?.data;
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data)) return data;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

function Subcategory() {
  const { slug } = useParams();
  const { language } = useLanguage();

  const [subcategory, setSubcategory] = useState(null);
  const [category, setCategory] = useState(null);
  const [news, setNews] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState("");

  const isHindi = language === "hi";

  useEffect(() => {
    setPage(1);
  }, [slug, language]);

  // Lookup subcategory by slug across active categories
  useEffect(() => {
    const controller = new AbortController();

    const lookupSubcategory = async () => {
      try {
        setLoading(true);
        setError("");
        setSubcategory(null);
        setCategory(null);
        setNews([]);

        const categoryRes = await api.get("/categories", {
          signal: controller.signal,
        });

        const catList = extractArray(categoryRes, "categories").filter((c) => c.isActive !== false);

       
        const subcategoryResults = await Promise.all(
          catList.map(async (cat) => {
            try {
              const res = await api.get(`/subcategories/category/${cat._id}`, {
                signal: controller.signal,
              });
              const subs = extractArray(res, "subcategories").filter((s) => s.isActive !== false);
              return { category: cat, subcategories: subs };
            } catch {
              return { category: cat, subcategories: [] };
            }
          })
        );

        let foundSub = null;
        let foundCat = null;

        for (const res of subcategoryResults) {
          const match = res.subcategories.find((item) => {
            const itemSlug = getLocalizedValue(item.slug, language);
            return (
              itemSlug === slug ||
              item.slug?.en === slug ||
              item.slug?.hi === slug
            );
          });

          if (match) {
            foundSub = match;
            foundCat = res.category;
            break;
          }
        }

        if (!foundSub) {
          throw new Error(isHindi ? "उपश्रेणी नहीं मिली।" : "Subcategory not found.");
        }

        setSubcategory(foundSub);
        setCategory(foundCat);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Subcategory lookup error:", err);
          setError(
            err.response?.data?.message ||
              err.message ||
              (isHindi ? "उपश्रेणी लोड करने में असमर्थ।" : "Unable to load subcategory.")
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      lookupSubcategory();
    }

    return () => controller.abort();
  }, [slug, language, isHindi]);

  // Fetch News for this subcategory
  useEffect(() => {
    if (!subcategory?._id) return;
    const controller = new AbortController();

    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        setError("");

        const response = await api.get("/news", {
          params: {
            language,
            subcategory: subcategory._id,
            page,
            limit: 12,
            sort: "latest",
          },
          signal: controller.signal,
        });

        const result = response.data?.data;
        setNews(Array.isArray(result?.news) ? result.news : []);
        setPagination(result?.pagination || null);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Subcategory news fetch error:", err);
          setNews([]);
          setPagination(null);
          setError(isHindi ? "समाचार लोड करने में असमर्थ।" : "Unable to load news.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setNewsLoading(false);
        }
      }
    };

    fetchNews();
    return () => controller.abort();
  }, [subcategory?._id, language, page, isHindi]);

  const subcategoryName = getLocalizedValue(subcategory?.name, language);
  const subcategoryDesc = getLocalizedValue(subcategory?.description, language);

  const categoryName = getLocalizedValue(category?.name, language);
  const categorySlug = getLocalizedValue(category?.slug, language);

  // On page 1, show first article as featured lead story
  const leadArticle = page === 1 && news.length > 0 ? news[0] : null;
  const gridArticles = page === 1 && news.length > 1 ? news.slice(1) : news;

  return (
    <div className="subcategory-view-page">
      {/* 1. TOP ADVERTISEMENT */}
      <div className="container">
        <Advertisement page="category" position="top" />
      </div>

      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="subcategory-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">{isHindi ? "होम" : "Home"}</Link>
          <ChevronRight size={14} className="crumb-sep" />
          {categorySlug && (
            <>
              <Link to={`/category/${categorySlug}`}>{categoryName}</Link>
              <ChevronRight size={14} className="crumb-sep" />
            </>
          )}
          <span>{subcategoryName || slug}</span>
        </nav>

        {/* Subcategory Masthead Banner */}
        <div className="subcategory-masthead-banner">
          <span className="subcategory-pill-label">
            <Layers size={13} />
            <span>{isHindi ? "उप-डेस्क" : "SUB-DESK"}</span>
          </span>
          <h1 className="subcategory-heading-title">{subcategoryName || slug}</h1>
          {subcategoryDesc && (
            <p className="subcategory-heading-desc">{subcategoryDesc}</p>
          )}
        </div>

        {/* Loading State */}
        {(loading || newsLoading) && (
          <div className="subcategory-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton skeleton-sub-card" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="subcategory-error-state">
            <AlertCircle size={28} className="error-icon" />
            <h3>{error}</h3>
            <Link to="/" className="back-home-link">
              ← {isHindi ? "होम पेज पर वापस जाएं" : "Return to Homepage"}
            </Link>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !newsLoading && !error && news.length > 0 && (
          <>
            {/* Featured Lead Subcategory Story (Page 1) */}
            {leadArticle && (
              <div className="subcategory-featured-story">
                <div className="editorial-section-header has-accent">
                  <span className="editorial-section-title">
                    <span className="title-bar" />
                    <Sparkles size={16} />
                    {isHindi ? "प्रमुख रिपोर्ट" : "FEATURED REPORT"}
                  </span>
                </div>
                <NewsCard article={leadArticle} variant="hero" />
              </div>
            )}

            {/* Subcategory Dispatches Grid */}
            <div className="editorial-section-header">
              <span className="editorial-section-title">
                <span className="title-bar" />
                {isHindi ? "सभी उप-डेस्क खबरें" : "ALL SUB-DESK DISPATCHES"}
              </span>
            </div>

            <div className="subcategory-articles-grid">
              {gridArticles.map((article) => (
                <NewsCard
                  key={article._id}
                  article={article}
                  variant="standard"
                />
              ))}
            </div>

           
            <Advertisement page="category" position="middle" />

           
            {pagination && pagination.totalPages > 1 && (
              <div className="subcategory-pagination-bar">
                <button
                  type="button"
                  className="page-btn prev-btn"
                  disabled={!pagination.hasPreviousPage || newsLoading}
                  onClick={() => {
                    setPage((p) => p - 1);
                    window.scrollTo({ top: 200, behavior: "smooth" });
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>{isHindi ? "पिछला पृष्ठ" : "Previous"}</span>
                </button>

                <div className="pagination-current-info">
                  <span>
                    {isHindi ? "पृष्ठ" : "Page"}{" "}
                    <strong>{pagination.page}</strong> / {pagination.totalPages}
                  </span>
                </div>

                <button
                  type="button"
                  className="page-btn next-btn"
                  disabled={!pagination.hasNextPage || newsLoading}
                  onClick={() => {
                    setPage((p) => p + 1);
                    window.scrollTo({ top: 200, behavior: "smooth" });
                  }}
                >
                  <span>{isHindi ? "अगला पृष्ठ" : "Next"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !newsLoading && !error && news.length === 0 && (
          <div className="subcategory-empty-state">
            <h3>{isHindi ? "इस उपश्रेणी में अभी कोई समाचार उपलब्ध नहीं है" : "No Articles In This Subcategory"}</h3>
            <p>
              {isHindi
                ? "इस उपश्रेणी में नई खबरें शीघ्र ही प्रकाशित की जाएंगी।"
                : "Articles filed under this sub-desk will be published here shortly."}
            </p>
            <Link to="/" className="back-home-link">
              ← {isHindi ? "होम पेज पर जाएं" : "Explore Other Stories"}
            </Link>
          </div>
        )}
      </div>

      {/* BOTTOM ADVERTISEMENT */}
      <div className="container">
        <Advertisement page="category" position="bottom" />
      </div>
    </div>
  );
}

export default Subcategory;
