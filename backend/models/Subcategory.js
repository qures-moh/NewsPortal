
const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      en: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      hi: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
    },

    slug: {
      en: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      hi: {
        type: String,
        required: true,
        trim: true,
      },
    },

    description: {
      en: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      hi: {
        type: String,
        trim: true,
        maxlength: 500,
      },
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
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

subcategorySchema.index(
  { category: 1, "slug.en": 1 },
  { unique: true }
);

subcategorySchema.index(
  { category: 1, "slug.hi": 1 },
  { unique: true }
);

subcategorySchema.index({ category: 1, isActive: 1, displayOrder: 1 });

module.exports = mongoose.model("Subcategory", subcategorySchema);
