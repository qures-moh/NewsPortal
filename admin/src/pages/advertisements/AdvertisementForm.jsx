
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./AdvertisementForm.css";

const initialForm = {
  name: "",
  bannerImage: "",
  destinationUrl: "",
  page: "homepage",
  position: "top",
  devices: ["desktop", "mobile"],
  startAt: "",
  endAt: "",
  isActive: true,
};

const toDateTimeLocal = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  const offset = parsedDate.getTimezoneOffset() * 60000;

  return new Date(parsedDate.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;

  const apiUrl = import.meta.env.VITE_API_URL || "";
  const backendUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${backendUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

const AdvertisementForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (isEditMode) {
      fetchAdvertisement();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchAdvertisement = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/advertisements/admin/${id}`
      );

      const ad = response.data.advertisement;

      if (!ad) {
        toast.error("Advertisement not found");
        navigate("/advertisements", { replace: true });
        return;
      }

      setForm({
        name: ad.name || "",
        bannerImage: ad.bannerImage || "",
        destinationUrl: ad.destinationUrl || "",
        page: ad.placement?.page || "homepage",
        position: ad.placement?.position || "top",
        devices: ad.devices || ["desktop", "mobile"],
        startAt: toDateTimeLocal(ad.startAt),
        endAt: toDateTimeLocal(ad.endAt),
        isActive: ad.isActive ?? true,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load advertisement"
      );

      navigate("/advertisements", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WEBP and AVIF images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);

      const response = await api.post("/media/image", formData);

      const uploadedPath = response.data?.data?.path;

      if (!uploadedPath) {
        throw new Error("Image upload response did not contain a path");
      }

      setForm((previous) => ({
        ...previous,
        bannerImage: uploadedPath,
      }));
      setIsDirty(true);
      if (errors.bannerImage) {
        setErrors((prev) => ({ ...prev, bannerImage: "" }));
      }

      toast.success("Banner image uploaded successfully");
    } catch (error) {
      setPreviewUrl("");
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Image upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((previous) => ({
      ...previous,
      bannerImage: "",
    }));
    setIsDirty(true);
    setPreviewUrl("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
    setIsDirty(true);

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDeviceChange = (device) => {
    setForm((previous) => {
      const alreadySelected = previous.devices.includes(device);
      const updatedDevices = alreadySelected
        ? previous.devices.filter((item) => item !== device)
        : [...previous.devices, device];

      return {
        ...previous,
        devices: updatedDevices,
      };
    });
    setIsDirty(true);

    if (errors.devices) {
      setErrors((prev) => ({ ...prev, devices: "" }));
    }
  };

  const handleBackOrCancel = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      navigate("/advertisements");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Advertisement name is required";
    } else if (form.name.trim().length < 3) {
      newErrors.name = "Advertisement name must be at least 3 characters";
    }

    if (!form.bannerImage) {
      newErrors.bannerImage = "Please upload a banner image";
    }

    if (!form.destinationUrl.trim()) {
      newErrors.destinationUrl = "Destination URL is required";
    } else {
      try {
        const url = new URL(form.destinationUrl);
        if (!["http:", "https:"].includes(url.protocol)) {
          newErrors.destinationUrl = "Destination URL must begin with http:// or https://";
        }
      } catch {
        newErrors.destinationUrl = "Please enter a valid destination URL (e.g., https://example.com)";
      }
    }

    if (!form.devices.length) {
      newErrors.devices = "Select at least one device";
    }

    if (!form.startAt) {
      newErrors.startAt = "Start date and time is required";
    }

    if (!form.endAt) {
      newErrors.endAt = "End date and time is required";
    } else if (form.startAt && new Date(form.endAt) <= new Date(form.startAt)) {
      newErrors.endAt = "End date must be strictly after the start date";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please correct the errors before saving");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (uploading) {
      toast.error("Please wait for the image upload to finish");
      return;
    }

    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      bannerImage: form.bannerImage,
      destinationUrl: form.destinationUrl.trim(),
      placement: {
        page: form.page,
        position: form.position,
      },
      devices: form.devices,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      isActive: form.isActive,
    };

    try {
      setSaving(true);

      if (isEditMode) {
        await api.patch(`/advertisements/${id}`, payload);
        toast.success("Advertisement updated successfully");
      } else {
        await api.post("/advertisements", payload);
        toast.success("Advertisement created successfully");
      }

      navigate("/advertisements");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to save advertisement"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ad-form-loading">
        Loading advertisement...
      </div>
    );
  }

  const imagePreview = previewUrl || getImageUrl(form.bannerImage);

  return (
    <div className="ad-form-page">
      <div className="ad-form-header">
        <div>
          <button
            type="button"
            className="ad-back-btn"
            onClick={handleBackOrCancel}
          >
            <ArrowLeft size={17} />
            Back to advertisements
          </button>

          <h1>
            {isEditMode ? "Edit Advertisement" : "Create Advertisement"}
          </h1>

          <p>
            Configure your advertisement, placement, devices, and schedule.
          </p>
        </div>
      </div>

      <form className="ad-form-card" onSubmit={handleSubmit}>
        <div className="ad-form-section">
          <h2>Basic Information</h2>
          <p>Enter the advertisement details.</p>

          <div className="ad-form-field">
            <label htmlFor="name">
              Advertisement Name <span className="field-required-mark">*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              className={errors.name ? "has-field-error" : ""}
              value={form.name}
              onChange={handleChange}
              placeholder="Example: Homepage Summer Campaign"
              maxLength={100}
            />
            {errors.name && (
              <span className="field-error-text" role="alert">
                {errors.name}
              </span>
            )}
          </div>

          <div className="ad-form-field">
            <label>
              Banner Image <span className="field-required-mark">*</span>
            </label>

            <div className={`ad-upload-area ${errors.bannerImage ? "input-has-error" : ""}`}>
              {imagePreview ? (
                <div className="ad-upload-preview">
                  <img
                    src={imagePreview}
                    alt="Advertisement banner preview"
                  />

                  <button
                    type="button"
                    className="ad-remove-image"
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    title="Remove image"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <div className="ad-upload-placeholder">
                  <ImageIcon size={35} />
                  <strong>Upload advertisement banner</strong>
                  <span>JPEG, PNG, WEBP or AVIF · Maximum 5 MB</span>
                </div>
              )}

              <label
                htmlFor="bannerUpload"
                className={`ad-upload-btn ${
                  uploading ? "uploading" : ""
                }`}
              >
                <Upload size={17} />
                {uploading
                  ? "Uploading image..."
                  : imagePreview
                    ? "Choose Another Image"
                    : "Choose Image"}
              </label>

              <input
                id="bannerUpload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleImageUpload}
                disabled={uploading}
                hidden
              />
            </div>

            {errors.bannerImage && (
              <span className="field-error-text" role="alert">
                {errors.bannerImage}
              </span>
            )}

            {form.bannerImage && !uploading && (
              <small className="ad-upload-success">
                Image uploaded successfully
              </small>
            )}
          </div>

          <div className="ad-form-field">
            <label htmlFor="destinationUrl">
              Destination URL <span className="field-required-mark">*</span>
            </label>
            <input
              id="destinationUrl"
              type="url"
              name="destinationUrl"
              className={errors.destinationUrl ? "has-field-error" : ""}
              value={form.destinationUrl}
              onChange={handleChange}
              placeholder="https://example.com"
            />
            {errors.destinationUrl && (
              <span className="field-error-text" role="alert">
                {errors.destinationUrl}
              </span>
            )}
          </div>
        </div>

        <div className="ad-form-divider" />

        <div className="ad-form-section">
          <h2>Advertisement Placement</h2>
          <p>Choose where this advertisement should appear.</p>

          <div className="ad-form-grid">
            <div className="ad-form-field">
              <label htmlFor="page">Page *</label>
              <select
                id="page"
                name="page"
                value={form.page}
                onChange={handleChange}
              >
                <option value="homepage">Homepage</option>
                <option value="article">Article</option>
                <option value="category">Category</option>
              </select>
            </div>

            <div className="ad-form-field">
              <label htmlFor="position">Position *</label>
              <select
                id="position"
                name="position"
                value={form.position}
                onChange={handleChange}
              >
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
        </div>

        <div className="ad-form-divider" />

        <div className="ad-form-section">
          <h2>Target Devices</h2>
          <p>Select the devices on which this advertisement can appear.</p>

          <div className={`ad-device-options ${errors.devices ? "has-field-error" : ""}`}>
            {["desktop", "mobile"].map((device) => (
              <label className="ad-device-option" key={device}>
                <input
                  type="checkbox"
                  checked={form.devices.includes(device)}
                  onChange={() => handleDeviceChange(device)}
                />
                {device.charAt(0).toUpperCase() + device.slice(1)}
              </label>
            ))}
          </div>
          {errors.devices && (
            <span className="field-error-text" role="alert">
              {errors.devices}
            </span>
          )}
        </div>

        <div className="ad-form-divider" />

        <div className="ad-form-section">
          <h2>Advertisement Schedule</h2>
          <p>Set when this advertisement should run.</p>

          <div className="ad-form-grid">
            <div className="ad-form-field">
              <label htmlFor="startAt">
                Start Date and Time <span className="field-required-mark">*</span>
              </label>
              <input
                id="startAt"
                type="datetime-local"
                name="startAt"
                className={errors.startAt ? "has-field-error" : ""}
                value={form.startAt}
                onChange={handleChange}
              />
              {errors.startAt && (
                <span className="field-error-text" role="alert">
                  {errors.startAt}
                </span>
              )}
            </div>

            <div className="ad-form-field">
              <label htmlFor="endAt">
                End Date and Time <span className="field-required-mark">*</span>
              </label>
              <input
                id="endAt"
                type="datetime-local"
                name="endAt"
                className={errors.endAt ? "has-field-error" : ""}
                value={form.endAt}
                onChange={handleChange}
                min={form.startAt || undefined}
              />
              {errors.endAt && (
                <span className="field-error-text" role="alert">
                  {errors.endAt}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ad-form-divider" />

        <div className="ad-form-section">
          <h2>Status</h2>

          <label className="ad-active-toggle">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            <span>
              <strong>Advertisement Active</strong>
              <small>
                Allow this advertisement to be considered for display.
              </small>
            </span>
          </label>
        </div>

        <div className="ad-form-footer">
          <button
            type="button"
            className="ad-cancel-btn"
            onClick={handleBackOrCancel}
            disabled={saving || uploading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="ad-submit-btn"
            disabled={saving || uploading}
          >
            <Save size={17} />
            {saving
              ? "Saving..."
              : uploading
                ? "Uploading image..."
                : isEditMode
                  ? "Update Advertisement"
                  : "Create Advertisement"}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          navigate("/advertisements");
        }}
        title="Discard Changes"
        message="You have unsaved changes on this advertisement. Are you sure you want to discard them and return to the advertisements list?"
        confirmText="Discard and Leave"
        cancelText="Keep Editing"
        variant="warning"
      />
    </div>
  );
};

export default AdvertisementForm;
