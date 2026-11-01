
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import Advertisement from "../../components/Advertisement/Advertisement";
import "./Subcategory.css";

const getLocalizedValue = (value, language = "en") => {
  if (typeof value === "string") return value;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const localizedValue = value[language] || value.en || value.hi || "";

  if (
    typeof localizedValue === "string" ||
    typeof localizedValue === "number"
  ) {
    return String(localizedValue);
  }

  if (localizedValue && typeof localizedValue === "object") {
    const nestedValue =
      localizedValue.title ||
      localizedValue.name ||
      localizedValue.text ||
      "";

    return typeof nestedValue === "string" ||
      typeof nestedValue === "number"
      ? String(nestedValue)
      : "";
  }

  return "";
};

const extractArray = (response, keys = []) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) {
      return data.data[key];
    }
  }

  return [];
};

const extractNewsData = (response) => {
  const root = response?.data;
  const data = root?.data || root;

  let articles = [];

  if (Array.isArray(data)) {
    articles = data;
  } else {
    articles =
      data?.news ||
      data?.articles ||
      root?.news ||
      root?.articles ||
      [];
  }

  return {
    articles: Array.isArray(articles) ? articles : [],
    pagination: data?.pagination || root?.pagination || {},
  };
};

const formatDate = (date, language = "en") => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString(
    language === "hi" ? "hi-IN" : "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

const getImageUrl = (article) => {
  const image =
    article?.thumbnail?.url ||
    article?.thumbnail ||
    article?.featuredImage?.url ||
    article?.featuredImage ||
    article?.image?.url ||
    article?.image ||
    "";

  return typeof image === "string" ? image : "";
};

function Subcategory() {
  const { slug } = useParams();
  const { language: selectedLanguage } = useLanguage();

  const language = selectedLanguage === "hi" ? "hi" : "en";

  const [subcategory, setSubcategory] = useState(null);
  const [category, setCategory] = useState(null);
  const [news, setNews] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [subcategoryLoading, setSubcategoryLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [slug, language]);

  useEffect(() => {
    const controller = new AbortController();

    const findSubcategory = async () => {
      try {
        setSubcategoryLoading(true);
        setError("");
        setSubcategory(null);
        setCategory(null);
        setNews([]);

        const categoryResponse = await api.get("/categories", {
          signal: controller.signal,
        });

        const categories = extractArray(categoryResponse, [
          "categories",
        ]).filter((item) => item.isActive !== false);

        if (!categories.length) {
          throw new Error("No categories found.");
        }

        const results = await Promise.all(
          categories.map(async (item) => {
            const response = await api.get(
              `/subcategories/category/${item._id}`,
              {
                signal: controller.signal,
              }
            );

            return {
              category: item,
              subcategories: extractArray(response, [
                "subcategories",
              ]).filter((sub) => sub.isActive !== false),
            };
          })
        );

        let matchedSubcategory = null;
        let matchedCategory = null;

        for (const result of results) {
          const found = result.subcategories.find((item) => {
            const localizedSlug = getLocalizedValue(
              item.slug,
              language
            );

            return localizedSlug === slug;
          });

          if (found) {
            matchedSubcategory = found;
            matchedCategory = result.category;
            break;
          }
        }

        if (!matchedSubcategory) {
          setError("Subcategory not found.");
          return;
        }

        setSubcategory(matchedSubcategory);
        setCategory(matchedCategory);
      } catch (err) {
        if (
          controller.signal.aborted ||
          err.code === "ERR_CANCELED" ||
          err.name === "CanceledError" ||
          err.name === "AbortError"
        ) {
          return;
        }

        console.error("SUBCATEGORY LOOKUP ERROR:", {
          message: err.message,
          url: err.config?.url,
          status: err.response?.status,
          response: err.response?.data,
        });

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load this subcategory."
        );
      } finally {
        if (!controller.signal.aborted) {
          setSubcategoryLoading(false);
        }
      }
    };

    findSubcategory();

    return () => controller.abort();
  }, [slug, language]);

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

        const { articles, pagination } = extractNewsData(response);

        setNews(articles);

        const pages = Number(
          pagination?.totalPages ||
            pagination?.pages ||
            1
        );

        setTotalPages(
          Number.isFinite(pages) && pages > 0 ? pages : 1
        );
      } catch (err) {
        if (
          controller.signal.aborted ||
          err.code === "ERR_CANCELED" ||
          err.name === "CanceledError" ||
          err.name === "AbortError"
        ) {
          return;
        }

        console.error("SUBCATEGORY NEWS ERROR:", {
          message: err.message,
          url: err.config?.url,
          params: err.config?.params,
          status: err.response?.status,
          response: err.response?.data,
        });

        setError(
          err.response?.data?.message ||
            "Unable to load news. Please try again."
        );
      } finally {
        if (!controller.signal.aborted) {
          setNewsLoading(false);
        }
      }
    };

    fetchNews();

    return () => controller.abort();
  }, [subcategory?._id, language, page]);

  const getArticleSlug = (article) =>
    getLocalizedValue(article?.slug, language);

  if (subcategoryLoading) {
    return (
      <div className="subcategory-message">
        <div className="subcategory-spinner" />
        <p>
          {language === "hi"
            ? "उपश्रेणी लोड हो रही है..."
            : "Loading subcategory..."}
        </p>
      </div>
    );
  }

  if (error && !subcategory) {
    return (
      <div className="subcategory-message">
        <h2>{error}</h2>
        <Link to="/">
          {language === "hi" ? "होम पेज पर जाएं" : "Go to Homepage"}
        </Link>
      </div>
    );
  }

  if (!subcategory) return null;

  return (
    <div className="subcategory-page">
      <div className="subcategory-ad">
        <Advertisement page="category" position="top" />
      </div>

      <div className="subcategory-breadcrumb">
        <Link to="/">
          {language === "hi" ? "होम" : "Home"}
        </Link>

        <span>/</span>

        <Link
          to={`/category/${getLocalizedValue(
            category?.slug,
            language
          )}`}
        >
          {getLocalizedValue(category?.name, language)}
        </Link>

        <span>/</span>

        <span>
          {getLocalizedValue(subcategory?.name, language)}
        </span>
      </div>

      <div className="subcategory-heading">
        <div>
          <span className="subcategory-label">
            {language === "hi" ? "उपश्रेणी" : "SUBCATEGORY"}
          </span>

          <h1>
            {getLocalizedValue(subcategory?.name, language)}
          </h1>

          {subcategory?.description && (
            <p>
              {getLocalizedValue(
                subcategory.description,
                language
              )}
            </p>
          )}
        </div>
      </div>

      <section className="subcategory-news-section">
        <div className="subcategory-section-header">
          <h2>
            {language === "hi" ? "ताज़ा खबरें" : "Latest News"}
          </h2>

          <span>
            {news.length}{" "}
            {language === "hi" ? "खबरें" : "Articles"}
          </span>
        </div>

        {newsLoading ? (
          <div className="subcategory-message">
            <div className="subcategory-spinner" />
            <p>
              {language === "hi"
                ? "खबरें लोड हो रही हैं..."
                : "Loading news..."}
            </p>
          </div>
        ) : error ? (
          <div className="subcategory-empty">
            <h3>{error}</h3>
          </div>
        ) : news.length === 0 ? (
          <div className="subcategory-empty">
            <h3>
              {language === "hi"
                ? "अभी कोई खबर उपलब्ध नहीं है"
                : "No news available"}
            </h3>

            <p>
              {language === "hi"
                ? "इस उपश्रेणी में जल्द ही खबरें प्रकाशित होंगी।"
                : "Articles will appear here once published."}
            </p>
          </div>
        ) : (
          <div className="subcategory-news-grid">
            {news.map((article) => {
              const image = getImageUrl(article);
              const articleSlug = getArticleSlug(article);
              const articleTitle = getLocalizedValue(
                article.title,
                language
              );
              const articleExcerpt = getLocalizedValue(
                article.excerpt,
                language
              );

              return (
                <article
                  className="subcategory-news-card"
                  key={article._id}
                >
                  <Link
                    to={`/news/${language}/${articleSlug}`}
                    className="subcategory-news-image"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={articleTitle}
                        loading="lazy"
                      />
                    ) : (
                      <div className="subcategory-image-placeholder">
                        No Image
                      </div>
                    )}
                  </Link>

                  <div className="subcategory-news-content">
                    <span className="subcategory-news-date">
                      {formatDate(
                        article.publishedAt || article.createdAt,
                        language
                      )}
                    </span>

                    <h3>
                      <Link
                        to={`/news/${language}/${articleSlug}`}
                      >
                        {articleTitle}
                      </Link>
                    </h3>

                    <p>{articleExcerpt}</p>

                    <Link
                      className="subcategory-read-more"
                      to={`/news/${language}/${articleSlug}`}
                    >
                      {language === "hi"
                        ? "पूरी खबर पढ़ें"
                        : "Read More"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="subcategory-ad">
        <Advertisement page="category" position="middle" />
      </div>

      {!newsLoading && totalPages > 1 && (
        <div className="subcategory-pagination">
          <button
            disabled={page <= 1}
            onClick={() => {
              setPage((current) => current - 1);
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            {language === "hi" ? "पिछला" : "Previous"}
          </button>

          <span>
            {language === "hi" ? "पृष्ठ" : "Page"} {page}{" "}
            {language === "hi" ? "में से" : "of"} {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => {
              setPage((current) => current + 1);
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            {language === "hi" ? "अगला" : "Next"}
          </button>
        </div>
      )}

      <div className="subcategory-ad">
        <Advertisement page="category" position="bottom" />
      </div>
    </div>
  );
}

export default Subcategory;
