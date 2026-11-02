
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const News = require("../models/News");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateDisplayOrder = (order, max) => {
  if (
    !Number.isInteger(order) ||
    order < 0 ||
    order > max
  ) {
    throw createError(
      `Display order must be between 0 and ${max}`
    );
  }
};

const checkSlugAvailability = async (
  slug,
  excludeId = null,
  session = null
) => {
  for (const language of ["en", "hi"]) {
    const query = {
      [`slug.${language}`]: slug[language],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingCategory = await Category.findOne(query)
      .select("_id")
      .session(session);

    if (existingCategory) {
      throw createError(
        `Category ${language} slug already exists: ${slug[language]}`,
        409
      );
    }
  }
};

const normalizeCategoryOrders = async (session) => {
  const categories = await Category.find()
    .sort({ displayOrder: 1, createdAt: 1, _id: 1 })
    .session(session)
    .select("_id displayOrder");

  const operations = categories
    .map((category, index) => ({
      updateOne: {
        filter: { _id: category._id },
        update: {
          $set: { displayOrder: index },
        },
      },
    }));

  if (operations.length) {
    await Category.bulkWrite(operations, { session });
  }

  return categories;
};

const createCategory = async (data, userId) => {
  const session = await mongoose.startSession();

  try {
    let createdCategory;

    await session.withTransaction(async () => {
      await checkSlugAvailability(data.slug, null, session);

      const categories = await normalizeCategoryOrders(session);
      const displayOrder =
        data.displayOrder ?? categories.length;

      validateDisplayOrder(displayOrder, categories.length);

      await Category.updateMany(
        { displayOrder: { $gte: displayOrder } },
        { $inc: { displayOrder: 1 } },
        { session }
      );

      const [category] = await Category.create(
        [
          {
            ...data,
            displayOrder,
            createdBy: userId,
          },
        ],
        { session }
      );

      createdCategory = category;
    });

    return createdCategory;
  } finally {
    await session.endSession();
  }
};

const updateCategory = async (categoryId, data, userId) => {
  const session = await mongoose.startSession();

  try {
    let updatedCategory;

    await session.withTransaction(async () => {
      if (!mongoose.isValidObjectId(categoryId)) {
        throw createError("Invalid category ID", 400);
      }

      await normalizeCategoryOrders(session);

      const category = await Category.findById(categoryId).session(session);

      if (!category) {
        throw createError("Category not found", 404);
      }

      if (data.slug) {
        await checkSlugAvailability(data.slug, categoryId, session);
      }

      if (data.name?.en !== undefined) {
        category.set("name.en", data.name.en);
      }

      if (data.name?.hi !== undefined) {
        category.set("name.hi", data.name.hi);
      }

      if (data.slug?.en !== undefined) {
        category.set("slug.en", data.slug.en);
      }

      if (data.slug?.hi !== undefined) {
        category.set("slug.hi", data.slug.hi);
      }

      if (data.description?.en !== undefined) {
        category.set("description.en", data.description.en);
      }

      if (data.description?.hi !== undefined) {
        category.set("description.hi", data.description.hi);
      }

      if (data.image !== undefined) {
        category.image = data.image;
      }

      if (data.displayOrder !== undefined) {
        const categories = await Category.find({
          _id: { $ne: categoryId },
        })
          .sort({ displayOrder: 1, createdAt: 1, _id: 1 })
          .session(session)
          .select("_id displayOrder");

        const oldOrder = category.displayOrder;
        const newOrder = data.displayOrder;

        validateDisplayOrder(newOrder, categories.length);

        if (newOrder < oldOrder) {
          await Category.updateMany(
            {
              _id: { $ne: categoryId },
              displayOrder: {
                $gte: newOrder,
                $lt: oldOrder,
              },
            },
            {
              $inc: { displayOrder: 1 },
            },
            { session }
          );
        } else if (newOrder > oldOrder) {
          await Category.updateMany(
            {
              _id: { $ne: categoryId },
              displayOrder: {
                $gt: oldOrder,
                $lte: newOrder,
              },
            },
            {
              $inc: { displayOrder: -1 },
            },
            { session }
          );
        }

        category.displayOrder = newOrder;
      }

      category.updatedBy = userId;

      await category.save({ session });

      updatedCategory = category;
    });

    return updatedCategory;
  } finally {
    await session.endSession();
  }
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
    const escapedSearch = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { "name.en": { $regex: escapedSearch, $options: "i" } },
      { "name.hi": { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .populate("createdBy", "name email")
      .sort({ displayOrder: 1, createdAt: 1, _id: 1 })
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
    .sort({ displayOrder: 1, createdAt: 1, _id: 1 })
    .lean();
};

const getCategoryById = async (categoryId) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw createError("Invalid category ID", 400);
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    throw createError("Category not found", 404);
  }

  return category;
};

const updateCategoryStatus = async (categoryId, isActive, userId) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw createError("Invalid category ID", 400);
  }

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
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      if (!mongoose.isValidObjectId(categoryId)) {
        throw createError("Invalid category ID", 400);
      }

      await normalizeCategoryOrders(session);

      const category = await Category.findById(categoryId).session(session);

      if (!category) {
        throw createError("Category not found", 404);
      }

      const [subcategoryExists, newsExists] = await Promise.all([
        Subcategory.exists({ category: categoryId }).session(session),
        News.exists({ category: categoryId }).session(session),
      ]);

      if (subcategoryExists || newsExists) {
        throw createError(
          "Cannot delete this category because it has associated subcategories or news. Deactivate it instead.",
          409
        );
      }

      const deletedOrder = category.displayOrder;

      await category.deleteOne({ session });

      await Category.updateMany(
        {
          displayOrder: { $gt: deletedOrder },
        },
        {
          $inc: { displayOrder: -1 },
        },
        { session }
      );

      result = { message: "Category deleted successfully" };
    });

    return result;
  } finally {
    await session.endSession();
  }
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
