
const mongoose = require("mongoose");

const logoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      default: null,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const localizedSchema = new mongoose.Schema(
  {
    en: {
      type: String,
      trim: true,
      default: "",
    },
    hi: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const contactFieldSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      trim: true,
      default: "",
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    value: {
      type: localizedSchema,
      default: () => ({}),
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: [
        "facebook",
        "instagram",
        "youtube",
        "whatsapp",
        "twitter",
      ],
      required: true,
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    showInHeader: {
      type: Boolean,
      default: false,
    },
    showInFooter: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const websiteSettingsSchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      default: "main",
      unique: true,
      immutable: true,
    },

    websiteName: {
      type: localizedSchema,
      default: () => ({}),
    },

    branding: {
      logo: {
        type: logoSchema,
        default: () => ({}),
      },
      mobileLogo: {
        type: logoSchema,
        default: () => ({}),
      },
      footerLogo: {
        type: logoSchema,
        default: () => ({}),
      },
      favicon: {
        type: logoSchema,
        default: () => ({}),
      },
    },

    contact: {
      mobile: {
        type: contactFieldSchema,
        default: () => ({}),
      },
      whatsapp: {
        type: contactFieldSchema,
        default: () => ({}),
      },
      email: {
        type: contactFieldSchema,
        default: () => ({}),
      },
      address: {
        type: addressSchema,
        default: () => ({}),
      },
      showContactInFooter: {
        type: Boolean,
        default: true,
      },
      showFloatingWhatsapp: {
        type: Boolean,
        default: true,
      },
    },

    socialLinks: {
      type: [socialLinkSchema],
      default: [],
    },

    socialDisplay: {
      showInHeader: {
        type: Boolean,
        default: true,
      },
      showInFooter: {
        type: Boolean,
        default: true,
      },
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "WebsiteSettings",
  websiteSettingsSchema
);
