
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  RefreshCw,
  Pencil,
  Archive,
  Eye,
  ChevronLeft,
  ChevronRight,
  Newspaper,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAdminNews } from "../../features/news/newsSlice";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./NewsList.css";

const getLocalizedTitle = (title) => {
  if (typeof title === "string") return title;

  return (
    title?.en?.title ||
    title?.hi?.title ||
    "Untitled article"
  );
};

const getLocalizedCategory = (category) => {
  if (!category) return "—";
  if (typeof category === "string") return category;

  const name = category.name;

  if (typeof name === "string") return name;

  return name?.en || name?.hi || "—";
};

const getStatusClass = (status) => {
  const classes = {
    published: "news-list-status-published",
    draft: "news-list-status-draft",
    scheduled: "news-list-status-scheduled",
    archived: "news-list-status-archived",
  };

  return classes[status] || "";
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error, fallback) => {
  if (typeof error === "string") return error;

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const NewsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    news = [],
    pagination = {},
    loading = false,
    error = null,
  } = useSelector((state) => state.news || {});

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [archivingId, setArchivingId] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Archive Article",
    variant: "warning",
    onConfirm: null,
    isLoading: false,
  });

  const currentPage = Number(pagination.currentPage) || page;
  const totalPages = Number(pagination.totalPages) || 0;
  const totalNews = Number(pagination.totalNews) || 0;

  const loadNews = useCallback(
    async (showErrorToast = false) => {
      try {
        await dispatch(
          fetchAdminNews({
            page,
            limit: 10,
            search,
            status,
          })
        ).unwrap();
      } catch (err) {
        if (showErrorToast) {
          toast.error(
            getErrorMessage(
              err,
              "Unable to load news articles"
            )
          );
        }
      }
    },
    [dispatch, page, search, status]
  );

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleSearch = (event) => {
    event.preventDefault();

    const nextSearch = searchInput.trim();

    if (nextSearch === search && page === 1) return;

    setPage(1);
    setSearch(nextSearch);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    loadNews(true);
  };

  const handleEdit = (id) => {
    navigate(`/news/edit/${id}`);
  };

  const handleArchive = (item) => {
    if (!item?._id || archivingId || loading) return;

    const title = getLocalizedTitle(item.title);

    setConfirmModal({
      isOpen: true,
      title: "Archive News Article",
      message: `Are you sure you want to archive "${title}"? Archived articles will no longer be visible on public feeds.`,
      confirmText: "Archive Article",
      variant: "warning",
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          setArchivingId(item._id);

          const response = await api.patch(
            `/news/${item._id}/archive`
          );

          if (!response.data?.success) {
            throw new Error(
              response.data?.message || "Failed to archive news"
            );
          }

          toast.success("News archived successfully");
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          await loadNews(true);
        } catch (err) {
          toast.error(
            getErrorMessage(err, "Failed to archive news")
          );
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        } finally {
          setArchivingId(null);
        }
      },
    });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading) {
      setPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !loading) {
      setPage(currentPage + 1);
    }
  };

  return (
    <div className="news-list-page">
      <div className="news-list-heading">
        <div>
          <span className="news-list-eyebrow">
            CONTENT MANAGEMENT
          </span>

          <h1>News Management</h1>

          <p>
            Create, organize and manage your news articles.
          </p>
        </div>

        <button
          type="button"
          className="news-create-btn"
          onClick={() => navigate("/news/create")}
        >
          <Plus size={18} />
          Create News
        </button>
      </div>

      <div className="news-list-stats">
        <div>
          <span>Total Articles</span>
          <strong>{totalNews.toLocaleString("en-IN")}</strong>
        </div>

        <div>
          <span>Current Page</span>
          <strong>{currentPage}</strong>
        </div>

        <div>
          <span>Total Pages</span>
          <strong>{totalPages}</strong>
        </div>
      </div>

      <div className="news-list-panel">
        <div className="news-list-toolbar">
          <form
            className="news-search-form"
            onSubmit={handleSearch}
          >
            <Search size={18} />

            <input
              type="search"
              placeholder="Search articles..."
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              aria-label="Search news articles"
            />

            <button type="submit" disabled={loading}>
              Search
            </button>
          </form>

          <div className="news-list-toolbar-actions">
            <select
              value={status}
              onChange={handleStatusChange}
              aria-label="Filter news by status"
              disabled={loading}
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>

            <button
              type="button"
              className="news-refresh-btn"
              onClick={handleRefresh}
              disabled={loading || Boolean(archivingId)}
              aria-label="Refresh news"
              title="Refresh news"
            >
              <RefreshCw
                size={17}
                className={loading ? "news-refresh-loading" : ""}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="news-list-error" role="alert">
            <span>
              {getErrorMessage(error, "Unable to load news")}
            </span>

            <button
              type="button"
              onClick={() => loadNews(true)}
              disabled={loading}
            >
              Retry
            </button>
          </div>
        )}

        <div className="news-list-table-wrapper">
          <table className="news-list-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th>Views</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="news-list-message">
                    Loading articles...
                  </td>
                </tr>
              ) : news.length > 0 ? (
                news.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="news-list-title">
                        {getLocalizedTitle(item.title)}
                      </div>

                      <span className="news-list-id">
                        ID: {item._id}
                      </span>
                    </td>

                    <td>
                      {getLocalizedCategory(item.category)}
                    </td>

                    <td>
                      {item.author?.name || "—"}
                    </td>

                    <td>
                      <span
                        className={`news-list-status ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="news-list-views">
                        <Eye size={14} />

                        {Number(item.views || 0).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </td>

                    <td>
                      {formatDate(item.createdAt)}
                    </td>

                    <td>
                      <div className="news-list-actions">
                        <button
                          type="button"
                          title="Edit article"
                          aria-label={`Edit ${getLocalizedTitle(item.title)}`}
                          onClick={() => handleEdit(item._id)}
                          disabled={Boolean(archivingId)}
                        >
                          <Pencil size={16} />
                        </button>

                        {item.status !== "archived" && (
                          <button
                            type="button"
                            title="Archive article"
                            aria-label={`Archive ${getLocalizedTitle(item.title)}`}
                            className="news-archive-action"
                            onClick={() => handleArchive(item)}
                            disabled={
                              loading || Boolean(archivingId)
                            }
                          >
                            {archivingId === item._id ? (
                              <RefreshCw
                                size={16}
                                className="news-refresh-loading"
                              />
                            ) : (
                              <Archive size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="news-list-message">
                    <Newspaper size={30} />

                    <strong>No articles found</strong>

                    <span>
                      Try changing your search or filters.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="news-list-pagination">
          <span>
            Showing {news.length} articles
            {totalNews > 0
              ? ` on page ${currentPage} of ${totalPages}`
              : ""}
          </span>

          <div>
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={handlePreviousPage}
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <button
              type="button"
              disabled={
                loading ||
                totalPages === 0 ||
                currentPage >= totalPages
              }
              onClick={handleNextPage}
            >
              Next
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => !confirmModal.isLoading && setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};

export default NewsList;
