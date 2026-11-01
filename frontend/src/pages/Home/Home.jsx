
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";

import Advertisement from "../../components/Advertisement/Advertisement";
import BreakingNews from "../../components/BreakingNews/BreakingNews";

import "./Home.css";

// Get localized content
const getLocalizedValue = (value, language) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  return value[language] || value.en || value.hi || "";
};

// Get localized article content
const getLocalizedArticle = (article, language) => {
  return (
    article?.title?.[language] ||
    article?.title?.en ||
    article?.title?.hi ||
    {}
  );
};

// Format date
const formatDate = (date, language) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString(
    language === "hi" ? "hi-IN" : "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

// News Card
const NewsCard = ({ article, language, featured = false }) => {
  const localized = getLocalizedArticle(article, language);
  const slug = localized.slug;

  if (!slug) return null;

  return (
    <article className={`home-news-card ${featured ? "featured-card" : ""}`}>
      <Link
        to={`/news/${language}/${slug}`}
        className="home-news-image-link"
      >
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt={
              getLocalizedValue(article.thumbnailAlt, language) ||
              localized.title ||
              ""
            }
            loading="lazy"
          />
        ) : (
          <div className="home-image-placeholder">
            {language === "hi" ? "समाचार" : "News"}
          </div>
        )}
      </Link>

      <div className="home-news-content">
        {article.category && (
          <span className="home-news-category">
            {getLocalizedValue(article.category.name, language)}
          </span>
        )}

        <h3>
          <Link to={`/news/${language}/${slug}`}>
            {localized.title}
          </Link>
        </h3>

        {localized.excerpt && <p>{localized.excerpt}</p>}

        <div className="home-news-meta">
          <span>{formatDate(article.publishedAt, language)}</span>

          {article.author?.name && (
            <span>{article.author.name}</span>
          )}
        </div>
      </div>
    </article>
  );
};

// Homepage
const Home = () => {
  const { language } = useLanguage();

  const [breakingNews, setBreakingNews] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [categorySections, setCategorySections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchHomepageData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/news/homepage", {
          params: { language },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const homepageData = response.data.data;

        if (!homepageData) {
          throw new Error("Invalid homepage response");
        }

        setBreakingNews(
          Array.isArray(homepageData.breakingNews)
            ? homepageData.breakingNews
            : []
        );

        setFeaturedNews(
          Array.isArray(homepageData.featuredNews)
            ? homepageData.featuredNews
            : []
        );

        setLatestNews(
          Array.isArray(homepageData.latestNews)
            ? homepageData.latestNews
            : []
        );

        setTrendingNews(
          Array.isArray(homepageData.trendingNews)
            ? homepageData.trendingNews
            : []
        );

        setCategorySections(
          Array.isArray(homepageData.categorySections)
            ? homepageData.categorySections.filter(
                (section) =>
                  section.category &&
                  Array.isArray(section.news) &&
                  section.news.length > 0
              )
            : []
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Homepage fetch error:", err);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load homepage news."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchHomepageData();

    return () => controller.abort();
  }, [language]);

  const labels = {
    featured: language === "hi" ? "प्रमुख समाचार" : "Featured News",
    latest: language === "hi" ? "ताज़ा खबरें" : "Latest News",
    trending: language === "hi" ? "ट्रेंडिंग न्यूज़" : "Trending News",
    viewAll: language === "hi" ? "सभी देखें" : "View All",
    empty:
      language === "hi"
        ? "अभी कोई समाचार उपलब्ध नहीं है।"
        : "No news available at the moment.",
  };

  return (
    <div className="home-page">
      {/* Top Advertisement */}
      <Advertisement page="homepage" position="top" />

      {/* Breaking News Ticker */}
      <BreakingNews news={breakingNews} />

      {/* Error Message */}
      {error && (
        <div className="home-message home-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="home-message">
          {language === "hi"
            ? "समाचार लोड हो रहे हैं..."
            : "Loading news..."}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Featured News */}
          {featuredNews.length > 0 && (
            <section className="home-section">
              <div className="home-section-heading">
                <h2>{labels.featured}</h2>
              </div>

              <div className="featured-news-grid">
                {featuredNews.slice(0, 4).map((article, index) => (
                  <NewsCard
                    key={article._id}
                    article={article}
                    language={language}
                    featured={index === 0}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Latest News */}
          <section className="home-section">
            <div className="home-section-heading">
              <h2>{labels.latest}</h2>
            </div>

            {latestNews.length > 0 ? (
              <div className="latest-news-grid">
                {latestNews.slice(0, 10).map((article) => (
                  <NewsCard
                    key={article._id}
                    article={article}
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <p className="home-message">{labels.empty}</p>
            )}
          </section>

          {/* Middle Advertisement */}
          <Advertisement page="homepage" position="middle" />

          {/* Trending News */}
          {trendingNews.length > 0 && (
            <section className="home-section">
              <div className="home-section-heading">
                <h2>{labels.trending}</h2>
              </div>

              <div className="trending-news-grid">
                {trendingNews.map((article) => (
                  <NewsCard
                    key={article._id}
                    article={article}
                    language={language}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Dynamic Category-wise News */}
          {categorySections.map(({ category, news }) => {
            const categoryName = getLocalizedValue(
              category.name,
              language
            );

            const categorySlug = getLocalizedValue(
              category.slug,
              language
            );

            return (
              <section
                className="home-section home-category-section"
                key={category._id}
              >
                <div className="home-section-heading">
                  <h2>{categoryName}</h2>

                  <Link to={`/category/${categorySlug}`}>
                    {labels.viewAll} →
                  </Link>
                </div>

                <div className="category-home-grid">
                  {news.map((article) => (
                    <NewsCard
                      key={article._id}
                      article={article}
                      language={language}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Empty Homepage */}
          {!featuredNews.length &&
            !latestNews.length &&
            !trendingNews.length &&
            !categorySections.length && (
              <p className="home-message">{labels.empty}</p>
            )}
        </>
      )}

      {/* Bottom Advertisement */}
      <Advertisement page="homepage" position="bottom" />
    </div>
  );
};

export default Home;
