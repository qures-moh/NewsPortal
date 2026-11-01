
import React, { useEffect, useState } from "react";
import {
  Save,
  Globe,
  Image,
  Phone,
  Share2,
  Upload,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./Settings.css";

const platforms = [
  "facebook",
  "instagram",
  "youtube",
  "whatsapp",
  "twitter",
];

const defaultSettings = {
  websiteName: { en: "", hi: "" },

  branding: {
    logo: { url: null, isVisible: true },
    mobileLogo: { url: null, isVisible: true },
    footerLogo: { url: null, isVisible: true },
    favicon: { url: null, isVisible: true },
  },

  contact: {
    mobile: { value: "", isVisible: true },
    whatsapp: { value: "", isVisible: true },
    email: { value: "", isVisible: true },
    address: {
      value: { en: "", hi: "" },
      isVisible: true,
    },
    showContactInFooter: true,
    showFloatingWhatsapp: true,
  },

  socialLinks: platforms.map((platform) => ({
    platform,
    url: "",
    isActive: false,
    showInHeader: false,
    showInFooter: true,
  })),

  socialDisplay: {
    showInHeader: true,
    showInFooter: true,
  },
};

const mergeSettings = (data = {}) => {
  const result = {
    ...defaultSettings,
    ...data,
    websiteName: {
      ...defaultSettings.websiteName,
      ...data.websiteName,
    },
    branding: { ...defaultSettings.branding },
    contact: {
      ...defaultSettings.contact,
      ...data.contact,
    },
    socialDisplay: {
      ...defaultSettings.socialDisplay,
      ...data.socialDisplay,
    },
  };

  ["logo", "mobileLogo", "footerLogo", "favicon"].forEach((key) => {
    result.branding[key] = {
      ...defaultSettings.branding[key],
      ...data.branding?.[key],
    };
  });

  ["mobile", "whatsapp", "email"].forEach((key) => {
    result.contact[key] = {
      ...defaultSettings.contact[key],
      ...data.contact?.[key],
    };
  });

  result.contact.address = {
    ...defaultSettings.contact.address,
    ...data.contact?.address,
    value: {
      ...defaultSettings.contact.address.value,
      ...data.contact?.address?.value,
    },
  };

  result.socialLinks = platforms.map((platform) => {
    const existing = (data.socialLinks || []).find(
      (item) => item.platform === platform
    );

    return {
      ...defaultSettings.socialLinks.find(
        (item) => item.platform === platform
      ),
      ...existing,
    };
  });

  return result;
};

const getImageUrl = (path) => {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  const baseURL =
    api.defaults.baseURL ||
    import.meta.env.VITE_API_URL ||
    "";

  const backendURL = baseURL.replace(/\/api\/?$/, "");

  return `${backendURL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await api.get("/settings/admin");

      setSettings(
        mergeSettings(response.data?.settings || {})
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load website settings"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateNested = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateLocalized = (section, language, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [language]: value,
      },
    }));
  };

  const updateContactField = (field, property, value) => {
    setSettings((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: {
          ...prev.contact[field],
          [property]: value,
        },
      },
    }));
  };

  const updateAddress = (language, value) => {
    setSettings((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        address: {
          ...prev.contact.address,
          value: {
            ...prev.contact.address.value,
            [language]: value,
          },
        },
      },
    }));
  };

  const updateBranding = (field, property, value) => {
    setSettings((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        [field]: {
          ...prev.branding[field],
          [property]: value,
        },
      },
    }));
  };

  const updateSocialLink = (platform, property, value) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item) =>
        item.platform === platform
          ? { ...item, [property]: value }
          : item
      ),
    }));
  };

  const uploadImage = async (field, file) => {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP and AVIF images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB");
      return;
    }

    try {
      setUploading((prev) => ({ ...prev, [field]: true }));

      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post(
        "/media/image",
        formData
      );

      const imagePath = response.data?.data?.path;

      if (!imagePath) {
        throw new Error("Image path was not returned by the server");
      }

      updateBranding(field, "url", imagePath);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Image upload failed"
      );
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const validateSettings = () => {
    const nextErrors = {};

    if (!settings.websiteName.en.trim()) {
      nextErrors["websiteName.en"] = "English website name is required";
    } else if (settings.websiteName.en.trim().length < 2) {
      nextErrors["websiteName.en"] = "English website name must be at least 2 characters";
    }

    if (!settings.websiteName.hi.trim()) {
      nextErrors["websiteName.hi"] = "हिंदी वेबसाइट का नाम आवश्यक है";
    } else if (settings.websiteName.hi.trim().length < 2) {
      nextErrors["websiteName.hi"] = "हिंदी वेबसाइट का नाम कम से कम 2 अक्षरों का होना चाहिए";
    }

    const emailValue = settings.contact?.email?.value?.trim();
    if (emailValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        nextErrors["contact.email"] = "Please enter a valid email address";
      }
    }

    const mobileValue = settings.contact?.mobile?.value?.trim();
    if (mobileValue) {
      const phoneRegex = /^[0-9+\s\-()]{7,20}$/;
      if (!phoneRegex.test(mobileValue)) {
        nextErrors["contact.mobile"] = "Please enter a valid mobile number";
      }
    }

    const whatsappValue = settings.contact?.whatsapp?.value?.trim();
    if (whatsappValue) {
      const phoneRegex = /^[0-9+\s\-()]{7,20}$/;
      if (!phoneRegex.test(whatsappValue)) {
        nextErrors["contact.whatsapp"] = "Please enter a valid WhatsApp number";
      }
    }

    const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
    settings.socialLinks.forEach((item) => {
      const url = item.url.trim();
      if (item.isActive && !url) {
        nextErrors[`social.${item.platform}`] = `URL is required for active ${item.platform} link`;
      } else if (url && !urlRegex.test(url)) {
        nextErrors[`social.${item.platform}`] = "URL must start with http:// or https://";
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please correct the errors in the settings form");
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!validateSettings()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        websiteName: settings.websiteName,
        branding: settings.branding,
        contact: settings.contact,
        socialLinks: settings.socialLinks,
        socialDisplay: settings.socialDisplay,
      };

      await api.patch("/settings/admin", payload);

      toast.success("Website settings saved successfully");
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      if (Array.isArray(validationErrors)) {
        validationErrors.forEach((message) => toast.error(message));
      } else {
        toast.error(
          error.response?.data?.message ||
            "Failed to save settings"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <LoaderCircle className="settings-spinner" size={28} />
        <p>Loading website settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>Website Settings</h1>
          <p>Manage your website identity, contact details and social links.</p>
        </div>

        <div className="settings-header-actions">
          <button
            type="button"
            className="settings-reset-btn"
            onClick={() => setShowResetConfirm(true)}
            disabled={saving}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="submit"
            form="website-settings-form"
            className="settings-save-btn"
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle className="settings-spinner" size={17} />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <form
        id="website-settings-form"
        onSubmit={handleSave}
        className="settings-form"
      >
        {/* Website identity */}
        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <Globe size={19} />
            </div>
            <div>
              <h2>Website Identity</h2>
              <p>Set your website name in both languages.</p>
            </div>
          </div>

          <div className="settings-grid">
            {["en", "hi"].map((language) => (
              <div className="settings-field" key={language}>
                <label>
                  Website Name ({language === "en" ? "English" : "Hindi"})
                </label>
                <input
                  type="text"
                  className={errors[`websiteName.${language}`] ? "has-field-error" : ""}
                  maxLength={500}
                  value={settings.websiteName[language]}
                  onChange={(e) => {
                    if (errors[`websiteName.${language}`]) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy[`websiteName.${language}`];
                        return copy;
                      });
                    }
                    updateLocalized(
                      "websiteName",
                      language,
                      e.target.value
                    );
                  }}
                  placeholder={
                    language === "en"
                      ? "Enter website name"
                      : "वेबसाइट का नाम दर्ज करें"
                  }
                />
                {errors[`websiteName.${language}`] && (
                  <span className="field-error-text">{errors[`websiteName.${language}`]}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Branding */}
        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <Image size={19} />
            </div>
            <div>
              <h2>Website Branding</h2>
              <p>Upload logos and favicon for different website areas.</p>
            </div>
          </div>

          <div className="settings-branding-grid">
            {[
              { key: "logo", title: "Main Logo", hint: "Website header logo" },
              { key: "mobileLogo", title: "Mobile Logo", hint: "Logo for mobile layout" },
              { key: "footerLogo", title: "Footer Logo", hint: "Logo displayed in footer" },
              { key: "favicon", title: "Favicon", hint: "Browser tab icon" },
            ].map(({ key, title, hint }) => (
              <div className="settings-branding-item" key={key}>
                <div className="settings-branding-title">
                  <div>
                    <h3>{title}</h3>
                    <p>{hint}</p>
                  </div>

                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.branding[key].isVisible}
                      onChange={(e) =>
                        updateBranding(
                          key,
                          "isVisible",
                          e.target.checked
                        )
                      }
                    />
                    <span />
                  </label>
                </div>

                <div className="settings-image-preview">
                  {settings.branding[key].url ? (
                    <img
                      src={getImageUrl(settings.branding[key].url)}
                      alt={title}
                    />
                  ) : (
                    <div className="settings-image-placeholder">
                      <Image size={28} />
                      <span>No image uploaded</span>
                    </div>
                  )}
                </div>

                <label className="settings-upload-btn">
                  {uploading[key] ? (
                    <LoaderCircle className="settings-spinner" size={16} />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploading[key] ? "Uploading..." : "Upload Image"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={uploading[key]}
                    onChange={(e) => {
                      uploadImage(key, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <Phone size={19} />
            </div>
            <div>
              <h2>Contact Information</h2>
              <p>Manage public contact information and visibility.</p>
            </div>
          </div>

          <div className="settings-contact-grid">
            {[
              { key: "mobile", label: "Mobile Number", placeholder: "+91 9876543210" },
              { key: "whatsapp", label: "WhatsApp Number", placeholder: "+91 9876543210" },
              { key: "email", label: "Contact Email", placeholder: "contact@example.com" },
            ].map(({ key, label, placeholder }) => (
              <div className="settings-field" key={key}>
                <div className="settings-label-row">
                  <label>{label}</label>
                  <label className="settings-inline-switch">
                    <input
                      type="checkbox"
                      checked={settings.contact[key].isVisible}
                      onChange={(e) =>
                        updateContactField(
                          key,
                          "isVisible",
                          e.target.checked
                        )
                      }
                    />
                    Visible
                  </label>
                </div>

                <input
                  type={key === "email" ? "email" : "tel"}
                  className={errors[`contact.${key}`] ? "has-field-error" : ""}
                  value={settings.contact[key].value}
                  placeholder={placeholder}
                  onChange={(e) => {
                    if (errors[`contact.${key}`]) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy[`contact.${key}`];
                        return copy;
                      });
                    }
                    updateContactField(key, "value", e.target.value);
                  }}
                />
                {errors[`contact.${key}`] && (
                  <span className="field-error-text">{errors[`contact.${key}`]}</span>
                )}
              </div>
            ))}
          </div>

          <div className="settings-grid settings-address-grid">
            {["en", "hi"].map((language) => (
              <div className="settings-field" key={language}>
                <label>
                  Address ({language === "en" ? "English" : "Hindi"})
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={settings.contact.address.value[language]}
                  placeholder="Enter address"
                  onChange={(e) =>
                    updateAddress(language, e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <label className="settings-inline-switch settings-address-visibility">
            <input
              type="checkbox"
              checked={settings.contact.address.isVisible}
              onChange={(e) =>
                updateContactField(
                  "address",
                  "isVisible",
                  e.target.checked
                )
              }
            />
            Show address publicly
          </label>

          <div className="settings-toggle-list">
            <label>
              <span>
                <strong>Show contact information in footer</strong>
                <small>Display contact details in the website footer.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.contact.showContactInFooter}
                onChange={(e) =>
                  updateNested(
                    "contact",
                    "showContactInFooter",
                    e.target.checked
                  )
                }
              />
            </label>

            <label>
              <span>
                <strong>Enable floating WhatsApp button</strong>
                <small>Show the WhatsApp contact button on the website.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.contact.showFloatingWhatsapp}
                onChange={(e) =>
                  updateNested(
                    "contact",
                    "showFloatingWhatsapp",
                    e.target.checked
                  )
                }
              />
            </label>
          </div>
        </section>

        {/* Social media */}
        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <Share2 size={19} />
            </div>
            <div>
              <h2>Social Media Links</h2>
              <p>Configure your social media profiles and display options.</p>
            </div>
          </div>

          <div className="settings-toggle-list settings-social-display">
            <label>
              <span>
                <strong>Enable social links in header</strong>
                <small>Allow active social links to appear in the header.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.socialDisplay.showInHeader}
                onChange={(e) =>
                  updateNested(
                    "socialDisplay",
                    "showInHeader",
                    e.target.checked
                  )
                }
              />
            </label>

            <label>
              <span>
                <strong>Enable social links in footer</strong>
                <small>Allow active social links to appear in the footer.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.socialDisplay.showInFooter}
                onChange={(e) =>
                  updateNested(
                    "socialDisplay",
                    "showInFooter",
                    e.target.checked
                  )
                }
              />
            </label>
          </div>

          <div className="settings-social-list">
            {settings.socialLinks.map((item) => (
              <div className="settings-social-item" key={item.platform}>
                <div className="settings-social-top">
                  <h3>{item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}</h3>

                  <label className="settings-inline-switch">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) =>
                        updateSocialLink(
                          item.platform,
                          "isActive",
                          e.target.checked
                        )
                      }
                    />
                    Active
                  </label>
                </div>

                <input
                  type="url"
                  className={errors[`social.${item.platform}`] ? "has-field-error" : ""}
                  value={item.url}
                  placeholder={`https://${item.platform}.com/your-profile`}
                  onChange={(e) => {
                    if (errors[`social.${item.platform}`]) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy[`social.${item.platform}`];
                        return copy;
                      });
                    }
                    updateSocialLink(
                      item.platform,
                      "url",
                      e.target.value
                    );
                  }}
                />
                {errors[`social.${item.platform}`] && (
                  <span className="field-error-text">{errors[`social.${item.platform}`]}</span>
                )}

                <div className="settings-social-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={item.showInHeader}
                      onChange={(e) =>
                        updateSocialLink(
                          item.platform,
                          "showInHeader",
                          e.target.checked
                        )
                      }
                    />
                    Show in header
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={item.showInFooter}
                      onChange={(e) =>
                        updateSocialLink(
                          item.platform,
                          "showInFooter",
                          e.target.checked
                        )
                      }
                    />
                    Show in footer
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="settings-bottom-actions">
          <button
            type="submit"
            className="settings-save-btn"
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle className="settings-spinner" size={17} />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving Settings..." : "Save All Settings"}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Website Settings?"
        message="Are you sure you want to discard your changes and reload settings from the server?"
        confirmText="Reset Settings"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => {
          setShowResetConfirm(false);
          setErrors({});
          fetchSettings();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

export default Settings;
