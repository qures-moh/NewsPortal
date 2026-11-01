
const WebsiteSettings = require("../models/WebsiteSettings");

const defaultSettings = {
  siteKey: "main",
  websiteName: {
    en: "",
    hi: "",
  },
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
  socialLinks: [],
  socialDisplay: {
    showInHeader: true,
    showInFooter: true,
  },
};

// Merge nested objects while preserving fields not submitted.
// Arrays are replaced instead of merged.
const mergeObjects = (existing, updates) => {
  const result = { ...existing };

  Object.keys(updates).forEach((key) => {
    const newValue = updates[key];
    const oldValue = existing?.[key];

    if (
      newValue &&
      typeof newValue === "object" &&
      !Array.isArray(newValue) &&
      !(newValue instanceof Date)
    ) {
      result[key] = mergeObjects(
        oldValue &&
          typeof oldValue === "object" &&
          !Array.isArray(oldValue)
          ? oldValue
          : {},
        newValue
      );
    } else {
      result[key] = newValue;
    }
  });

  return result;
};

const getOrCreateSettings = async () => {
  let settings = await WebsiteSettings.findOne({
    siteKey: "main",
  });

  if (settings) {
    return settings;
  }

  try {
    settings = await WebsiteSettings.create(defaultSettings);
    return settings;
  } catch (error) {
    // Handle simultaneous first-time requests.
    if (error.code === 11000) {
      return WebsiteSettings.findOne({ siteKey: "main" });
    }

    throw error;
  }
};

// Full settings for authenticated admin requests.
const getAdminSettings = async () => {
  const settings = await getOrCreateSettings();

  return settings;
};

// Only expose settings intended for the public website.
const getPublicSettings = async () => {
  const settings = await getOrCreateSettings();
  const data = settings.toObject();

  const branding = {};

  Object.entries(data.branding || {}).forEach(([key, item]) => {
    branding[key] = {
      isVisible: item.isVisible,
      url: item.isVisible ? item.url : null,
    };
  });

  const contact = {};

  ["mobile", "whatsapp", "email"].forEach((field) => {
    const item = data.contact?.[field] || {};

    contact[field] = {
      isVisible: item.isVisible,
      value: item.isVisible ? item.value : "",
    };
  });

  const address = data.contact?.address || {};

  contact.address = {
    isVisible: address.isVisible,
    value: address.isVisible
      ? address.value
      : { en: "", hi: "" },
  };

  contact.showContactInFooter =
    data.contact?.showContactInFooter ?? true;

  const whatsapp = data.contact?.whatsapp || {};

  contact.showFloatingWhatsapp =
    Boolean(data.contact?.showFloatingWhatsapp) &&
    Boolean(whatsapp.isVisible) &&
    Boolean(whatsapp.value);

  const socialDisplay = data.socialDisplay || {
    showInHeader: true,
    showInFooter: true,
  };

  const socialLinks = (data.socialLinks || [])
    .filter((item) => {
      if (!item.isActive) return false;

      return (
        (socialDisplay.showInHeader && item.showInHeader) ||
        (socialDisplay.showInFooter && item.showInFooter)
      );
    })
    .map((item) => ({
      platform: item.platform,
      url: item.url,
      isActive: item.isActive,
      showInHeader:
        Boolean(socialDisplay.showInHeader) &&
        Boolean(item.showInHeader),
      showInFooter:
        Boolean(socialDisplay.showInFooter) &&
        Boolean(item.showInFooter),
    }));

  return {
    websiteName: data.websiteName,
    branding,
    contact,
    socialLinks,
    socialDisplay,
  };
};

// Update settings using partial nested updates.
const updateSettings = async (data, adminId) => {
  const settings = await getOrCreateSettings();

  const currentData = settings.toObject();

  const mergedData = mergeObjects(currentData, data);

  // Update only the fields allowed by the validator.
  Object.keys(data).forEach((field) => {
    settings.set(field, mergedData[field]);
  });

  settings.updatedBy = adminId;

  await settings.save();

  return settings;
};

module.exports = {
  getOrCreateSettings,
  getAdminSettings,
  getPublicSettings,
  updateSettings,
};
