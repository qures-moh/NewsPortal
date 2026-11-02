/**
 * Localized value extraction for strings or multilingual objects:
 * { en: "...", hi: "..." }
 */
export const getLocalizedValue = (value, language = "en") => {
  if (!value) return "";
  if (typeof value === "string") return value;

  if (typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const primary = value[language];
  if (typeof primary === "string" && primary.trim()) return primary.trim();

  const fallback = value.en || value.hi || "";
  if (typeof fallback === "string") return fallback.trim();

  if (typeof fallback === "object") {
    return (
      fallback.title ||
      fallback.name ||
      fallback.text ||
      ""
    );
  }

  return "";
};

/**
 * Extract localized article content from News model:
 * News schema stores: title: { en: { title, slug, excerpt, content }, hi: { ... } }
 */
export const getLocalizedArticle = (article, language = "en") => {
  if (!article) {
    return { title: "", slug: "", excerpt: "", content: "" };
  }

  const primaryLang = language === "hi" ? "hi" : "en";
  const alternateLang = primaryLang === "en" ? "hi" : "en";

  const primary = article.title?.[primaryLang] || {};
  const alternate = article.title?.[alternateLang] || {};

  return {
    title: primary.title || alternate.title || "",
    slug: primary.slug || alternate.slug || "",
    excerpt: primary.excerpt || alternate.excerpt || "",
    content: primary.content || alternate.content || "",
  };
};

/**
 * Format date in English or Hindi locale
 */
export const formatNewsDate = (dateString, language = "en") => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const isHindi = language === "hi";

  return date.toLocaleDateString(isHindi ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Relative time ago (e.g. "10 mins ago", "10 मिनट पहले")
 */
export const getRelativeTime = (dateString, language = "en") => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const isHindi = language === "hi";

  if (seconds < 60) {
    return isHindi ? "अभी-अभी" : "Just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return isHindi ? `${minutes} मिनट पहले` : `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return isHindi ? `${hours} घंटे पहले` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return isHindi ? `${days} दिन पहले` : `${days}d ago`;
  }

  return formatNewsDate(dateString, language);
};

/**
 * Estimated reading time
 */
export const calculateReadingTime = (content = "", language = "en") => {
  if (!content) return language === "hi" ? "1 मिनट" : "1 min read";

  // Strip HTML tags
  const plainText = content.replace(/<[^>]*>/g, " ").trim();
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return language === "hi" ? `${minutes} मिनट` : `${minutes} min read`;
};
