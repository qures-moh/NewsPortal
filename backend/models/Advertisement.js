
const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    bannerImage: {
      type: String,
      required: true,
      trim: true,
    },

    destinationUrl: {
      type: String,
      required: true,
      trim: true,
    },

    placement: {
      page: {
        type: String,
        enum: ["homepage", "article", "category"],
        required: true,
      },

      position: {
        type: String,
        enum: ["top", "middle", "bottom"],
        required: true,
      },
    },

    devices: {
      type: [String],
      enum: ["desktop", "mobile"],
      default: ["desktop", "mobile"],
      validate: {
        validator: function (value) {
          return value.length > 0 &&
            new Set(value).size === value.length;
        },
        message: "Select at least one valid device",
      },
    },

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      required: true,
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

advertisementSchema.pre("validate", function () {
  if (
    this.startAt &&
    this.endAt &&
    this.endAt <= this.startAt
  ) {
    this.invalidate(
      "endAt",
      "End date must be after start date"
    );
  }
});

advertisementSchema.index({
  isActive: 1,
  "placement.page": 1,
  "placement.position": 1,
  startAt: 1,
  endAt: 1,
});

advertisementSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model(
  "Advertisement",
  advertisementSchema
);
