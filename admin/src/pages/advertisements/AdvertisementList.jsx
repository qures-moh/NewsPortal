import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./AdvertisementList.css";

const AdvertisementList = () => {
  const navigate = useNavigate();

  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [pageType, setPageType] = useState("");
  const [position, setPosition] = useState("");
  const [isActive, setIsActive] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    variant: "danger",
    onConfirm: null,
    isLoading: false,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchAdvertisements = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        const response = await api.get("/advertisements/admin/all", {
          params: {
            page,
            limit: pagination.limit,
            search: search.trim(),
            pageType,
            position,
            isActive,
          },
        });

        setAdvertisements(response.data.advertisements || []);

        setPagination((previous) => ({
          ...previous,
          ...(response.data.pagination || {}),
        }));
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load advertisements"
        );
      } finally {
        setLoading(false);
      }
    },
    [search, pageType, position, isActive, pagination.limit]
  );

  useEffect(() => {
    fetchAdvertisements(1);
  }, [fetchAdvertisements]);

  const handleDelete = (id, name = "this advertisement") => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Advertisement",
      message: `Are you sure you want to delete "${name}"? This will immediately remove it from all page placements.`,
      confirmText: "Delete Advertisement",
      variant: "danger",
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          await api.delete(`/advertisements/${id}`);

          toast.success("Advertisement deleted successfully");
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));

          const nextPage =
            advertisements.length === 1 && pagination.page > 1
              ? pagination.page - 1
              : pagination.page;

          fetchAdvertisements(nextPage);
        } catch (error) {
          toast.error(
            error.response?.data?.message ||
              "Failed to delete advertisement"
          );
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleToggleStatus = (advertisement) => {
    const isActivating = !advertisement.isActive;
    setConfirmModal({
      isOpen: true,
      title: isActivating ? "Activate Advertisement" : "Deactivate Advertisement",
      message: isActivating
        ? `Are you sure you want to activate "${advertisement.name}"? It will become visible on the specified placement.`
        : `Are you sure you want to deactivate "${advertisement.name}"? It will be hidden from the website.`,
      confirmText: isActivating ? "Activate" : "Deactivate",
      variant: isActivating ? "primary" : "warning",
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          await api.patch(`/advertisements/${advertisement._id}`, {
            isActive: isActivating,
          });

          toast.success(
            isActivating
              ? "Advertisement activated"
              : "Advertisement deactivated"
          );

          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          fetchAdvertisements(pagination.page);
        } catch (error) {
          toast.error(
            error.response?.data?.message ||
              "Failed to update advertisement status"
          );
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http")) return imagePath;

    const apiUrl = import.meta.env.VITE_API_URL || "";
    const backendUrl = apiUrl.replace(/\/api\/?$/, "");

    return `${backendUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const resetFilters = () => {
    setSearch("");
    setPageType("");
    setPosition("");
    setIsActive("");
  };

  return (
    <div className="advertisement-page">
      <div className="advertisement-header">
        <div>
          <h1>Advertisements</h1>
          <p>Manage your website advertisements and placements.</p>
        </div>

        <button
          className="ad-primary-btn"
          onClick={() => navigate("/advertisements/create")}
        >
          <Plus size={18} />
          Create Advertisement
        </button>
      </div>

      <div className="ad-stats">
        <div className="ad-stat-card">
          <span>Total on this page</span>
          <strong>{advertisements.length}</strong>
        </div>

        <div className="ad-stat-card">
          <span>Total advertisements</span>
          <strong>{pagination.total}</strong>
        </div>

        <div className="ad-stat-card">
          <span>Current page</span>
          <strong>
            {pagination.page} / {pagination.totalPages}
          </strong>
        </div>
      </div>

      <div className="ad-filter-card">
        <div className="ad-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search advertisements..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={pageType}
          onChange={(event) => setPageType(event.target.value)}
        >
          <option value="">All pages</option>
          <option value="homepage">Homepage</option>
          <option value="article">Article</option>
          <option value="category">Category</option>
        </select>

        <select
          value={position}
          onChange={(event) => setPosition(event.target.value)}
        >
          <option value="">All positions</option>
          <option value="top">Top</option>
          <option value="middle">Middle</option>
          <option value="bottom">Bottom</option>
        </select>

        <select
          value={isActive}
          onChange={(event) => setIsActive(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          className="ad-reset-btn"
          onClick={resetFilters}
          title="Reset filters"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="ad-table-card">
        {loading ? (
          <div className="ad-loading">Loading advertisements...</div>
        ) : advertisements.length === 0 ? (
          <div className="ad-empty">
            <h3>No advertisements found</h3>
            <p>Create an advertisement or change your filters.</p>
            <button
              className="ad-primary-btn"
              onClick={() => navigate("/advertisements/create")}
            >
              <Plus size={17} />
              Create Advertisement
            </button>
          </div>
        ) : (
          <>
            <div className="ad-table-wrapper">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Advertisement</th>
                    <th>Placement</th>
                    <th>Devices</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {advertisements.map((ad) => (
                    <tr key={ad._id}>
                      <td>
                        <div className="ad-product-cell">
                          {ad.bannerImage ? (
                            <img
                              src={getImageUrl(ad.bannerImage)}
                              alt={ad.name}
                              className="ad-thumbnail"
                            />
                          ) : (
                            <div className="ad-thumbnail-placeholder">
                              No image
                            </div>
                          )}

                          <div>
                            <strong>{ad.name}</strong>
                            <a
                              href={ad.destinationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ad-destination-link"
                            >
                              Visit destination
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="ad-placement">
                          {ad.pages && ad.pages.length > 0
                            ? ad.pages.join(", ")
                            : ad.placement?.page}
                        </span>
                        <small className="ad-subtext">
                          {ad.positions && ad.positions.length > 0
                            ? ad.positions.join(", ")
                            : ad.placement?.position}
                        </small>
                      </td>

                      <td>
                        {(ad.devices || []).join(", ")}
                      </td>

                      <td>
                        <div>{formatDate(ad.startAt)}</div>
                        <small className="ad-subtext">
                          to {formatDate(ad.endAt)}
                        </small>
                      </td>

                      <td>
                        <button
                          className={`ad-status ${
                            ad.isActive ? "active" : "inactive"
                          }`}
                          onClick={() => handleToggleStatus(ad)}
                        >
                          {ad.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td>
                        <div className="ad-actions">
                          <button
                            className="ad-icon-btn edit"
                            title="Edit"
                            onClick={() =>
                              navigate(
                                `/advertisements/edit/${ad._id}`
                              )
                            }
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className="ad-icon-btn delete"
                            title="Delete"
                            onClick={() => handleDelete(ad._id, ad.name)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ad-pagination">
              <span>
                Showing {advertisements.length} of {pagination.total}
              </span>

              <div className="ad-pagination-controls">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchAdvertisements(pagination.page - 1)}
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchAdvertisements(pagination.page + 1)}
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
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

export default AdvertisementList;