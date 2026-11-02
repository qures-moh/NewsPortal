import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Layers,
  ArrowLeft,
  ArrowRight,
  Filter,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import Advertisement from "../../components/Advertisement/Advertisement";
import NewsCard from "../../components/NewsCard/NewsCard";
import { getImageUrl } from "../../utils/imageUrl";
import { getLocalizedValue } from "../../utils/newsHelpers";
import "./Category.css";

const Category = () => {
  const { slug } = useParams();
  const { language } = useLanguage();

  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [news, setNews] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isHindi = language === "hi";


  useEffect(() => {
    setPage(1);
  }, [slug, language]);

 
  useEffect(() => {
    const controller = new AbortController();

    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError("");
        setCategory(null);
        setSubcategories([]);
        setNews([]);
        setPagination(null);

        const response = await api.get("/categories", {
          signal: controller.signal,
        });

        const catList =
          response.data?.categories ||
          response.data?.data?.categories ||
          response.data?.data ||
          [];

        const matched = catList.find((item) => {
          const itemSlug = getLocalizedValue(item.slug, language);
          return (
            (itemSlug === slug || item.slug?.en === slug || item.slug?.hi === slug) &&
            item.isActive !== false
          );
        });

        if (!matched) {
          throw new Error(isHindi ? "श्रेणी नहीं मिली।" : "Category not found.");
        }

        setCategory(matched);

     
        try {
          const subRes = await api.get(`/subcategories/category/${matched._id}`, {
            signal: controller.signal,
          });
          const subs =
            subRes.data?.subcategories ||
            subRes.data?.data?.subcategories ||
            subRes.data?.data ||
            [];
          setSubcategories(Array.isArray(subs) ? subs.filter((s) => s.isActive !== false) : []);
        } catch {
         
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Category lookup error:", err);
          setError(
            err.response?.data?.message ||
              err.message ||
              (isHindi ? "श्रेणी लोड करने में असमर्थ।" : "Unable to load category.")
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      fetchCategoryData();
    }

    return () => controller.abort();
  }, [slug, language, isHindi]);

  // Fetch News articles for this category
  useEffect(() => {
    if (!category?._id) return;
    const controller = new AbortController();

    const fetchNews = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/news", {
          params: {
            language,
            page,
            limit: 12,
            category: category._id,
            sort: "latest",
          },
          signal: controller.signal,
        });

        const result = response.data?.data;
        setNews(Array.isArray(result?.news) ? result.news : []);
        setPagination(result?.pagination || null);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Category news fetch error:", err);
          setNews([]);
          setPagination(null);
          setError(isHindi ? "समाचार लोड करने में असमर्थ।" : "Unable to load news.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchNews();
    return () => controller.abort();
  }, [category?._id, language, page, isHindi]);

  const categoryName = getLocalizedValue(category?.name, language);
  const categoryDesc = getLocalizedValue(category?.description, language);
  const categoryImg = category?.image ? getImageUrl(category.image) : null;

  // On page 1, show first article as featured lead story
  const leadArticle = page === 1 && news.length > 0 ? news[0] : null;
  const gridArticles = page === 1 && news.length > 1 ? news.slice(1) : news;

  return (
    <div className="category-view-page">
      {/* 1. TOP ADVERTISEMENT */}
      <div className="container">
        <Advertisement page="category" position="top" />
      </div>

      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="category-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">{isHindi ? "होम" : "Home"}</Link>
          <ChevronRight size={14} className="crumb-sep" />
          <span>{categoryName || slug}</span>
        </nav>

        {/* Category Masthead Banner (Dainik Bhaskar Style) */}
        <div className="category-masthead-banner">
          <div className="category-banner-content">
            <span className="category-pill-label">
              <Layers size={13} />
              <span>{isHindi ? "संपादकीय डेस्क" : "EDITORIAL DESK"}</span>
            </span>
            <h1 className="category-heading-title">{categoryName || slug}</h1>
            {categoryDesc && (
              <p className="category-heading-desc">{categoryDesc}</p>
            )}
          </div>

          {categoryImg && (
            <div className="category-banner-img-wrap">
              <img
                src={categoryImg}
                alt={categoryName}
                className="category-banner-img"
              />
            </div>
          )}
        </div>

        {/* Subcategories Filter Pills */}
        {subcategories.length > 0 && (
          <div className="subcategories-filter-bar">
            <span className="subcategories-filter-label">
              <Filter size={13} />
              <span>{isHindi ? "उप-श्रेणियां:" : "Sub-Desks:"}</span>
            </span>
            <div className="subcategories-pills-list">
              {subcategories.map((sub) => {
                const subName = getLocalizedValue(sub.name, language);
                const subSlug = getLocalizedValue(sub.slug, language);
                if (!subName || !subSlug) return null;
                return (
                  <Link
                    key={sub._id}
                    to={`/subcategory/${subSlug}`}
                    className="subcategory-pill-btn"
                  >
                    {subName}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="category-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton skeleton-category-card" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="category-error-state">
            <AlertCircle size={28} className="error-icon" />
            <h3>{error}</h3>
            <Link to="/" className="back-home-link">
              ← {isHindi ? "होम पेज पर वापस जाएं" : "Return to Homepage"}
            </Link>
          </div>
        )}

      
        {!loading && !error && news.length > 0 && (
          <>
          
            {leadArticle && (
              <div className="category-featured-story">
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

           
            <div className="editorial-section-header">
              <span className="editorial-section-title">
                <span className="title-bar" />
                {isHindi ? "सभी खबरें एवं विश्लेषण" : "LATEST DISPATCHES"}
              </span>
            </div>

            <div className="category-articles-grid">
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
              <div className="category-pagination-bar">
                <button
                  type="button"
                  className="page-btn prev-btn"
                  disabled={!pagination.hasPreviousPage || loading}
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
                  disabled={!pagination.hasNextPage || loading}
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

       
        {!loading && !error && news.length === 0 && (
          <div className="category-empty-state">
            <h3>{isHindi ? "इस श्रेणी में अभी कोई समाचार नहीं है" : "No Dispatches Filed Under This Category"}</h3>
            <p>
              {isHindi
                ? "हमारी संपादकीय टीम शीघ्र ही यहाँ ताज़ा समाचार प्रकाशित करेगी।"
                : "Articles filed under this desk will appear here as soon as they are published."}
            </p>
            <Link to="/" className="back-home-link">
              ← {isHindi ? "अन्य समाचार पढ़ें" : "Explore Other Stories"}
            </Link>
          </div>
        )}
      </div>

      
      <div className="container">
        <Advertisement page="category" position="bottom" />
      </div>
    </div>
  );
};

export default Category;
