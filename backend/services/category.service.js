
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const News = require("../models/News");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const checkSlugAvailability = async (slug, excludeId = null) => {
  for (const language of ["en", "hi"]) {
    const query = {
      [`slug.${language}`]: slug[language],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingCategory = await Category.findOne(query).select("_id");

    if (existingCategory) {
      throw createError(
        `Category ${language} slug already exists: ${slug[language]}`,
        409
      );
    }
  }
};

const createCategory = async (data, userId) => {
  await checkSlugAvailability(data.slug);

  const category = await Category.create({
    ...data,
    createdBy: userId,
  });

  return category;
};

const updateCategory = async (categoryId, data, userId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw createError("Category not found", 404);
  }

  if (data.slug) {
    await checkSlugAvailability(data.slug, categoryId);
  }

  if (data.name) {
    category.name = {
      ...category.name.toObject(),
      ...data.name,
    };
  }

  if (data.slug) {
    category.slug = {
      ...category.slug.toObject(),
      ...data.slug,
    };
  }

  if (data.description) {
    category.description = {
      ...category.description.toObject(),
      ...data.description,
    };
  }

  if (data.image !== undefined) {
    category.image = data.image;
  }

  if (data.displayOrder !== undefined) {
    category.displayOrder = data.displayOrder;
  }

  category.updatedBy = userId;

  await category.save();

  return category;
};

const getAdminCategories = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "all",
} = {}) => {
  const filter = {};

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

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .populate("createdBy", "name email")
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Category.countDocuments(filter),
  ]);

  return {
    categories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPublicCategories = async () => {
  return Category.find({ isActive: true })
    .select("name slug description image displayOrder")
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();
};

const getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw createError("Category not found", 404);
  }

  return category;
};

const updateCategoryStatus = async (categoryId, isActive, userId) => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
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

  if (!category) {
    throw createError("Category not found", 404);
  }

  return category;
};

const deleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw createError("Category not found", 404);
  }

  const [subcategoryExists, newsExists] = await Promise.all([
    Subcategory.exists({ category: categoryId }),
    News.exists({ category: categoryId }),
  ]);

  if (subcategoryExists || newsExists) {
    throw createError(
      "Cannot delete this category because it has associated subcategories or news. Deactivate it instead.",
      409
    );
  }

  await category.deleteOne();

  return { message: "Category deleted successfully" };
};

module.exports = {
  createCategory,
  updateCategory,
  getAdminCategories,
  getPublicCategories,
  getCategoryById,
  updateCategoryStatus,
  deleteCategory,
};
