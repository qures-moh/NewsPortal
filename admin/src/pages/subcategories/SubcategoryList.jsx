import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./SubcategoryList.css";

const initialForm = {
  name: { en: "", hi: "" },
  description: { en: "", hi: "" },
  category: "",
  displayOrder: 0,
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const getLocalizedName = (value, language = "en") => {
  if (!value) return "—";

  if (typeof value === "string") return value;

  return value[language] || value.en || value.hi || "—";
};

const getCategoryId = (category) => {
  if (!category) return "";

  return typeof category === "string"
    ? category
    : category._id || "";
};

const generateSlug = (value) => {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
};

const SubcategoryList = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

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

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);

      const response = await api.get("/categories/admin/all", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to fetch categories"
        );
      }

      const activeCategories = (
        response.data.categories || []
      ).filter((category) => category.isActive);

      setCategories(activeCategories);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to load categories")
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadSubcategories = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/subcategories/admin/all", {
        params: {
          page,
          limit: 10,
          search,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to fetch subcategories"
        );
      }

      setSubcategories(response.data.subcategories || []);

      const paginationData = response.data.pagination || {};

      setPagination({
        page: paginationData.page || page,
        totalPages: paginationData.totalPages || 1,
        total: paginationData.total || 0,
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to load subcategories")
      );
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadSubcategories();
  }, [loadSubcategories]);

  const updateLocalizedField = (field, language, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: {
        ...previous[field],
        [language]: value,
      },
    }));
  };

  const resetForm = () => {
    setForm({
      name: { en: "", hi: "" },
      description: { en: "", hi: "" },
      category: "",
      displayOrder: 0,
    });

    setEditingId(null);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = async (subcategory) => {
    try {
      setSaving(true);

      const response = await api.get(
        `/subcategories/admin/${subcategory._id}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load subcategory"
        );
      }

      const selectedSubcategory =
        response.data.subcategory || subcategory;

      setEditingId(selectedSubcategory._id);

      setForm({
        name: {
          en: selectedSubcategory.name?.en || "",
          hi: selectedSubcategory.name?.hi || "",
        },
        description: {
          en: selectedSubcategory.description?.en || "",
          hi: selectedSubcategory.description?.hi || "",
        },
        category: getCategoryId(selectedSubcategory.category),
        displayOrder: selectedSubcategory.displayOrder ?? 0,
      });

      setModalOpen(true);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to load subcategory")
      );
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.en.trim()) {
      newErrors.nameEn = "English subcategory name is required";
    } else if (form.name.en.trim().length < 2) {
      newErrors.nameEn = "English name must be at least 2 characters";
    } else if (!generateSlug(form.name.en)) {
      newErrors.nameEn = "English name contains invalid characters";
    }

    if (!form.name.hi.trim()) {
      newErrors.nameHi = "Hindi subcategory name is required";
    } else if (form.name.hi.trim().length < 2) {
      newErrors.nameHi = "Hindi name must be at least 2 characters";
    } else if (!generateSlug(form.name.hi)) {
      newErrors.nameHi = "Hindi name contains invalid characters";
    }

    if (!form.category) {
      newErrors.category = "Please select a parent category";
    }

    if (form.description.en && form.description.en.length > 500) {
      newErrors.descriptionEn = "English description cannot exceed 500 characters";
    }

    if (form.description.hi && form.description.hi.length > 500) {
      newErrors.descriptionHi = "Hindi description cannot exceed 500 characters";
    }

    const displayOrder = Number(form.displayOrder);

    if (
      form.displayOrder === "" ||
      !Number.isInteger(displayOrder) ||
      displayOrder < 0 ||
      displayOrder > 10000
    ) {
      newErrors.displayOrder = "Display order must be an integer between 0 and 10000";
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

    const wasEditing = Boolean(editingId);

    const payload = {
      name: {
        en: form.name.en.trim(),
        hi: form.name.hi.trim(),
      },
      slug: {
        en: generateSlug(form.name.en),
        hi: generateSlug(form.name.hi),
      },
      description: {
        en: form.description.en.trim(),
        hi: form.description.hi.trim(),
      },
      category: form.category,
      displayOrder: Number(form.displayOrder),
    };

    try {
      setSaving(true);

      const response = wasEditing
        ? await api.patch(
            `/subcategories/${editingId}`,
            payload
          )
        : await api.post("/subcategories", payload);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to save subcategory"
        );
      }

      toast.success(
        wasEditing
          ? "Subcategory updated successfully"
          : "Subcategory created successfully"
      );

      setModalOpen(false);
      resetForm();

      if (!wasEditing && page !== 1) {
        setPage(1);
      } else {
        await loadSubcategories();
      }
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to save subcategory")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (subcategory) => {
    if (actionId) return;
    const isActivating = !subcategory.isActive;

    setConfirmModal({
      isOpen: true,
      title: isActivating ? "Activate Subcategory" : "Deactivate Subcategory",
      message: isActivating
        ? `Are you sure you want to activate "${subcategory.name?.en || "this subcategory"}"? It will become visible on the public portal.`
        : `Are you sure you want to deactivate "${subcategory.name?.en || "this subcategory"}"? It will be hidden from the public portal.`,
      confirmText: isActivating ? "Activate" : "Deactivate",
      variant: isActivating ? "primary" : "warning",
      isLoading: false,
      onConfirm: async () => {
        try {
          setActionId(subcategory._id);
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));

          const response = await api.patch(
            `/subcategories/${subcategory._id}/status`,
            {
              isActive: isActivating,
            }
          );

          if (!response.data?.success) {
            throw new Error(
              response.data?.message || "Unable to update status"
            );
          }

          toast.success(
            isActivating ? "Subcategory activated" : "Subcategory deactivated"
          );

          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          await loadSubcategories();
        } catch (error) {
          toast.error(
            getErrorMessage(error, "Unable to update status")
          );
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        } finally {
          setActionId(null);
        }
      },
    });
  };

  const handleDelete = (subcategory) => {
    if (actionId) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Subcategory",
      message: `Are you sure you want to permanently delete "${subcategory.name?.en || "this subcategory"}"? This action cannot be undone.`,
      confirmText: "Delete Subcategory",
      variant: "danger",
      isLoading: false,
      onConfirm: async () => {
        try {
          setActionId(subcategory._id);
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));

          const response = await api.delete(
            `/subcategories/${subcategory._id}`
          );

          if (!response.data?.success) {
            throw new Error(
              response.data?.message || "Unable to delete subcategory"
            );
          }

          toast.success("Subcategory deleted successfully");
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));

          if (subcategories.length === 1 && page > 1) {
            setPage((previous) => previous - 1);
          } else {
            await loadSubcategories();
          }
        } catch (error) {
          toast.error(
            getErrorMessage(error, "Unable to delete subcategory")
          );
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        } finally {
          setActionId(null);
        }
      },
    });
  };

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleRefresh = () => {
    loadSubcategories();
    loadCategories();
  };

  return (
    <div className="subcategory-page">
      <div className="subcategory-page-header">
        <div>
          <h1>Subcategories</h1>
          <p>Organize news into more specific sections.</p>
        </div>

        <button
          type="button"
          className="subcategory-primary-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add Subcategory
        </button>
      </div>

      <div className="subcategory-toolbar">
        <form
          className="subcategory-search"
          onSubmit={handleSearch}
        >
          <Search size={18} />

          <input
            type="text"
            placeholder="Search subcategories..."
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
          />

          <button type="submit">Search</button>
        </form>

        <button
          type="button"
          className="subcategory-refresh-btn"
          onClick={handleRefresh}
          disabled={loading || categoriesLoading}
          aria-label="Refresh subcategories"
        >
          <RefreshCw
            size={17}
            className={loading ? "subcategory-spin" : ""}
          />
        </button>
      </div>

      <div className="subcategory-table-card">
        <div className="subcategory-table-wrapper">
          <table className="subcategory-table">
            <thead>
              <tr>
                <th>Subcategory</th>
                <th>Hindi Name</th>
                <th>Parent Category</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="subcategory-empty">
                    Loading subcategories...
                  </td>
                </tr>
              ) : subcategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="subcategory-empty">
                    No subcategories found.
                  </td>
                </tr>
              ) : (
                subcategories.map((subcategory) => (
                  <tr key={subcategory._id}>
                    <td>
                      <div className="subcategory-name-cell">
                        <strong>
                          {subcategory.name?.en || "—"}
                        </strong>

                        <span>
                          {subcategory.description?.en ||
                            "No description"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {subcategory.name?.hi || "—"}
                    </td>

                    <td>
                      <span className="subcategory-parent">
                        {getLocalizedName(
                          subcategory.category?.name,
                          "en"
                        )}
                      </span>
                    </td>

                    <td>
                      {subcategory.displayOrder ?? 0}
                    </td>

                    <td>
                      <span
                        className={`subcategory-status ${
                          subcategory.isActive
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {subcategory.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="subcategory-actions">
                        <button
                          type="button"
                          title="Edit subcategory"
                          disabled={Boolean(actionId)}
                          onClick={() =>
                            openEditModal(subcategory)
                          }
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title={
                            subcategory.isActive
                              ? "Deactivate"
                              : "Activate"
                          }
                          disabled={
                            actionId === subcategory._id
                          }
                          onClick={() =>
                            handleStatusChange(subcategory)
                          }
                        >
                          {subcategory.isActive ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="danger"
                          title="Delete subcategory"
                          disabled={Boolean(actionId)}
                          onClick={() =>
                            handleDelete(subcategory)
                          }
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

        <div className="subcategory-pagination">
          <span>
            Total subcategories:{" "}
            <strong>{pagination.total}</strong>
          </span>

          <div>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((previous) => previous - 1)
              }
            >
              <ChevronLeft size={17} />
            </button>

            <span>
              Page {page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= pagination.totalPages || loading
              }
              onClick={() =>
                setPage((previous) => previous + 1)
              }
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="subcategory-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="subcategory-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="subcategory-modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit Subcategory"
                    : "Add Subcategory"}
                </h2>

                <p>
                  Enter subcategory details in English and Hindi.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="subcategory-modal-body">
                <section className="subcategory-form-section">
                  <h3>English Details</h3>

                  <div className="subcategory-form-grid">
                    <div className="subcategory-form-group full">
                      <label>
                        Subcategory Name <span className="field-required-mark">*</span>
                      </label>

                      <input
                        type="text"
                        className={errors.nameEn ? "has-field-error" : ""}
                        value={form.name.en}
                        onChange={(event) => {
                          updateLocalizedField(
                            "name",
                            "en",
                            event.target.value
                          );
                          if (errors.nameEn) {
                            setErrors((prev) => ({ ...prev, nameEn: "" }));
                          }
                        }}
                        placeholder="e.g. Politics"
                        maxLength={100}
                      />
                      {errors.nameEn && (
                        <span className="field-error-text" role="alert">
                          {errors.nameEn}
                        </span>
                      )}
                    </div>

                    <div className="subcategory-form-group full">
                      <label>English Description</label>

                      <textarea
                        className={errors.descriptionEn ? "has-field-error" : ""}
                        value={form.description.en}
                        onChange={(event) => {
                          updateLocalizedField(
                            "description",
                            "en",
                            event.target.value
                          );
                          if (errors.descriptionEn) {
                            setErrors((prev) => ({ ...prev, descriptionEn: "" }));
                          }
                        }}
                        placeholder="Enter English description"
                        maxLength={500}
                        rows={3}
                      />
                      {errors.descriptionEn && (
                        <span className="field-error-text" role="alert">
                          {errors.descriptionEn}
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                <section className="subcategory-form-section">
                  <h3>Hindi Details</h3>

                  <div className="subcategory-form-grid">
                    <div className="subcategory-form-group full">
                      <label>
                        Hindi Subcategory Name <span className="field-required-mark">*</span>
                      </label>

                      <input
                        type="text"
                        className={errors.nameHi ? "has-field-error" : ""}
                        value={form.name.hi}
                        onChange={(event) => {
                          updateLocalizedField(
                            "name",
                            "hi",
                            event.target.value
                          );
                          if (errors.nameHi) {
                            setErrors((prev) => ({ ...prev, nameHi: "" }));
                          }
                        }}
                        placeholder="उदाहरण: राजनीति"
                        maxLength={100}
                      />
                      {errors.nameHi && (
                        <span className="field-error-text" role="alert">
                          {errors.nameHi}
                        </span>
                      )}
                    </div>

                    <div className="subcategory-form-group full">
                      <label>Hindi Description</label>

                      <textarea
                        className={errors.descriptionHi ? "has-field-error" : ""}
                        value={form.description.hi}
                        onChange={(event) => {
                          updateLocalizedField(
                            "description",
                            "hi",
                            event.target.value
                          );
                          if (errors.descriptionHi) {
                            setErrors((prev) => ({ ...prev, descriptionHi: "" }));
                          }
                        }}
                        placeholder="हिंदी विवरण लिखें"
                        maxLength={500}
                        rows={3}
                      />
                      {errors.descriptionHi && (
                        <span className="field-error-text" role="alert">
                          {errors.descriptionHi}
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                <section className="subcategory-form-section">
                  <h3>Additional Details</h3>

                  <div className="subcategory-form-grid">
                    <div className="subcategory-form-group full">
                      <label>
                        Parent Category <span className="field-required-mark">*</span>
                      </label>

                      <select
                        className={errors.category ? "has-field-error" : ""}
                        value={form.category}
                        onChange={(event) => {
                          setForm((previous) => ({
                            ...previous,
                            category: event.target.value,
                          }));
                          if (errors.category) {
                            setErrors((prev) => ({ ...prev, category: "" }));
                          }
                        }}
                        disabled={categoriesLoading}
                      >
                        <option value="">
                          {categoriesLoading
                            ? "Loading categories..."
                            : "Select parent category"}
                        </option>

                        {categories.map((category) => (
                          <option
                            key={category._id}
                            value={category._id}
                          >
                            {category.name?.en} (
                            {category.name?.hi})
                          </option>
                        ))}
                      </select>

                      {errors.category && (
                        <span className="field-error-text" role="alert">
                          {errors.category}
                        </span>
                      )}

                      {categories.length === 0 &&
                        !categoriesLoading && (
                          <small className="subcategory-field-hint">
                            No active categories found. Create or
                            activate a category first.
                          </small>
                        )}
                    </div>

                    <div className="subcategory-form-group">
                      <label>
                        Display Order <span className="field-required-mark">*</span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="1"
                        className={errors.displayOrder ? "has-field-error" : ""}
                        value={form.displayOrder}
                        onChange={(event) => {
                          setForm((previous) => ({
                            ...previous,
                            displayOrder: event.target.value,
                          }));
                          if (errors.displayOrder) {
                            setErrors((prev) => ({ ...prev, displayOrder: "" }));
                          }
                        }}
                      />
                      {errors.displayOrder && (
                        <span className="field-error-text" role="alert">
                          {errors.displayOrder}
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <div className="subcategory-modal-footer">
                <button
                  type="button"
                  className="subcategory-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="subcategory-primary-btn"
                  disabled={
                    saving ||
                    categoriesLoading ||
                    categories.length === 0
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Subcategory"
                      : "Create Subcategory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default SubcategoryList;