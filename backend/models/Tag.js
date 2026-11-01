
const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    name: {
      en: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60,
      },
      hi: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60,
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
        maxlength: 300,
        default: "",
      },
      hi: {
        type: String,
        trim: true,
        maxlength: 300,
        default: "",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
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

tagSchema.index(
  { "slug.en": 1 },
  { unique: true }
);

tagSchema.index(
  { "slug.hi": 1 },
  { unique: true }
);

tagSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Tag", tagSchema);
