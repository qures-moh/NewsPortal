
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
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

    image: {
      type: String,
      default: null,
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

categorySchema.index({ "slug.en": 1 }, { unique: true });
categorySchema.index({ "slug.hi": 1 }, { unique: true });
categorySchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model("Category", categorySchema);
