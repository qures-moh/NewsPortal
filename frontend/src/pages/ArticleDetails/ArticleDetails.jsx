
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";

import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import Advertisement from "../../components/Advertisement/Advertisement";

import "./ArticleDetails.css";

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

const ArticleDetails = () => {
  const { slug, language: routeLanguage } = useParams();
  const { language: selectedLanguage } = useLanguage();

  // URL language takes priority for article content.
  const language = ["en", "hi"].includes(routeLanguage)
    ? routeLanguage
    : selectedLanguage;

  const [article, setArticle] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch article details.
  useEffect(() => {
    const controller = new AbortController();

    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError("");
        setArticle(null);
        setRelatedNews([]);

        const response = await api.get(
          `/news/${language}/${encodeURIComponent(slug)}`,
          {
            signal: controller.signal,
          }
        );

        const result = response.data.data;

        const articleData =
          result?.article ||
          result?.news ||
          result ||
          response.data.article;

        if (!articleData?._id) {
          throw new Error("Article not found.");
        }

        setArticle(articleData);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Article fetch error:", err);
          setError(err.message || "Unable to load this article.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      fetchArticle();
    }

    return () => controller.abort();
  }, [slug, language]);

  // Increment article views.
  useEffect(() => {
    if (!article?._id) return;

    const controller = new AbortController();

    api
      .post(
        `/news/${article._id}/views`,
        {},
        {
          signal: controller.signal,
        }
      )
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error("View count update failed:", err);
        }
      });

    return () => controller.abort();
  }, [article?._id]);

  // Fetch related articles.
  useEffect(() => {
    if (!article?._id || !article?.category?._id) return;

    const controller = new AbortController();

    const fetchRelatedNews = async () => {
      try {
        const response = await api.get("/news", {
          params: {
            language,
            category: article.category._id,
            limit: 5,
            sort: "latest",
          },
          signal: controller.signal,
        });

        const result = response.data.data;

        const related = (result?.news || []).filter(
          (item) => item._id !== article._id
        );

        setRelatedNews(related.slice(0, 4));
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Related news error:", err);
        }
      }
    };

    fetchRelatedNews();

    return () => controller.abort();
  }, [article, language]);

  if (loading) {
    return (
      <div className="article-message">
        {language === "hi"
          ? "समाचार लोड हो रहा है..."
          : "Loading article..."}
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-message article-error">
        {error ||
          (language === "hi"
            ? "समाचार नहीं मिला।"
            : "Article not found.")}

        <br />

        <Link to="/">Go to homepage</Link>
      </div>
    );
  }

  const localizedArticle = getLocalizedArticle(article, language);

  const title = localizedArticle.title || "";
  const excerpt = localizedArticle.excerpt || "";
  const content = localizedArticle.content || "";

  // Sanitize HTML before rendering article content.
  const cleanContent = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
  });

  const categoryName = getLocalizedValue(
    article.category?.name,
    language
  );

  const categorySlug = getLocalizedValue(
    article.category?.slug,
    language
  );

  const thumbnailAlt =
    getLocalizedValue(article.thumbnailAlt, language) || title;

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        language === "hi" ? "hi-IN" : "en-IN",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      )
    : "";

  const sortedMedia = Array.isArray(article.media)
    ? [...article.media].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      )
    : [];

  return (
    <div className="article-page">

      {/* Top advertisement */}
      <Advertisement page="article" position="top" />

      <div className="article-layout">

        {/* Main article */}
        <main className="article-main">

          {/* Breadcrumb */}
          <div className="article-breadcrumb">
            <Link to="/">
              {language === "hi" ? "होम" : "Home"}
            </Link>

            <span>/</span>

            {categorySlug && (
              <Link to={`/category/${categorySlug}`}>
                {categoryName}
              </Link>
            )}
          </div>

          {/* Breaking news label */}
          {article.isBreaking && (
            <span className="article-breaking-label">
              {language === "hi"
                ? "ब्रेकिंग न्यूज़"
                : "BREAKING NEWS"}
            </span>
          )}

          {/* Article title */}
          <h1 className="article-title">
            {title}
          </h1>

          {/* Excerpt */}
          {excerpt && (
            <p className="article-excerpt">
              {excerpt}
            </p>
          )}

          {/* Article information */}
          <div className="article-meta">

            <span>
              {article.author?.name || "News Portal Admin"}
            </span>

            {publishedDate && (
              <>
                <span className="article-meta-dot">•</span>

                <time dateTime={article.publishedAt}>
                  {publishedDate}
                </time>
              </>
            )}

            <span className="article-meta-dot">•</span>

            <span>
              {article.views || 0}{" "}
              {language === "hi" ? "व्यूज़" : "Views"}
            </span>

          </div>

          {/* Featured image */}
          {article.thumbnail && (
            <figure className="article-featured-image">
              <img
                src={article.thumbnail}
                alt={thumbnailAlt}
                loading="eager"
              />
            </figure>
          )}

          {/* Article HTML content */}
          <div className="article-content">
            {cleanContent ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: cleanContent,
                }}
              />
            ) : (
              <p>
                {language === "hi"
                  ? "इस समाचार की पूरी जानकारी उपलब्ध नहीं है।"
                  : "Full article content is not available."}
              </p>
            )}
          </div>

          {/* Additional article images and videos */}
          {sortedMedia.length > 0 && (
            <div className="article-media">

              {sortedMedia.map((media, index) => (
                <figure key={`${media.url}-${index}`}>

                  {media.type === "video" ? (
                    <video controls preload="metadata">
                      <source src={media.url} />
                      Your browser does not support video.
                    </video>
                  ) : (
                    <img
                      src={media.url}
                      alt={
                        getLocalizedValue(media.alt, language) ||
                        title
                      }
                      loading="lazy"
                    />
                  )}

                </figure>
              ))}

            </div>
          )}

          {/* Middle advertisement */}
          <Advertisement page="article" position="middle" />

          {/* Tags */}
          {Array.isArray(article.tags) && article.tags.length > 0 && (
            <div className="article-tags">

              <strong>
                {language === "hi" ? "टैग:" : "Tags:"}
              </strong>

              {article.tags.map((tag, index) => (
                <span key={`${tag}-${index}`}>
                  {tag}
                </span>
              ))}

            </div>
          )}

        </main>

        {/* Related news sidebar */}
        <aside className="article-sidebar">

          <h2>
            {language === "hi"
              ? "संबंधित समाचार"
              : "Related News"}
          </h2>

          {relatedNews.length > 0 ? (
            relatedNews.map((item) => {
              const localized = getLocalizedArticle(
                item,
                language
              );

              const relatedSlug = localized.slug;

              if (!relatedSlug) return null;

              return (
                <Link
                  className="related-news-card"
                  key={item._id}
                  to={`/news/${language}/${relatedSlug}`}
                >

                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={localized.title || ""}
                      loading="lazy"
                    />
                  )}

                  <h3>
                    {localized.title}
                  </h3>

                </Link>
              );
            })
          ) : (
            <p className="related-news-empty">
              {language === "hi"
                ? "संबंधित समाचार उपलब्ध नहीं हैं।"
                : "No related news available."}
            </p>
          )}

        </aside>

      </div>

      {/* Bottom advertisement */}
      <Advertisement page="article" position="bottom" />

    </div>
  );
};

export default ArticleDetails;
