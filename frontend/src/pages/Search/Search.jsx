
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";

import "./Search.css";

const getLocalizedArticle = (article, language) =>
  article?.title?.[language] ||
  article?.title?.en ||
  article?.title?.hi ||
  {};

const Search = () => {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";

  const [news, setNews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [query, language]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setNews([]);
      setPagination(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/news", {
          params: {
            language,
            search: trimmedQuery,
            page,
            limit: 10,
            sort: "latest",
          },
          signal: controller.signal,
        });

        const result = response.data.data;

        setNews(result?.news || []);
        setPagination(result?.pagination || null);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Search error:", err);
          setNews([]);
          setPagination(null);
          setError(err.message || "Unable to search news.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSearchResults();

    return () => controller.abort();
  }, [query, language, page]);

  const handleSearch = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const value = formData.get("search")?.toString().trim();

    if (!value) return;

    setSearchParams({ q: value });
  };

  return (
    <div className="search-page">

      <div className="search-header">
        <h1>
          {language === "hi" ? "समाचार खोजें" : "Search News"}
        </h1>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="search"
            name="search"
            defaultValue={query}
            placeholder={
              language === "hi"
                ? "समाचार खोजें..."
                : "Search articles..."
            }
          />

          <button type="submit">
            {language === "hi" ? "खोजें" : "Search"}
          </button>
        </form>
      </div>

      {query && (
        <h2 className="search-results-heading">
          {language === "hi" ? "खोज परिणाम:" : "Search results for:"}{" "}
          <span>{query}</span>
        </h2>
      )}

      {loading && (
        <p className="search-message">
          {language === "hi" ? "खोज रहे हैं..." : "Searching..."}
        </p>
      )}

      {error && (
        <p className="search-error">{error}</p>
      )}

      {!loading && !error && query && news.length === 0 && (
        <p className="search-message">
          {language === "hi"
            ? "कोई समाचार नहीं मिला।"
            : "No articles found."}
        </p>
      )}

      {!loading && news.length > 0 && (
        <>
          <div className="search-results-grid">
            {news.map((article) => {
              const localized = getLocalizedArticle(
                article,
                language
              );

              if (!localized.slug) return null;

              return (
                <article
                  className="search-result-card"
                  key={article._id}
                >
                  <Link
                    to={`/news/${language}/${localized.slug}`}
                    className="search-result-image"
                  >
                    {article.thumbnail && (
                      <img
                        src={article.thumbnail}
                        alt={localized.title || ""}
                        loading="lazy"
                      />
                    )}
                  </Link>

                  <div className="search-result-content">
                    <h3>
                      <Link
                        to={`/news/${language}/${localized.slug}`}
                      >
                        {localized.title}
                      </Link>
                    </h3>

                    <p>{localized.excerpt}</p>

                    <span>
                      {article.publishedAt
                        ? new Date(
                            article.publishedAt
                          ).toLocaleDateString(
                            language === "hi" ? "hi-IN" : "en-IN"
                          )
                        : ""}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {pagination?.totalPages > 1 && (
            <div className="search-pagination">
              <button
                disabled={!pagination.hasPreviousPage || loading}
                onClick={() => setPage((prev) => prev - 1)}
              >
                {language === "hi" ? "पिछला" : "Previous"}
              </button>

              <span>
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                disabled={!pagination.hasNextPage || loading}
                onClick={() => setPage((prev) => prev + 1)}
              >
                {language === "hi" ? "अगला" : "Next"}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Search;
