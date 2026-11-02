import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Filter, ArrowLeft, ArrowRight, X, Sparkles } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/api";
import NewsCard from "../../components/NewsCard/NewsCard";
import { getLocalizedValue } from "../../utils/newsHelpers";
import "./Search.css";

const extractArray = (response, key) => {
  const data = response?.data?.data;
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data)) return data;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const Search = () => {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const tagQuery = searchParams.get("tag") || "";
  const activeSearchTerm = query || tagQuery;

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const [news, setNews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(query);

  const isHindi = language === "hi";

  // Load categories for filter dropdown
  useEffect(() => {
    let isMounted = true;
    api
      .get("/categories")
      .then((res) => {
        if (!isMounted) return;
        const list = extractArray(res, "categories").filter((c) => c.isActive !== false);
        setCategories(list);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync search input when param changes
  useEffect(() => {
    setSearchInput(query);
    setPage(1);
  }, [query, tagQuery, language, selectedCategory, sortBy]);

  // Execute Search query
  useEffect(() => {
    const term = (query || tagQuery || "").trim();

    if (!term && !selectedCategory) {
      setNews([]);
      setPagination(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const executeSearch = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          language,
          search: term,
          page,
          limit: 12,
          sort: sortBy,
        };

        if (selectedCategory) {
          params.category = selectedCategory;
        }

        const response = await api.get("/news", {
          params,
          signal: controller.signal,
        });

        const result = response.data?.data;
        setNews(Array.isArray(result?.news) ? result.news : []);
        setPagination(result?.pagination || null);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Search execution error:", err);
          setNews([]);
          setPagination(null);
          setError(isHindi ? "खोज परिणाम प्राप्त करने में समस्या आई।" : "Unable to retrieve search results.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    executeSearch();
    return () => controller.abort();
  }, [query, tagQuery, selectedCategory, sortBy, language, page, isHindi]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;
    setSearchParams({ q: clean });
  };

  const handleClear = () => {
    setSearchInput("");
    setSearchParams({});
  };

  return (
    <div className="search-view-page">
      <div className="container">
        {/* Search Header Banner */}
        <div className="search-masthead-banner">
          <h1 className="search-heading-title">
            {isHindi ? "समाचार एवं अभिलेखागार खोज" : "DISPATCH ARCHIVES & SEARCH"}
          </h1>
          <p className="search-heading-desc">
            {isHindi
              ? "हज़ारों प्रकाशित समाचारों, विश्लेषणात्मक लेखों और विशेष रिपोर्टों में से खोजें।"
              : "Search across thousands of breaking news reports, editorials, investigations, and topics."}
          </p>

          {/* Search Input Bar */}
          <form className="search-main-form" onSubmit={handleFormSubmit}>
            <div className="search-input-wrap">
              <SearchIcon size={20} className="search-icon-decor" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={isHindi ? "खोजें: विषय, राजनेता, खेल, अर्थव्यवस्था..." : "Search keyword, person, topic, or event..."}
                className="search-main-input"
              />
              {searchInput && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleClear}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button type="submit" className="search-submit-btn">
              <span>{isHindi ? "खोजें" : "Search"}</span>
            </button>
          </form>

          {/* Filters Bar */}
          <div className="search-filters-row">
            <div className="filter-item">
              <label htmlFor="cat-filter">
                <Filter size={13} />
                <span>{isHindi ? "श्रेणी फ़िल्टर:" : "Desk Filter:"}</span>
              </label>
              <select
                id="cat-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">{isHindi ? "सभी श्रेणियां" : "All Categories"}</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {getLocalizedValue(c.name, language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="sort-filter">
                <span>{isHindi ? "क्रमबद्ध करें:" : "Sort By:"}</span>
              </label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="latest">{isHindi ? "नवीनतम पहले" : "Latest First"}</option>
                <option value="popular">{isHindi ? "लोकप्रिय (सर्वाधिक देखे गए)" : "Most Viewed"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info Banner */}
        {activeSearchTerm && (
          <div className="search-results-infobar">
            <h2>
              {tagQuery ? (
                <>
                  {isHindi ? "टैग के परिणाम:" : "Articles tagged with:"}{" "}
                  <span className="search-term-highlight">#{tagQuery}</span>
                </>
              ) : (
                <>
                  {isHindi ? "खोज परिणाम:" : "Search results for:"}{" "}
                  <span className="search-term-highlight">"{query}"</span>
                </>
              )}
            </h2>
            {pagination && (
              <span className="results-total-badge">
                {pagination.total || news.length} {isHindi ? "परिणाम मिले" : "Dispatches Found"}
              </span>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="search-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton skeleton-search-card" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="search-error-state">
            <p>{error}</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && news.length > 0 && (
          <>
            <div className="search-articles-grid">
              {news.map((article) => (
                <NewsCard
                  key={article._id}
                  article={article}
                  variant="standard"
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="search-pagination-bar">
                <button
                  type="button"
                  className="page-btn prev-btn"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => {
                    setPage((p) => p - 1);
                    window.scrollTo({ top: 200, behavior: "smooth" });
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>{isHindi ? "पिछला" : "Previous"}</span>
                </button>

                <div className="pagination-current-info">
                  <span>
                    {isHindi ? "पृष्ठ" : "Page"}{" "}
                    <strong>{pagination.page}</strong> / {pagination.totalPages}
                  </span>
                </div>

                <button
                  type="button"
                  className="page-btn next-btn"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => {
                    setPage((p) => p + 1);
                    window.scrollTo({ top: 200, behavior: "smooth" });
                  }}
                >
                  <span>{isHindi ? "अगला" : "Next"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && activeSearchTerm && news.length === 0 && (
          <div className="search-empty-state">
            <Sparkles size={32} className="empty-sparkle-icon" />
            <h3>{isHindi ? "कोई परिणाम नहीं मिला" : "No Matching Articles Found"}</h3>
            <p>
              {isHindi
                ? "कृपया अन्य शब्दों का उपयोग करें या वर्तनी की जांच करें।"
                : "Try adjusting your search terms, removing filters, or browsing by category desks."}
            </p>
            <Link to="/" className="back-home-link">
              ← {isHindi ? "होम पेज पर वापस जाएं" : "Return to Homepage"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
