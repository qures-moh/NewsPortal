
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import Advertisement from "../../components/Advertisement/Advertisement";

import "./Category.css";

const getLocalizedValue = (value, language) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value[language] || value.en || value.hi || "";
};

const getLocalizedArticle = (article, language) => {
  return (
    article?.title?.[language] ||
    article?.title?.en ||
    article?.title?.hi ||
    {}
  );
};

const Category = () => {
  const { slug } = useParams();
  const { language } = useLanguage();

  const [category, setCategory] = useState(null);
  const [news, setNews] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reset pagination when category or language changes.
  useEffect(() => {
    setPage(1);
  }, [slug, language]);

  // Fetch categories and identify selected category.
  useEffect(() => {
    const controller = new AbortController();

    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError("");

        setCategory(null);
        setNews([]);
        setPagination(null);

        const response = await api.get("/categories", {
          signal: controller.signal,
        });

        const categories =
          response.data.categories ||
          response.data.data?.categories ||
          response.data.data ||
          [];

        const selectedCategory = categories.find((item) => {
          const categorySlug = getLocalizedValue(
            item.slug,
            language
          );

          return (
            categorySlug === slug &&
            item.isActive !== false
          );
        });

        if (!selectedCategory) {
          setError("Category not found.");
          return;
        }

        setCategory(selectedCategory);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Category fetch error:", err);
          setError(err.message || "Unable to load category.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCategory();

    return () => controller.abort();
  }, [slug, language]);

  // Fetch news after identifying the selected category.
  useEffect(() => {
    if (!category?._id) return;

    const controller = new AbortController();

    const fetchCategoryNews = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/news", {
          params: {
            language,
            page,
            limit: 10,
            category: category._id,
            sort: "latest",
          },
          signal: controller.signal,
        });

        const result = response.data.data;

        setNews(result?.news || []);
        setPagination(result?.pagination || null);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Category news error:", err);
          setNews([]);
          setPagination(null);
          setError(err.message || "Unable to load news.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCategoryNews();

    return () => controller.abort();
  }, [category, language, page]);

  const categoryName = getLocalizedValue(
    category?.name,
    language
  );

  if (loading && !category) {
    return (
      <div className="category-message">
        {language === "hi" ? "श्रेणी लोड हो रही है..." : "Loading category..."}
      </div>
    );
  }

  if (error && !category) {
    return (
      <div className="category-message category-error">
        {error}
      </div>
    );
  }

  return (
    <div className="category-page">

      {/* Top advertisement */}
      <Advertisement page="category" position="top" />

      {/* Category heading */}
      <div className="category-header">
        <h1>{categoryName}</h1>
      </div>

      {loading && (
        <p className="category-message">
          {language === "hi" ? "समाचार लोड हो रहे हैं..." : "Loading news..."}
        </p>
      )}

      {error && (
        <p className="category-error">{error}</p>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="category-message">
          {language === "hi"
            ? "इस श्रेणी में अभी कोई समाचार उपलब्ध नहीं है।"
            : "No news available in this category yet."}
        </div>
      )}

      {/* News articles */}
      <div className="category-news-grid">
        {news.map((article, index) => {
          const localizedArticle = getLocalizedArticle(
            article,
            language
          );

          const title = localizedArticle.title || "";
          const excerpt = localizedArticle.excerpt || "";
          const articleSlug = localizedArticle.slug || "";

          const articleUrl = articleSlug
            ? `/news/${language}/${articleSlug}`
            : null;

          return (
            <article
              className="category-news-card"
              key={article._id}
            >
              {/* Article thumbnail */}
              {articleUrl ? (
                <Link
                  to={articleUrl}
                  className="category-news-image-link"
                >
                  <img
                    src={article.thumbnail}
                    alt={
                      getLocalizedValue(
                        article.thumbnailAlt,
                        language
                      ) || title
                    }
                    className="category-news-image"
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                </Link>
              ) : (
                <div className="category-news-image-link">
                  <img
                    src={article.thumbnail}
                    alt={title}
                    className="category-news-image"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="category-news-content">

                {/* Published date */}
                <span className="category-news-date">
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString(
                        language === "hi" ? "hi-IN" : "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : ""}
                </span>

                {/* Article title */}
                <h2>
                  {articleUrl ? (
                    <Link to={articleUrl}>
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                </h2>

                {/* Article excerpt */}
                <p>{excerpt}</p>

                {/* Author */}
                {article.author?.name && (
                  <span className="category-news-author">
                    {article.author.name}
                  </span>
                )}

              </div>
            </article>
          );
        })}
      </div>

      {/* Middle advertisement */}
      {!loading && news.length > 0 && (
        <Advertisement page="category" position="middle" />
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="category-pagination">

          <button
            type="button"
            disabled={!pagination.hasPreviousPage || loading}
            onClick={() => setPage((prev) => prev - 1)}
          >
            {language === "hi" ? "पिछला" : "Previous"}
          </button>

          <span>
            {pagination.page} / {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={!pagination.hasNextPage || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {language === "hi" ? "अगला" : "Next"}
          </button>

        </div>
      )}

      {/* Bottom advertisement */}
      <Advertisement page="category" position="bottom" />

    </div>
  );
};

export default Category;
