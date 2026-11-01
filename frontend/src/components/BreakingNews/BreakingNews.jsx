import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import { Zap } from "lucide-react";
import "./BreakingNews.css";

const BreakingNews = () => {
  const { language } = useLanguage();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchBreakingNews = async () => {
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

        const breakingNews = response.data.data?.news || [];

        if (isMounted) {
          setNews(
            breakingNews.filter((article) => article.isBreaking)
          );
        }
      } catch (error) {
        console.error("Breaking news fetch error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBreakingNews();

    const interval = setInterval(fetchBreakingNews, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [language]);

  const getLocalizedValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;

    return value[language] || value.en || value.hi || "";
  };

  if (loading || news.length === 0) return null;

  return (
    <section className="breaking-news">
      <div className="breaking-label">
        <Zap size={16} fill="currentColor" />
        <span>
          {language === "hi" ? "ब्रेकिंग न्यूज़" : "BREAKING NEWS"}
        </span>
      </div>

      <div className="breaking-track-wrapper">
        <div className="breaking-track">
          {[...news, ...news].map((article, index) => {
            const title = getLocalizedValue(
              article.title?.[language]?.title
            );

            const slug = getLocalizedValue(
              article.title?.[language]?.slug
            );

            if (!title || !slug) return null;

            return (
              <Link
                key={`${article._id}-${index}`}
                to={`/news/${language}/${slug}`}
                className="breaking-item"
              >
                {title}
                <span className="breaking-separator">◆</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BreakingNews;