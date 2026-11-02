import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Video,
  Layers,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import Advertisement from "../../components/Advertisement/Advertisement";
import BreakingNews from "../../components/BreakingNews/BreakingNews";
import NewsCard from "../../components/NewsCard/NewsCard";
import { getLocalizedValue } from "../../utils/newsHelpers";
import "./Home.css";

const Home = () => {
  const { language } = useLanguage();

  const [breakingNews, setBreakingNews] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [categorySections, setCategorySections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isHindi = language === "hi";

  const fetchHomepage = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/news/homepage", {
        params: { language },
        signal,
      });

      const data = response.data?.data || {};

      setBreakingNews(Array.isArray(data.breakingNews) ? data.breakingNews : []);
      setFeaturedNews(Array.isArray(data.featuredNews) ? data.featuredNews : []);
      setLatestNews(Array.isArray(data.latestNews) ? data.latestNews : []);
      setTrendingNews(Array.isArray(data.trendingNews) ? data.trendingNews : []);

      
      const validCategories = (Array.isArray(data.categorySections) ? data.categorySections : []).filter(
        (sec) => sec.category && Array.isArray(sec.news) && sec.news.length > 0
      );
      setCategorySections(validCategories);
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Homepage load error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          (isHindi ? "मुखपृष्ठ समाचार लोड करने में असमर्थ।" : "Unable to load homepage stories.")
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchHomepage(controller.signal);
    return () => controller.abort();
  }, [language]);

  // Video articles: filter from latest/featured articles that have video attachments
  const videoArticles = [...featuredNews, ...latestNews].filter(
    (item) => Array.isArray(item.media) && item.media.some((m) => m.type === "video")
  ).slice(0, 4);

  // Lead story is first featured item, remainder are secondary hero grid
  const leadStory = featuredNews[0] || latestNews[0] || null;
  const secondaryStories = featuredNews.slice(1, 4).length > 0
    ? featuredNews.slice(1, 4)
    : latestNews.slice(1, 4);

  return (
    <div className="homepage-container">
    
      <div className="container">
        <Advertisement page="homepage" position="top" />
      </div>

      
      <BreakingNews news={breakingNews} />

      <div className="container homepage-main-layout">
       
        {loading && (
          <div className="homepage-skeleton-grid">
            <div className="skeleton skeleton-hero" />
            <div className="skeleton-side-col">
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
            </div>
          </div>
        )}

      
        {error && !loading && (
          <div className="homepage-error-box">
            <AlertCircle size={28} className="error-icon" />
            <div>
              <h3>{isHindi ? "समाचार लोड करने में समस्या आई" : "Failed to load latest stories"}</h3>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="retry-btn"
              onClick={() => fetchHomepage()}
            >
              <RefreshCw size={15} />
              <span>{isHindi ? "पुनः प्रयास करें" : "Try Again"}</span>
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
           
            {leadStory && (
              <section className="hero-magazine-section">
                <div className="hero-grid">
                  {/* Lead Main Story */}
                  <div className="hero-lead-col">
                    <NewsCard article={leadStory} variant="hero" />
                  </div>

                  {/* Secondary Stories Stack */}
                  {secondaryStories.length > 0 && (
                    <div className="hero-secondary-col">
                      <div className="editorial-section-header">
                        <span className="editorial-section-title">
                          <span className="title-bar" />
                          <Sparkles size={16} />
                          {isHindi ? "विशेष सुर्खियां" : "TOP HEADLINES"}
                        </span>
                      </div>

                      <div className="secondary-stories-list">
                        {secondaryStories.map((article) => (
                          <NewsCard
                            key={article._id}
                            article={article}
                            variant="horizontal"
                            showExcerpt={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 4. TWO-COLUMN: LATEST NEWS + TRENDING RANKED SIDEBAR */}
            <section className="main-feed-section">
              <div className="feed-layout-grid">
                {/* Left Feed: Latest Stories (2/3) */}
                <div className="feed-primary-col">
                  <div className="editorial-section-header has-accent">
                    <span className="editorial-section-title">
                      <span className="title-bar" />
                      <Clock size={16} />
                      {isHindi ? "ताज़ा घटनाक्रम" : "LATEST DISPATCHES"}
                    </span>
                    <span className="feed-timestamp">
                      {isHindi ? "लगातार अपडेट" : "Continuously Updated"}
                    </span>
                  </div>

                  {latestNews.length > 0 ? (
                    <div className="latest-stories-grid">
                      {latestNews.slice(0, 8).map((article) => (
                        <NewsCard
                          key={article._id}
                          article={article}
                          variant="standard"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="no-news-msg">
                      {isHindi ? "वर्तमान में कोई ताज़ा खबर नहीं है।" : "No recent articles available."}
                    </p>
                  )}
                </div>

                {/* Right Sidebar: Trending Ranked Stories (1/3) */}
                <aside className="feed-sidebar-col">
                  <div className="trending-widget-box">
                    <div className="trending-widget-header">
                      <span className="trending-widget-title">
                        <Flame size={18} className="flame-icon" />
                        {isHindi ? "सबसे ज़्यादा पढ़ी गई" : "MOST POPULAR"}
                      </span>
                      <TrendingUp size={16} className="trending-trend-icon" />
                    </div>

                    <div className="trending-ranked-list">
                      {(trendingNews.length > 0 ? trendingNews : latestNews.slice(0, 5)).map(
                        (article, index) => (
                          <NewsCard
                            key={article._id}
                            article={article}
                            variant="ranked"
                            rank={index + 1}
                          />
                        )
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </section>

            {/* 5. MIDDLE ADVERTISEMENT */}
            <Advertisement page="homepage" position="middle" />

            {/* 6. MULTIMEDIA / VIDEO STORIES SECTION (If available) */}
            {videoArticles.length > 0 && (
              <section className="video-spotlight-section">
                <div className="editorial-section-header">
                  <span className="editorial-section-title video-title">
                    <Video size={18} />
                    {isHindi ? "वीडियो रिपोर्ट एवं विश्लेषण" : "VIDEO DISPATCHES & SPECIALS"}
                  </span>
                </div>

                <div className="video-stories-grid">
                  {videoArticles.map((article) => (
                    <NewsCard
                      key={article._id}
                      article={article}
                      variant="standard"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 7. DYNAMIC CATEGORY BLOCKS (Curated from admin categories) */}
            {categorySections.map(({ category, news }) => {
              const categoryName = getLocalizedValue(category.name, language);
              const categorySlug = getLocalizedValue(category.slug, language);

              return (
                <section key={category._id} className="category-editorial-block">
                  <div className="editorial-section-header has-accent">
                    <span className="editorial-section-title">
                      <span className="title-bar" />
                      {categoryName}
                    </span>
                    <Link
                      to={`/category/${categorySlug}`}
                      className="editorial-section-link"
                    >
                      <span>{isHindi ? "सभी खबरें देखें" : "View All"}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>

                  <div className="category-block-grid">
                    {news.map((article) => (
                      <NewsCard
                        key={article._id}
                        article={article}
                        variant="standard"
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>

      {/* 8. BOTTOM ADVERTISEMENT */}
      <div className="container">
        <Advertisement page="homepage" position="bottom" />
      </div>
    </div>
  );
};

export default Home;
