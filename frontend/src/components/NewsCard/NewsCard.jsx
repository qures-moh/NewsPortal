import { Link } from "react-router-dom";
import { Clock, Video, Flame } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getImageUrl, getNewsPlaceholder } from "../../utils/imageUrl";
import {
  getLocalizedArticle,
  getLocalizedValue,
  formatNewsDate,
  getRelativeTime,
  calculateReadingTime,
} from "../../utils/newsHelpers";
import "./NewsCard.css";

const NewsCard = ({
  article,
  variant = "standard",
  rank = null,
  showCategory = true,
  showExcerpt = true,
}) => {
  const { language } = useLanguage();

  if (!article) return null;

  const { title, slug, excerpt, content } = getLocalizedArticle(article, language);
  if (!slug || !title) return null;

  const articleUrl = `/news/${language}/${slug}`;
  const categoryName = getLocalizedValue(article.category?.name, language);
  const categorySlug = getLocalizedValue(article.category?.slug, language);

  const thumbnailUrl = article.thumbnail
    ? getImageUrl(article.thumbnail)
    : getNewsPlaceholder(categoryName || "NEWS");

  const thumbnailAlt = getLocalizedValue(article.thumbnailAlt, language) || title;

  const formattedDate = formatNewsDate(article.publishedAt || article.createdAt, language);
  const timeAgo = getRelativeTime(article.publishedAt || article.createdAt, language);
  const readTime = calculateReadingTime(content, language);

  const hasVideo = Array.isArray(article.media) && article.media.some((m) => m.type === "video");

  if (variant === "hero") {
    return (
      <article className="news-card-hero">
        <Link to={articleUrl} className="card-hero-image-wrap">
          <img
            src={thumbnailUrl}
            alt={thumbnailAlt}
            className="card-hero-img"
            loading="eager"
            onError={(e) => {
              e.currentTarget.src = getNewsPlaceholder(categoryName || "NEWS");
            }}
          />
          <div className="card-hero-overlay" />
          {hasVideo && (
            <span className="card-video-pill">
              <Video size={14} /> Video
            </span>
          )}
        </Link>

        <div className="card-hero-content">
          <div className="card-meta-top">
            {showCategory && categoryName && (
              <Link
                to={categorySlug ? `/category/${categorySlug}` : "#"}
                className="category-badge"
              >
                {categoryName}
              </Link>
            )}
            <span className="card-time-ago">
              <Clock size={12} /> {timeAgo}
            </span>
          </div>

          <h2 className="card-hero-title">
            <Link to={articleUrl}>{title}</Link>
          </h2>

          {showExcerpt && excerpt && (
            <p className="card-hero-excerpt">{excerpt}</p>
          )}

          <div className="card-hero-byline">
            <span className="card-read-time">{readTime}</span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "ranked") {
    return (
      <article className="news-card-ranked">
        <span className="rank-number">{String(rank || 1).padStart(2, "0")}</span>
        <div className="ranked-content">
          {showCategory && categoryName && (
            <span className="ranked-category">{categoryName}</span>
          )}
          <h4 className="ranked-title">
            <Link to={articleUrl}>{title}</Link>
          </h4>
          <div className="ranked-meta">
            <span>{timeAgo}</span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "horizontal" || variant === "compact") {
    return (
      <article className={`news-card-horizontal ${variant === "compact" ? "is-compact" : ""}`}>
        <Link to={articleUrl} className="horizontal-image-wrap">
          <img
            src={thumbnailUrl}
            alt={thumbnailAlt}
            className="horizontal-img"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = getNewsPlaceholder(categoryName || "NEWS");
            }}
          />
          {hasVideo && (
            <span className="mini-video-badge">
              <Video size={10} />
            </span>
          )}
        </Link>

        <div className="horizontal-content">
          <div className="horizontal-meta-top">
            {showCategory && categoryName && (
              <span className="horizontal-category">{categoryName}</span>
            )}
            <span className="horizontal-date">{timeAgo}</span>
          </div>

          <h3 className="horizontal-title">
            <Link to={articleUrl}>{title}</Link>
          </h3>

          {showExcerpt && excerpt && variant !== "compact" && (
            <p className="horizontal-excerpt">{excerpt}</p>
          )}

          <div className="horizontal-meta-bottom">
            <span>{readTime}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="news-card-standard">
      <Link to={articleUrl} className="standard-image-wrap">
        <img
          src={thumbnailUrl}
          alt={thumbnailAlt}
          className="standard-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = getNewsPlaceholder(categoryName || "NEWS");
          }}
        />
        {hasVideo && (
          <span className="card-video-pill">
            <Video size={12} /> Video
          </span>
        )}
        {showCategory && categoryName && (
          <span className="card-corner-badge">{categoryName}</span>
        )}
      </Link>

      <div className="standard-content">
        <div className="standard-meta-top">
          <span className="standard-date">{formattedDate}</span>
          <span className="meta-separator">•</span>
          <span className="standard-read-time">{readTime}</span>
        </div>

        <h3 className="standard-title">
          <Link to={articleUrl}>{title}</Link>
        </h3>

        {showExcerpt && excerpt && (
          <p className="standard-excerpt">{excerpt}</p>
        )}
      </div>
    </article>
  );
};

export default NewsCard;