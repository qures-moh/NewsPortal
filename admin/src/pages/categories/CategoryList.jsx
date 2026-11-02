
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./CategoryList.css";

const initialForm = {
  name: { en: "", hi: "" },
  description: { en: "", hi: "" },
  displayOrder: "",
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const generateSlug = (value) => {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
};

const getImageUrl = (path) => {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl = import.meta.env.VITE_API_URL || "";
  const backendUrl = apiUrl
    .replace(/\/api\/?$/i, "")
    .replace(/\/+$/, "");

  const normalizedPath = path.replace(/^\/+/, "");

  return backendUrl
    ? `${backendUrl}/${normalizedPath}`
    : `/${normalizedPath}`;
};

const CategoryList = () => {
  const [categories, setCategories] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState("");

  const fileInputRef = useRef(null);
  const previewRef = useRef("");

  const clearImagePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
    }

    setImagePreview("");
  }, []);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/categories/admin/all", {
        params: {
          page,
          limit: 10,
          search,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to fetch categories"
        );
      }

      setCategories(response.data.categories || []);

      const paginationData = response.data.pagination || {};

      setPagination({
        page: paginationData.page || page,
        totalPages: paginationData.totalPages || 1,
        total: paginationData.total || 0,
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to load categories")
      );
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
    clearImagePreview();

    setForm(initialForm);
    setErrors({});
    setImageFile(null);
    setExistingImage("");
    setEditingId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const openEditModal = async (category) => {
    try {
      setSaving(true);

      const response = await api.get(
        `/categories/admin/${category._id}`
      );

      const selectedCategory =
        response.data?.category || category;

      setEditingId(selectedCategory._id);

      setForm({
        name: {
          en: selectedCategory.name?.en || "",
          hi: selectedCategory.name?.hi || "",
        },
        description: {
          en: selectedCategory.description?.en || "",
          hi: selectedCategory.description?.hi || "",
        },
        displayOrder: String(
          selectedCategory.displayOrder ?? 0
        ),
      });

      setExistingImage(selectedCategory.image || "");
      setImageFile(null);
      setErrors({});
      clearImagePreview();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setModalOpen(true);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to load category")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only JPG, PNG, WEBP and AVIF images are allowed"
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      event.target.value = "";
      return;
    }

    clearImagePreview();

    const previewUrl = URL.createObjectURL(file);

    previewRef.current = previewUrl;

    setImagePreview(previewUrl);
    setImageFile(file);
  };

  const removeSelectedImage = () => {
    clearImagePreview();
    setImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadCategoryImage = async () => {
    if (!imageFile) {
      return existingImage || null;
    }

    if (!(imageFile instanceof File)) {
      throw new Error("Please select a valid image file.");
    }

    const formData = new FormData();

    formData.append("image", imageFile, imageFile.name);

    const response = await api.post("/media/image", formData);

    const imagePath =
      response.data?.data?.path ||
      response.data?.data?.url;

    if (!response.data?.success || !imagePath) {
      throw new Error(
        response.data?.message ||
          "Category image upload failed"
      );
    }

    return imagePath;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.en.trim()) {
      newErrors.nameEn = "English category name is required";
    } else if (form.name.en.trim().length < 2) {
      newErrors.nameEn =
        "English name must be at least 2 characters";
    } else if (!generateSlug(form.name.en)) {
      newErrors.nameEn =
        "English name contains invalid characters";
    }

    if (!form.name.hi.trim()) {
      newErrors.nameHi = "Hindi category name is required";
    } else if (form.name.hi.trim().length < 2) {
      newErrors.nameHi =
        "Hindi name must be at least 2 characters";
    } else if (!generateSlug(form.name.hi)) {
      newErrors.nameHi =
        "Hindi name contains invalid characters";
    }

    if (form.description.en.length > 500) {
      newErrors.descriptionEn =
        "English description cannot exceed 500 characters";
    }

    if (form.description.hi.length > 500) {
      newErrors.descriptionHi =
        "Hindi description cannot exceed 500 characters";
    }

    if (form.displayOrder !== "") {
      const displayOrder = Number(form.displayOrder);

      if (
        !Number.isInteger(displayOrder) ||
        displayOrder < 0 ||
        displayOrder > 10000
      ) {
        newErrors.displayOrder =
          "Display order must be an integer between 0 and 10000";
      }
    }

    if (editingId && form.displayOrder === "") {
      newErrors.displayOrder =
        "Display order is required when editing";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(
        "Please resolve the validation errors in the form"
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      let imagePath = existingImage || null;

      if (imageFile) {
        try {
          imagePath = await uploadCategoryImage();
        } catch (uploadError) {
          toast.error(
            getErrorMessage(
              uploadError,
              "Category image upload failed"
            )
          );

          return;
        }
      }

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
        image: imagePath,
      };

      if (form.displayOrder !== "") {
        payload.displayOrder = Number(form.displayOrder);
      }

      const wasEditing = Boolean(editingId);

      if (wasEditing) {
        await api.patch(
          `/categories/${editingId}`,
          payload
        );

        toast.success("Category updated successfully");
      } else {
        await api.post("/categories", payload);

        toast.success("Category created successfully");
      }

      setModalOpen(false);
      resetForm();

      if (!wasEditing && page !== 1) {
        setPage(1);
        return;
      }

      await loadCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to save category")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (category) => {
    const isActivating = !category.isActive;

    setConfirmModal({
      isOpen: true,
      title: isActivating
        ? "Activate Category"
        : "Deactivate Category",
      message: isActivating
        ? `Are you sure you want to activate "${
            category.name?.en || "this category"
          }"? It will become visible on the public portal.`
        : `Are you sure you want to deactivate "${
            category.name?.en || "this category"
          }"? It will be hidden from the public portal.`,
      confirmText: isActivating ? "Activate" : "Deactivate",
      variant: isActivating ? "primary" : "warning",
      isLoading: false,

      onConfirm: async () => {
        try {
          setConfirmModal((previous) => ({
            ...previous,
            isLoading: true,
          }));

          await api.patch(
            `/categories/${category._id}/status`,
            {
              isActive: isActivating,
            }
          );

          toast.success(
            isActivating
              ? "Category activated"
              : "Category deactivated"
          );

          setConfirmModal((previous) => ({
            ...previous,
            isOpen: false,
            isLoading: false,
          }));

          await loadCategories();
        } catch (error) {
          toast.error(
            getErrorMessage(error, "Unable to update status")
          );

          setConfirmModal((previous) => ({
            ...previous,
            isLoading: false,
          }));
        }
      },
    });
  };

  const handleDelete = (category) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Category",
      message: `Are you sure you want to permanently delete "${
        category.name?.en || "this category"
      }"? This action cannot be undone.`,
      confirmText: "Delete Category",
      variant: "danger",
      isLoading: false,

      onConfirm: async () => {
        try {
          setConfirmModal((previous) => ({
            ...previous,
            isLoading: true,
          }));

          await api.delete(`/categories/${category._id}`);

          toast.success("Category deleted successfully");

          setConfirmModal((previous) => ({
            ...previous,
            isOpen: false,
            isLoading: false,
          }));

          if (categories.length === 1 && page > 1) {
            setPage((previous) => previous - 1);
          } else {
            await loadCategories();
          }
        } catch (error) {
          toast.error(
            getErrorMessage(error, "Unable to delete category")
          );

          setConfirmModal((previous) => ({
            ...previous,
            isLoading: false,
          }));
        }
      },
    });
  };

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  };

  const displayedImage =
    imagePreview || getImageUrl(existingImage);

  return (
    <div className="category-page">
      <div className="category-page-header">
        <div>
          <h1>Categories</h1>
          <p>
            Manage your news categories in English and Hindi.
          </p>
        </div>

        <button
          type="button"
          className="category-primary-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="category-toolbar">
        <form
          className="category-search"
          onSubmit={handleSearch}
        >
          <Search size={18} />

          <input
            type="text"
            placeholder="Search categories..."
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
          />

          <button type="submit">Search</button>
        </form>

        <button
          type="button"
          className="category-refresh-btn"
          onClick={loadCategories}
          disabled={loading}
          aria-label="Refresh categories"
        >
          <RefreshCw
            size={17}
            className={loading ? "category-spin" : ""}
          />
        </button>
      </div>

      <div className="category-table-card">
        <div className="category-table-wrapper">
          <table className="category-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Hindi Name</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="category-empty">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="category-empty">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <div className="category-name-cell">
                        {category.image ? (
                          <img
                            src={getImageUrl(category.image)}
                            alt={category.name?.en || "Category"}
                          />
                        ) : (
                          <div className="category-placeholder">
                            <ImageIcon size={20} />
                          </div>
                        )}

                        <div>
                          <strong>
                            {category.name?.en || "—"}
                          </strong>

                          <span>
                            {category.description?.en ||
                              "No description"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{category.name?.hi || "—"}</td>

                    <td>{category.displayOrder ?? 0}</td>

                    <td>
                      <span
                        className={`category-status ${
                          category.isActive
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {category.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="category-actions">
                        <button
                          type="button"
                          title="Edit category"
                          onClick={() =>
                            openEditModal(category)
                          }
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title={
                            category.isActive
                              ? "Deactivate"
                              : "Activate"
                          }
                          onClick={() =>
                            handleStatusChange(category)
                          }
                        >
                          {category.isActive ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="danger"
                          title="Delete category"
                          onClick={() => handleDelete(category)}
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

        <div className="category-pagination">
          <span>
            Total categories:{" "}
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
          className="category-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="category-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="category-modal-header">
              <div>
                <h2>
                  {editingId ? "Edit Category" : "Add Category"}
                </h2>

                <p>
                  Enter category details in English and Hindi.
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
              <div className="category-modal-body">
                <section className="category-form-section">
                  <h3>English Details</h3>

                  <div className="category-form-grid">
                    <div className="category-form-group full">
                      <label>
                        Category Name{" "}
                        <span className="field-required-mark">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        className={
                          errors.nameEn ? "has-field-error" : ""
                        }
                        value={form.name.en}
                        onChange={(event) => {
                          updateLocalizedField(
                            "name",
                            "en",
                            event.target.value
                          );

                          if (errors.nameEn) {
                            setErrors((previous) => ({
                              ...previous,
                              nameEn: "",
                            }));
                          }
                        }}
                        placeholder="e.g. National"
                        maxLength={100}
                      />

                      {errors.nameEn && (
                        <span
                          className="field-error-text"
                          role="alert"
                        >
                          {errors.nameEn}
                        </span>
                      )}
                    </div>

                    <div className="category-form-group full">
                      <label>English Description</label>

                      <textarea
                        className={
                          errors.descriptionEn
                            ? "has-field-error"
                            : ""
                        }
                        value={form.description.en}
                        onChange={(event) => {
                          updateLocalizedField(
                            "description",
                            "en",
                            event.target.value
                          );

                          if (errors.descriptionEn) {
                            setErrors((previous) => ({
                              ...previous,
                              descriptionEn: "",
                            }));
                          }
                        }}
                        placeholder="Enter English description"
                        maxLength={500}
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
                    </div>
                  </div>
                </section>

                <section className="category-form-section">
                  <h3>Hindi Details</h3>

                  <div className="category-form-grid">
                    <div className="category-form-group full">
                      <label>
                        Hindi Category Name{" "}
                        <span className="field-required-mark">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        className={
                          errors.nameHi ? "has-field-error" : ""
                        }
                        value={form.name.hi}
                        onChange={(event) => {
                          updateLocalizedField(
                            "name",
                            "hi",
                            event.target.value
                          );

                          if (errors.nameHi) {
                            setErrors((previous) => ({
                              ...previous,
                              nameHi: "",
                            }));
                          }
                        }}
                        placeholder="उदाहरण: राष्ट्रीय समाचार"
                        maxLength={100}
                      />

                      {errors.nameHi && (
                        <span
                          className="field-error-text"
                          role="alert"
                        >
                          {errors.nameHi}
                        </span>
                      )}
                    </div>

                    <div className="category-form-group full">
                      <label>Hindi Description</label>

                      <textarea
                        className={
                          errors.descriptionHi
                            ? "has-field-error"
                            : ""
                        }
                        value={form.description.hi}
                        onChange={(event) => {
                          updateLocalizedField(
                            "description",
                            "hi",
                            event.target.value
                          );

                          if (errors.descriptionHi) {
                            setErrors((previous) => ({
                              ...previous,
                              descriptionHi: "",
                            }));
                          }
                        }}
                        placeholder="हिंदी विवरण लिखें"
                        maxLength={500}
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
                    </div>
                  </div>
                </section>

                <section className="category-form-section">
                  <h3>Additional Details</h3>

                  <div className="category-form-grid">
                    <div className="category-form-group full">
                      <label>Category Image</label>

                      <div className="category-upload-area">
                        <input
                          ref={fileInputRef}
                          type="file"
                          name="image"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={handleImageChange}
                          id="category-image-input"
                          hidden
                        />

                        <label
                          htmlFor="category-image-input"
                          className="category-upload-label"
                        >
                          <Upload size={22} />
                          <span>
                            Choose image from desktop
                          </span>
                          <small>
                            JPG, PNG, WEBP or AVIF · Maximum 5MB
                          </small>
                        </label>
                      </div>

                      {displayedImage && (
                        <div className="category-image-preview-wrapper">
                          <img
                            src={displayedImage}
                            alt="Category preview"
                            className="category-image-preview"
                          />

                          <div>
                            <strong>
                              {imageFile
                                ? imageFile.name
                                : "Current image"}
                            </strong>

                            <span>
                              {imageFile
                                ? `${(
                                    imageFile.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)} MB`
                                : "Existing category image"}
                            </span>

                            {imageFile && (
                              <button
                                type="button"
                                onClick={removeSelectedImage}
                              >
                                Remove selected image
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="category-form-group">
                      <label>
                        Display Order
                        {!editingId && (
                          <span className="field-optional-mark">
                            {" "}Optional
                          </span>
                        )}
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="1"
                        className={
                          errors.displayOrder
                            ? "has-field-error"
                            : ""
                        }
                        value={form.displayOrder}
                        onChange={(event) => {
                          setForm((previous) => ({
                            ...previous,
                            displayOrder: event.target.value,
                          }));

                          if (errors.displayOrder) {
                            setErrors((previous) => ({
                              ...previous,
                              displayOrder: "",
                            }));
                          }
                        }}
                        placeholder={
                          editingId
                            ? "Enter display order"
                            : "Auto (add to end)"
                        }
                      />

                      {!editingId && (
                        <small>
                          Leave blank to add this category at the end.
                        </small>
                      )}

                      {errors.displayOrder && (
                        <span
                          className="field-error-text"
                          role="alert"
                        >
                          {errors.displayOrder}
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <div className="category-modal-footer">
                <button
                  type="button"
                  className="category-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="category-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Category"
                      : "Create Category"}
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
          setConfirmModal((previous) => ({
            ...previous,
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

export default CategoryList;
