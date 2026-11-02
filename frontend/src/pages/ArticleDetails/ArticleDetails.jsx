
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  Clock,
  Eye,
  Calendar,
  Share2,
  Printer,
  ChevronRight,
  User,
  Check,
  Copy,
  MessageCircle,
  Tag as TagIcon,
  Video,
  ArrowLeft,
  ArrowRight,
  Flame,
  Bookmark,
  ThumbsUp,
  Lightbulb,
  Heart,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import Advertisement from "../../components/Advertisement/Advertisement";
import NewsCard from "../../components/NewsCard/NewsCard";
import { SocialIcon } from "../../components/common/SocialIcons";
import NewsTextToSpeech from "../../components/common/NewsTextToSpeech";
import { getImageUrl, getNewsPlaceholder } from "../../utils/imageUrl";
import {
  getLocalizedArticle,
  getLocalizedValue,
  formatNewsDate,
  calculateReadingTime,
} from "../../utils/newsHelpers";
import "./ArticleDetails.css";

const ArticleDetails = () => {
  const { slug, language: routeLanguage } = useParams();
  const { language: activeLanguage } = useLanguage();
  const navigate = useNavigate();

  // The language selector in LanguageContext is the source of truth.
  // routeLanguage is kept in sync with it so the URL uses the matching
  // localized article slug.
  const language = activeLanguage === "hi" ? "hi" : "en";

  const isHindi = language === "hi";

  const [article, setArticle] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fontSize, setFontSize] = useState("normal");
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Reactions state
  const [reactions, setReactions] = useState({
    helpful: 34,
    informative: 58,
    inspiring: 19,
  });

  const [userReaction, setUserReaction] = useState(null);

  // Fetch article by language and slug
  useEffect(() => {
    const controller = new AbortController();
    // The current URL slug belongs to routeLanguage. Use that language to
    // resolve the existing URL first; the sync effect below then navigates
    // to the selected language's localized slug.
    const lookupLanguage = ["en", "hi"].includes(routeLanguage)
      ? routeLanguage
      : language;

    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError("");
        setRelatedNews([]);
        setTrendingNews([]);

        const response = await api.get(
          `/news/${lookupLanguage}/${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );

        const data = response.data?.data;

        const articleData =
          data?.article ||
          data?.news ||
          data ||
          response.data?.article;

        if (!articleData?._id) {
          throw new Error(
            isHindi ? "समाचार नहीं मिला।" : "Article not found."
          );
        }

        setArticle(articleData);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Article fetch error:", err);

          setError(
            err.response?.data?.message ||
              err.message ||
              (isHindi
                ? "समाचार लोड करने में असमर्थ।"
                : "Unable to load article.")
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      fetchArticle();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return () => controller.abort();
  }, [slug, language, routeLanguage, isHindi]);

  // Keep the article URL synchronized with the selected language.
  // Each language can have a different slug, stored in article.title.en/hi.slug.
  useEffect(() => {
    if (!article?._id) return;

    const localizedArticle = getLocalizedArticle(article, language);
    const localizedSlug = localizedArticle?.slug;

    if (!localizedSlug) {
      console.warn(
        `No ${language} slug found for article ${article._id}.`
      );
      return;
    }

    if (routeLanguage === language && slug === localizedSlug) return;

    const nextPath = `/news/${language}/${encodeURIComponent(localizedSlug)}`;
    navigate(nextPath, { replace: true });
  }, [article?._id, language, routeLanguage, slug, navigate]);

  // Increment view count
  useEffect(() => {
    if (!article?._id) return;

    const controller = new AbortController();

    api
      .post(
        `/news/${article._id}/views`,
        { language },
        { signal: controller.signal }
      )
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error("View count update failed:", err);
        }
      });

    return () => controller.abort();
  }, [article?._id, language]);

  // Fetch related and trending articles
  useEffect(() => {
    if (!article?._id) return;

    const controller = new AbortController();

    const fetchSidebarData = async () => {
      try {
        const [relatedRes, trendingRes] = await Promise.allSettled([
          api.get("/news", {
            params: {
              language,
              category: article.category?._id,
              limit: 8,
              sort: "latest",
            },
            signal: controller.signal,
          }),

          api.get("/news", {
            params: {
              language,
              limit: 6,
              sort: "popular",
            },
            signal: controller.signal,
          }),
        ]);

        if (relatedRes.status === "fulfilled") {
          const items = relatedRes.value.data?.data?.news || [];

          const filtered = items.filter(
            (item) => item._id !== article._id
          );

          setRelatedNews(filtered.slice(0, 5));
        }

        if (trendingRes.status === "fulfilled") {
          const items = trendingRes.value.data?.data?.news || [];

          const filtered = items.filter(
            (item) => item._id !== article._id
          );

          setTrendingNews(filtered.slice(0, 5));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Sidebar data error:", err);
        }
      }
    };

    fetchSidebarData();

    return () => controller.abort();
  }, [article?._id, article?.category?._id, language]);

  if (loading) {
    return (
      <div className="container article-page-container">
        <div className="article-skeleton">
          <div className="skeleton skeleton-bread" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-meta" />
          <div className="skeleton skeleton-banner" />
          <div className="skeleton skeleton-body" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container article-page-container">
        <div className="article-error-state">
          <h2>
            {error ||
              (isHindi ? "समाचार नहीं मिला" : "Article Not Found")}
          </h2>

          <p>
            {isHindi
              ? "यह समाचार हटा दिया गया है या उपलब्ध नहीं है।"
              : "The requested article could not be found or has been archived."}
          </p>

          <button
            type="button"
            className="back-home-btn"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={16} />
            <span>
              {isHindi
                ? "होम पेज पर वापस जाएं"
                : "Return to Homepage"}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const { title, excerpt, content } = getLocalizedArticle(
    article,
    language
  );

  const cleanHtml = DOMPurify.sanitize(content || "", {
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

  const subcategoryName = getLocalizedValue(
    article.subcategory?.name,
    language
  );

  const subcategorySlug = getLocalizedValue(
    article.subcategory?.slug,
    language
  );

  const publishedDate = formatNewsDate(
    article.publishedAt || article.createdAt,
    language
  );

  const readTime = calculateReadingTime(content, language);
  const views = article.views || 0;

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : "";

  // Copy Link
  const handleCopyLink = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard is not available.");
      }

      await navigator.clipboard.writeText(currentUrl);

      setCopied(true);

      toast.success(
        isHindi
          ? "लिंक कॉपी हो गया!"
          : "Link copied to clipboard!"
      );

      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Copy link error:", err);

      toast.error(
        isHindi
          ? "लिंक कॉपी नहीं हो सका।"
          : "Unable to copy link."
      );
    }
  };

  // Print article
  const handlePrint = () => {
    window.print();
  };

  // Bookmark article
  const handleBookmarkToggle = () => {
    setBookmarked((prev) => !prev);

    toast.success(
      bookmarked
        ? isHindi
          ? "बुकमार्क हटाया गया"
          : "Article removed from saved stories"
        : isHindi
        ? "समाचार बुकमार्क किया गया"
        : "Article saved to reading list"
    );
  };

  // Reader reactions
  const handleReaction = (type) => {
    if (userReaction === type) {
      setUserReaction(null);

      setReactions((prev) => ({
        ...prev,
        [type]: prev[type] - 1,
      }));
    } else {
      setReactions((prev) => ({
        ...prev,
        [type]: prev[type] + 1,
        ...(userReaction
          ? { [userReaction]: prev[userReaction] - 1 }
          : {}),
      }));

      setUserReaction(type);

      toast.success(
        isHindi
          ? "आपकी प्रतिक्रिया के लिए धन्यवाद!"
          : "Thanks for your feedback!"
      );
    }
  };

  // Sort article media
  const sortedMedia = Array.isArray(article.media)
    ? [...article.media].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      )
    : [];

  const mainImageUrl = article.thumbnail
    ? getImageUrl(article.thumbnail)
    : getNewsPlaceholder(categoryName || "NEWS");

  const thumbnailAlt =
    getLocalizedValue(article.thumbnailAlt, language) || title;

  // Extract key highlights
  const keyHighlights = excerpt
    ? excerpt
        .split(/[.।]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 15)
        .slice(0, 3)
    : [];

  return (
    <article className={`article-detail-page font-size-${fontSize}`}>
      {/* 1. TOP ADVERTISEMENT */}
      <div className="container">
        <Advertisement page="article" position="top" />
      </div>

      <div className="container article-layout-grid">
        {/* MAIN ARTICLE COLUMN */}
        <div className="article-main-column">
          {/* Breadcrumb Navigation */}
          <nav className="article-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">
              {isHindi ? "होम" : "Home"}
            </Link>

            <ChevronRight size={14} className="crumb-sep" />

            {categorySlug && (
              <>
                <Link to={`/category/${categorySlug}`}>
                  {categoryName}
                </Link>

                {subcategorySlug && (
                  <>
                    <ChevronRight
                      size={14}
                      className="crumb-sep"
                    />

                    <Link to={`/subcategory/${subcategorySlug}`}>
                      {subcategoryName}
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Category Pill & Breaking Tag */}
          <div className="article-badge-row">
            {categoryName && (
              <Link
                to={`/category/${categorySlug}`}
                className="category-pill-tag"
              >
                {categoryName}
              </Link>
            )}

            {article.isBreaking && (
              <span className="article-live-ribbon">
                <span className="live-pulse-dot" />
                <span>
                  {isHindi
                    ? "ब्रेकिंग रिपोर्ट"
                    : "BREAKING DISPATCH"}
                </span>
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className="article-headline">{title}</h1>

          {/* Standfirst / Excerpt */}
          {excerpt && (
            <div className="article-standfirst-box">
              <p className="article-standfirst-text">
                {excerpt}
              </p>
            </div>
          )}

          {/* Byline & Metadata Row */}
          <div className="article-byline-bar">
            <div className="byline-author-info">
              {article.author?.avatar ? (
                <img
                  src={getImageUrl(article.author.avatar)}
                  alt={article.author.name}
                  className="byline-avatar-img"
                />
              ) : (
                <span className="byline-avatar-placeholder">
                  <User size={18} />
                </span>
              )}

              <div className="byline-details">
                <div className="byline-name-row">
                  <span className="byline-author-name">
                    {article.author?.name ||
                      "Senior Political Correspondent"}
                  </span>

                  <span className="author-verified-tag">
                    <Award size={12} />
                    {isHindi
                      ? "संपादकीय मंडल"
                      : "Editorial Staff"}
                  </span>
                </div>

                <div className="byline-time-row">
                  <span className="byline-date">
                    <Calendar size={13} />
                    {publishedDate}
                  </span>

                  <span className="byline-dot">•</span>

                  <span className="byline-read">
                    <Clock size={13} />
                    {readTime}
                  </span>

                  <span className="byline-dot">•</span>

                  <span className="byline-views">
                    <Eye size={13} />
                    {views.toLocaleString()}{" "}
                    {isHindi ? "व्यूज़" : "views"}
                  </span>
                </div>
              </div>
            </div>

            {/* Reading Mode Toolbar */}
            <div className="article-toolbar">
              {/* Real Text-to-Speech */}
              <NewsTextToSpeech
                title={title}
                excerpt={excerpt}
                content={content}
                language={language}
                articleId={article._id}
              />

              {/* Bookmark Button */}
              <button
                type="button"
                className={`tool-icon-btn ${
                  bookmarked ? "bookmarked" : ""
                }`}
                onClick={handleBookmarkToggle}
                title="Bookmark article"
              >
                <Bookmark
                  size={15}
                  fill={bookmarked ? "currentColor" : "none"}
                />
              </button>

              {/* Font Resizer */}
              <div className="font-resizer">
                <button
                  type="button"
                  className={fontSize === "small" ? "active" : ""}
                  onClick={() => setFontSize("small")}
                  title="Smaller text"
                >
                  A-
                </button>

                <button
                  type="button"
                  className={fontSize === "normal" ? "active" : ""}
                  onClick={() => setFontSize("normal")}
                  title="Default text"
                >
                  A
                </button>

                <button
                  type="button"
                  className={fontSize === "large" ? "active" : ""}
                  onClick={() => setFontSize("large")}
                  title="Larger text"
                >
                  A+
                </button>
              </div>

              {/* Print */}
              <button
                type="button"
                className="tool-icon-btn"
                onClick={handlePrint}
                title="Print Article"
              >
                <Printer size={15} />
              </button>
            </div>
          </div>

          {/* Sticky Social Share Strip */}
          <div className="article-share-strip">
            <span className="share-strip-label">
              <Share2 size={14} />
              <span>
                {isHindi ? "शेयर करें:" : "Share Story:"}
              </span>
            </span>

            <div className="share-buttons-group">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${title} - ${currentUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-whatsapp"
                title="Share on WhatsApp"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  title
                )}&url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-twitter"
                title="Share on X"
              >
                <SocialIcon platform="x" size={13} />
                <span>Post</span>
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-facebook"
                title="Share on Facebook"
              >
                <SocialIcon platform="facebook" size={13} />
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-linkedin"
                title="Share on LinkedIn"
              >
                <SocialIcon platform="linkedin" size={13} />
              </a>

              <button
                type="button"
                className="share-btn share-copy"
                onClick={handleCopyLink}
                title="Copy link"
              >
                {copied ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}

                <span>
                  {copied
                    ? isHindi
                      ? "कॉपी हुआ"
                      : "Copied"
                    : isHindi
                    ? "कॉपी लिंक"
                    : "Copy Link"}
                </span>
              </button>
            </div>
          </div>

          {/* Featured Primary Lead Image */}
          <figure className="article-lead-image">
            <div className="lead-img-frame">
              <img
                src={mainImageUrl}
                alt={thumbnailAlt}
                className="lead-img"
                loading="eager"
              />
            </div>

            <figcaption className="lead-caption">
              <span className="caption-text">
                {thumbnailAlt}
              </span>

              <span className="caption-credit">
                Photo: Dispatch / Editorial Archives
              </span>
            </figcaption>
          </figure>

          {/* Key Highlights */}
          {keyHighlights.length > 0 && (
            <div className="article-takeaways-card">
              <div className="takeaways-header">
                <Sparkles
                  size={16}
                  className="takeaways-icon"
                />

                <h4>
                  {isHindi
                    ? "प्रमुख बिंदु एवं सारांश"
                    : "KEY HIGHLIGHTS & TAKEAWAYS"}
                </h4>
              </div>

              <ul className="takeaways-list">
                {keyHighlights.map((point, idx) => (
                  <li key={idx}>
                    <span className="takeaway-bullet">◆</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Article Prose Body */}
          <div className="article-prose-body">
            {cleanHtml ? (
              <div
                className="prose-content"
                dangerouslySetInnerHTML={{
                  __html: cleanHtml,
                }}
              />
            ) : (
              <p className="no-content-notice">
                {isHindi
                  ? "इस समाचार की विस्तृत रिपोर्ट शीघ्र उपलब्ध होगी।"
                  : "The complete in-depth investigation will be posted shortly."}
              </p>
            )}
          </div>

          {/* Reader Reaction & Feedback Widget */}
          <div className="reader-reactions-bar">
            <span className="reactions-label">
              {isHindi
                ? "यह रिपोर्ट कैसी लगी?"
                : "Rate this reporting:"}
            </span>

            <div className="reactions-buttons">
              <button
                type="button"
                className={`reaction-btn ${
                  userReaction === "helpful" ? "active" : ""
                }`}
                onClick={() => handleReaction("helpful")}
              >
                <ThumbsUp size={15} />
                <span>{isHindi ? "उपयोगी" : "Helpful"}</span>
                <span className="reaction-count">
                  ({reactions.helpful})
                </span>
              </button>

              <button
                type="button"
                className={`reaction-btn ${
                  userReaction === "informative" ? "active" : ""
                }`}
                onClick={() => handleReaction("informative")}
              >
                <Lightbulb size={15} />
                <span>
                  {isHindi ? "रोचक" : "Informative"}
                </span>
                <span className="reaction-count">
                  ({reactions.informative})
                </span>
              </button>

              <button
                type="button"
                className={`reaction-btn ${
                  userReaction === "inspiring" ? "active" : ""
                }`}
                onClick={() => handleReaction("inspiring")}
              >
                <Heart size={15} />
                <span>
                  {isHindi ? "सराहनीय" : "Inspiring"}
                </span>
                <span className="reaction-count">
                  ({reactions.inspiring})
                </span>
              </button>
            </div>
          </div>

          {/* In-Article Advertisement */}
          <Advertisement page="article" position="middle" />

          {/* Multimedia Gallery */}
          {sortedMedia.length > 0 && (
            <section className="article-media-gallery">
              <div className="media-gallery-header">
                <Video
                  size={18}
                  className="media-header-icon"
                />

                <h3>
                  {isHindi
                    ? "संलग्न मीडिया एवं वीडियो कवरेज"
                    : "ATTACHED MEDIA & VIDEO COVERAGE"}
                </h3>
              </div>

              <div className="media-gallery-grid">
                {sortedMedia.map((media, idx) => {
                  const mediaUrl = getImageUrl(media.url);

                  const mediaAlt =
                    getLocalizedValue(media.alt, language) ||
                    `${title} - Visual ${idx + 1}`;

                  return (
                    <figure
                      key={idx}
                      className={`media-item-box is-${media.type}`}
                    >
                      {media.type === "video" ? (
                        <div className="video-player-wrap">
                          <video
                            controls
                            preload="metadata"
                            poster={mainImageUrl}
                            className="article-video-player"
                          >
                            <source src={mediaUrl} />
                            Your browser does not support the video player.
                          </video>

                          <span className="media-type-badge">
                            <Video size={12} />
                            Video Report
                          </span>
                        </div>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={mediaAlt}
                          className="article-gallery-img"
                          loading="lazy"
                        />
                      )}

                      {mediaAlt && (
                        <figcaption className="media-item-caption">
                          {mediaAlt}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </section>
          )}

          {/* Article Tags */}
          {Array.isArray(article.tags) &&
            article.tags.length > 0 && (
              <div className="article-tags-section">
                <span className="tags-label">
                  <TagIcon size={14} />
                  <span>
                    {isHindi ? "संबंधित विषय:" : "Filed Under:"}
                  </span>
                </span>

                <div className="tags-chips-list">
                  {article.tags.map((t, idx) => {
                    const tagSlug =
                      typeof t === "object"
                        ? t.slug || t.name
                        : t;

                    const tagDisplay =
                      typeof t === "object"
                        ? getLocalizedValue(t.name, language) ||
                          t.slug
                        : t;

                    return (
                      <Link
                        key={idx}
                        to={`/search?tag=${encodeURIComponent(
                          tagSlug
                        )}`}
                        className="article-tag-chip"
                      >
                        #{tagDisplay}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Author Bio Box */}
          <div className="author-bio-card">
            {article.author?.avatar ? (
              <img
                src={getImageUrl(article.author.avatar)}
                alt={article.author.name}
                className="author-bio-avatar"
              />
            ) : (
              <span className="author-bio-placeholder">
                <User size={28} />
              </span>
            )}

            <div className="author-bio-content">
              <h4>
                {article.author?.name ||
                  "Newsroom Special Correspondent"}
              </h4>

              <p>
                {isHindi
                  ? "राष्ट्रीय राजनीति, नीतिगत मामलों और आर्थिक सुधारों पर विशेष रिपोर्टिंग। निष्पक्ष पत्रकारिता के प्रति प्रतिबद्ध।"
                  : "Covering national affairs, governance initiatives, and economic reforms for the Editorial Board. Focused on ground realities and verified reportage."}
              </p>
            </div>
          </div>
        </div>

        {/* SIDEBAR COLUMN */}
        <aside className="article-sidebar-column">
          {/* Trending / Most Read Stories */}
          <div className="sidebar-widget-box">
            <div className="sidebar-widget-header">
              <span className="sidebar-widget-title">
                <Flame
                  size={17}
                  className="flame-rank-icon"
                />

                {isHindi
                  ? "सबसे ज़्यादा पढ़ी गई"
                  : "MOST READ NOW"}
              </span>

              <TrendingUp
                size={15}
                className="trending-icon"
              />
            </div>

            <div className="sidebar-ranked-feed">
              {(trendingNews.length > 0
                ? trendingNews
                : relatedNews
              ).map((item, index) => (
                <NewsCard
                  key={item._id}
                  article={item}
                  variant="ranked"
                  rank={index + 1}
                />
              ))}
            </div>
          </div>

          {/* More From This Category */}
          {relatedNews.length > 0 && (
            <div className="sidebar-widget-box">
              <div className="sidebar-widget-header">
                <span className="sidebar-widget-title">
                  <span className="title-bar" />

                  {categoryName ||
                    (isHindi
                      ? "संबंधित खबरें"
                      : "RELATED STORIES")}
                </span>

                {categorySlug && (
                  <Link
                    to={`/category/${categorySlug}`}
                    className="sidebar-view-more"
                  >
                    {isHindi ? "सभी →" : "More →"}
                  </Link>
                )}
              </div>

              <div className="sidebar-stories-feed">
                {relatedNews.map((item) => (
                  <NewsCard
                    key={item._id}
                    article={item}
                    variant="compact"
                    showExcerpt={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Newsletter Box */}
          <div className="sidebar-newsletter-box">
            <span className="newsletter-badge">
              <Sparkles size={12} />
              {isHindi ? "मुफ़्त बुलेटिन" : "DAILY BRIEF"}
            </span>

            <h4>
              {isHindi
                ? "मुख्य समाचार अपने इनबॉक्स में"
                : "The Evening Briefing"}
            </h4>

            <p>
              {isHindi
                ? "देश-विदेश के महत्वपूर्ण घटनाक्रम सीधे अपने ईमेल पर प्राप्त करें।"
                : "Top stories and balanced analysis curated by our editors, sent daily at 6 PM."}
            </p>

            <Link to="/" className="sidebar-newsletter-link">
              {isHindi
                ? "न्यूज़लेटर सदस्यता लें →"
                : "Subscribe to Newsletter →"}
            </Link>
          </div>
        </aside>
      </div>

      {/* BOTTOM RELATED STORIES SECTION */}
      {relatedNews.length > 0 && (
        <section className="container article-bottom-related">
          <div className="editorial-section-header has-accent">
            <span className="editorial-section-title">
              <span className="title-bar" />

              {isHindi
                ? "अन्य संबंधित विश्लेषण"
                : "MORE FROM THIS DESK"}
            </span>

            {categorySlug && (
              <Link
                to={`/category/${categorySlug}`}
                className="editorial-section-link"
              >
                <span>
                  {isHindi
                    ? "पूरी श्रेणी देखें"
                    : "Explore Desk"}
                </span>

                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          <div className="bottom-related-grid">
            {relatedNews.slice(0, 3).map((item) => (
              <NewsCard
                key={item._id}
                article={item}
                variant="standard"
              />
            ))}
          </div>
        </section>
      )}

      {/* BOTTOM ADVERTISEMENT */}
      <div className="container">
        <Advertisement page="article" position="bottom" />
      </div>
    </article>
  );
};

export default ArticleDetails;
