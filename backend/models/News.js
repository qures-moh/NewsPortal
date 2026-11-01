
const mongoose = require("mongoose");

const generateSlug = (value) => {
  return value
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
};

const localizedContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 220,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
    },
  },
  { _id: false }
);

const localizedSeoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false }
);

const articleMediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    order: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: true }
);

const newsSchema = new mongoose.Schema(
  {
    title: {
      en: localizedContentSchema,
      hi: localizedContentSchema,
    },

    availableLanguages: {
      type: [
        {
          type: String,
          enum: ["en", "hi"],
        },
      ],
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
    },

    thumbnail: {
      type: String,
      required: true,
      trim: true,
    },

    thumbnailAlt: {
      en: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      hi: {
        type: String,
        trim: true,
        maxlength: 200,
      },
    },

    media: {
      type: [articleMediaSchema],
      default: [],
      validate: {
        validator: function (items) {
          if (!Array.isArray(items)) return false;

          const imageCount = items.filter(
            (item) => item.type === "image"
          ).length;

          const videoCount = items.filter(
            (item) => item.type === "video"
          ).length;

          return imageCount <= 10 && videoCount <= 3;
        },
        message: "An article can contain at most 10 images and 3 videos.",
      },
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 40,
      },
    ],

    status: {
      type: String,
      enum: ["draft", "published", "scheduled", "archived"],
      default: "draft",
      index: true,
    },

    seo: {
      en: localizedSeoSchema,
      hi: localizedSeoSchema,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isBreaking: {
      type: Boolean,
      default: false,
      index: true,
    },

    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

newsSchema.pre("validate", function () {
  if (Array.isArray(this.availableLanguages)) {
    this.availableLanguages = [...new Set(this.availableLanguages)];

    for (const language of this.availableLanguages) {
      const localized = this.title?.[language];

      if (localized?.title) {
        localized.slug = generateSlug(localized.title);
      }

      if (
        !localized?.title ||
        !localized?.slug ||
        !localized?.excerpt ||
        !localized?.content
      ) {
        this.invalidate(
          `title.${language}`,
          `Complete ${language} title, excerpt and content are required`
        );
      }
    }
  }

  if (
    this.status === "scheduled" &&
    (!this.scheduledAt || this.scheduledAt <= new Date())
  ) {
    this.invalidate(
      "scheduledAt",
      "A future scheduled date is required"
    );
  }

  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

newsSchema.index(
  { "title.en.slug": 1 },
  {
    unique: true,
    sparse: true,
  }
);

newsSchema.index(
  { "title.hi.slug": 1 },
  {
    unique: true,
    sparse: true,
  }
);

newsSchema.index({ status: 1, publishedAt: -1 });

newsSchema.index({ category: 1, status: 1, publishedAt: -1 });

newsSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });

newsSchema.index({ status: 1, isTrending: 1, views: -1 });

module.exports = mongoose.model("News", newsSchema);
