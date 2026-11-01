
const Subcategory = require("../models/Subcategory");
const Category = require("../models/Category");
const News = require("../models/News");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateCategory = async (categoryId) => {
  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  }).select("_id");

  if (!category) {
    throw createError("Active category not found", 404);
  }

  return category;
};

const checkSlugAvailability = async (
  slug,
  categoryId,
  excludeId = null
) => {
  for (const language of ["en", "hi"]) {
    const query = {
      category: categoryId,
      [`slug.${language}`]: slug[language],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Subcategory.findOne(query).select("_id");

    if (existing) {
      throw createError(
        `${language} subcategory slug already exists in this category`,
        409
      );
    }
  }
};

const createSubcategory = async (data, userId) => {
  await validateCategory(data.category);

  await checkSlugAvailability(data.slug, data.category);

  const subcategory = await Subcategory.create({
    ...data,
    createdBy: userId,
  });

  return subcategory;
};

const updateSubcategory = async (
  subcategoryId,
  data,
  userId
) => {
  const subcategory = await Subcategory.findById(subcategoryId);

  if (!subcategory) {
    throw createError("Subcategory not found", 404);
  }

  const nextCategoryId = data.category || subcategory.category;

  if (data.category) {
    await validateCategory(data.category);
  }

  const nextSlug = data.slug
    ? {
        en: data.slug.en ?? subcategory.slug.en,
        hi: data.slug.hi ?? subcategory.slug.hi,
      }
    : subcategory.slug;

  await checkSlugAvailability(
    nextSlug,
    nextCategoryId,
    subcategoryId
  );

  if (data.name) {
    subcategory.name = {
      en: data.name.en ?? subcategory.name.en,
      hi: data.name.hi ?? subcategory.name.hi,
    };
  }

  if (data.slug) {
    subcategory.slug = nextSlug;
  }

  if (data.description) {
    subcategory.description = {
      en: data.description.en ?? subcategory.description.en,
      hi: data.description.hi ?? subcategory.description.hi,
    };
  }

  if (data.category) {
    subcategory.category = data.category;
  }

  if (data.displayOrder !== undefined) {
    subcategory.displayOrder = data.displayOrder;
  }

  subcategory.updatedBy = userId;

  await subcategory.save();

  return subcategory;
};

const getAdminSubcategories = async ({
  page = 1,
  limit = 10,
  category,
  search = "",
  status = "all",
} = {}) => {
  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  if (search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { "name.en": { $regex: escapedSearch, $options: "i" } },
      { "name.hi": { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [subcategories, total] = await Promise.all([
    Subcategory.find(filter)
      .populate("category", "name slug")
      .populate("createdBy", "name email")
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Subcategory.countDocuments(filter),
  ]);

  return {
    subcategories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPublicSubcategories = async (categoryId) => {
  await validateCategory(categoryId);

  return Subcategory.find({
    category: categoryId,
    isActive: true,
  })
    .select("name slug description category displayOrder")
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();
};

const getSubcategoryById = async (subcategoryId) => {
  const subcategory = await Subcategory.findById(subcategoryId)
    .populate("category", "name slug");

  if (!subcategory) {
    throw createError("Subcategory not found", 404);
  }

  return subcategory;
};

const updateSubcategoryStatus = async (
  subcategoryId,
  isActive,
  userId
) => {
  const subcategory = await Subcategory.findByIdAndUpdate(
    subcategoryId,
    {
      $set: {
        isActive,
        updatedBy: userId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!subcategory) {
    throw createError("Subcategory not found", 404);
  }

  return subcategory;
};

const deleteSubcategory = async (subcategoryId) => {
  const subcategory = await Subcategory.findById(subcategoryId);

  if (!subcategory) {
    throw createError("Subcategory not found", 404);
  }

  const newsExists = await News.exists({
    subcategory: subcategoryId,
  });

  if (newsExists) {
    throw createError(
      "Cannot delete this subcategory because news articles are associated with it. Deactivate it instead.",
      409
    );
  }

  await subcategory.deleteOne();

  return {
    message: "Subcategory deleted successfully",
  };
};

module.exports = {
  createSubcategory,
  updateSubcategory,
  getAdminSubcategories,
  getPublicSubcategories,
  getSubcategoryById,
  updateSubcategoryStatus,
  deleteSubcategory,
};
