
const mongoose = require("mongoose");
const Advertisement = require("../models/Advertisement");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validateId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid advertisement ID", 400);
  }
};

const validatePagination = (page, limit) => {
  const parsedPage = Number(page || 1);
  const parsedLimit = Number(limit || 10);

  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1 ||
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 100
  ) {
    throw createError("Invalid pagination values", 400);
  }

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};

// Create a banner advertisement.
const createAdvertisement = async (data, adminId) => {
  const advertisement = await Advertisement.create({
    ...data,
    createdBy: adminId,
  });

  return advertisement;
};

// Get a single advertisement for admin.
const getAdvertisementById = async (id) => {
  validateId(id);

  const advertisement = await Advertisement.findById(id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!advertisement) {
    throw createError("Advertisement not found", 404);
  }

  return advertisement;
};

// Get all advertisements for admin.
const getAdminAdvertisements = async ({
  page = 1,
  limit = 10,
  search,
  pageType,
  position,
  isActive,
} = {}) => {
  const pagination = validatePagination(page, limit);

  const filter = {};

  if (search) {
    if (typeof search !== "string" || search.length > 100) {
      throw createError("Invalid search value", 400);
    }

    filter.name = {
      $regex: escapeRegex(search.trim()),
      $options: "i",
    };
  }

  if (pageType) {
    if (!["homepage", "article", "category"].includes(pageType)) {
      throw createError("Invalid advertisement page", 400);
    }

    // Match either legacy placement.page or the new pages array
    filter.$or = [
      { "placement.page": pageType },
      { pages: pageType },
    ];
  }

  if (position) {
    if (!["top", "middle", "bottom"].includes(position)) {
      throw createError("Invalid advertisement position", 400);
    }

    // Match either legacy placement.position or the new positions array
    if (filter.$or) {
      // If we already have a $or from pageType, use $and to combine
      const pageOr = filter.$or;
      delete filter.$or;
      filter.$and = [
        { $or: pageOr },
        { $or: [{ "placement.position": position }, { positions: position }] },
      ];
    } else {
      filter.$or = [
        { "placement.position": position },
        { positions: position },
      ];
    }
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw createError("Invalid advertisement status", 400);
    }

    filter.isActive = isActive;
  }

  const [advertisements, total] = await Promise.all([
    Advertisement.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),

    Advertisement.countDocuments(filter),
  ]);

  return {
    advertisements,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

// Update an advertisement without overwriting omitted fields.
const updateAdvertisement = async (id, data, adminId) => {
  validateId(id);

  const advertisement = await Advertisement.findById(id);

  if (!advertisement) {
    throw createError("Advertisement not found", 404);
  }

  // Merge placement so updating only page or position
  // does not erase the other value.
  if (data.placement !== undefined) {
    advertisement.placement = {
      page: data.placement.page ?? advertisement.placement.page,
      position:
        data.placement.position ?? advertisement.placement.position,
    };
  }

  const fields = [
    "name",
    "bannerImage",
    "destinationUrl",
    "pages",
    "positions",
    "devices",
    "startAt",
    "endAt",
    "isActive",
  ];

  fields.forEach((field) => {
    if (data[field] !== undefined) {
      advertisement.set(field, data[field]);
    }
  });

  // Check the final dates, including existing values.
  if (
    advertisement.startAt &&
    advertisement.endAt &&
    advertisement.endAt <= advertisement.startAt
  ) {
    throw createError(
      "End date must be after start date",
      400
    );
  }

  advertisement.updatedBy = adminId;

  await advertisement.save();

  return advertisement;
};


const deleteAdvertisement = async (id) => {
  validateId(id);

  const advertisement = await Advertisement.findByIdAndDelete(id);

  if (!advertisement) {
    throw createError("Advertisement not found", 404);
  }

  return advertisement;
};


const getPublicAdvertisements = async ({
  page,
  position,
  device,
} = {}) => {
  const allowedPages = ["homepage", "article", "category"];
  const allowedPositions = ["top", "middle", "bottom"];
  const allowedDevices = ["desktop", "mobile"];

  if (!allowedPages.includes(page)) {
    throw createError("Invalid advertisement page", 400);
  }

  if (!allowedPositions.includes(position)) {
    throw createError("Invalid advertisement position", 400);
  }

  if (!allowedDevices.includes(device)) {
    throw createError("Invalid device", 400);
  }

  const now = new Date();

  // Match ads using multi-select pages/positions OR legacy single placement
  const advertisements = await Advertisement.find({
    isActive: true,
    $or: [
      { pages: page, positions: position },
      { "placement.page": page, "placement.position": position },
    ],
    devices: device,
    startAt: { $lte: now },
    endAt: { $gte: now },
  })
    .select("name bannerImage destinationUrl placement pages positions devices")
    .sort({ createdAt: -1 })
    .lean();

  return advertisements;
};

module.exports = {
  createAdvertisement,
  getAdvertisementById,
  getAdminAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  getPublicAdvertisements,
};
