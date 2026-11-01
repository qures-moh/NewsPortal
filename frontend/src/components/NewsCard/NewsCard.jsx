
import { Link } from "react-router-dom";
import "./NewsCard.css";

const NewsCard = ({ article, language }) => {
  const getLocalized = (value, field) => {
    if (!value) return "";

    if (typeof value === "string") {
      return value;
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return "";
    }

    // Handle nested structure:
    // { title: { en: "...", hi: "..." }, excerpt: ... }
    if (field && value[field] !== undefined) {
      return getLocalized(value[field]);
    }

    const localized =
      value[language] || value.en || value.hi;

    if (typeof localized === "string") {
      return localized;
    }

    // Handle an object containing title/excerpt/content/slug
    if (localized && typeof localized === "object" && field) {
      return getLocalized(localized[field]);
    }

    return "";
  };

  const title = getLocalized(article.title, "title");
  const excerpt = getLocalized(article.excerpt, "excerpt");
  const slug = getLocalized(article.slug, "slug");

  return (
    <article className="news-card">
      <Link to={`/news/${language}/${slug}`}>
        <img
          src={article.thumbnail}
          alt={getLocalized(article.thumbnailAlt) || title}
          loading="lazy"
        />

        <div className="news-card-content">
          <h2>{title}</h2>
          <p>{excerpt}</p>

          <span>
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString(
                  language === "hi" ? "hi-IN" : "en-IN"
                )
              : ""}
          </span>
        </div>
      </Link>
    </article>
  );
};

export default NewsCard;
