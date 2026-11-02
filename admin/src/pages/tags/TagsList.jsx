
import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Power,
  RotateCcw,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./TagsList.css";

const initialForm = {
  name: { en: "", hi: "" },
  description: { en: "", hi: "" },
};

const slugify = (value) =>
  value
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const TagsList = () => {
  const [tags, setTags] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    variant: "danger",
    onConfirm: null,
    isLoading: false,
  });

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/tags/admin/all", {
        params: {
          page,
          limit: 10,
          search: search.trim(),
          status,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to fetch tags"
        );
      }

      setTags(response.data.tags || []);

      setPagination(
        response.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        }
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to load tags")
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  const loadTrendingTags = useCallback(async () => {
    try {
      const response = await api.get("/tags");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load trending tags"
        );
      }

      setTrendingTags(response.data.tags || []);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to load trending tags")
      );
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTags();
      loadTrendingTags();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadTags, loadTrendingTags]);

  const updateField = (field, language, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [language]: value,
      },
    }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = async (id) => {
    try {
      setActionId(id);

      const response = await api.get(`/tags/admin/${id}`);

      if (!response.data?.success || !response.data?.tag) {
        throw new Error(
          response.data?.message || "Unable to fetch tag"
        );
      }

      const tag = response.data.tag;

      setForm({
        name: {
          en: tag.name?.en || "",
          hi: tag.name?.hi || "",
        },
        description: {
          en: tag.description?.en || "",
          hi: tag.description?.hi || "",
        },
      });

      setEditingId(id);
      setErrors({});
      setModalOpen(true);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to load tag")
      );
    } finally {
      setActionId(null);
    }
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setErrors({});
  };

  const validateForm = () => {
    const englishName = form.name.en.trim();
    const hindiName = form.name.hi.trim();
    const newErrors = {};

    if (!englishName) {
      newErrors.nameEn = "English tag name is required";
    } else if (englishName.length < 2) {
      newErrors.nameEn =
        "English tag name must be at least 2 characters";
    } else if (englishName.length > 60) {
      newErrors.nameEn =
        "English tag name cannot exceed 60 characters";
    } else if (!slugify(englishName)) {
      newErrors.nameEn =
        "English tag name contains invalid characters";
    }

    if (!hindiName) {
      newErrors.nameHi = "Hindi tag name is required";
    } else if (hindiName.length < 2) {
      newErrors.nameHi =
        "Hindi tag name must be at least 2 characters";
    } else if (hindiName.length > 60) {
      newErrors.nameHi =
        "Hindi tag name cannot exceed 60 characters";
    } else if (!slugify(hindiName)) {
      newErrors.nameHi =
        "Hindi tag name contains invalid characters";
    }

    if (form.description.en.length > 300) {
      newErrors.descriptionEn =
        "English description cannot exceed 300 characters";
    }

    if (form.description.hi.length > 300) {
      newErrors.descriptionHi =
        "Hindi description cannot exceed 300 characters";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please resolve the validation errors in the form");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || !validateForm()) return;

    const payload = {
      name: {
        en: form.name.en.trim(),
        hi: form.name.hi.trim(),
      },
      slug: {
        en: slugify(form.name.en),
        hi: slugify(form.name.hi),
      },
      description: {
        en: form.description.en.trim(),
        hi: form.description.hi.trim(),
      },
    };

    try {
      setSaving(true);

      const response = editingId
        ? await api.patch(`/tags/${editingId}`, payload)
        : await api.post("/tags", payload);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to save tag"
        );
      }

      toast.success(
        response.data.message ||
          (editingId ? "Tag updated" : "Tag created")
      );

      const wasEditing = Boolean(editingId);

      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm);
      setErrors({});

      if (!wasEditing && page !== 1) {
        setPage(1);
      } else {
        await loadTags();
      }
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to save tag")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTrendingChange = async (
    tag,
    isTrending,
    order
  ) => {
    if (actionId) return;

    if (isTrending && !tag.isActive) {
      toast.error(
        "Activate this tag before adding it to Trending."
      );
      return;
    }

    const nextOrder = Number(order);

    if (
      isTrending &&
      (!Number.isInteger(nextOrder) ||
        nextOrder < 1 ||
        nextOrder > 5)
    ) {
      toast.error("Select a valid trending position.");
      return;
    }

    if (
      isTrending &&
      !tag.isTrending &&
      trendingTags.length >= 5
    ) {
      toast.error(
        "You can select a maximum of five trending tags."
      );
      return;
    }

    try {
      setActionId(tag._id);

      const response = await api.patch(
        `/tags/${tag._id}/trending`,
        {
          isTrending,
          ...(isTrending && {
            trendingOrder: nextOrder,
          }),
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to update trending tag"
        );
      }

      toast.success(
        response.data.message || "Trending tags updated"
      );

      await Promise.all([
        loadTags(),
        loadTrendingTags(),
      ]);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to update trending tag"
        )
      );
    } finally {
      setActionId(null);
    }
  };

  const handleStatusChange = (tag) => {
    if (actionId) return;

    const isActivating = !tag.isActive;

    setConfirmModal({
      isOpen: true,
      title: isActivating ? "Activate Tag" : "Deactivate Tag",
      message: isActivating
        ? `Are you sure you want to activate "${tag.name?.en || "this tag"}"?`
        : `Are you sure you want to deactivate "${tag.name?.en || "this tag"}"?`,
      confirmText: isActivating ? "Activate" : "Deactivate",
      variant: isActivating ? "primary" : "warning",
      isLoading: false,
      onConfirm: async () => {
        try {
          setActionId(tag._id);
          setConfirmModal((prev) => ({
            ...prev,
            isLoading: true,
          }));

          const response = await api.patch(
            `/tags/${tag._id}/status`,
            {
              isActive: isActivating,
            }
          );

          if (!response.data?.success) {
            throw new Error(
              response.data?.message ||
                "Unable to update status"
            );
          }

          toast.success(
            response.data.message ||
              (isActivating
                ? "Tag activated"
                : "Tag deactivated")
          );

          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            isLoading: false,
          }));

          await Promise.all([
            loadTags(),
            loadTrendingTags(),
          ]);
        } catch (error) {
          toast.error(
            getErrorMessage(
              error,
              "Unable to update status"
            )
          );

          setConfirmModal((prev) => ({
            ...prev,
            isLoading: false,
          }));
        } finally {
          setActionId(null);
        }
      },
    });
  };

  const handleDelete = (tag) => {
    if (actionId) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Tag",
      message: `Are you sure you want to permanently delete "${tag.name?.en || "this tag"}"? This action cannot be undone.`,
      confirmText: "Delete Tag",
      variant: "danger",
      isLoading: false,
      onConfirm: async () => {
        try {
          setActionId(tag._id);
          setConfirmModal((prev) => ({
            ...prev,
            isLoading: true,
          }));

          const response = await api.delete(
            `/tags/${tag._id}`
          );

          if (!response.data?.success) {
            throw new Error(
              response.data?.message ||
                "Unable to delete tag"
            );
          }

          toast.success(
            response.data.message ||
              "Tag deleted successfully"
          );

          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            isLoading: false,
          }));

          if (tags.length === 1 && page > 1) {
            setPage((prev) => prev - 1);
          } else {
            await Promise.all([
              loadTags(),
              loadTrendingTags(),
            ]);
          }
        } catch (error) {
          toast.error(
            getErrorMessage(
              error,
              "Unable to delete tag"
            )
          );

          setConfirmModal((prev) => ({
            ...prev,
            isLoading: false,
          }));
        } finally {
          setActionId(null);
        }
      },
    });
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="tags-page">
      <div className="tags-page-header">
        <div>
          <h1>Tags</h1>
          <p>
            Manage the tags used to organize your news articles.
          </p>
        </div>

        <button
          type="button"
          className="tags-primary-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add Tag
        </button>
      </div>

      <div className="tags-stats">
        <div className="tags-stat-card">
          <div className="tags-stat-icon">
            <Tag size={21} />
          </div>

          <div>
            <span>Total Tags</span>
            <h3>{pagination.total}</h3>
          </div>
        </div>
      </div>

      <div className="tags-trending-summary">
        <div>
          <Flame size={20} />
          <strong>Trending Tags</strong>
        </div>

        <span>{trendingTags.length} / 5 selected</span>
      </div>

      <div className="tags-content-card">
        <div className="tags-toolbar">
          <div className="tags-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search tags..."
              value={search}
              onChange={(event) =>
                handleSearchChange(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            className="tags-status-filter"
            value={status}
            onChange={(event) =>
              handleStatusFilter(event.target.value)
            }
          >
            <option value="all">All Tags</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="tags-table-wrapper">
          <table className="tags-table">
            <thead>
              <tr>
                <th>Tag Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Trending</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="tags-empty">
                    <Loader2
                      className="tags-spinner"
                      size={24}
                    />
                    <span>Loading tags...</span>
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan="5" className="tags-empty">
                    <Tag size={30} />
                    <strong>No tags found</strong>
                    <span>
                      Try changing your search or create a new tag.
                    </span>
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag._id}>
                    <td>
                      <div className="tags-name-cell">
                        <strong>{tag.name?.en}</strong>
                        <span>{tag.name?.hi}</span>
                      </div>
                    </td>

                    <td>
                      <div className="tags-description-cell">
                        {tag.description?.en ||
                          tag.description?.hi ||
                          "—"}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`tags-status ${
                          tag.isActive ? "active" : "inactive"
                        }`}
                      >
                        {tag.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="tags-trending-control">
                        <label className="tags-trending-toggle">
                          <input
                            type="checkbox"
                            checked={Boolean(tag.isTrending)}
                            disabled={
                              !tag.isActive ||
                              Boolean(actionId)
                            }
                            onChange={(event) => {
                              const checked =
                                event.target.checked;

                              const nextOrder = checked
                                ? trendingTags.length + 1
                                : 0;

                              handleTrendingChange(
                                tag,
                                checked,
                                nextOrder
                              );
                            }}
                          />

                          <span className="tags-trending-slider" />
                        </label>

                        {tag.isTrending ? (
                          <div className="tags-trending-selected">
                            <Flame size={14} />
                            <span>
                              #{tag.trendingOrder}
                            </span>
                          </div>
                        ) : (
                          <span className="tags-trending-inactive">
                            Off
                          </span>
                        )}
                      </div>

                      {tag.isTrending && (
                        <select
                          className="tags-trending-order"
                          value={tag.trendingOrder}
                          disabled={Boolean(actionId)}
                          onChange={(event) =>
                            handleTrendingChange(
                              tag,
                              true,
                              event.target.value
                            )
                          }
                          aria-label={`Trending position for ${tag.name?.en}`}
                        >
                          {[1, 2, 3, 4, 5].map((order) => (
                            <option
                              key={order}
                              value={order}
                            >
                              Position {order}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td>
                      <div className="tags-actions">
                        <button
                          type="button"
                          title="Edit tag"
                          onClick={() =>
                            openEditModal(tag._id)
                          }
                          disabled={Boolean(actionId)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title={
                            tag.isActive
                              ? "Deactivate tag"
                              : "Activate tag"
                          }
                          onClick={() =>
                            handleStatusChange(tag)
                          }
                          disabled={Boolean(actionId)}
                        >
                          {tag.isActive ? (
                            <Power size={16} />
                          ) : (
                            <RotateCcw size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="delete"
                          title="Delete tag"
                          onClick={() => handleDelete(tag)}
                          disabled={Boolean(actionId)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="tags-pagination">
          <span>
            Showing{" "}
            {tags.length
              ? (page - 1) * pagination.limit + 1
              : 0}
            –
            {(page - 1) * pagination.limit + tags.length} of{" "}
            {pagination.total}
          </span>

          <div>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((prev) => prev - 1)
              }
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <span>
              {page} / {Math.max(1, pagination.totalPages)}
            </span>

            <button
              type="button"
              disabled={
                page >= pagination.totalPages || loading
              }
              onClick={() =>
                setPage((prev) => prev + 1)
              }
            >
              Next
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="tags-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="tags-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <form onSubmit={handleSubmit}>
              <div className="tags-modal-header">
                <div>
                  <h2>
                    {editingId ? "Edit Tag" : "Create Tag"}
                  </h2>

                  <p>
                    Add bilingual information for your news tag.
                  </p>
                </div>

                <button
                  type="button"
                  className="tags-modal-close"
                  onClick={closeModal}
                  disabled={saving}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="tags-modal-body">
                <div className="tags-language-section">
                  <h3>English Details</h3>

                  <label>
                    <span>
                      Tag Name{" "}
                      <span className="field-required-mark">
                        *
                      </span>
                    </span>

                    <input
                      className={
                        errors.nameEn ? "has-field-error" : ""
                      }
                      value={form.name.en}
                      onChange={(event) => {
                        updateField(
                          "name",
                          "en",
                          event.target.value
                        );

                        if (errors.nameEn) {
                          setErrors((prev) => ({
                            ...prev,
                            nameEn: "",
                          }));
                        }
                      }}
                      placeholder="For example: Technology"
                      maxLength={60}
                    />

                    {errors.nameEn && (
                      <span
                        className="field-error-text"
                        role="alert"
                      >
                        {errors.nameEn}
                      </span>
                    )}
                  </label>

                  <label>
                    Description

                    <textarea
                      className={
                        errors.descriptionEn
                          ? "has-field-error"
                          : ""
                      }
                      value={form.description.en}
                      onChange={(event) => {
                        updateField(
                          "description",
                          "en",
                          event.target.value
                        );

                        if (errors.descriptionEn) {
                          setErrors((prev) => ({
                            ...prev,
                            descriptionEn: "",
                          }));
                        }
                      }}
                      placeholder="Enter English description"
                      maxLength={300}
                      rows={3}
                    />

                    {errors.descriptionEn && (
                      <span
                        className="field-error-text"
                        role="alert"
                      >
                        {errors.descriptionEn}
                      </span>
                    )}
                  </label>
                </div>

                <div className="tags-language-section">
                  <h3>Hindi Details</h3>

                  <label>
                    <span>
                      Tag Name{" "}
                      <span className="field-required-mark">
                        *
                      </span>
                    </span>

                    <input
                      className={
                        errors.nameHi ? "has-field-error" : ""
                      }
                      value={form.name.hi}
                      onChange={(event) => {
                        updateField(
                          "name",
                          "hi",
                          event.target.value
                        );

                        if (errors.nameHi) {
                          setErrors((prev) => ({
                            ...prev,
                            nameHi: "",
                          }));
                        }
                      }}
                      placeholder="उदाहरण: तकनीक"
                      maxLength={60}
                    />

                    {errors.nameHi && (
                      <span
                        className="field-error-text"
                        role="alert"
                      >
                        {errors.nameHi}
                      </span>
                    )}
                  </label>

                  <label>
                    Description

                    <textarea
                      className={
                        errors.descriptionHi
                          ? "has-field-error"
                          : ""
                      }
                      value={form.description.hi}
                      onChange={(event) => {
                        updateField(
                          "description",
                          "hi",
                          event.target.value
                        );

                        if (errors.descriptionHi) {
                          setErrors((prev) => ({
                            ...prev,
                            descriptionHi: "",
                          }));
                        }
                      }}
                      placeholder="हिंदी विवरण दर्ज करें"
                      maxLength={300}
                      rows={3}
                    />

                    {errors.descriptionHi && (
                      <span
                        className="field-error-text"
                        role="alert"
                      >
                        {errors.descriptionHi}
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div className="tags-modal-footer">
                <button
                  type="button"
                  className="tags-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tags-primary-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="tags-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {editingId
                        ? "Update Tag"
                        : "Create Tag"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          !confirmModal.isLoading &&
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
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

export default TagsList;
