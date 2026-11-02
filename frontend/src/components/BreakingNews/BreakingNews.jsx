import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Zap, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import { getLocalizedArticle } from "../../utils/newsHelpers";
import "./BreakingNews.css";

const BreakingNews = ({ news: initialNews }) => {
  const { language } = useLanguage();
  const [news, setNews] = useState(Array.isArray(initialNews) ? initialNews : []);
  const [loading, setLoading] = useState(!initialNews || initialNews.length === 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isHindi = language === "hi";

  // If initialNews is passed and updates, use it
  useEffect(() => {
    if (Array.isArray(initialNews) && initialNews.length > 0) {
      setNews(initialNews);
      setLoading(false);
    }
  }, [initialNews]);

  // If no initialNews provided, fetch breaking news
  useEffect(() => {
    if (Array.isArray(initialNews) && initialNews.length > 0) return;

    let isMounted = true;
    const fetchBreaking = async () => {
      try {
        const response = await api.get("/news", {
          params: {
            language,
            page: 1,
            limit: 10,
            breaking: true,
            sort: "latest",
          },
        });
        const items = response.data?.data?.news || [];
        if (isMounted) {
          setNews(items.filter((a) => a.isBreaking));
        }
      } catch (err) {
        console.warn("Breaking news ticker error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBreaking();
    return () => {
      isMounted = false;
    };
  }, [language, initialNews]);

  // Auto cycle ticker every 5 seconds
  useEffect(() => {
    if (news.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [news.length, isPaused]);

  if (loading || news.length === 0) return null;

  const currentArticle = news[currentIndex] || news[0];
  const { title, slug } = getLocalizedArticle(currentArticle, language);

  if (!title || !slug) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % news.length);
  };

  return (
    <div
      className="breaking-ticker-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container breaking-ticker-container">
        {/* Live Badge */}
        <div className="breaking-ticker-badge">
          <span className="live-pulse-dot" />
          <Zap size={14} className="zap-icon" />
          <span className="badge-text">
            {isHindi ? "ब्रेकिंग न्यूज़" : "BREAKING"}
          </span>
        </div>

        {/* Ticker Content */}
        <div className="breaking-ticker-headline">
          <Link
            to={`/news/${language}/${slug}`}
            className="breaking-headline-link"
          >
            <span className="ticker-count">[{currentIndex + 1}/{news.length}]</span>
            <span className="ticker-title">{title}</span>
          </Link>
        </div>

        {/* Ticker Controls */}
        <div className="breaking-ticker-controls">
          <button
            type="button"
            className="ticker-ctrl-btn"
            onClick={handlePrev}
            aria-label="Previous headline"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="ticker-ctrl-btn"
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label={isPaused ? "Play ticker" : "Pause ticker"}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>

          <button
            type="button"
            className="ticker-ctrl-btn"
            onClick={handleNext}
            aria-label="Next headline"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakingNews;